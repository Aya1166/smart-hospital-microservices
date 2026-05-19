const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'hospital-notifier-group' });

async function runWorker() {
  await consumer.connect();
  console.log('🔔 Notification Worker safely listening to Message Hub streams.');
  
  await consumer.subscribe({ topic: 'appointment-notifications', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log(`\n📢 [NOTIFICATION DISPATCHED] Processing event: ${payload.eventType}`);
      console.log(`👉 Alerting System: Patient ID ${payload.patient_id} booked with Dr. ${payload.doctor} on ${payload.date}.`);
    },
  });
}

runWorker().catch(err => console.error("Kafka consumer initialization failed:", err));