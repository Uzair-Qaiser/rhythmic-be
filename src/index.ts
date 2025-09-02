import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB first
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to Rhythmic Backend API",
    status: "running",
    database: "connected"
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    database: "connected",
    uptime: process.uptime()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});