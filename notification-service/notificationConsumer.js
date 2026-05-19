const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({
  groupId: 'notification-group'
});

async function run() {

  await consumer.connect();

  await consumer.subscribe({
    topic: 'appointment-created',
    fromBeginning: true
  });

  await consumer.run({

    eachMessage: async ({ message }) => {

      const value = message.value.toString();

      console.log(
        'Notification received:',
        value
      );

    }

  });

}

run();