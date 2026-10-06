# 📱 Glassmorphic Full-Stack Expense Tracker (DA)

A premium, mobile-first full-stack financial dashboard designed specifically for tracking expenses in **Algerian Dinar (DA / د.ج)**. Built with a decoupled architecture featuring a lightning-fast **FastAPI** backend and a modern vanilla **Tailwind CSS** frontend with real-time **Chart.js** telemetry.

## 🚀 Key Features

* 🇩🇿 **Localized Currency Architecture:** Built-in formatting utility ensuring all data points render in clean Algerian Dinar layouts.
* 📊 **Interactive Telemetry:** Live category allocation breakdowns powered by an optimized `Chart.js` doughnut chart wrapper.
* 🚨 **Smart Budget Progress System:** A premium glassmorphic target bar that updates based on the calendar month. Features dynamic visual feedback states:
  * 🟢 **Green Balance:** Safe zones (<75%)
  * 🟡 **Amber Warning:** Nearing limits (75%–99%)
  * 🔴 **Red Alert:** Pulsating animation indicating over-budget status with precise surplus calculations.
* ✎ **Full Inline CRUD Capabilities:** Seamlessly add, delete, or perform partial updates (`PUT`) directly within data feeds via native async JS inputs without page reloads.
* 📲 **Network Broadcast Ready:** Optimized for local network visibility (`0.0.0.0`) enabling immediate browser testing on physical mobile device screens over Wi-Fi.

## 🗂️ Project Architecture

```text
expense-tracker/
├── backend/
│   ├── main.py            # FastAPI Application & REST API Endpoints
│   ├── database.py        # SQLite Engine & SQLAlchemy Session Config
│   ├── models.py          # Database Schemas & Models
│   ├── schemas.py         # Data Validation Pipelines (Pydantic models)
│   └── requirements.txt   # Python Dependencies
├── frontend/
│   └── index.html         # Glassmorphic UI Interface & Asynchronous Logic
└── .gitignore             # Strict Environment/Data Exclusion Mapping
```

## 🛠️ Tech Stack & Implementation Details

* **Backend Framework:** [FastAPI](https://tiangolo.com) (Python)
* **Object Relational Mapper (ORM):** SQLAlchemy 
* **Database Engine:** SQLite (Local persistent single-file database engine)
* **UI styling Framework:** Tailwind CSS (Utility-first styling with custom frosted backdrop blurs)
* **Visual Data Layer:** Chart.js Engine (Asynchronous chart instance lifecycle updates)

## ⚡ Quick Setup & Local Deployment

### 1. Configure the Python Backend Environment
Navigate to the backend module from the project root directory:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Dynamic API Target
Open `frontend/index.html` and modify the top-level API constant variable to target your computer's local Wi-Fi IP address if deploying for cross-device synchronization:
```javascript
const API_BASE_URL = "http://YOUR_LOCAL_NETWORK_IP:8080";
```

### 3. Initialize the Global REST API Server
Boot up the Uvicorn engine bound to your local network adapter interface:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```
* **Frontend Web Dashboard:** Access via your web browser or local smartphone device at `http://YOUR_LOCAL_NETWORK_IP:8080`
* **Automated Interactive Docs UI:** Access via the built-in Swagger playground at `http://YOUR_LOCAL_NETWORK_IP:8080/docs`
