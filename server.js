/**
 * MediQuest Platform — Backend API
 * Node.js + Express + Socket.IO
 * 
 * Setup:
 *   npm install express mongoose socket.io cors dotenv bcryptjs jsonwebtoken
 *   node server.js
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // serve index.html

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mediquest";
const JWT_SECRET = process.env.JWT_SECRET || "mediquest_secret_change_in_prod";

/* ===================== MODELS ===================== */

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, enum: ["student","intern","doctor","nurse","mentor"], default: "student" },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  casesCompleted: { type: Number, default: 0 },
  totalAnswers: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  quizScores: [{ score: Number, difficulty: String, date: String }],
  preQuizDone: { type: Boolean, default: false },
  preQuizLevel: { type: String, default: "beginner" },
  createdAt: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  name: String,
  host: String,
  members: [{ userId: String, name: String, role: String }],
  maxMembers: { type: Number, default: 5 },
  status: { type: String, enum: ["active","full","ended"], default: "active" },
  caseId: Number,
  messages: [{ from: String, text: String, ts: String, role: String }],
  createdAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  userId: String,
  type: { type: String, enum: ["counselling","mentorship"] },
  topic: String,
  date: String,
  time: String,
  notes: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Room = mongoose.model("Room", RoomSchema);
const Session = mongoose.model("Session", SessionSchema);

/* ===================== MIDDLEWARE ===================== */

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ===================== AUTH ROUTES ===================== */

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================== USER ROUTES ===================== */

// GET /api/users/me
app.get("/api/users/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// PUT /api/users/me
app.put("/api/users/me", authMiddleware, async (req, res) => {
  const updates = req.body;
  delete updates.password; delete updates.email;

  // Auto-calculate level based on XP
  if (updates.xp !== undefined) {
    updates.level = Math.max(1, Math.min(10, Math.floor(updates.xp / 500) + 1));
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
  res.json(user);
});

/* ===================== CASE / QUIZ ROUTES ===================== */

// NOTE: Cases & quiz data are served from embedded JSON in frontend for now.
// These endpoints are ready for when you inject real data / ML APIs.

// GET /api/cases — returns all cases (pluggable for ML-based selection later)
app.get("/api/cases", authMiddleware, (req, res) => {
  // TODO: Replace with DB query / ML difficulty filter
  res.json({ message: "Cases served from frontend JSON for MVP. Plug in real data here.", cases: [] });
});

// POST /api/cases/:id/submit — submit a case attempt
app.post("/api/cases/:id/submit", authMiddleware, async (req, res) => {
  const { diagnosisId, treatmentId, pointsEarned } = req.body;
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { score: pointsEarned, casesCompleted: 1, totalAnswers: 2 }
  });
  res.json({ success: true, pointsEarned });
});

// POST /api/quiz/submit — submit quiz results
app.post("/api/quiz/submit", authMiddleware, async (req, res) => {
  const { score, difficulty, correctAnswers, totalAnswers } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, {
    $inc: { totalAnswers, correctAnswers },
    $push: { quizScores: { score, difficulty, date: new Date().toLocaleDateString() } }
  }, { new: true });

  // Rule-based difficulty adjustment (no ML)
  let newLevel = user.preQuizLevel;
  if (score >= 80 && user.preQuizLevel !== "advanced") newLevel = "advanced";
  else if (score >= 50 && user.preQuizLevel === "beginner") newLevel = "intermediate";
  else if (score < 40 && user.preQuizLevel === "advanced") newLevel = "intermediate";

  await User.findByIdAndUpdate(req.user.id, { preQuizLevel: newLevel });
  res.json({ success: true, newLevel, mentorshipRecommended: score < 40 });
});

/* ===================== LEADERBOARD ROUTES ===================== */

// GET /api/leaderboard
app.get("/api/leaderboard", async (req, res) => {
  const users = await User.find()
    .select("name role level score correctAnswers totalAnswers")
    .sort({ score: -1 })
    .limit(50);

  const lb = users.map(u => ({
    name: u.name, role: u.role, level: u.level, score: u.score,
    accuracy: u.totalAnswers > 0 ? Math.round(u.correctAnswers / u.totalAnswers * 100) : 0
  }));

  res.json(lb);
});

/* ===================== SESSION ROUTES ===================== */

// POST /api/sessions — book counselling or mentorship
app.post("/api/sessions", authMiddleware, async (req, res) => {
  const session = await Session.create({ userId: req.user.id, ...req.body });
  res.json({ success: true, session });
});

// GET /api/sessions/me
app.get("/api/sessions/me", authMiddleware, async (req, res) => {
  const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(sessions);
});

/* ===================== ROOM ROUTES ===================== */

