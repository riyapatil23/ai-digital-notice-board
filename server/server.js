process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { initSocket } = require('./services/realtime/socketService');
const { initDeadlineScheduler } = require('./services/deadlineScheduler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Real-time Socket.IO
initSocket(server);

// Initialize Scheduled Deadline Reminders (node-cron)
initDeadlineScheduler();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL || 'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/personal', require('./routes/personalRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ApexCampus AI Notice Board Backend is healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
