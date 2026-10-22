# FinTrust Bank Demo App

This is a prototype banking application for DevOps training and real world challenge simulation.

It contains:

- Node.js backend API
- React frontend
- PostgreSQL database
- Dockerfiles
- Docker Compose setup
- Kubernetes manifests
- GitHub Actions pipeline
- Terraform starter files
- Ansible starter playbook
- Incident and security audit documents

## Local Setup With Docker Compose

```bash
docker compose up --build
```

Open the frontend:

```text
http://localhost:3000
```

Open the backend health check:

```text
http://localhost:8080/health
```

## Backend Endpoints

```text
GET  /health
GET  /api/accounts
POST /api/accounts
POST /api/accounts/:id/deposit
POST /api/accounts/:id/withdraw
GET  /api/transactions
```

## DevOps Challenge Usage

Use this app to practise:

1. Git workflow and pull requests
2. Docker image building
3. CI/CD with GitHub Actions or Jenkins
4. Deployment to Linux server
5. Infrastructure provisioning with Terraform
6. Server configuration with Ansible
7. Kubernetes deployment
8. Health checks and rolling updates
9. Monitoring with Prometheus and Grafana
10. Centralized logging
11. Security hardening
12. Incident response documentation

## Kubernetes Demo

Update the image names in these files first:

```text
k8s/backend.yaml
k8s/frontend.yaml
```

Then run:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

## Important Note

This app is for training and demonstration only. It is not production banking software.
