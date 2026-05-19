const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { initDB } = require('./db/database');

// 1. Point directly to your global hospital.proto file
const protoPath = path.join(__dirname, '../proto/hospital.proto');

const packageDefinition = protoLoader.loadSync(protoPath, { 
  keepCase: true, 
  longs: String, 
  enums: String, 
  defaults: true, 
  oneofs: true 
});

// 2. Load the package using the correct namespace (.hospital)
const hospitalProto = grpc.loadPackageDefinition(packageDefinition).hospital;

async function startgRPCServer() {
  const db = await initDB();
  const server = new grpc.Server();

  // 3. Access PatientService from the hospital namespace
  server.addService(hospitalProto.PatientService.service, {
    CreatePatient: async (call, callback) => {
      try {
        const { name, age, disease } = call.request;
        const newPatient = {
          id: Date.now().toString(),
          name,
          age,
          disease
        };
        await db.patients.insert(newPatient);
        callback(null, newPatient);
      } catch (err) {
        callback({ code: grpc.status.INTERNAL, details: err.message });
      }
    },
    GetPatient: async (call, callback) => {
      try {
        const patient = await db.patients.findOne({ selector: { id: call.request.id } }).exec();
        if (!patient) {
          return callback({ code: grpc.status.NOT_FOUND, details: "Patient not found" });
        }
        callback(null, {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          disease: patient.disease
        });
      } catch (err) {
        callback({ code: grpc.status.INTERNAL, details: err.message });
      }
    }
  });

  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) return console.error(err);
    console.log(` Hospital Patient Microservice listening on port ${port} (gRPC)`);
  });
}

startgRPCServer().catch(err => console.error(err));