const express = require('express');
const cors = require('cors');
const fs = require('fs');

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } =
  require('@as-integrations/express4');

const resolvers = require('./resolvers');

const typeDefs = fs.readFileSync('./schema.gql', 'utf8');

const packageDefinition = protoLoader.loadSync(
  './proto/patient.proto'
);

const patientProto =
  grpc.loadPackageDefinition(packageDefinition).patient;

const grpcClient = new patientProto.PatientService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

async function startServer() {

  const app = express();

  app.use(cors());
  app.use(express.json());

  // ---------------- GRAPHQL ----------------

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
  });

  await apolloServer.start();

  app.use('/graphql', expressMiddleware(apolloServer));
  // ---------------- REST ----------------

  app.get('/patients', (req, res) => {

    grpcClient.GetPatients({}, (err, response) => {

      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.patients);
      }

    });

  });

  app.get('/patients/:id', (req, res) => {

    grpcClient.GetPatient(
      { id: req.params.id },
      (err, response) => {

        if (err) {
          res.status(500).send(err);
        } else {
          res.json(response.patient);
        }

      }
    );

  });

  app.post('/patients', (req, res) => {

    grpcClient.CreatePatient(
      req.body,
      (err, response) => {

        if (err) {
          res.status(500).send(err);
        } else {
          res.json(response.patient);
        }

      }
    );

  });

  app.delete('/patients/:id', (req, res) => {

    grpcClient.DeletePatient(
      { id: req.params.id },
      (err, response) => {

        if (err) {
          res.status(500).send(err);
        } else {
          res.json(response);
        }

      }
    );

  });

  // ---------------- START ----------------

  app.listen(3000, () => {
    console.log(
      'API Gateway running on http://localhost:3000'
    );
  });

}

startServer();