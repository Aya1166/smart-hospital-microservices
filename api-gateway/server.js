const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const app = express();
app.use(express.json());

// Load Unified gRPC Proto Definition
const protoPath = path.join(__dirname, '../proto/hospital.proto');

const packageDefinition = protoLoader.loadSync(protoPath, { 
  keepCase: true, 
  longs: String, 
  enums: String, 
  defaults: true, 
  oneofs: true 
});

// Load the core hospital package definition
const hospitalProto = grpc.loadPackageDefinition(packageDefinition).hospital;

// Instantiate gRPC Clients connecting to your active services
const patientClient = new hospitalProto.PatientService('localhost:50051', grpc.credentials.createInsecure());
const appointmentClient = new hospitalProto.AppointmentService('localhost:50052', grpc.credentials.createInsecure());

// --- REST ENDPOINTS ---
app.post('/api/patients', (req, res) => {
  const { name, age, disease } = req.body;
  patientClient.CreatePatient({ name, age, disease }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(response);
  });
});

app.get('/api/patients/:id', (req, res) => {
  patientClient.GetPatient({ id: req.params.id }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});

app.post('/api/appointments', (req, res) => {
  const { patientId, doctor, date } = req.body;
  appointmentClient.CreateAppointment({ patient_id: patientId, doctor, date }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: response.id,
      patientId: response.patient_id,
      doctor: response.doctor,
      date: response.date
    });
  });
});

// --- GRAPHQL SERVER SETUP ---
const typeDefs = require('fs').readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');
const resolvers = require('./resolvers')(patientClient, appointmentClient);

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway running! REST/JSON API at http://localhost:${PORT}`);
    console.log(`🚀 GraphQL Playground ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(err => console.error("Failed to start API Gateway:", err));