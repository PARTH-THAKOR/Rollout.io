# Contributing to Rollout.io

Thank you for your interest in contributing to Rollout.io. 

As a Final Year IT Capstone Project built by students at Government Engineering College, Gandhinagar, we welcome and appreciate contributions of all kinds, including bug fixes, query optimizations, microservice refactoring, and new feature additions.

---

## How Can You Contribute?

### 1. Reporting Bugs and Suggesting Features
- Please check the existing Issues tab to ensure the bug or feature has not already been reported.
- If it is new, open a new issue. Please include:
  - A clear, descriptive title.
  - Steps to reproduce the issue.
  - Expected versus actual behavior.
  - Relevant logs or screenshots.

### 2. Code Contributions
To contribute code, please follow this workflow:
1. Fork the repository to your own GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Rollout.io.git
   ```
3. Create a branch for your changes using a clean, descriptive name:
   ```bash
   git checkout -b feature/amazing-new-feature
   # or
   git checkout -b fix/resolve-caching-bug
   ```
4. Implement your changes and commit them with clean, descriptive commit messages.
5. Push your branch to GitHub:
   ```bash
   git push origin feature/amazing-new-feature
   ```
6. Open a Pull Request (PR) against our development or main branch.

---

## Branching and PR Guidelines

To facilitate a smooth review process:
- **Keep it Focused**: A single PR should address a single issue or feature.
- **Reference Issues**: If your PR resolves an open issue, link it in the PR description (e.g., `Closes #12`).
- **Code Style**: 
  - For Java backend services, follow standard Java camelCase naming conventions and include Javadocs on major classes and methods.
  - For React/JavaScript code, use modern ES6 functional syntax.
- **Academic Context**: Because this is a graded academic project, we may request clarifications to thoroughly understand the changes before merging.

---

## Local Setup

The project consists of multiple microservices:
- **Backend**: Spring Boot, Eureka Registry, Config Server, API Gateway, RabbitMQ, and MongoDB.
- **Frontend**: Vite + React Dashboard.

You can set up the local ecosystem using Docker Compose:
```bash
# Navigate to the deployment directory
cd DEPLOY

# Start all infrastructure and microservices
docker-compose up -d
```

---

## Support

If you need help or wish to discuss major architectural changes, please:
- Open a GitHub Issue.
- Contact the team at rollout@paraglide.in.

Thank you for helping us improve this project.
