# 🚀 GCP Deployment Guide: Rollout.io

This guide provides step-by-step instructions for deploying the **Rollout.io** microservices ecosystem to Google Cloud Platform (GCP) using Compute Engine and Docker Compose.

---

## 🏗️ Step 1: Provision a Compute Engine VM

1.  **Go to GCP Console**: Navigate to [Compute Engine > VM Instances](https://console.cloud.google.com/compute/instances).
2.  **Create Instance**:
    *   **Name**: `rollout-v5-stable`
    *   **Region**: Choose a region close to your users (e.g., `us-east1`).
    *   **Machine Type**: `e2-medium` (2 vCPU, 4GB RAM) is recommended.
    *   **Boot Disk**: Ubuntu 22.04 LTS (Standard Persistent Disk, 20GB+).
    *   **Firewall**: Check **Allow HTTP traffic** and **Allow HTTPS traffic**.
3.  **Click Create**.

---

## 🛠️ Step 2: Install Docker & Docker Compose

Once the VM is running, SSH into it and run the following commands to install Docker:

```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

---

## 📂 Step 3: Upload Deployment Files

Transfer the `DEPLOY` folder to your VM. You can use GCP's `gcloud scp` or manually create the files.

### Option A: Using SCP (Recommended)
From your local machine terminal:
```bash
# Adjust the path to your project root
gcloud compute scp --recurse ./DEPLOY rollout-production:~/
```

### Option B: Manual Creation (Alternative)
On the VM:
```bash
mkdir ~/DEPLOY
cd ~/DEPLOY
# Create docker-compose.yml and prometheus.yml using nano or vi
nano docker-compose.yml
nano prometheus.yml
```

---

## 🚀 Step 4: Launch Rollout.io

Navigate to the folder containing your files and run:

```bash
cd ~/DEPLOY
sudo docker-compose up -d
```

> [!NOTE]
> The services have internal sleep timers (entrypoints) to ensure correct startup order (Registry -> Config -> Services -> Gateway). It may take 2-3 minutes for everything to be fully operational.

---

## 🔒 Step 5: Configure Firewall Rules

You need to open specific ports for the API Gateway and Monitoring.

1.  Go to [VPC Network > Firewall](https://console.cloud.google.com/net-security/firewalls).
2.  **Create Firewall Rule**:
    *   **Name**: `rollout-services`
    *   **Targets**: `All instances in the network`
    *   **Source IP ranges**: `0.0.0.0/0`
    *   **Protocols and ports**:
        *   TCP: `80` (API Gateway)
        *   TCP: `5000` (Registry Dashboard)
        *   TCP: `5001` (Grafana Monitoring)
3.  **Click Create**.

---

## ✅ Step 6: Verify Deployment

*   **API Gateway**: `http://<YOUR_VM_EXTERNAL_IP>/`
*   **Service Registry**: `http://<YOUR_VM_EXTERNAL_IP>:4999/`
*   **Grafana Dashboard**: `http://<YOUR_VM_EXTERNAL_IP>:3000/` (Default login: `admin` / `admin`)

---

## 💡 Troubleshooting

*   **View Logs**: `sudo docker-compose logs -f`
*   **Check Containers**: `sudo docker ps`
*   **Restart Everything**: `sudo docker-compose down && sudo docker-compose up -d`
