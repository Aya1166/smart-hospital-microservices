const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const db = require('./db/database');

const packageDefinition = protoLoader.loadSync(
  './proto/patient.proto'
);

const patientProto = grpc.loadPackageDefinition(packageDefinition).patient;

const patientService = {

  GetPatients: (call, callback) => {

    db.all("SELECT * FROM patients", [], (err, rows) => {

      if (err) {
        callback(err);
      } else {
        callback(null, { patients: rows });
      }

    });

  },

  GetPatient: (call, callback) => {

    db.get(
      "SELECT * FROM patients WHERE id = ?",
      [call.request.id],
      (err, row) => {

        if (err) {
          callback(err);
        } else {
          callback(null, { patient: row });
        }

      }
    );

  },

  CreatePatient: (call, callback) => {

    const { name, age } = call.request;

    db.run(
      "INSERT INTO patients(name, age) VALUES(?, ?)",
      [name, age],
      function(err) {

        if (err) {
          callback(err);
        } else {

          callback(null, {
            patient: {
              id: this.lastID.toString(),
              name,
              age
            }
          });

        }

      }
    );

  },

  DeletePatient: (call, callback) => {

    db.run(
      "DELETE FROM patients WHERE id = ?",
      [call.request.id],
      function(err) {

        if (err) {
          callback(err);
        } else {

          callback(null, {
            message: "Patient deleted"
          });

        }

      }
    );

  }

};

const server = new grpc.Server();

server.addService(
  patientProto.PatientService.service,
  patientService
);

server.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Patient gRPC service running on port 50051");
  }
);