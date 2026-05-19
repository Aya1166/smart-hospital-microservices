const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const sqlite3 = require('sqlite3').verbose();

const { Kafka } = require('kafkajs');

// ---------------- KAFKA ----------------

const kafka = new Kafka({
  clientId: 'appointment-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

// ---------------- DATABASE ----------------

const db = new sqlite3.Database('./appointments.db');

db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientName TEXT,
    doctorName TEXT,
    date TEXT
  )
`);

// ---------------- PROTO ----------------

const packageDefinition = protoLoader.loadSync(
  './proto/appointment.proto'
);

const appointmentProto =
  grpc.loadPackageDefinition(packageDefinition).appointment;

// ---------------- SERVICE ----------------

const appointmentService = {

  GetAppointments: (call, callback) => {

    db.all(
      "SELECT * FROM appointments",
      [],
      (err, rows) => {

        if (err) {
          callback(err);
        } else {
          callback(null, {
            appointments: rows
          });
        }

      }
    );

  },

  CreateAppointment: async (call, callback) => {

    const {
      patientName,
      doctorName,
      date
    } = call.request;

    db.run(
      `
      INSERT INTO appointments(
        patientName,
        doctorName,
        date
      )
      VALUES (?, ?, ?)
      `,
      [patientName, doctorName, date],

      async function(err) {

        if (err) {

          callback(err);

        } else {

          // ---------------- KAFKA EVENT ----------------

          await producer.connect();

          await producer.send({
            topic: 'appointment-created',
            messages: [
              {
                value: JSON.stringify({
                  id: this.lastID,
                  patientName,
                  doctorName,
                  date
                })
              }
            ]
          });

          console.log('Kafka event sent');

          callback(null, {
            appointment: {
              id: this.lastID.toString(),
              patientName,
              doctorName,
              date
            }
          });

        }

      }
    );

  }

};

// ---------------- SERVER ----------------

const server = new grpc.Server();

server.addService(
  appointmentProto.AppointmentService.service,
  appointmentService
);

server.bindAsync(
  '0.0.0.0:50052',
  grpc.ServerCredentials.createInsecure(),
  () => {

    console.log(
      'Appointment gRPC service running on port 50052'
    );

  }
);