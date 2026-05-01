<div align="center">
  <img src="ASSETS/banner.png" alt="Rollout.io Architecture" width="100%">

  <h1>Rollout.io</h1>

  <p><b>The Architecture of Instant Change.</b></p>
  <p>A centralized, ultra-low latency feature flag and configuration management system. Designed for complex distributed microservices architectures dealing with dynamic rendering and runtime execution layers.</p>
</div>

<hr />

## Overview

Rollout.io Remote Config enables applications to control features dynamically at runtime without redeploying code. It supports safe rollouts, instant rollback, and centralized configuration control, improving reliability in high-availability production environments.

## Architecture Capabilities

* **Centralized Flag Management**: Unified control plane for all feature toggles.
* **Runtime Execution**: Enable and disable features without process restarts.
* **Controlled Rollouts**: Gradual feature exposure and precise targeting.
* **Instant Rollback**: Emergency kill switches during cascading failures.
* **Project Isolation**: Segregated configuration handling across environments.
* **Seamless Integration**: Ultra-low latency SDKs for modern applications.

## Technical Foundation

The system is built on a highly scalable, distributed technology stack:
* **Frontend Layer**: React, Vite
* **Execution Engine**: Java, Spring Boot, RESTful APIs
* **Persistence Layer**: MongoDB
* **Message Broker**: RabbitMQ
* **Caching Layer**: Redis
* **Telemetry & Monitoring**: Prometheus

## Quick Start Guide

### 1. Initialize the Backend Infrastructure
The entire backend ecosystem (microservices, databases, and message brokers) is containerized and orchestrated using Docker Compose.

```bash
cd DEPLOY
docker-compose up -d
```
Verify the container execution state utilizing `docker ps`.

### 2. Configure and Execute the Admin Control Plane
The Admin Dashboard requires Firebase Authentication for secure access control. 

**Authentication Setup:**
Navigate to `UI/src/firebase.js` and inject your Firebase project configuration parameters:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

**Bootstrapping the UI:**
```bash
cd UI
npm install
npm run dev
```

### 3. Execute the Integration Test Environment (Zomato Clone)
To validate the Rollout.io SDK integration, boot the pre-configured sample test application.

```bash
cd TEST/zomato-clone
npm install
npm start
```

## Supported Client SDKs

**JavaScript SDK (`@techparaglide/sdk-js`)**
Professional-grade, high-performance SDK for web-based rendering environments.

```bash
npm install @techparaglide/sdk-js@latest
```
Detailed implementation schematics available at: `SDK/javascript/README.txt`

**Java SDK (`com.rollout.io:sdk-java`)**
Enterprise-grade SDK for server-side Java and Spring Boot runtimes.

```xml
<dependency>
    <groupId>com.rollout.io</groupId>
    <artifactId>sdk-java</artifactId>
    <version>5.0.1</version>
</dependency>
```
Detailed implementation schematics available at: `SDK/java/README.md`

## Engineering Team

**Parthsinh R. Thakor | Dharmik S. Aslaliya | Meet N. Parmar**

## License

This project is distributed under the **MIT License**. Reference the `LICENSE` file for full terms and conditions.
