const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// GET /api/logs
exports.list = async (req, res, next) => {
  try {
    const { search, type, date, userId, page = 1, limit = 100 } = req.query;
    let { startDate, endDate } = req.query;
    // Accept single `date` param as shorthand for start+end of that day
    if (date && !startDate && !endDate) { startDate = date; endDate = date; }
    const query = {};

    // Filter by userId (accepts MongoDB ObjectId or employeeId string)
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query.user = new mongoose.Types.ObjectId(userId);
      } else {
        const resolvedUser = await User.findOne({ employeeId: userId }).lean();
        // If not found, use a non-matching ObjectId so result is empty
        query.user = resolvedUser ? resolvedUser._id : new mongoose.Types.ObjectId();
      }
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { target: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query.timestamp.$lt = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort('-timestamp').skip(skip).limit(parseInt(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/logs/export
exports.exportLogs = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query.timestamp.$lt = end;
      }
    }

    const logs = await AuditLog.find(query).sort('-timestamp').limit(5000);
    
    // CSV format
    const header = 'ID,Type,User,Role,Action,Target,IP,Timestamp\n';
    const rows = logs.map(l =>
      `${l._id},${l.type},${l.userName || ''},${l.role || ''},${(l.action || '').replace(/,/g, ';')},${l.target || ''},${l.ip || ''},${l.timestamp?.toISOString() || ''}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send(header + rows);
  } catch (err) {
    next(err);
  }
};
