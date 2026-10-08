# AAPSD-Assistant Deployment Instructions

This guide provides step-by-step instructions for deploying the AAPSD-Assistant system on a new machine. It covers using Docker Compose for standard setups, as well as running the system via Docker Desktop's Kubernetes integration, including Prometheus for monitoring.

## Prerequisites

- **Git** (to clone the repository)
- **Node.js** (optional, for local development)
- **Docker Desktop** (must be installed and running on the new machine)

---

## Part 1: Setting up Docker Desktop

1. **Download and Install**: Download Docker Desktop from [Docker's official website](https://www.docker.com/products/docker-desktop) and install it on your new machine.
2. **Start Docker Desktop**: Launch the application.
3. **Enable Kubernetes**:
   - Go to **Settings** (the gear icon at the top right) in Docker Desktop.
   - Select **Kubernetes** from the left menu.
   - Check the box for **Enable Kubernetes**.
   - Click **Apply & Restart**. This will download the necessary Kubernetes components and start a single-node cluster on your machine.
   - Wait until the Kubernetes icon in the bottom-left corner of Docker Desktop turns green.
4. **Verify Installation**: Open a command prompt or PowerShell and run:
   ```bash
   kubectl get nodes
   ```
   You should see `docker-desktop` listed with a `Ready` status.

---

## Part 2: Starting the System with Docker Compose (Standard Setup)

If you just want to power up the system quickly using standard Docker Compose:

1. **Clone the Repository** and navigate to the project root:
   ```bash
   git clone <repository-url>
   cd AAPSD-Assistant
   ```
2. **Set up Environment Variables**:
   Copy the example environment file:
   ```bash
   cp infra/docker/.env.example infra/docker/.env
   ```
   _(Edit `infra/docker/.env` if you need to customize any ports, database passwords, or API URLs)._
3. **Build and Start Services**:
   ```bash
   cd infra/docker
   docker-compose up -d --build
   ```
4. **Verify the System is Up**:
   - **Web App**: http://localhost:5173
   - **API**: http://localhost:3000
   - **PostgreSQL**: `localhost:5432`
   - **Redis**: `localhost:6379`
5. **Stop Services** (when done):
   ```bash
   docker-compose down
   ```

---

## Part 3: Deploying on Kubernetes with Prometheus (Advanced Setup)

This section explains how to run the workloads and Prometheus on the Kubernetes cluster provided by Docker Desktop.

### 1. Build Docker Images Locally

Since the Kubernetes deployment needs your custom images, you must build them first and make them available to the local Docker daemon. From the root of the project, run:

```bash
docker build -t aapsd-api:latest -f infra/docker/api.Dockerfile .
docker build -t aapsd-web:latest -f infra/docker/web.Dockerfile .
```

> [!NOTE]
> The current `infra/kubernetes/aapsd-workloads.yaml` file uses placeholder images (`nginx:alpine`) for the API and Web. If you want to run your actual application code, you should edit lines 85 and 108 in `aapsd-workloads.yaml` to use `image: aapsd-api:latest` and `image: aapsd-web:latest` respectively, and set `imagePullPolicy: Never` so Kubernetes uses the local images.

### 2. Apply Kubernetes Manifests

The repository contains the Kubernetes configuration in `infra/kubernetes/aapsd-workloads.yaml`. This file defines the Deployments and Services for Prometheus, Redis, the API, and the Web app.

```bash
# From the root of the project
kubectl apply -f infra/kubernetes/aapsd-workloads.yaml
```

### 3. Verify Deployments & Pods

Check if everything is running correctly:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

You should see pods for `prometheus`, `aapsd-redis`, `aapsd-api`, and `aapsd-web` in the `Running` state.

### 4. Access the Services (Prometheus & System)

- **Prometheus Dashboard**: The service is exposed via a LoadBalancer on port `9095`. Open your browser and navigate to:
  http://localhost:9095

  _(If the LoadBalancer doesn't bind to localhost automatically on your Windows setup, you can manually port-forward)_:

  ```bash
  kubectl port-forward svc/prometheus 9095:9090
  ```

- **Web App & API**: The web and api services are currently internal to the cluster. To access them, you can port-forward their respective deployments:
  ```bash
  # Example to access the Web app
  kubectl port-forward deployment/aapsd-web 8080:80
  # Now access via http://localhost:8080
  ```

### 5. Cleaning Up

To shut down all the Kubernetes resources and remove them from your Docker Desktop cluster:

```bash
kubectl delete -f infra/kubernetes/aapsd-workloads.yaml
```

---

## Part 4: Troubleshooting New Windows Machine Deployments

When setting up AAPSD-Assistant on a brand-new Windows computer, you may encounter these common initial setup issues:

### 1. PowerShell Script Execution Disabled (`cannot be loaded because running scripts is disabled`)

By default, Windows blocks script execution (`Restricted` execution policy).

- **Permanent fix for your user account**:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- **Temporary single-command bypass**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\setup-docker-desktop-k8s.ps1
  ```

### 2. Missing Module Error (`ERR_MODULE_NOT_FOUND` for `@aapsd/policy`, `@aapsd/contracts`, `@aapsd/diagnosis`)

AAPSD-Assistant is an npm monorepo. On a new machine, workspace packages must be compiled from TypeScript to JavaScript (`dist/`) before starting the API server.

- From the project root directory, run:
  ```powershell
  npm run build
  ```
- Once the build finishes, start the API using:
  ```powershell
  npm run dev -w apps/api
  ```

### 3. Redis Connection Refused (`ECONNREFUSED 127.0.0.1:6379`)

The backend API requires a running Redis instance on port `6379`.

- Start a standalone Docker Redis container:
  ```powershell
  docker run -d --name aapsd-redis -p 6379:6379 redis:alpine --requirepass aapsd_dev
  ```
- Or start Postgres and Redis together via Docker Compose (`compose.yaml` uses `postgres` as the service name):
  ```powershell
  cd infra\docker
  docker-compose up -d postgres redis
  ```

### 4. System Environment Check Hanging on Database Connection

If starting `apps/api` hangs indefinitely after printing `--- System Environment Checks ---`, the application is waiting for PostgreSQL (`DATABASE_URL`).

- For local development, start PostgreSQL via Docker Compose (`docker-compose up -d postgres redis`) and set your `apps/api/.env` to match the local PostgreSQL credentials in `infra/docker/.env`:
  ```env
  DATABASE_URL=postgresql://aapsd:aapsd_dev@localhost:5432/aapsd
  ```
- If using remote Supabase, verify that your network/firewall allows outbound traffic on TCP port `6543`.
