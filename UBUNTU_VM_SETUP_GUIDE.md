# AAPSD-Assistant: Ubuntu VM Setup & Installation Guide (VirtualBox)

This guide provides the step-by-step instructions to set up **Ubuntu Desktop (24.04 LTS or 22.04 LTS)** in VirtualBox, install all required dependencies (**Node.js 20, Docker, Kubernetes/MicroK8s, Git**), and import the **AAPSD-Assistant** project into Ubuntu.

---

## Step 1: Create Ubuntu Virtual Machine in VirtualBox

1. Download the **Ubuntu 24.04 LTS Desktop ISO** from `ubuntu.com/download/desktop`.
2. Open **VirtualBox** and click **New**:
   - **Name:** `Ubuntu-AAPSD-Assistant`
   - **Type:** `Linux`, **Version:** `Ubuntu (64-bit)`
   - **RAM (Memory):** Minimum **8192 MB** (8 GB) recommended.
   - **Processors (CPU):** Minimum **4 cores** recommended.
   - **Virtual Hard Disk:** Minimum **40 GB** dynamically allocated.
3. Complete the Ubuntu Desktop installation and log into your new Ubuntu desktop.

---

## Step 2: Install Essential System Packages & Build Tools

Open the **Terminal** in Ubuntu (`Ctrl + Alt + T`) and run:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential unzip
```

---

## Step 3: Install Node.js 20 LTS & npm

Install the official NodeSource repository for Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify your installation:

```bash
node -v   # Should output v20.x.x
npm -v    # Should output 10.x.x
```

---

## Step 4: Install Docker & Docker Compose on Ubuntu

Run the official Docker installation script:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Grant your Ubuntu user permission to run Docker without `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verify Docker is working:

```bash
docker run hello-world
```

---

## Step 5: Install Kubernetes (MicroK8s) on Ubuntu

In Ubuntu, **MicroK8s** is the cleanest, official Kubernetes distribution for local development:

```bash
sudo snap install microk8s --classic
sudo usermod -a -G microk8s $USER
mkdir -p ~/.kube
sudo chown -f -R $USER ~/.kube
newgrp microk8s
```

Enable standard Kubernetes features:

```bash
microk8s status --wait-ready
microk8s enable dns storage
microk8s config > ~/.kube/config
```

Verify Kubernetes is running:

```bash
kubectl get nodes   # Should show status: Ready
```

_(Note: If `kubectl` is not found, alias it with: `sudo snap alias microk8s.kubectl kubectl`)_

---

## Step 6: Copy AAPSD-Assistant into the Ubuntu VM

You can transfer the project folder into Ubuntu using either method below:

### Option A: Via VirtualBox Shared Folder

1. In VirtualBox VM Settings → **Shared Folders**, add your Windows project directory (`AAPSD-Assistant`).
2. Inside Ubuntu, copy the project to your home directory:
   ```bash
   cp -r /media/sf_AAPSD-Assistant ~/AAPSD-Assistant
   cd ~/AAPSD-Assistant
   ```

### Option B: Via Zip Archive or Git Clone

1. Copy the `AAPSD-Assistant.zip` file into Ubuntu Desktop and extract it:
   ```bash
   unzip ~/Desktop/AAPSD-Assistant.zip -d ~/
   cd ~/AAPSD-Assistant
   ```

### Install Project Node Dependencies

Once inside the project directory (`~/AAPSD-Assistant`), run:

```bash
npm install
```

---

## Next Step

Now proceed to **`UBUNTU_APP_SETUP_GUIDE.md`** to configure your `.env` file, start Redis & Prometheus, and launch the application!
