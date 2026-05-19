const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
  './proto/patient.proto'
);

const patientProto =
  grpc.loadPackageDefinition(packageDefinition).patient;

const grpcClient = new patientProto.PatientService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const resolvers = {

  Query: {

    patients: async () => {

      return new Promise((resolve, reject) => {

        grpcClient.GetPatients({}, (err, response) => {

          if (err) reject(err);
          else resolve(response.patients);

        });

      });

    },

    patient: async (_, args) => {

      return new Promise((resolve, reject) => {

        grpcClient.GetPatient(
          { id: args.id },
          (err, response) => {

            if (err) reject(err);
            else resolve(response.patient);

          }
        );

      });

    }

  },

  Mutation: {

    createPatient: async (_, args) => {

      return new Promise((resolve, reject) => {

        grpcClient.CreatePatient(
          args,
          (err, response) => {

            if (err) reject(err);
            else resolve(response.patient);

          }
        );

      });

    },

    deletePatient: async (_, args) => {

      return new Promise((resolve, reject) => {

        grpcClient.DeletePatient(
          { id: args.id },
          (err, response) => {

            if (err) reject(err);
            else resolve(response.message);

          }
        );

      });

    }

  }

};

module.exports = resolvers;