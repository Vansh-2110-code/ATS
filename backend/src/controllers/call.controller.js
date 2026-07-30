const CallLog = require('../models/CallLog');
const Candidate = require('../models/Candidate');
const { createLog } = require('../utils/auditLogger');
const notificationService = require('../utils/notification.service');

// POST /api/calls/initiate
exports.initiate = async (req, res, next) => {
  try {
    const { candidateId } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const call = await CallLog.create({
      candidate: candidate._id,
      candidateName: candidate.name,
      candidatePhone: candidate.phone,
      recruiter: req.user._id,
      recruiterName: req.user.name,
      startTime: new Date(),
    });

    // Auto-assign to recruiter if candidate is unassigned, expired, or general data
    if (req.user.role === 'recruiter') {
      const lastActivity = candidate.assignedAt || candidate.createdAt;
      const daysSinceAssignment = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
      const isOwner = String(candidate.assignedRecruiter || '') === String(req.user._id);
      const isExpired = !candidate.assignedRecruiter || daysSinceAssignment >= 30;
      const isGeneral = candidate.ownershipStatus === 'General Data';

      if (!isOwner && (isExpired || isGeneral)) {
        candidate.assignedRecruiter = req.user._id;
        candidate.assignedRecruiterName = req.user.name;
        candidate.ownershipStatus = 'Assigned';
        candidate.assignedAt = new Date();
      }
    }

    // Update candidate status if "New"
    if (candidate.status === 'New') {
      candidate.status = 'Contacted';
    }
    await candidate.save();

    await createLog({
      type: 'call', user: req.user._id, userName: req.user.name,
      role: req.user.role, action: `Initiated call to ${candidate.name} (${candidate.phone})`,
      target: candidate._id.toString(), ip: req.ip,
    });

    res.status(201).json(call);
  } catch (err) {
    next(err);
  }
};

// PUT /api/calls/:id/end
exports.endCall = async (req, res, next) => {
  try {
    const { duration } = req.body;
    const call = await CallLog.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call not found' });

    call.endTime = new Date();
    call.duration = duration || Math.round((call.endTime - call.startTime) / 1000);
    await call.save();

    res.json(call);
  } catch (err) {
    next(err);
  }
};

// POST /api/calls/:id/log
exports.logOutcome = async (req, res, next) => {
  try {
    const { outcome, notes } = req.body;
    if (!outcome) return res.status(400).json({ message: 'Outcome is required' });

    const call = await CallLog.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call not found' });

    call.outcome = outcome;
    call.notes = notes || '';
    call.completed = true;
    if (!call.endTime) {
      call.endTime = new Date();
      call.duration = Math.round((call.endTime - call.startTime) / 1000);
    }
    await call.save();

    // Update candidate status based on outcome
    const candidate = await Candidate.findById(call.candidate);
    if (candidate) {
      // Add the call log as a candidate note so it displays in their history and registers on the dashboards
      const callNoteText = `[Call Outcome: ${outcome}]${notes ? ` - ${notes}` : ''}`;
      candidate.notes.push({
        text: callNoteText,
        addedBy: req.user._id,
        addedByName: req.user.name,
        createdAt: new Date(),
      });

      const statusMap = {
        'Interested': 'Interested',
        'Not Interested': 'Rejected',
        'Call Back': 'Call Back',
        'No Answer': 'Did Not Pick',
        'Busy': 'Call Back',
        'Wrong Number': 'Wrong Number',
      };
      if (statusMap[outcome]) {
        candidate.status = statusMap[outcome];
      }
      await candidate.save();
    }

    await createLog({
      type: 'call', user: req.user._id, userName: req.user.name,
      role: req.user.role, action: `Call outcome: ${outcome} for ${call.candidateName}`,
      target: call.candidate.toString(), ip: req.ip,
    });

    // Generate missed call notification if outcome is No Answer or Busy
    if (outcome === 'No Answer' || outcome === 'Busy') {
      await notificationService.createNotification({
        recipientId: call.recruiter,
        type: 'call',
        title: 'Missed Call Logged',
        message: `${call.candidateName} (${outcome}). Follow up later.`,
        entityId: candidate ? candidate._id : null,
        entityType: 'Candidate',
        navigateTo: candidate ? `/recruiter/candidates/${candidate._id}` : `/recruiter/dashboard`
      });
    }

    res.json(call);
  } catch (err) {
    next(err);
  }
};

// GET /api/calls/candidate/:candidateId
exports.getCandidateCalls = async (req, res, next) => {
  try {
    const calls = await CallLog.find({ candidate: req.params.candidateId })
      .sort('-createdAt')
      .limit(50);
    res.json(calls);
  } catch (err) {
    next(err);
  }
};

// GET /api/calls/my - Get current recruiter's calls
exports.getMyCalls = async (req, res, next) => {
  try {
    const { date } = req.query;
    const query = { recruiter: req.user._id };
    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    const calls = await CallLog.find(query).sort('-createdAt').limit(100);
    res.json(calls);
  } catch (err) {
    next(err);
  }
};
