const AccessLog = require('../models/AccessLog');

/**
 * Get logs of the currently authenticated employee
 */
const getMyLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find({ user: req.user._id })
      .populate('resource')
      .sort({ timestamp: -1 })
      .limit(50);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your activity logs' });
  }
};

/**
 * Get all logs across the system (Admin only)
 */
const getAllLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .populate('user')
      .populate('resource')
      .sort({ timestamp: -1 })
      .limit(200);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system logs' });
  }
};

module.exports = {
  getMyLogs,
  getAllLogs,
};
