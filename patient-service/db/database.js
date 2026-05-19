const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');

// Define a valid RxDB Patient Schema
const PatientSchema = {
  title: 'patient schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    age: { type: 'string' },
    disease: { type: 'string' }
  },
  required: ['id', 'name', 'age', 'disease']
};

async function initDB() {
  // Instantiate database with clean modern native memory storage engine
  const db = await createRxDatabase({
    name: 'patientdb',
    storage: getRxStorageMemory()
  });

  await db.addCollections({
    patients: { schema: PatientSchema }
  });

  return db;
}

module.exports = { initDB };