const Connection = require('../models/Connection');
const User = require('../models/User');
const {
  notifyConnectionRequest,
  notifyConnectionAccepted
} = require('../services/notificationService');

// --- Admin Endpoints ---

// Search students
const searchStudents = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          role: 'student',
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : { role: 'student' };

    const students = await User.find(keyword).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin sends a connection request
const sendConnectionRequest = async (req, res) => {
  const { studentId } = req.body;
  try {
    const existing = await Connection.findOne({ adminId: req.user._id, studentId });
    if (existing) {
      return res.status(400).json({ message: 'Connection already exists or is pending' });
    }
    const connection = await Connection.create({
      adminId: req.user._id,
      studentId,
      status: 'pending'
    });

    // Notify student about incoming connection request
    await notifyConnectionRequest(req.user.name || 'Admin', studentId);

    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin gets all their connections
const getAdminConnections = async (req, res) => {
  try {
    const connections = await Connection.find({ adminId: req.user._id })
      .populate('studentId', 'name email');
    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin removes connection
const removeConnectionAdmin = async (req, res) => {
  try {
    await Connection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Connection removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// --- Student Endpoints ---

// Student gets all their connections
const getStudentConnections = async (req, res) => {
  try {
    const connections = await Connection.find({ studentId: req.user._id })
      .populate('adminId', 'name email');
    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student updates connection status (accept/reject)
const updateConnectionStatus = async (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });
    
    if (connection.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status === 'rejected') {
      await Connection.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Connection rejected and removed' });
    }

    connection.status = status;
    await connection.save();

    // Notify admin that connection was accepted
    if (status === 'accepted') {
      await notifyConnectionAccepted(req.user.name || 'Student', connection.adminId);
    }

    res.json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchStudents,
  sendConnectionRequest,
  getAdminConnections,
  removeConnectionAdmin,
  getStudentConnections,
  updateConnectionStatus
};