// GET /api/rooms
app.get("/api/rooms", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const roomsDb = await Room.find({ status: { $ne: "ended" } }).select("-messages");
      res.json(roomsDb);
    } else {
      // Fallback to in-memory rooms
      const activeRooms = Object.keys(rooms).map(id => ({
        roomId: id,
        name: rooms[id].name || id,
        host: rooms[id].host || "Unknown",
        members: rooms[id].members,
        maxMembers: rooms[id].maxMembers || 4,
        status: "active"
      }));
      res.json(activeRooms);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms
app.post("/api/rooms", authMiddleware, async (req, res) => {
  try {
    const { name, caseId } = req.body;
    const generateRoomCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      return code;
    };
    const roomId = generateRoomCode();

    if (mongoose.connection.readyState === 1) {
      const room = await Room.create({
        roomId, name, host: req.user.email, caseId,
        members: [{ userId: req.user.id, name: req.user.name, role: "host" }]
      });
      res.json(room);
    } else {
      // Create in-memory
      rooms[roomId] = { 
        name, 
        host: req.user.email, 
        members: [{ socketId: null, userId: req.user.id, name: req.user.name, role: "host" }],
        messages: [] 
      };
      res.json({ roomId, name, host: req.user.email });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================== AI/ML PLACEHOLDER ROUTES ===================== */
// These routes are intentionally left as stubs for future ML integration

// POST /api/ai/adaptive-difficulty — future ML endpoint
app.post("/api/ai/adaptive-difficulty", authMiddleware, (req, res) => {
  // TODO: Call Python ML model via this endpoint
  // Input: { userId, recentScores, timeSpent, errorPatterns }
  // Output: { recommendedDifficulty, nextCaseType, weakAreas }
  res.json({
    status: "ml_not_integrated",
    message: "This endpoint will be powered by your ML model. POST { userId, recentScores } to get adaptive recommendations.",
    placeholder: {
      recommendedDifficulty: "intermediate",
      nextCaseType: "cardiology",
      weakAreas: []
    }
  });
});

// POST /api/ai/patient-simulation — future ML endpoint
app.post("/api/ai/patient-simulation", authMiddleware, (req, res) => {
  // TODO: ML model generates dynamic patient responses
  // Input: { caseId, userAction, currentState }
  // Output: { nextSymptoms, vitalsChange, outcome }
  res.json({
    status: "ml_not_integrated",
    message: "Plug in your trained simulation model here.",
    placeholder: { nextSymptoms: [], vitalsChange: {}, outcome: null }
  });
});

// POST /api/ai/performance-analysis — future ML endpoint
app.post("/api/ai/performance-analysis", authMiddleware, (req, res) => {
  // TODO: ML model analyzes patterns in user performance
  res.json({
    status: "ml_not_integrated",
    message: "Connect your analytics model. Will analyze error patterns, suggest focus areas.",
    placeholder: { focusAreas: [], predictedImprovement: null }
  });
});

/* ===================== SOCKET.IO — REAL-TIME ===================== */

const rooms = {}; // in-memory room state for demo

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_room", ({ roomId, user }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
        rooms[roomId] = { members: [], messages: [], name: roomId, host: user.name };
    }

    const member = { socketId: socket.id, ...user };
    
    // Check for role collision
    const existingMemberWithRole = rooms[roomId].members.find(m => m.role === user.role && m.socketId !== socket.id);
    if (existingMemberWithRole) {
      socket.emit("role_collision", { role: user.role, existingPlayer: existingMemberWithRole.name });
    }

    // Update or add member
    const existingMemberIndex = rooms[roomId].members.findIndex(m => m.socketId === socket.id);
    if (existingMemberIndex > -1) {
      rooms[roomId].members[existingMemberIndex] = member;
    } else {
      rooms[roomId].members.push(member);
    }

    io.to(roomId).emit("room_update", {
      members: rooms[roomId].members,
      memberCount: rooms[roomId].members.length
    });

    socket.to(roomId).emit("user_joined", {
      message: `${user.name} joined the room`,
      user
    });
  });

  socket.on("send_message", ({ roomId, message }) => {
    const msg = { ...message, ts: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) };
    if (rooms[roomId]) rooms[roomId].messages.push(msg);
    io.to(roomId).emit("new_message", msg);
  });

  socket.on("case_action", ({ roomId, action, userId }) => {
    // Broadcast clinical actions to all room members
    io.to(roomId).emit("case_update", { action, userId, ts: Date.now() });
  });

  socket.on("leave_room", ({ roomId, user }) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].members = rooms[roomId].members.filter(m => m.socketId !== socket.id);
      io.to(roomId).emit("room_update", { members: rooms[roomId].members });
      socket.to(roomId).emit("user_left", { message: `${user?.name || "A user"} left the room` });
    }
  });

  socket.on("disconnect", () => {
    // Clean up member from all rooms
    Object.keys(rooms).forEach(roomId => {
      rooms[roomId].members = rooms[roomId].members.filter(m => m.socketId !== socket.id);
    });
    console.log("Socket disconnected:", socket.id);
  });
});

/* ===================== START ===================== */

mongoose.connect(MONGO_URI).then(() => {
  console.log("✅ MongoDB connected");
  server.listen(PORT, () => console.log(`🚀 MediQuest API running on http://localhost:${PORT}`));
}).catch(err => {
  console.error("⚠ MongoDB not available, starting without DB for demo…");
  server.listen(PORT, () => console.log(`🚀 MediQuest API running on http://localhost:${PORT} (no DB)`));
});
