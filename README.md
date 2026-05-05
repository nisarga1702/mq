# MedLearn Platform — Deployment Guide

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` file
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/medlearn
JWT_SECRET=your_super_secret_key_here
```

### 3. Run development server
```bash
npm run dev
```

### 4. Open in browser
- App: http://localhost:3001
- API: http://localhost:3001/api

---

## 🌐 Deploy to Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a long random string
6. Deploy!

---

## ☁ Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```
Add env vars via Railway dashboard.

---

## 🔥 Deploy Frontend Only (GitHub Pages / Netlify)

The `index.html` is completely self-contained and works without a backend.
It uses localStorage for persistence in standalone mode.

**Netlify:**
1. Drag `index.html` to netlify.com/drop
2. Done — live in seconds!

**GitHub Pages:**
```bash
git init && git add . && git commit -m "init"
gh repo create medlearn --public --push
# Enable GitHub Pages from repo settings → Pages → main branch
```

---

## 🤖 AI/ML Integration Guide

When your ML models are ready, connect them via these API endpoints:

### Adaptive Difficulty
```
POST /api/ai/adaptive-difficulty
Body: { userId, recentScores: [85, 60, 72], timeSpent: [120, 90, 150] }
```

### Patient Simulation
```
POST /api/ai/patient-simulation
Body: { caseId: 1, userAction: "diagnosis", currentState: {...} }
```

### Performance Analysis
```
POST /api/ai/performance-analysis
Body: { userId, errorPatterns: [...], focusSessions: [...] }
```

Replace the placeholder responses in `server.js` with calls to your Python models.

---

## 📁 Project Structure

```
medlearn-platform/
├── index.html          # Complete frontend (React, all 10 features)
├── server.js           # Node.js + Express + Socket.IO backend
├── package.json        # Dependencies
├── .env                # Environment variables (create this)
└── README.md           # This file
```

---

## ✅ Features Implemented

| Feature | Status |
|---|---|
| Authentication (signup/login) | ✅ Frontend + Backend |
| Pre-quiz + Adaptive levels | ✅ Rule-based logic |
| Clinical Simulation (5 cases) | ✅ Full diagnosis + treatment |
| Role assignment (Intern/Doctor/Nurse/Surgeon) | ✅ |
| Multiplayer rooms + chat | ✅ Socket.IO ready |
| Performance dashboard | ✅ XP, levels, accuracy |
| Counselling booking | ✅ |
| Mentorship system | ✅ Low-score recommendation |
| Leaderboard (Top 10) | ✅ |
| Institutional collaboration UI | ✅ |
| AI/ML placeholder endpoints | ✅ Ready for integration |

---

## 🛣 Future Integration

- Replace JSON cases with MongoDB queries
- Connect Python ML API to `/api/ai/*` endpoints
- Add real Socket.IO multiplayer synchronisation
- Add Firebase Auth for social login
- Add payment gateway for premium mentorship
