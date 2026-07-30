const Job = require('../models/Job');
const { createLog } = require('../utils/auditLogger');

// GET /api/jobs
exports.list = async (req, res, next) => {
  try {
    const { search, status, company, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { jrNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (company) query.companyName = { $regex: company, $options: 'i' };

    // Hide Closed priority jobs from non-admin users
    if (req.user && req.user.role !== 'admin') {
      query.priority = { $ne: 'Closed' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total, totalPositionsResult] = await Promise.all([
      Job.find(query).populate('createdBy', 'name email employeeId role').sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Job.countDocuments(query),
      Job.aggregate([
        { $match: query },
        { $group: { _id: null, sum: { $sum: '$positions' } } }
      ])
    ]);
    const totalPositions = totalPositionsResult[0]?.sum || 0;

    // Attach candidate counts per job title & jrNumber (batch lookup)
    const Candidate = require('../models/Candidate');
    const jobTitles = jobs.map(j => j.jobTitle).filter(Boolean);
    const jrNumbers = jobs.map(j => j.jrNumber).filter(Boolean);

    const [byJr, byTitle] = await Promise.all([
      Candidate.aggregate([
        { $match: { jrNumber: { $in: jrNumbers } } },
        { $group: { _id: '$jrNumber', count: { $sum: 1 } } }
      ]),
      Candidate.aggregate([
        { $match: { positionApplied: { $in: jobTitles } } },
        { $group: { _id: { $toLower: '$positionApplied' }, count: { $sum: 1 } } }
      ])
    ]);

    const jrCountMap = Object.fromEntries(byJr.map(c => [c._id, c.count]));
    const titleCountMap = Object.fromEntries(byTitle.map(c => [c._id, c.count]));

    const jobsWithCounts = jobs.map(j => {
      const jrCount = jrCountMap[j.jrNumber] || 0;
      const titleCount = titleCountMap[(j.jobTitle || '').toLowerCase()] || 0;
      return {
        ...j.toObject(),
        candidateCount: Math.max(jrCount, titleCount),
      };
    });

    res.json({
      jobs: jobsWithCounts,
      pagination: {
        total,
        totalPositions,
        pages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/:id/candidates — admin/manager: candidates linked to a JR by positionApplied
exports.candidatesForJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email employeeId role');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const Candidate = require('../models/Candidate');
    // Escape regex special chars
    const escaped = job.jobTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const candidates = await Candidate.find({
      $or: [
        { jrNumber: job.jrNumber },
        { positionApplied: { $regex: `^${escaped}$`, $options: 'i' } }
      ]
    })
      .sort('-createdAt')
      .limit(200)
      .select('name phone email status source positionApplied assignedRecruiterName location city createdAt jrNumber');
    res.json({ candidates, total: candidates.length, job: { jobTitle: job.jobTitle, jrNumber: job.jrNumber, companyName: job.companyName, status: job.status, createdBy: job.createdBy } });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/:id
exports.getById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email employeeId role');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
};

// POST /api/jobs
exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (typeof data.skills === 'string') {
      data.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof data.assignedRecruiters === 'string') {
      try { data.assignedRecruiters = JSON.parse(data.assignedRecruiters); } catch { delete data.assignedRecruiters; }
    }
    if (req.file) {
      data.jdFilePath = `/uploads/jd/${req.file.filename}`;
      data.jdOriginalName = req.file.originalname;
    }
    data.createdBy = req.user._id;
    if (!data.recruiterName) data.recruiterName = req.user.name;
    if (!data.recruiterEmail) data.recruiterEmail = req.user.email;

    // Auto-generate JR Number if not provided: JRWH0001, JRWH0002, ...
    if (!data.jrNumber) {
      const count = await Job.countDocuments();
      data.jrNumber = `JRWH${String(count + 1).padStart(4, '0')}`;
    }

    const job = await Job.create(data);
    await job.populate('createdBy', 'name email employeeId role');

    await createLog({
      type: 'create', user: req.user._id, userName: req.user.name,
      role: req.user.role, action: `Created job: ${job.jobTitle} (${job.jrNumber})`,
      target: job._id.toString(), ip: req.ip,
    });

    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

// POST /api/jobs/:id/extract-keywords
exports.extractKeywords = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Basic keyword extraction from description/requirements
    const text = `${job.description || ''} ${job.requirements || ''} ${job.skills.join(' ')}`.toLowerCase();
    const commonWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'with', 'this', 'that', 'these', 'those', 'it', 'its', 'not', 'no', 'but', 'if', 'so', 'as', 'by', 'from', 'up', 'out', 'about', 'into', 'over', 'after', 'we', 'our', 'you', 'your', 'they', 'their', 'he', 'she', 'him', 'her', 'who', 'what', 'which', 'when', 'where', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 'just', 'also', 'etc']);
    
    const words = text.split(/[\s,.;:()[\]{}]+/).filter(w => w.length > 3 && !commonWords.has(w));
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    
    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    job.suggestedKeywords = keywords;
    await job.save();

    res.json({ keywords });
  } catch (err) {
    next(err);
  }
};

// PUT /api/jobs/:id
exports.update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (typeof data.skills === 'string') {
      data.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof data.assignedRecruiters === 'string') {
      try { data.assignedRecruiters = JSON.parse(data.assignedRecruiters); } catch { delete data.assignedRecruiters; }
    }
    if (req.file) {
      data.jdFilePath = `/uploads/jd/${req.file.filename}`;
      data.jdOriginalName = req.file.originalname;
    }
    const job = await Job.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate('createdBy', 'name email employeeId role');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    await createLog({
      type: 'edit', user: req.user._id, userName: req.user.name,
      role: req.user.role, action: `Updated job: ${job.jobTitle} (${job.jrNumber})`,
      target: job._id.toString(), ip: req.ip,
    });
    res.json(job);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/jobs/:id
exports.remove = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    await createLog({
      type: 'delete', user: req.user._id, userName: req.user.name,
      role: req.user.role, action: `Deleted job: ${job.jobTitle} (${job.jrNumber})`,
      target: job._id.toString(), ip: req.ip,
    });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/jobs/bulk
exports.bulkCreate = async (req, res, next) => {
  try {
    let jobs = req.body.jobs;

    // If Excel/CSV file uploaded, parse it
    if (req.file) {
      const XLSX = require('xlsx');
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const colVal = (row, keys) => {
        for (const k of keys) {
          const found = Object.keys(row).find(
            rk => rk.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')
          );
          if (found && row[found] !== '') return String(row[found]).trim();
        }
        return '';
      };

      jobs = rows.map(row => {
        const divisionRaw = colVal(row, ['division', 'div', 'segment']).toUpperCase();
        let division = 'BPO';
        if (divisionRaw.includes('IT')) {
          division = 'IT';
        } else if (divisionRaw.includes('LATERAL')) {
          division = 'Lateral';
        }
        return {
          companyName: colVal(row, ['companyname', 'company', 'client']),
          jobTitle:    colVal(row, ['jobtitle', 'title', 'position', 'role', 'designation']),
          department:  colVal(row, ['department', 'dept']),
          division:    division,
          jobType:     colVal(row, ['jobtype', 'type', 'employmenttype']),
          experience:  colVal(row, ['experience', 'exp', 'experiencerequired']),
          location:    colVal(row, ['location', 'city', 'place']),
          positions:   parseInt(colVal(row, ['positions', 'openings', 'vacancies', 'count'])) || 1,
          priority:    colVal(row, ['priority']),
          status:      colVal(row, ['status']),
          hrName:      colVal(row, ['hrname', 'hr', 'contactname']),
          hrEmail:     colVal(row, ['hremail', 'hremailid', 'contactemail']),
          skills:      colVal(row, ['skills', 'keyskills']).split(',').map(s => s.trim()).filter(Boolean),
          description: colVal(row, ['description', 'desc', 'jobdescription', 'jd']),
        };
      });
    }

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ message: 'No jobs provided' });
    }
    if (jobs.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 jobs per bulk post' });
    }

    const baseCount = await Job.countDocuments();
    const created = [];
    const failed = [];

    for (let i = 0; i < jobs.length; i++) {
      const jobData = { ...jobs[i] };
      if (!jobData.companyName || !jobData.jobTitle) {
        failed.push({ row: i + 1, error: 'companyName and jobTitle are required', jobTitle: jobData.jobTitle || '(empty)' });
        continue;
      }
      try {
        jobData.jrNumber  = `JRWH${String(baseCount + created.length + 1).padStart(4, '0')}`;
        jobData.createdBy = req.user._id;
        if (!jobData.recruiterName) jobData.recruiterName = req.user.name;
        if (!jobData.recruiterEmail) jobData.recruiterEmail = req.user.email;
        jobData.status    = jobData.status   || 'Open';
        jobData.priority  = jobData.priority || 'Medium';
        const doc = await Job.create(jobData);
        created.push({ _id: doc._id, jrNumber: doc.jrNumber, jobTitle: doc.jobTitle, companyName: doc.companyName });
      } catch (err) {
        failed.push({ row: i + 1, error: err.message, jobTitle: jobData.jobTitle });
      }
    }

    await createLog({
      type: 'create', user: req.user._id, userName: req.user.name, role: req.user.role,
      action: `Bulk created ${created.length} job(s) (${failed.length} failed)`,
      target: 'bulk', ip: req.ip,
    });

    res.status(201).json({ created: created.length, failed: failed.length, total: jobs.length, jobs: created, errors: failed.slice(0, 20) });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/companies - Company list with stats
exports.companies = async (req, res, next) => {
  try {
    const Candidate = require('../models/Candidate');
    const companies = await Job.aggregate([
      {
        $group: {
          _id: '$companyName',
          totalJRs: { $sum: 1 },
          openJRs: { $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] } },
          closedJRs: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          totalPositions: { $sum: '$positions' },
          departments: { $addToSet: '$department' },
          latestJR: { $max: '$createdAt' },
        },
      },
      { $sort: { totalJRs: -1 } },
    ]);

    const result = await Promise.all(companies.map(async (c) => {
      const jobDocs = await Job.find({ companyName: c._id }).select('_id jobTitle jrNumber');
      const jobTitles = jobDocs.map(j => j.jobTitle).filter(Boolean);
      const jrNumbers = jobDocs.map(j => j.jrNumber).filter(Boolean);
      // Count candidates by positionApplied or jrNumber matching
      const candidateCount = jobDocs.length
        ? await Candidate.countDocuments({
            $or: [
              { jrNumber: { $in: jrNumbers } },
              { positionApplied: { $in: jobTitles } }
            ]
          })
        : 0;
      return {
        companyName: c._id,
        totalJRs: c.totalJRs,
        openJRs: c.openJRs,
        closedJRs: c.closedJRs,
        totalPositions: c.totalPositions,
        departments: (c.departments || []).filter(Boolean),
        lastActivity: c.latestJR,
        candidateCount,
      };
    }));

    res.json({ companies: result, total: result.length });
  } catch (err) {
    next(err);
  }
};

// ─── Get HR Contacts for dropdown ──────────────────────────────────
exports.getHRContacts = async (req, res, next) => {
  try {
    const Job = require('../models/Job');

    // Fetch all unique HR contacts from jobs
    const jobs = await Job.find({ hrName: { $exists: true, $ne: '' } })
      .select('hrName hrEmail')
      .lean()
      .exec();

    // Create set of unique HR contacts (avoid duplicates)
    const hrSet = new Map();

    jobs.forEach(job => {
      if (job.hrName && job.hrName.trim()) {
        const key = job.hrName.toLowerCase().trim();
        if (!hrSet.has(key)) {
          hrSet.set(key, {
            name: job.hrName.trim(),
            email: job.hrEmail?.trim() || '',
          });
        }
      }
    });

    // Convert to array with consistent format
    const hrContacts = Array.from(hrSet.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((hr, idx) => ({
        _id: `hr_${idx}`,
        name: hr.name,
        email: hr.email,
      }));

    res.json({ success: true, hrContacts });
  } catch (err) {
    console.error('Error fetching HR contacts:', err);
    res.status(500).json({ message: err.message });
  }
};
