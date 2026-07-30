const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const { createLog } = require('../utils/auditLogger');
const notificationService = require('../utils/notification.service');

// GET /api/interviews
// Returns both Interview model docs AND candidates with interview data (first call submitted with interview scheduled)
exports.list = async (req, res, next) => {
  try {
    const { date, status, mode } = req.query;

    const iQuery = {};
    
    // Role-based filtering for Interview docs
    if (req.user.role === 'recruiter') {
      iQuery.recruiter = req.user._id;
    } else if (req.user.role === 'tl') {
      const TeamMember = require('../models/TeamMember');
      const teamMembers = await TeamMember.find({
        teamLeaderId: req.user._id,
        removedAt: null,
      }).select('memberId');
      const memberIds = teamMembers.map(t => t.memberId);
      memberIds.push(req.user._id);
      iQuery.recruiter = { $in: memberIds };
    }

    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setDate(end.getDate() + 1);
      iQuery.date = { $gte: d, $lt: end };
    }
    if (status) iQuery.status = status;
    if (mode) iQuery.mode = mode;

    const interviewDocs = await Interview.find(iQuery).sort('-date').limit(200);
    const interviewCandidateIds = new Set(interviewDocs.map(i => i.candidate?.toString()).filter(Boolean));

    // ── 2. Candidates with interview data from first call ─────────
    const cQuery = {};
    
    // Role-based filtering for Candidate-derived interviews
    if (req.user.role === 'recruiter') {
      cQuery.assignedRecruiter = req.user._id;
    } else if (req.user.role === 'tl') {
      // Re-use memberIds from above or re-query if not in same scope (let's re-query to be safe/clear)
      const TeamMember = require('../models/TeamMember');
      const teamMembers = await TeamMember.find({
        teamLeaderId: req.user._id,
        removedAt: null,
      }).select('memberId');
      const memberIds = teamMembers.map(t => t.memberId);
      memberIds.push(req.user._id);
      cQuery.assignedRecruiter = { $in: memberIds };
    }

    cQuery.$and = [
      {
        $or: [
          { firstCallStatus: 'Interview Scheduled' },
          { firstCallStatus: 'Interview Completed' },
          { status: 'Interview Scheduled' },
          { interviewScheduled: { $exists: true, $ne: null } },
          { interviewDate: { $exists: true, $ne: null } },
        ],
      },
      { firstCallSubmitted: true },
    ];

    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setDate(end.getDate() + 1);
      cQuery.$and.push({
        $or: [
          { firstCallDate: { $gte: d, $lt: end } },
          { interviewScheduled: { $gte: d, $lt: end } },
          { interviewDate: { $gte: d, $lt: end } },
        ],
      });
    }

    const candidatesWithInterview = await Candidate.find(cQuery)
      .select('name phone positionApplied eligibleRole firstCallStatus firstCallDate firstCallTime interviewScheduled interviewDate interviewTime interviewType interviewStatus status assignedRecruiter assignedRecruiterName')
      .sort('-firstCallDate')
      .limit(200);

    // Map candidates to interview shape (skip any already in Interview model)
    const candidateInterviews = candidatesWithInterview
      .filter(c => !interviewCandidateIds.has(c._id.toString()))
      .map(c => {
        const intDate = c.firstCallDate || c.interviewScheduled || c.interviewDate || null;
        const intStatus = c.firstCallStatus === 'Interview Completed' ? 'Completed' : 'Scheduled';
        const modeMap = { 'Virtual': 'Video', 'Walk-in Company': 'In-Person', 'Walk-in WHM': 'In-Person', 'Video Call': 'Video', 'Phone Call': 'Telephonic', 'Face2Face': 'In-Person' };
        const mappedMode = modeMap[c.interviewType] || 'In-Person';

        if (status && intStatus !== status) return null;
        if (mode && mappedMode !== mode) return null;

        return {
          _id: `cand_${c._id}`,
          candidate: { _id: c._id, name: c.name },
          candidateName: c.name,
          candidateId: c._id,
          role: c.positionApplied || c.eligibleRole || '',
          recruiter: { name: c.assignedRecruiterName || '' },
          recruiterName: c.assignedRecruiterName || '',
          date: intDate,
          time: c.firstCallTime || c.interviewTime || '',
          mode: mappedMode,
          status: intStatus,
          round: 'HR Round',
          notes: c.firstCallStatus || '',
          fromCandidate: true,
        };
      })
      .filter(Boolean);

    const allInterviews = [
      ...interviewDocs.map(i => ({ ...i.toObject(), candidateId: i.candidate })),
      ...candidateInterviews,
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    res.json({ interviews: allInterviews, total: allInterviews.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/interviews
exports.create = async (req, res, next) => {
  try {
    const { candidateId, date, time, mode, round, location, link, notes, role } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    const interview = await Interview.create({
      candidate: candidate._id,
      candidateName: candidate.name,
      role: role || '',
      recruiter: req.user._id,
      recruiterName: req.user.name,
      date: new Date(date),
      time,
      mode: mode || 'In-Person',
      round, location, link, notes,
    });

    // Update candidate status
    candidate.status = 'Interview Scheduled';
    await candidate.save();

    await createLog({
      type: 'create', user: req.user._id, userName: req.user.name,
      role: req.user.role, action: `Scheduled interview for ${candidate.name}`,
      target: interview._id.toString(), ip: req.ip,
    });

    // --- Notification Logic ---
    try {
      const TeamMember = require('../models/TeamMember');
      const recipients = new Set();
      
      // 1. Recruiter assigned to candidate
      if (candidate.assignedRecruiter) recipients.add(candidate.assignedRecruiter.toString());
      
      // 2. Team Leader of that recruiter
      if (candidate.assignedRecruiter) {
        const teamMapping = await TeamMember.findOne({ memberId: candidate.assignedRecruiter, removedAt: null }).select('teamLeaderId');
        if (teamMapping) recipients.add(teamMapping.teamLeaderId.toString());
      }
      
      // 3. All Admins
      const admins = await User.find({ role: 'admin', status: 'Active' }).select('_id');
      admins.forEach(a => recipients.add(a._id.toString()));
      
      // 4. Exclude current user (assigner)
      recipients.delete(req.user._id.toString());
      
      if (recipients.size > 0) {
        await notificationService.createBulkNotifications({
          recipientIds: Array.from(recipients),
          type: 'interview',
          title: 'Interview Scheduled',
          message: `An interview was scheduled for ${candidate.name} by ${req.user.name}`,
          entityId: interview._id,
          entityType: 'Interview',
          navigateTo: '/recruiter/interviews'
        });
      }
    } catch (notifyErr) {
      console.error('Interview notification failed:', notifyErr);
    }

    res.status(201).json(interview);
  } catch (err) {
    next(err);
  }
};

// PUT /api/interviews/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const interview = await Interview.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Update candidate status based on interview outcome
    if (status === 'Completed') {
      await Candidate.findByIdAndUpdate(interview.candidate, { status: 'HR Shortlist' });
    } else if (status === 'No Show') {
      await Candidate.findByIdAndUpdate(interview.candidate, { status: 'Did Not Pick' });
    }

    res.json(interview);
  } catch (err) {
    next(err);
  }
};
