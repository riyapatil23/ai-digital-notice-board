const express = require('express');
const router = express.Router();
const { 
  searchStudents, 
  sendConnectionRequest, 
  getAdminConnections, 
  removeConnectionAdmin,
  getStudentConnections,
  updateConnectionStatus
} = require('../controllers/connectionController');
const { protect, admin, student } = require('../middleware/auth');

// Admin Routes
router.get('/search-students', protect, admin, searchStudents);
router.post('/admin', protect, admin, sendConnectionRequest);
router.get('/admin', protect, admin, getAdminConnections);
router.delete('/admin/:id', protect, admin, removeConnectionAdmin);

// Student Routes
router.get('/student', protect, student, getStudentConnections);
router.put('/student/:id', protect, student, updateConnectionStatus);

module.exports = router;
