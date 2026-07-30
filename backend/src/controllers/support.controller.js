const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Attendance = require('../models/Attendance');
const { createLog } = require('../utils/auditLogger');

// POST /api/support/chat
exports.chatResponse = async (req, res, next) => {
  try {
    const { message, action, email, phone } = req.body;

    // 1. Search Open Jobs
    if (action === 'search_jobs') {
      const openJobs = await Job.find({ status: 'Open' }).limit(5).lean();
      if (openJobs.length === 0) {
        return res.json({
          text: "Currently, there are no active job openings available. Please check back later!"
        });
      }
      const jobList = openJobs.map(j => `• **${j.jobTitle}** at ${j.companyName} (${j.location || 'All India'})`).join('\n');
      return res.json({
        text: `Here are the latest open positions:\n\n${jobList}\n\nYou can apply directly under our "Apply" page.`
      });
    }

    // 2. Check Candidate Status
    if (action === 'check_status') {
      if (!email && !phone) {
        return res.json({
          text: "Please provide your registered **Email Address** or **Phone Number** to check your status (e.g. type: `/status user@email.com` or select status option)."
        });
      }
      
      const query = {};
      if (email) query.email = email.trim().toLowerCase();
      if (phone) query.phone = phone.trim().replace(/\D/g, '');

      const candidate = await Candidate.findOne(query).sort('-createdAt').lean();
      if (!candidate) {
        return res.json({
          text: "No candidate profile found matching those details. Please double-check your input or register first."
        });
      }

      return res.json({
        text: `Hello **${candidate.name}**,\n\nYour current application status is: **${candidate.status || 'New'}**.\n\nRecruiter Assigned: **${candidate.assignedRecruiterName || 'Unassigned'}**.\nLast Updated: ${new Date(candidate.updatedAt).toLocaleDateString('en-IN')}.`
      });
    }

    // 3. Get Logged-In User Attendance
    if (action === 'get_attendance') {
      if (!req.user) {
        return res.json({
          text: "Attendance retrieval is only available to logged-in employees. Please sign in to check."
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const record = await Attendance.findOne({ user: req.user._id, date: today }).lean();

      if (!record) {
        return res.json({
          text: "You have **not marked** attendance yet today. Please complete your biometric face scan at the top of the dashboard."
        });
      }

      const toHHMM = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
      return res.json({
        text: `Here is your attendance log for today:\n\n• **Status**: ${record.status || 'Present'}\n• **Check-In**: ${toHHMM(record.loginTime)}\n• **Check-Out**: ${toHHMM(record.logoutTime)}\n• **Total Hours**: ${record.totalHours || 0} hrs`
      });
    }

    // 4. Natural Text Keywords & FAQs
    const text = (message || '').toLowerCase();

    // Document / Onboarding help
    if (text.includes('document') || text.includes('onboarding') || text.includes('docs')) {
      return res.json({
        text: "For onboarding, candidates must submit:\n1. Aadhaar Card & PAN Card\n2. Relieving letter from last company\n3. Salary slips from past 3 months\n4. Educational certificates (degree/marksheet)."
      });
    }

    // Address & Location help
    if (text.includes('address') || text.includes('location') || text.includes('office') || text.includes('where')) {
      return res.json({
        text: "White Horse Manpower's corporate office is located in **Bangalore, India**.\n\n*Address: 2nd floor, Block 12, Koramangala, Bangalore.*"
      });
    }

    // Contact & Support help
    if (text.includes('help') || text.includes('support') || text.includes('contact')) {
      return res.json({
        text: "You can reach candidate support by emailing **support@whitehorsemanpower.in** or contacting your assigned recruiter directly."
      });
    }

    // Internal User Queries
    if (req.user) {
      if (text.includes('reassign') || text.includes('lock')) {
        return res.json({
          text: "To reassign a locked candidate, go to the candidate's profile page and click **Request Reassignment** (visible to TL and Managers). Managers/Admins can directly reassign candidates via the edit panel."
        });
      }
      if (text.includes('incentive') || text.includes('commission')) {
        return res.json({
          text: "Incentives are processed in the first week of the month. Payouts are calculated based on closed job requirements (JRs) and candidate joins within the active 30-day window."
        });
      }
      if (text.includes('leave') || text.includes('wfh')) {
        return res.json({
          text: "To request Work From Home (WFH) or leave, use the Mark Attendance picker on the top bar or send a request to your Team Lead/Manager."
        });
      }
    }

    // Fallback general response
    return res.json({
      text: "I am your White Horse ATS Assistant. If you are a candidate, you can search open jobs or check application status. If you are a team member, you can query attendance or database updates. Feel free to use the quick actions below!"
    });

  } catch (err) {
    next(err);
  }
};
