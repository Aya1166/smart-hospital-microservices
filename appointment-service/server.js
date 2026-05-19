const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const db = require('./db/database'); 
const { connectProducer, sendAppointmentEvent } = require('./kafka');

const protoPath = path.join(__dirname, '../proto/hospital.proto');

const packageDefinition = protoLoader.loadSync(protoPath, { 
  keepCase: true, 
  longs: String, 
  enums: String, 
  defaults: true, 
  oneofs: true 
});

// 1. Load the package definitions
const loadedProto = grpc.loadPackageDefinition(packageDefinition);

// 2. SAFE EXTRACTION: This automatically checks if the service is directly on the root object 
// or nested under the 'hospital' package namespace.
let appointmentServiceDefinition;

if (loadedProto.hospital && loadedProto.hospital.AppointmentService) {
  appointmentServiceDefinition = loadedProto.hospital.AppointmentService.service;
} else if (loadedProto.AppointmentService) {
  appointmentServiceDefinition = loadedProto.AppointmentService.service;
} else {
  // Debug output so you can see exactly what services are available in your proto file
  console.error("❌ ERROR: Could not find AppointmentService in hospital.proto.");
  console.error("Available keys in your proto object are:", Object.keys(loadedProto.hospital || loadedProto));
  process.exit(1);
}

async function startServer() {
  await connectProducer();

  const server = new grpc.Server();

  // 3. Register service using the dynamically verified definition
  server.addService(appointmentServiceDefinition, {
    CreateAppointment: (call, callback) => {
      const { patient_id, doctor, date } = call.request;
      const id = Date.now().toString();

      const query = `INSERT INTO appointments (id, patient_id, doctor, date) VALUES (?, ?, ?, ?)`;
      db.run(query, [id, patient_id, doctor, date], async function (err) {
        if (err) return callback({ code: grpc.status.INTERNAL, details: err.message });

        const createdPayload = { id, patient_id, doctor, date };

        await sendAppointmentEvent('appointment-notifications', {
          eventType: 'APPOINTMENT_CREATED',
          ...createdPayload
        });

        callback(null, createdPayload);
      });
    },
    GetAppointmentsByPatient: (call, callback) => {
      const { patient_id } = call.request;
      const query = `SELECT * FROM appointments WHERE patient_id = ?`;

      db.all(query, [patient_id], (err, rows) => {
        if (err) return callback({ code: grpc.status.INTERNAL, details: err.message });
        callback(null, { appointments: rows || [] });
      });
    }
  });

  server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) return console.error(err);
    console.log(`📅 Appointment Microservice listening on port ${port} (gRPC)`);
  });
}

startServer().catch(err => console.error("Server execution initialization blocked:", err));