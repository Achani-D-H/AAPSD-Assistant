# AAPSD-Assistant: Ubuntu Application Setup & Execution Guide

This guide is the **Ubuntu/Linux equivalent of `CLIENT_SETUP_GUIDE.md`**, starting from **Step 1**.
Follow these instructions inside your Ubuntu terminal after completing `UBUNTU_VM_SETUP_GUIDE.md`.

---

## Step 1: Verify Kubernetes is Running on Ubuntu

Open your Ubuntu Terminal (`Ctrl + Alt + T`) inside the project folder (`~/AAPSD-Assistant`) and verify Kubernetes:

```bash
kubectl get nodes
```

You should see a node with `STATUS: Ready`.

---

## Step 2: Generate Kubernetes Credentials

Run our Linux Kubernetes setup bash script:

```bash
chmod +x ./scripts/setup-k8s-linux.sh
./scripts/setup-k8s-linux.sh
```

The script will automatically create the ServiceAccount and print out **4 green K8S configuration lines** like this:

```env
K8S_SKIP_TLS_VERIFY=true
K8S_API_SERVER_URL=https://127.0.0.1:16443
K8S_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI...
K8S_ALLOWED_NAMESPACES=default,kube-system
```

**Copy those 4 lines** — you will paste them into `apps/api/.env` in Step 5!

---

## Step 3: Start Redis & Prometheus in Docker

Run these commands in your Ubuntu terminal to start Redis and Prometheus containers:

```bash
# 1. Start Redis Cache
docker rm -f aapsd-redis 2>/dev/null
docker run -d --name aapsd-redis -p 6379:6379 --restart always redis:alpine

# 2. Start Prometheus Monitoring
docker rm -f aapsd-prometheus 2>/dev/null
docker run -d --name aapsd-prometheus -p 9090:9090 --restart always prom/prometheus:latest
```

Verify both containers are running:

```bash
docker ps
```

---

## Step 4: Choose Your Database Option

### Option A: Supabase Cloud Database

If you use Supabase Cloud, you **MUST** include `?sslmode=require` at the end of your connection string:

```env
DATABASE_URL=postgresql://postgres.kopjowqxltigwkdxdfja:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

### Option B: Local Docker PostgreSQL (Recommended for Zero Latency)

If you prefer a fast local database inside Ubuntu Docker:

```bash
docker rm -f aapsd-postgres 2>/dev/null
docker run -d --name aapsd-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aapsd -p 5432:5432 --restart always postgres:16-alpine
```

Your connection string in `.env` will be:

```env
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/aapsd
```

---

## Step 5: Configure `apps/api/.env`

Open or create `apps/api/.env`:

```bash
nano apps/api/.env
```

Paste the following complete configuration (replace `DATABASE_URL` and `K8S_...` with your values):

```env
# 1. Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# 2. Database Connection
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/aapsd

# 3. Redis Cache
REDIS_URL=redis://localhost:6379/0

# 4. Kubernetes Integration (PASTE YOUR 4 LINES FROM STEP 2)
K8S_SKIP_TLS_VERIFY=true
K8S_API_SERVER_URL=https://127.0.0.1:16443
K8S_TOKEN=eyJhbGciOiJSUzI1NiIs...
K8S_ALLOWED_NAMESPACES=default,kube-system

# 5. Prometheus Monitoring
PROMETHEUS_BASE_URL=http://localhost:9090
PROMETHEUS_ALLOWED_METRICS=up,node_cpu_seconds_total,node_memory_MemAvailable_bytes

# 6. GitHub OAuth
GITHUB_CLIENT_ID=dummy_id
GITHUB_CLIENT_SECRET=dummy_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# 7. Firebase Admin Service Account JSON
# Paste your entire single-line firebase-adminsdk.json string below:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"aapsd-assistant", ...}
```

Save and close the file (`Ctrl + O`, `Enter`, `Ctrl + X` in nano).

---

## Step 6: Run Database Migrations

Run the database migrations to create all tables:

```bash
npm run db:migrate -w apps/api
```

You should see: `Running database migrations... ✅ Migrations completed!`

---

## Step 7: Start the Entire System on Ubuntu

### 1. Start the Backend API (Terminal 1)

In your first Ubuntu terminal, start the API:

```bash
npm run dev -w apps/api
```

You should see all 5 system environment checks pass with green checkmarks:

```
--- System Environment Checks ---
✅ Database: Connected successfully
✅ Firebase Admin: Initialized successfully
✅ GitHub OAuth: Configured successfully
✅ Kubernetes Adapter: Connected successfully
✅ Prometheus Adapter: Connected successfully
--- Environment Checks Complete ---
```

### 2. Start the Frontend Web App (Terminal 2)

Open a **new Ubuntu terminal window/tab** (`Ctrl + Shift + T` or `Ctrl + Alt + T`) and start the React app:

```bash
cd ~/AAPSD-Assistant
npm run dev -w apps/web
```

### 3. Open the Application

Open Firefox or Chrome in Ubuntu and visit:
**`http://localhost:5173`**

---

## Why Running in Ubuntu Resolves Windows Issues

- **No Time Skew / "ID Token Expired" Errors:** Ubuntu automatically synchronizes with NTP servers (`chronyd`/`systemd-timesyncd`), so Google Firebase ID tokens never expire prematurely.
- **No Windows COOP Blocks:** Linux browsers handle OAuth popups natively without Windows security policies blocking `window.close()`.
- **Zero Firewall Blocking:** Local Docker containers (`127.0.0.1:5432`, `6379`, `9090`) connect in milliseconds without Windows Defender interference.
