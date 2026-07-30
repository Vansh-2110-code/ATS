const Candidate = require('../models/Candidate');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { generateEmployeeId } = require('../utils/helpers');

const Job = require('../models/Job');

// GET /api/public/jobs
exports.getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: 'Open' })
      .select('companyName jrNumber jobTitle department jobType experience location positions priority hrName hrEmail skills description')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
};

async function getNextRoundRobinRecruiter() {
  try {
    // 1. Get all active recruiters
    const recruiters = await User.find({ role: 'recruiter', status: 'Active' });
    if (recruiters.length === 0) return null;

    // 2. For each recruiter, find their most recent candidate assignment
    const recruitersWithLastAssignment = await Promise.all(recruiters.map(async (r) => {
      const lastCandidate = await Candidate.findOne({ assignedRecruiter: r._id })
        .sort({ assignedAt: -1 })
        .select('assignedAt');
      return {
        recruiter: r,
        lastAssignedAt: lastCandidate && lastCandidate.assignedAt ? lastCandidate.assignedAt.getTime() : 0
      };
    }));

    // 3. Sort recruiters by lastAssignedAt ascending (oldest first)
    recruitersWithLastAssignment.sort((a, b) => a.lastAssignedAt - b.lastAssignedAt);

    // 4. Return the recruiter who got assigned least recently
    return recruitersWithLastAssignment[0].recruiter;
  } catch (err) {
    console.error('Error in getNextRoundRobinRecruiter:', err);
    return null;
  }
}

// POST /api/public/apply
exports.apply = async (req, res, next) => {
  try {
    const { fullName, email, phone, experience, skills, jrNumber } = req.body;
    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }

    // Check duplicate
    const existing = await Candidate.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return res.status(409).json({ message: 'An application with this phone or email already exists' });
    }

    const candidateData = {
      name: fullName,
      email,
      phone,
      experience: experience || '',
      skills: typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : (skills || []),
      source: 'Company Website',
      appliedViaPublic: true,
      status: 'New',
      ownershipStatus: 'General Data',
    };

    // Round robin assignment to active recruiter
    const nextRecruiter = await getNextRoundRobinRecruiter();
    if (nextRecruiter) {
      candidateData.assignedRecruiter = nextRecruiter._id;
      candidateData.assignedRecruiterName = nextRecruiter.name;
      candidateData.ownershipStatus = 'Assigned';
      candidateData.assignedAt = new Date();
    }

    if (jrNumber) {
      // Map positionApplied for backwards compatibility with JR module aggregations
      const linkedJob = await Job.findOne({ jrNumber });
      
      if (linkedJob && linkedJob.status === 'Closed') {
        return res.status(403).json({ message: 'Position already filled / JR is closed' });
      }

      // Joining-Based Lock
      const joinedCandidate = await Candidate.findOne({
        jrNumber: jrNumber,
        status: 'Joined'
      });
      if (joinedCandidate) {
        return res.status(403).json({ message: 'Position already filled / candidate joined' });
      }

      candidateData.jrNumber = jrNumber;
      if (linkedJob) {
        candidateData.positionApplied = linkedJob.jobTitle;
      }
    }

    if (req.file) {
      candidateData.resumePath = `/uploads/resumes/${req.file.filename}`;
      candidateData.resumeOriginalName = req.file.originalname;
    }

    const candidate = await Candidate.create(candidateData);
    res.status(201).json({ message: 'Application submitted successfully', id: candidate._id });
  } catch (err) {
    next(err);
  }
};

// POST /api/public/joining
exports.joining = async (req, res, next) => {
  try {
    const { fullName, phone, joiningDate } = req.body;
    if (!fullName || !phone || !joiningDate) {
      return res.status(400).json({ message: 'fullName, phone, and joiningDate are required' });
    }
    const data = { ...req.body };
    data.employeeId = await generateEmployeeId(Employee, User);
    data.createdBy = req.user._id;

    const employee = await Employee.create(data);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

// GET /api/public/joining/:id - Single record detail (filtered by role)
exports.getJoiningDetail = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id)
      .populate('createdBy', 'name employeeId')
      .populate('candidateRef', 'name status source');
    if (!emp) return res.status(404).json({ message: 'Record not found' });

    // Role-based visibility check
    if (req.user.role === 'recruiter') {
      if (String(emp.createdBy?._id || emp.createdBy) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied: You did not submit this record.' });
      }
    } else if (req.user.role === 'tl') {
      const TeamMember = require('../models/TeamMember');
      const teamMember = await TeamMember.findOne({
        teamLeaderId: req.user._id,
        memberId: emp.createdBy?._id || emp.createdBy,
        removedAt: null,
      });
      const isSelf = String(emp.createdBy?._id || emp.createdBy) === String(req.user._id);
      if (!isSelf && !teamMember) {
        return res.status(403).json({ message: 'Access denied: Creator is not on your team.' });
      }
    }

    res.json(emp);
  } catch (err) {
    next(err);
  }
};

// PUT /api/public/joining/:id - Admin-only: update a joining record
exports.updateJoining = async (req, res, next) => {
  try {
    const emp = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name employeeId');
    if (!emp) return res.status(404).json({ message: 'Record not found' });
    res.json(emp);
  } catch (err) {
    next(err);
  }
};

// GET /api/public/joining - List all joining records (filtered by role)
exports.listJoining = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based records visibility
    if (req.user.role === 'recruiter') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'tl') {
      const TeamMember = require('../models/TeamMember');
      const teamMembers = await TeamMember.find({
        teamLeaderId: req.user._id,
        removedAt: null,
      }).select('memberId');
      const memberIds = teamMembers.map(t => t.memberId);
      memberIds.push(req.user._id);
      query.createdBy = { $in: memberIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [employees, total] = await Promise.all([
      Employee.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit))
        .populate('createdBy', 'name employeeId')
        .populate('candidateRef', 'name status source'),
      Employee.countDocuments(query),
    ]);
    res.json({ employees, total });
  } catch (err) {
    next(err);
  }
};
