const AuditLog = require('../models/AuditLog');

const createLog = async ({ type, user, userName, role, action, target, details, ip }) => {
  try {
    await AuditLog.create({ type, user, userName, role, action, target, details, ip });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

const logAction = (type, action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (res.statusCode < 400) {
        createLog({
          type,
          user: req.user?._id,
          userName: req.user?.name,
          role: req.user?.role,
          action: typeof action === 'function' ? action(req, data) : action,
          target: req.params.id || req.body?.name || '',
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        });
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { createLog, logAction };
