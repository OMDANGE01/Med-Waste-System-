# 🌐 Hosting MedWaste Guard on the Internet

This guide explains how to host your MedWaste Guard application on the public internet so anyone worldwide can access it from their phone, tablet, or laptop.

---

## ⚡ Method 1: Instant Internet Access (Ready in 10 Seconds)
*Use this if you want to share your app right now without creating any accounts, pushing to GitHub, or paying anything.*

1. Open your terminal in the project folder and run:
   ```bash
   npm run share
   ```
2. The script will automatically boot the server and output a public HTTPS internet URL, for example:
   ```
   🎉 YOUR APP IS NOW LIVE ON THE INTERNET!
   🌍 Public Internet URL: https://calm-badger-42.loca.lt
   🔑 Tunnel Password: 103.xxx.xxx.xxx
   ```
3. Share the URL with anyone! When opening on a phone or another device, if prompted for an access password, enter the IP displayed in your terminal.
4. **Mobile QR Code**: You can open the app on your computer, click **"Share QR"** in the top navbar, and point your phone's camera at the screen to load it immediately over mobile data or any Wi-Fi.

---

## 🏷️ How to make the URL "medwaste" (No localhost, No random names)

### 1. On the Public Internet (Cloud Hosting)
When deploying on **Render.com**, set the service name to **`medwaste`** or **`medwaste-system`**:
- Your public URL will be: **`https://medwaste.onrender.com`** (or `https://medwaste-system.onrender.com`)!
- This gives you a clean, custom, professional HTTPS address accessible by anyone in the world.

### 2. On Your Local Computer (Replace localhost with "medwaste")
If you don't want `localhost` showing in your browser URL bar:
1. Double-click **`setup-medwaste-domain.bat`** (or right-click -> "Run as administrator").
2. This maps the domain `medwaste` directly to your local computer.
3. Now you can open:
   - **`http://medwaste:5000`** (Production Web App)
   - **`http://medwaste:5173`** (Development Mode)
   Instead of `http://localhost:...`!

---

## ☁️ Method 2: Permanent Free Cloud Hosting on Render.com (Recommended)
*Get your permanent 24/7 public web address: `https://medwaste.onrender.com`.*

### Step 1: Push Your Project to GitHub
We have already initialized your Git repository and created your initial commit!

**Option A (Easiest - 1-Click Script):**
1. Create a repository on [GitHub](https://github.com/new) named **`medwaste`**.
2. Double-click the file **`push-to-github.bat`** in your project folder.
3. Paste your repository URL (e.g. `https://github.com/Ommohe007/medwaste.git`) and press Enter!

**Option B (Using GitHub Desktop - Already on your computer):**
1. Open **GitHub Desktop**.
2. Click **File** > **Add Local Repository...**
3. Select this folder: `C:\Users\OM\OneDrive\Documents\med-waste-system`
4. Click **Publish repository** to push it to your GitHub account (`Ommohe007`).

### Step 2: Deploy on Render.com (Free Tier)
1. Sign up for a free account at [render.com](https://render.com).
2. On your Dashboard, click **New +** and choose **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub repository.
4. Fill in the deployment settings:
   - **Name**: `medwaste` (Render will assign `https://medwaste.onrender.com` or `https://medwaste-system.onrender.com`)
   - **Region**: Choose the closest region (e.g. Frankfurt, Singapore, Oregon)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**.
6. Render will automatically build the React frontend, package the Express backend, and provide your permanent public URL (e.g. `https://medwaste.onrender.com`).

---

## 🍃 Optional: Connecting MongoDB Atlas (Free Cloud Database)
*By default, MedWaste Guard includes a built-in high-speed resilient storage engine that runs seamlessly in the cloud with zero database setup. If you'd like to use a cloud MongoDB cluster:*

1. Sign up for free at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free **M0 Shared Cluster**.
3. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
4. Under **Database Access**, create a user and password (e.g., `admin` / `password123`).
5. Click **Connect** -> **Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/med_waste_db?retryWrites=true&w=majority
   ```
6. In your Render Dashboard:
   - Go to your Web Service -> **Environment**.
   - Add environment variable:
     - **Key**: `MONGODB_URI`
     - **Value**: *(paste your connection string with your password filled in)*
   - Click **Save Changes**. Render will automatically reconnect to MongoDB!

---

## 🚂 Alternative: Deploy on Railway.app
1. Go to [railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects the Node.js project and uses `package.json` scripts (`npm run build` and `npm start`).
4. Under **Settings** -> **Networking**, click **Generate Domain** to get your public URL.

---

## 🛠️ Summary of Scripts
| Command | What it does |
| :--- | :--- |
| `npm run dev` | Runs local development mode with Vite hot-reloading |
| `npm run build` | Builds the production React frontend bundle into `frontend/dist` |
| `npm start` | Runs the production unified server serving both the UI and the API |
| `npm run share` | Creates an instant public HTTPS internet tunnel to share your live app |
