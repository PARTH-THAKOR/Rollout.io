# Rollout.io - Remote Config

## Overview

Rollout.io Remote Config is a centralized feature flag and configuration management system that enables applications to control features dynamically at runtime without redeploying code. It supports safe rollouts, instant rollback, and centralized configuration control, improving reliability in production environments.

## Key Features

* Centralized feature flag management
* Runtime enable and disable of features
* Controlled and gradual feature rollouts
* Instant rollback during failures
* Project-specific configuration handling
* Easy application integration

## How It Works

Administrators manage feature flags and configurations through an admin dashboard. Applications fetch feature status at runtime and adjust their behavior dynamically, allowing changes to take effect immediately without redeployment.

## Technology Stack

* Frontend: React
* Backend: Java, Spring Boot, REST APIs
* Database: MongoDB

## Use Cases

* Gradual rollout of new features
* Emergency feature disable (kill switch)
* A/B testing and experimentation
* SaaS application feature control

## License

This project is licensed under the MIT License.

## Client SDKs

### JavaScript SDK (@rollout.io/sdk-js)
Professional-grade, high-performance SDK for web-based environments.

Installation:
```bash
npm install @rollout.io/sdk-js@latest
```

Full documentation and implementation guide available at:
SDK/javascript/README.txt

## Authors

Parthsinh R. Thakor, Dharmik S. Aslaliya, Meet N. Parmar
