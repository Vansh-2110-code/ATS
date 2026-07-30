const RecruiterPortal = require('../models/RecruiterPortal');

// GET /api/recruiter-portals
exports.list = async (req, res, next) => {
  try {
    const portals = await RecruiterPortal.find().sort({ name: 1 }).lean();
    res.json(portals);
  } catch (err) {
    next(err);
  }
};

// POST /api/recruiter-portals (Admin only)
exports.create = async (req, res, next) => {
  try {
    const portal = await RecruiterPortal.create(req.body);
    res.status(201).json(portal);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A portal with this name already exists' });
    }
    next(err);
  }
};

// PUT /api/recruiter-portals/:id (Admin only)
exports.update = async (req, res, next) => {
  try {
    const portal = await RecruiterPortal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!portal) return res.status(404).json({ message: 'Portal not found' });
    res.json(portal);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A portal with this name already exists' });
    }
    next(err);
  }
};

// DELETE /api/recruiter-portals/:id (Admin only)
exports.remove = async (req, res, next) => {
  try {
    const portal = await RecruiterPortal.findByIdAndDelete(req.params.id);
    if (!portal) return res.status(404).json({ message: 'Portal not found' });
    res.json({ message: 'Portal deleted successfully' });
  } catch (err) {
    next(err);
  }
};
