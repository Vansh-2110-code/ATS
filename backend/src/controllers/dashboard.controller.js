const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const CallLog = require('../models/CallLog');
const Interview = require('../models/Interview');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const WalkIn = require('../models/WalkIn');
const TeamMember = require('../models/TeamMember');
const { getDateRange } = require('../utils/helpers');

// GET /api/dashboard/recruiter
exports.recruiterDashboard = async (req, res, next) => {
  try {
    const { dateRange = 'month', startDate, endDate, division, company, customer, recruiter } = req.query;
    const { start, end } = getDateRange(dateRange, startDate, endDate);
    const userId = req.user._id;
    const isAdmin = ['admin', 'manager', 'tl'].includes(req.user.role);

    const dateFilter = { $gte: start, $lt: end };
    
    let filterRecruiter = userId;
    if (isAdmin) {
      if (recruiter) {
        // If admin/manager/tl wants a specific recruiter
        filterRecruiter = new mongoose.Types.ObjectId(recruiter);
      } else {
        filterRecruiter = null; // Admin viewing all
      }
    }

    const baseMatch = { createdAt: dateFilter };
    if (filterRecruiter) baseMatch.assignedRecruiter = filterRecruiter;
    if (division) baseMatch.division = division;
    
    const clientFilter = customer || company;
    if (clientFilter) baseMatch.clientName = clientFilter;

    // Pipeline counts
    const statusCounts = await Candidate.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const pipeline = {};
    Candidate.STATUSES.forEach(s => { pipeline[s] = 0; });
    statusCounts.forEach(s => { pipeline[s._id] = s.count; });

    // Call stats
    const totalCalls = await CallLog.countDocuments({ recruiter: userId, createdAt: dateFilter });
    const todayCalls = await CallLog.countDocuments({
      recruiter: userId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    // Interview stats
    const totalInterviews = await Interview.countDocuments({ recruiter: userId, createdAt: dateFilter });
    const scheduledInterviews = await Interview.countDocuments({ recruiter: userId, status: 'Scheduled' });

    // Candidates
    const totalCandidates = await Candidate.countDocuments(baseMatch);
    const joined = await Candidate.countDocuments({ ...baseMatch, status: 'Joined' });

    // Follow-ups (candidates with follow-up notes)
    const followUps = await Candidate.find({
      ...(!isAdmin && { assignedRecruiter: userId }),
      'notes.followUpDate': { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lt: new Date(new Date().setHours(23, 59, 59, 999)) },
    }).select('name phone status notes').limit(10);

    // Recent activity
    const recentActivity = await AuditLog.find({ user: userId })
      .sort('-timestamp').limit(10)
      .select('action timestamp type');

    // Call target (daily = 50)
    const callTarget = { target: 50, completed: todayCalls };

    res.json({
      metrics: {
        totalCandidates,
        totalCalls,
        todayCalls,
        totalInterviews,
        scheduledInterviews,
        joined,
        conversionRate: totalCandidates > 0 ? Math.round((joined / totalCandidates) * 100) : 0,
      },
      pipeline,
      followUps,
      recentActivity,
      callTarget,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/tl
exports.tlDashboard = async (req, res, next) => {
  try {
    const { tlId } = req.query;
    const currentUser = req.user;

    // Determine target TL ID: Admins can specify, TLs get their own
    const targetTlId = (currentUser.role === 'admin' || currentUser.role === 'manager') && tlId ? tlId : currentUser._id;

    // Get assigned team members (recruiters)
    const teamAssignments = await TeamMember.find({ teamLeaderId: targetTlId })
      .populate('memberId', 'name email employeeId status')
      .lean();
    
    const recruiters = teamAssignments
      .map(ta => ta.memberId)
      .filter(u => u && u.status === 'Active');

    const recruiterIds = recruiters.map(r => r._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const teamStats = await Promise.all(recruiters.map(async (r) => {
      // Count notes added today as "calls made" (each note = a recruiter interaction)
      const callsAgg = await Candidate.aggregate([
        { $match: { assignedRecruiter: r._id } },
        { $unwind: '$notes' },
        { $match: { 'notes.createdAt': { $gte: today, $lt: tomorrow } } },
        { $count: 'count' },
      ]);
      const todayCalls = callsAgg[0]?.count || 0;

      // Count candidates with interview scheduled today
      const todayInterviews = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        $or: [
          { interviewScheduled: { $gte: today, $lt: tomorrow } },
          { interviewDate: { $gte: today, $lt: tomorrow } },
        ],
      });

      // Count candidates needing TL follow-up (Eligible, but no TL call submitted)
      const followUps = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        firstCallStatus: 'Eligible',
        tlCallSubmitted: false,
      });

      const totalCandidates = await Candidate.countDocuments({ assignedRecruiter: r._id });
      const activeCandidates = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        status: { $nin: ['Rejected', 'Joined'] },
      });

      const totalCallsAgg = await Candidate.aggregate([
        { $match: { assignedRecruiter: r._id } },
        { $unwind: '$notes' },
        { $count: 'count' },
      ]);
      const totalCalls = totalCallsAgg[0]?.count || 0;

      const totalInterviewsScheduled = await Candidate.countDocuments({
        assignedRecruiter: r._id,
        status: { $in: ['Interview Scheduled', 'Interview Rescheduled', 'Interview Completed', 'Shortlisted', 'HR Round Scheduled', 'Final Round Scheduled', 'Selected', 'Rejected'] }
      });

      return {
        id: r._id,
        name: r.name,
        email: r.email,
        employeeId: r.employeeId,
        todayCalls,
        totalCalls,
        callTarget: 50,
        todayInterviews,
        totalInterviewsScheduled,
        followUps,
        totalCandidates,
        activeCandidates,
        onTarget: todayCalls >= 50,
      };
    }));

    // Pending corrections (filtered by team members)
    const corrections = await Candidate.find({ 
      flagged: true,
      assignedRecruiter: { $in: recruiterIds }
    })
      .select('name phone email skills experience source status assignedRecruiterName flagReason')
      .limit(20);

    // Team health
    const avgCalls = teamStats.length > 0 ? Math.round(teamStats.reduce((s, t) => s + t.todayCalls, 0) / teamStats.length) : 0;
    const onTarget = teamStats.filter(t => t.onTarget).length;

    res.json({
      teamMembers: teamStats,
      corrections,
      teamHealth: {
        avgCalls,
        onTargetCount: onTarget,
        totalMembers: teamStats.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/manager
exports.managerDashboard = async (req, res, next) => {
  try {
    const { range = 'month', startDate, endDate } = req.query;
    const { getDateRange } = require('../utils/helpers');
    const { start, end } = getDateRange(range, startDate, endDate);
    const dateFilter = { $gte: start, $lt: end };

    // Previous period for trend calculation
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevDateFilter = { $gte: prevStart, $lt: start };

    // KPIs
    const totalPlacements = await Candidate.countDocuments({ status: 'Joined', updatedAt: dateFilter });
    const totalInterviews = await Interview.countDocuments({ createdAt: dateFilter });
    const completedInterviews = await Interview.countDocuments({ status: 'Completed', updatedAt: dateFilter });
    const interviewToHire = totalInterviews > 0 ? Math.round((totalPlacements / totalInterviews) * 100) : 0;

    // Revenue Calculation
    const joinedCurrent = await Candidate.countDocuments({ status: 'Joined', updatedAt: dateFilter });
    const currentRevenue = joinedCurrent * 25000;
    const joinedPrev = await Candidate.countDocuments({ status: 'Joined', updatedAt: prevDateFilter });
    const prevRevenue = joinedPrev * 25000;
    
    let revenueTrend = '+0%';
    if (prevRevenue > 0) {
      const pct = Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);
      revenueTrend = `${pct >= 0 ? '+' : ''}${pct}%`;
    } else if (currentRevenue > 0) {
      revenueTrend = '+100%';
    }

    // Funnel data & Revenue Data (last 6 months)
    const funnelData = [];
    const revenueData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mFilter = { $gte: mStart, $lt: mEnd };
      
      const applied = await Candidate.countDocuments({ createdAt: mFilter });
      const interviewed = await Interview.countDocuments({ createdAt: mFilter });
      const selected = await Candidate.countDocuments({ status: 'Selected', updatedAt: mFilter });
      const joinedCount = await Candidate.countDocuments({ status: 'Joined', updatedAt: mFilter });
      
      const monthLabel = mStart.toLocaleString('default', { month: 'short' });
      
      funnelData.push({
        month: monthLabel,
        applied, interviewed, selected, joined: joinedCount,
      });
      
      revenueData.push({
        month: monthLabel,
        revenue: joinedCount * 25000
      });
    }

    // Recruiter productivity
    const recruiters = await User.find({ role: 'recruiter', status: 'Active' }).select('name');
    const recruiterProductivity = await Promise.all(recruiters.map(async (r) => {
      const calls = await CallLog.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const interviews = await Interview.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const placements = await Candidate.countDocuments({ assignedRecruiter: r._id, status: 'Joined', updatedAt: dateFilter });
      return { name: r.name, calls, interviews, placements };
    }));

    // Source distribution
    const sourceDistribution = await Candidate.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Department distribution
    const departmentDistribution = await Candidate.aggregate([
      { $match: { createdAt: dateFilter, department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      kpis: {
        totalPlacements,
        totalInterviews,
        completedInterviews,
        interviewToHireRate: interviewToHire,
        avgTimeToHire: 14,
        revenue: currentRevenue,
        revenueTrend
      },
      funnelData,
      revenueData,
      recruiterProductivity,
      sourceDistribution: sourceDistribution.map(s => ({ source: s._id || 'Unknown', count: s.count })),
      departmentDistribution: departmentDistribution.map(d => ({ department: d._id, count: d.count })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/admin
exports.adminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Active users today
    const activeLogins = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } });
    const totalUsers = await User.countDocuments({ status: 'Active' });
    const totalResumes = await Candidate.countDocuments();

    // Attendance rate
    const attendanceRate = totalUsers > 0 ? Math.round((activeLogins / totalUsers) * 100) : 0;

    // ── NEW DASHBOARD CARD COUNTS ────────────────────────────────────
    const Job = require('../models/Job');

    // Pending Follow-ups: candidates with any follow-up note due today or earlier
    const pendingFollowUps = await Candidate.countDocuments({
      status: { $nin: ['Rejected', 'Joined', 'Exited'] },
      'notes.followUpDate': { $exists: true, $lte: tomorrow },
    });

    // Selected count
    const selectedCount = await Candidate.countDocuments({ status: 'Selected' });

    // Operations Round count
    const opsRoundCount = await Candidate.countDocuments({ status: 'Operations Round' });

    // HR Round: candidates in HR Shortlist / HR Round status
    const hrRoundCount = await Candidate.countDocuments({ status: { $in: ['HR Shortlist', 'HR Round'] } });

    // Follow to Join / Yet To Join: candidates with status 'Yet To Join'
    const yetToJoinCount = await Candidate.countDocuments({ status: 'Yet To Join' });
    const followToJoinCount = yetToJoinCount;

    // Joined count
    const joinedCount = await Candidate.countDocuments({ status: 'Joined' });

    // Rejected count
    const rejectedCount = await Candidate.countDocuments({ status: 'Rejected' });

    // Open Jobs & Open Positions count
    const openJobsAgg = await Job.aggregate([
      { $match: { status: 'Open' } },
      { $group: { _id: null, totalPositions: { $sum: '$positions' }, count: { $sum: 1 } } }
    ]);
    const openJobsCount = openJobsAgg[0]?.count || await Job.countDocuments({ status: 'Open' });
    const openPositionsCount = openJobsAgg[0]?.totalPositions || openJobsCount;

    // Revenue this month (from Revenue model if it exists)
    let currentMonthRevenue = 0;
    try {
      const Revenue = require('../models/Revenue');
      const now = new Date();
      const revenueDoc = await Revenue.findOne({ month: now.getMonth() + 1, year: now.getFullYear() });
      currentMonthRevenue = revenueDoc?.actual || 0;
    } catch (e) {
      currentMonthRevenue = 0;
    }
    // ── END NEW COUNTS ───────────────────────────────────────────────

    // Source chart
    const sourceChart = await Candidate.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent alerts (from logs)
    const alerts = await AuditLog.find({ type: { $in: ['delete', 'system'] } })
      .sort('-timestamp').limit(5)
      .select('action userName type timestamp');

    // System metrics
    const todayLogs = await AuditLog.countDocuments({ timestamp: { $gte: today, $lt: tomorrow } });

    
      // Calculate total revenue and get candidate revenue details
      const revenueData = await Candidate.aggregate([
        { $match: { revenueGenerated: { $gt: 0 } } },
        { $project: { _id: 1, name: 1, revenueGenerated: 1, joiningSalary: 1, placementPercentage: 1, dateOfJoining: 1, status: 1 } },
        { $sort: { revenueGenerated: -1 } }
      ]);
      const totalRevenue = revenueData.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);

      res.json({
        totalRevenue,
        revenueCandidates: revenueData,
      metrics: {
        activeLogins,
        totalUsers,
        totalResumes,
        attendanceRate,
        todayLogs,
        // Dashboard status card counts
        totalCandidates: totalResumes,
        pendingFollowUps,
        selectedCount,
        opsRoundCount,
        operationsRoundCount: opsRoundCount,
        hrRoundCount,
        yetToJoinCount,
        followToJoinCount,
        joinedCount,
        rejectedCount,
        openJobsCount,
        openPositionsCount,
        currentMonthRevenue,
      },
      sourceChart: sourceChart.map(s => ({ source: s._id || 'Unknown', count: s.count })),
      alerts: alerts.map(a => ({
        id: a._id,
        message: a.action,
        user: a.userName,
        type: a.type,
        severity: a.type === 'delete' ? 'high' : 'medium',
        time: a.timestamp,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/manager/reports
exports.managerReports = async (req, res, next) => {
  try {
    const { dateRange = 'month', startDate, endDate, sort = 'placements' } = req.query;
    const { start, end } = getDateRange(dateRange, startDate, endDate);
    const dateFilter = { $gte: start, $lt: end };

    const recruiters = await User.find({ role: 'recruiter', status: 'Active' }).select('name employeeId');

    const reports = await Promise.all(recruiters.map(async (r) => {
      const totalCalls = await CallLog.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const interviews = await Interview.countDocuments({ recruiter: r._id, createdAt: dateFilter });
      const placements = await Candidate.countDocuments({ assignedRecruiter: r._id, status: 'Joined', updatedAt: dateFilter });
      const candidates = await Candidate.countDocuments({ assignedRecruiter: r._id, createdAt: dateFilter });

      return {
        id: r._id,
        name: r.name,
        employeeId: r.employeeId,
        totalCalls,
        interviews,
        placements,
        candidates,
        conversionRate: candidates > 0 ? Math.round((placements / candidates) * 100) : 0,
      };
    }));

    // Sort
    reports.sort((a, b) => b[sort] - a[sort] || 0);

    res.json({ reports, dateRange });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/admin/all-teams
exports.allTeamsDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Get all active Team Leaders
    const teamLeaders = await User.find({ role: 'tl', status: 'Active' }).select('name email employeeId status').lean();

    const teams = await Promise.all(teamLeaders.map(async (tl) => {
      // 2. Get recruiters for this TL
      const teamAssignments = await TeamMember.find({ teamLeaderId: tl._id, removedAt: null })
        .populate('memberId', 'name email employeeId status')
        .lean();
      
      const recruiters = teamAssignments
        .map(ta => ta.memberId)
        .filter(u => u && u.status === 'Active');

      // 3. Calculate performance for each recruiter
      const recruiterStats = await Promise.all(recruiters.map(async (r) => {
        // Calls today
        const callsAgg = await Candidate.aggregate([
          { $match: { assignedRecruiter: r._id } },
          { $unwind: '$notes' },
          { $match: { 'notes.createdAt': { $gte: today, $lt: tomorrow } } },
          { $count: 'count' },
        ]);
        const calls = callsAgg[0]?.count || 0;

        // Interviews today
        const interviews = await Candidate.countDocuments({
          assignedRecruiter: r._id,
          $or: [
            { interviewScheduled: { $gte: today, $lt: tomorrow } },
            { interviewDate: { $gte: today, $lt: tomorrow } },
          ],
        });

        // Follow-ups (Eligible candidates waiting for TL)
        const followUps = await Candidate.countDocuments({
          assignedRecruiter: r._id,
          firstCallStatus: 'Eligible',
          tlCallSubmitted: false,
        });

        // Joined count (all time)
        const joinedCount = await Candidate.countDocuments({
          assignedRecruiter: r._id,
          status: 'Joined'
        });

        return {
          id: r._id,
          name: r.name,
          employeeId: r.employeeId,
          status: r.status,
          calls,
          target: 50,
          interviews,
          followUps,
          joinedCount,
          onTarget: calls >= 50
        };
      }));

      // 4. Aggregate TL performance
      const tlStats = {
        totalCalls: recruiterStats.reduce((s, r) => s + r.calls, 0),
        totalInterviews: recruiterStats.reduce((s, r) => s + r.interviews, 0),
        totalFollowUps: recruiterStats.reduce((s, r) => s + r.followUps, 0),
        totalJoined: recruiterStats.reduce((s, r) => s + r.joinedCount, 0),
        onTargetCount: recruiterStats.filter(r => r.onTarget).length,
        totalMembers: recruiterStats.length
      };

      return {
        tlId: tl._id,
        tlName: tl.name,
        tlEmployeeId: tl.employeeId,
        recruiters: recruiterStats,
        stats: tlStats
      };
    }));

    // 5. Overall summary
    const summary = {
      totalCalls: teams.reduce((s, t) => s + t.stats.totalCalls, 0),
      totalInterviews: teams.reduce((s, t) => s + t.stats.totalInterviews, 0),
      totalFollowUps: teams.reduce((s, t) => s + t.stats.totalFollowUps, 0),
      activeRecruiters: teams.reduce((s, t) => s + t.stats.totalMembers, 0)
    };

    res.json({
      teams,
      summary
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/division
exports.divisionDashboard = async (req, res, next) => {
  try {
    const { division = 'BPO', company } = req.query;
    const Job = require('../models/Job');
    const Candidate = require('../models/Candidate');

    const jobQuery = { division };
    const candQuery = { division };

    if (company && company !== 'All Companies') {
      const companyRegex = new RegExp(`^${company.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');
      jobQuery.$or = [
        { companyName: companyRegex },
        { client: companyRegex },
      ];
      candQuery.$or = [
        { clientName: companyRegex },
        { company: companyRegex },
        { client: companyRegex },
      ];
    }

    // 1. Open Positions & total JRs
    const openJobs = await Job.find({ ...jobQuery, status: 'Open' });
    const openPositions = openJobs.reduce((sum, j) => sum + (j.positions || 0), 0);
    const totalJRs = openJobs.length;

    // 2. Candidates in each stage
    const screeningCount = await Candidate.countDocuments({ ...candQuery, currentStage: 'Screening', status: { $ne: 'Rejected' } });
    const interviewCount = await Candidate.countDocuments({ ...candQuery, currentStage: 'Interview', status: { $ne: 'Rejected' } });
    const offerCount = await Candidate.countDocuments({ ...candQuery, currentStage: 'Offer', status: { $ne: 'Rejected' } });

    const baseYetToJoinOr = [
      { status: 'Yet To Join' },
      { candidateStatusPostOffer: 'Yet To Join' },
      { currentStage: 'Joining', status: { $ne: 'Joined' } }
    ];

    const yetToJoinMatch = candQuery.$or ? {
      $and: [
        { division },
        { $or: candQuery.$or },
        { $or: baseYetToJoinOr }
      ]
    } : {
      division,
      $or: baseYetToJoinOr
    };

    const yetToJoinCount = await Candidate.countDocuments(yetToJoinMatch);
    const joinedCount = await Candidate.countDocuments({ ...candQuery, status: 'Joined' });

    // 3. Joined Candidates with Date of Joining
    const joinedCandidates = await Candidate.find({ ...candQuery, status: 'Joined' })
      .select('name positionApplied clientName dateOfJoining assignedRecruiterName status')
      .sort('-dateOfJoining');

    // 4. Yet To Join Candidates
    const yetToJoinCandidates = await Candidate.find(yetToJoinMatch)
      .select('name positionApplied clientName dateOfJoining expectedDateOfJoining assignedRecruiterName status candidateStatusPostOffer')
      .sort('-createdAt');

    res.json({
      division,
      company: company || 'All Companies',
      openPositions,
      totalJRs,
      pipeline: {
        screening: screeningCount,
        interview: interviewCount,
        offer: offerCount,
        yetToJoin: yetToJoinCount,
        joined: joinedCount
      },
      joinedCandidates,
      yetToJoinCandidates
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/reports/advanced
exports.advancedReports = async (req, res, next) => {
  try {
    const { dateRange = 'month', startDate, endDate } = req.query;
    const { start, end } = getDateRange(dateRange, startDate, endDate);
    
    const Job = require('../models/Job');
    const Candidate = require('../models/Candidate');

    // 1. Recruiter performance
    const recruiterReport = await Candidate.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: '$assignedRecruiterName',
          shared: { $sum: 1 },
          interviews: {
            $sum: {
              $cond: [{ $in: ['$status', ['Interview Scheduled', 'Interview Completed', 'Shortlisted', 'HR Round Scheduled']] }, 1, 0]
            }
          },
          selected: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0]
            }
          },
          joined: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Joined'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { joined: -1 } }
    ]);

    // 2. Customer performance
    const customerReport = await Candidate.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, clientName: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$clientName',
          shared: { $sum: 1 },
          interviews: {
            $sum: {
              $cond: [{ $in: ['$status', ['Interview Scheduled', 'Interview Completed', 'Shortlisted', 'HR Round Scheduled']] }, 1, 0]
            }
          },
          selected: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0]
            }
          },
          joined: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Joined'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { joined: -1 } }
    ]);

    // 3. Division performance
    const divisionReport = await Candidate.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: '$division',
          shared: { $sum: 1 },
          interviews: {
            $sum: {
              $cond: [{ $in: ['$status', ['Interview Scheduled', 'Interview Completed', 'Shortlisted', 'HR Round Scheduled']] }, 1, 0]
            }
          },
          selected: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0]
            }
          },
          yetToJoin: {
            $sum: {
              $cond: [{ $in: ['$status', ['Yet To Join', 'Joining Date Confirmed', 'Joining Postponed']] }, 1, 0]
            }
          },
          joined: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Joined'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { joined: -1 } }
    ]);

    // 4. Aging Report
    const activePipelineCandidates = await Candidate.find({
      status: { $nin: ['Joined', 'Rejected', 'Exited'] }
    }).select('name currentStage status updatedAt createdAt assignedRecruiterName assignedRecruiter')
      .populate('assignedRecruiter', 'name');

    // Fetch TL mappings
    const TeamMember = require('../models/TeamMember');
    const allAssignments = await TeamMember.find({ removedAt: null }).populate('teamLeaderId', 'name');
    const recruiterToTlMap = {};
    allAssignments.forEach(ta => {
      if (ta.memberId && ta.teamLeaderId) {
        recruiterToTlMap[ta.memberId.toString()] = ta.teamLeaderId.name;
      }
    });

    const agingCandidates = activePipelineCandidates.map(cand => {
      const lastChangeDate = cand.updatedAt || cand.createdAt;
      const daysPending = Math.ceil((new Date() - new Date(lastChangeDate)) / (1000 * 60 * 60 * 24));
      
      let tlName = 'Unassigned';
      if (cand.assignedRecruiter && cand.assignedRecruiter._id) {
        tlName = recruiterToTlMap[cand.assignedRecruiter._id.toString()] || 'Unassigned';
      }

      return {
        _id: cand._id,
        name: cand.name,
        stage: cand.currentStage,
        status: cand.status,
        daysPending,
        pendingSince: cand.createdAt,
        recruiter: cand.assignedRecruiterName || 'Unassigned',
        teamLead: tlName,
        manager: 'Admin' // Currently Managers manage the whole branch, no strict TL-Manager map exists.
      };
    }).sort((a, b) => b.daysPending - a.daysPending);

    const avgStageAging = {};
    ['Applied', 'Screening', 'Interview', 'Offer', 'Joining'].forEach(stg => {
      const stgCands = agingCandidates.filter(c => c.stage === stg);
      const avg = stgCands.length > 0
        ? Math.round(stgCands.reduce((s, c) => s + c.daysPending, 0) / stgCands.length)
        : 0;
      avgStageAging[stg] = avg;
    });

    // 5. Conversion Ratio Report
    const conversionReport = recruiterReport.map(r => {
      const sharedPerSelect = r.selected > 0 ? (r.shared / r.selected).toFixed(1) : '—';
      const sharedPerJoin = r.joined > 0 ? (r.shared / r.joined).toFixed(1) : '—';
      return {
        recruiter: r._id || 'Unknown',
        shared: r.shared,
        interviews: r.interviews,
        selected: r.selected,
        joined: r.joined,
        sharedPerSelect,
        sharedPerJoin
      };
    });

    // 6. Active JR Report (JR Nos, Customer Name, Skills, Active profiles in Pipeline)
    const openJobs = await Job.find({ status: { $ne: 'Closed' } })
      .populate('createdBy', 'name email employeeId role')
      .lean();

    const activeJRsReport = await Promise.all(openJobs.map(async (j) => {
      const escapedTitle = (j.jobTitle || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const activeCandidates = await Candidate.find({
        $or: [
          { jrNumber: j.jrNumber },
          { positionApplied: { $regex: `^${escapedTitle}$`, $options: 'i' } }
        ],
        status: { $nin: ['Rejected', 'Exited'] }
      }).select('name phone email status currentStage assignedRecruiterName createdAt updatedAt').lean();

      return {
        _id: j._id,
        jrNumber: j.jrNumber || '—',
        customerName: j.companyName || j.client || '—',
        jobTitle: j.jobTitle || '—',
        skills: Array.isArray(j.skills) ? j.skills.join(', ') : (j.skills || '—'),
        location: j.location || '—',
        positions: j.positions || 1,
        status: j.status || 'Open',
        createdBy: j.createdBy?.name || j.recruiterName || 'Admin',
        activeProfilesCount: activeCandidates.length,
        activeCandidates: activeCandidates.map(c => ({
          _id: c._id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          status: c.status,
          stage: c.currentStage,
          recruiter: c.assignedRecruiterName || 'Unassigned',
          updatedAt: c.updatedAt || c.createdAt
        }))
      };
    }));

    // 7. Active Status Profiles (Documentation process, Pending with Customer, etc.)
    const activeProfilesCandidates = await Candidate.find({
      status: { $nin: ['Rejected', 'Exited', 'Joined'] }
    }).select('name phone email positionApplied clientName status jrNumber assignedRecruiterName updatedAt createdAt division').lean();

    const activeProfilesReport = activeProfilesCandidates.map(c => {
      const daysPending = Math.ceil((new Date() - new Date(c.updatedAt || c.createdAt)) / (1000 * 60 * 60 * 24));
      return {
        _id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        positionApplied: c.positionApplied || '—',
        clientName: c.clientName || '—',
        status: c.status || 'Active',
        jrNumber: c.jrNumber || '—',
        recruiter: c.assignedRecruiterName || 'Unassigned',
        division: c.division || 'BPO',
        daysPending,
        updatedAt: c.updatedAt || c.createdAt
      };
    }).sort((a, b) => b.daysPending - a.daysPending);

    // 8. Expected Revenue (Customer wise, Division Wise)
    const revenueCandidates = await Candidate.find({
      status: { $in: ['Yet To Join', 'Joining Date Confirmed', 'Joining Postponed', 'Joined', 'Selected', 'Offer Accepted', 'Offered'] }
    }).select('clientName division joiningSalary placementPercentage revenueGenerated status offerDetails').lean();

    const customerRevMap = {};
    const divisionRevMap = {};

    revenueCandidates.forEach(c => {
      const cust = c.clientName || 'General / Unspecified';
      const div = c.division || 'BPO';

      // Estimate revenue per candidate
      let rev = parseFloat(c.revenueGenerated) || 0;
      if (!rev && c.joiningSalary) {
        const sal = parseFloat(c.joiningSalary) || 0;
        const pct = parseFloat(c.placementPercentage) || 8.33;
        rev = (sal * pct) / 100;
      }
      if (!rev && c.offerDetails && c.offerDetails.joiningSalary) {
        const sal = parseFloat(c.offerDetails.joiningSalary) || 0;
        const pct = parseFloat(c.offerDetails.placementPercentage) || 8.33;
        rev = (sal * pct) / 100;
      }
      if (!rev) {
        rev = 25000; // default estimated placement fee
      }

      const isJoined = c.status === 'Joined';
      const isYetToJoin = ['Yet To Join', 'Joining Date Confirmed', 'Joining Postponed', 'Selected', 'Offer Accepted', 'Offered'].includes(c.status);

      // Customer Map
      if (!customerRevMap[cust]) {
        customerRevMap[cust] = { customerName: cust, yetToJoinCount: 0, joinedCount: 0, expectedRevenue: 0, actualJoinedRevenue: 0 };
      }
      customerRevMap[cust].expectedRevenue += rev;
      if (isJoined) {
        customerRevMap[cust].joinedCount += 1;
        customerRevMap[cust].actualJoinedRevenue += rev;
      }
      if (isYetToJoin) {
        customerRevMap[cust].yetToJoinCount += 1;
      }

      // Division Map
      if (!divisionRevMap[div]) {
        divisionRevMap[div] = { division: div, yetToJoinCount: 0, joinedCount: 0, expectedRevenue: 0, actualJoinedRevenue: 0 };
      }
      divisionRevMap[div].expectedRevenue += rev;
      if (isJoined) {
        divisionRevMap[div].joinedCount += 1;
        divisionRevMap[div].actualJoinedRevenue += rev;
      }
      if (isYetToJoin) {
        divisionRevMap[div].yetToJoinCount += 1;
      }
    });

    const customerExpectedRevenue = Object.values(customerRevMap).sort((a, b) => b.expectedRevenue - a.expectedRevenue);
    const divisionExpectedRevenue = Object.values(divisionRevMap).sort((a, b) => b.expectedRevenue - a.expectedRevenue);
    const totalExpectedRevenue = customerExpectedRevenue.reduce((sum, item) => sum + item.expectedRevenue, 0);

    // 9. Lead and Recruiter Performance Report (Joinees vs Profiles Submitted, Joinees vs Selects)
    const usersList = await User.find({ role: { $in: ['recruiter', 'tl', 'manager', 'admin'] } }).select('name role employeeId').lean();

    const leadRecruiterPerformanceReport = await Promise.all(usersList.map(async (u) => {
      const submitted = await Candidate.countDocuments({
        $or: [{ assignedRecruiter: u._id }, { assignedRecruiterName: u.name }],
        createdAt: { $gte: start, $lt: end }
      });

      const selects = await Candidate.countDocuments({
        $or: [{ assignedRecruiter: u._id }, { assignedRecruiterName: u.name }],
        createdAt: { $gte: start, $lt: end },
        status: { $in: ['Selected', 'Offer Released', 'Offer Accepted', 'Yet To Join', 'Joined'] }
      });

      const joinees = await Candidate.countDocuments({
        $or: [{ assignedRecruiter: u._id }, { assignedRecruiterName: u.name }],
        createdAt: { $gte: start, $lt: end },
        status: 'Joined'
      });

      const joineesVsSubmittedRatio = submitted > 0 ? `${((joinees / submitted) * 100).toFixed(1)}%` : '0.0%';
      const joineesVsSelectsRatio = selects > 0 ? `${((joinees / selects) * 100).toFixed(1)}%` : '0.0%';

      return {
        userId: u._id,
        name: u.name,
        employeeId: u.employeeId || '—',
        role: u.role === 'tl' ? 'Team Lead' : (u.role === 'recruiter' ? 'Recruiter' : u.role.toUpperCase()),
        submitted,
        selects,
        joinees,
        joineesVsSubmittedRatio,
        joineesVsSelectsRatio,
        rawSubmittedRatio: submitted > 0 ? (joinees / submitted) : 0,
        rawSelectsRatio: selects > 0 ? (joinees / selects) : 0,
      };
    }));

    const activeLeadRecruiterPerformance = leadRecruiterPerformanceReport
      .filter(r => r.submitted > 0 || r.selects > 0 || r.joinees > 0)
      .sort((a, b) => b.joinees - a.joinees || b.selects - a.selects || b.submitted - a.submitted);

    res.json({
      recruiterReport,
      customerReport,
      divisionReport,
      aging: {
        avgStageAging,
        candidates: agingCandidates.slice(0, 100) // limit to top 100 for performance
      },
      conversionReport,
      activeJRsReport,
      activeProfilesReport,
      expectedRevenueReport: {
        customerRevenue: customerExpectedRevenue,
        divisionRevenue: divisionExpectedRevenue,
        totalExpectedRevenue
      },
      leadRecruiterPerformanceReport: activeLeadRecruiterPerformance
    });
  } catch (err) {
    next(err);
  }
};
