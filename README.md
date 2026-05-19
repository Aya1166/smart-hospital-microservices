# 🏥 Smart Hospital Management System - Microservices

A distributed microservices ecosystem designed for efficient hospital workflows, utilizing an API Gateway, high-performance gRPC internal communication, Polyglot Persistence (SQL + NoSQL), and an Asynchronous Event-Driven Architecture via Apache Kafka.

---

## 🏗️ System Architecture

The application consists of four decentralized components coordinated through a centralized API Gateway:

1. **API Gateway (Port 4000):** Acts as the single reverse proxy ingress endpoint exposing both REST/JSON and GraphQL query routes. Translates client-facing payloads into internal gRPC communication.
2. **Patient Microservice (Port 50051):** Manages patient records using a high-speed, reactive in-memory NoSQL database (**RxDB**). Accessible internally via gRPC.
3. **Appointment Microservice (Port 50052):** Schedules client appointments using a relational **SQLite3** database engine. Acts as a **Kafka Producer** to broadcast real-time event topics upon schedule execution.
4. **Notification Microservice (Worker):** A decentralized background worker operating as a **Kafka Consumer** listening to event brokers to stream asynchronous patient alert logs.

---

## 🛠️ Tech Stack & Protocols

- **Runtime Environment:** Node.js (v22+)
- **API Formats:** REST API & GraphQL (Apollo Server)
- **Internal RPC Framework:** gRPC (via `@grpc/grpc-js` and `@grpc/proto-loader`)
- **Event Streaming/Messaging:** Apache Kafka (via `kafkajs`)
- **Persistence Layer:** Polyglot Architecture (RxDB NoSQL + SQLite3 SQL)

---

## 🚀 Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and an active [Apache Kafka](https://kafka.apache.org/) instance running locally on port `9092` (via Docker or local binary).

If using Docker, start your Kafka broker with:
```bash
docker run -d --name kafka -p 9092:9092 apache/kafka:latest
