const { Kafka } = require('kafkajs');

const kafkaInstance = new Kafka({
  clientId: 'appointment-service',
  brokers: ['localhost:9092']
});

const producerInstance = kafkaInstance.producer();

async function connectProducer() {
  await producerInstance.connect();
  console.log('⚡ Kafka Appointment Producer Connected Successfully');
}

async function sendAppointmentEvent(topic, data) {
  try {
    await producerInstance.send({
      topic: topic,
      messages: [{ value: JSON.stringify(data) }],
    });
  } catch (error) {
    console.error('❌ Error dispatching Kafka Message:', error);
  }
}

module.exports = { connectProducer, sendAppointmentEvent };