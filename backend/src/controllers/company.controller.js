const Company = require('../models/Company');

// GET /api/companies
exports.list = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { spoc: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [companies, total] = await Promise.all([
      Company.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Company.countDocuments(query),
    ]);
    res.json({ companies, total });
  } catch (err) {
    next(err);
  }
};

// POST /api/companies
exports.create = async (req, res, next) => {
  try {
    const company = await Company.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(company);
  } catch (err) {
    // If a legacy unique index fires, retry with insertOne to bypass it
    if (err.code === 11000 && err.keyPattern && err.keyPattern.companyName) {
      try {
        const doc = new Company({ ...req.body, createdBy: req.user._id });
        await Company.collection.insertOne(doc.toObject());
        return res.status(201).json(doc);
      } catch (retryErr) {
        return next(retryErr);
      }
    }
    next(err);
  }
};

// PUT /api/companies/:id
exports.update = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/companies/:id
exports.remove = async (req, res, next) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted' });
  } catch (err) {
    next(err);
  }
};
