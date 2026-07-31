const Company = require('../models/Company');

// GET /api/companies
exports.list = async (req, res, next) => {
  try {
    const { search, page, limit, dedupe = 'true', sort = 'name' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { spoc: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }
    
    let companies = await Company.find(query).collation({ locale: 'en', strength: 2 }).sort({ companyName: 1 });

    if (dedupe !== 'false') {
      const seen = new Set();
      companies = companies.filter(c => {
        const name = (c.companyName || '').trim().toLowerCase();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    }

    companies.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || '', undefined, { numeric: true, sensitivity: 'base' }));

    const total = companies.length;

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      companies = companies.slice(skip, skip + parseInt(limit));
    }

    res.json({ companies, total });
  } catch (err) {
    next(err);
  }
};

// POST /api/companies
exports.create = async (req, res, next) => {
  try {
    const companyName = (req.body.companyName || '').trim();
    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }
    const existing = await Company.findOne({
      companyName: { $regex: `^${companyName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, $options: 'i' }
    });
    if (existing) {
      return res.status(400).json({ message: `Company "${existing.companyName}" already exists.` });
    }
    const company = await Company.create({ ...req.body, companyName, createdBy: req.user._id });
    res.status(201).json(company);
  } catch (err) {
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
