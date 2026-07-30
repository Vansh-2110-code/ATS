const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const Candidate = require('../models/Candidate');
const Message = require('../models/Message');
const User = require('../models/User');
const { buildTemplate, sendEmail } = require('../utils/emailService');

// POST /api/email/send
// Recruiter sends a letter to a candidate
router.post('/send', auth, authorize('recruiter', 'tl', 'manager', 'admin', 'spoc'), async (req, res) => {
  try {
    const {
      candidateId,
      templateType,          // interview_call_letter | second_round_call_letter | final_round_call_letter | offer_letter | selection_mail
      customSubject,         // optional override
      customBody,            // optional override (if recruiter edited template)
      interviewDate,
      interviewTime,
      interviewMode,
      jobLocation,
      joiningDate,
      offeredSalary,
      role,
      company,
    } = req.body;

    if (!candidateId || !templateType) {
      return res.status(400).json({ message: 'candidateId and templateType are required' });
    }

    const candidate = await Candidate.findById(candidateId).select('name email phone assignedRecruiterName');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (!candidate.email) return res.status(400).json({ message: 'Candidate has no email address on record' });

    // Build template or use custom
    const { subject: tplSubject, body: tplBody } = buildTemplate(templateType, {
      candidateName: candidate.name,
      role: role || '[Role]',
      company: company || '[Company]',
      interviewDate: interviewDate || '[Date TBD]',
      interviewTime: interviewTime || '[Time TBD]',
      interviewMode: interviewMode || 'Face-to-Face',
      recruiterName: req.user.name,
      recruiterEmail: req.user.email,
      jobLocation: jobLocation || 'Bangalore',
      joiningDate: joiningDate || '[Date TBD]',
      offeredSalary: offeredSalary || '[To be discussed]',
    });

    const finalSubject = customSubject || tplSubject;
    const finalBody    = customBody    || tplBody;

    // Fetch active managers and admins for CC list
    const ccUsers = await User.find({
      role: { $in: ['admin', 'manager'] },
      status: 'Active',
    }).select('email');

    const ccEmails = ccUsers
      .map(u => u.email)
      .filter(email => email && email.toLowerCase() !== req.user.email.toLowerCase());

    // Send the email
    const mailResult = await sendEmail({
      to: candidate.email,
      toName: candidate.name,
      subject: finalSubject,
      body: finalBody,
      replyTo: req.user.email,
      from: `"${req.user.name}" <${req.user.email}>`,
      cc: ccEmails,
    });

    // Save to internal message store
    await Message.create({
      from: req.user.id,
      fromName: req.user.name,
      fromRole: req.user.role,
      candidateId: candidate._id,
      subject: finalSubject,
      body: finalBody,
      messageType: templateType,
      folder: templateType === 'offer_letter' || templateType === 'selection_mail'
        ? 'offer_letters'
        : 'interview_letters',
      templateData: { role, company, interviewDate, interviewTime },
    });

    res.json({
      success: true,
      messageId: mailResult.messageId,
      sentTo: candidate.email,
      candidateName: candidate.name,
    });
  } catch (err) {
    console.error('[Email Send Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/email/templates/:type — preview a template
router.get('/templates/:type', auth, async (req, res) => {
  try {
    const { candidateName, role, company, interviewDate, interviewTime, interviewMode, joiningDate, offeredSalary } = req.query;
    const { subject, body } = buildTemplate(req.params.type, {
      candidateName: candidateName || '[Candidate Name]',
      role: role || '[Role]',
      company: company || '[Company]',
      interviewDate: interviewDate || '[Date]',
      interviewTime: interviewTime || '[Time]',
      interviewMode: interviewMode || 'Face-to-Face',
      recruiterName: req.user.name,
      recruiterEmail: req.user.email,
      joiningDate: joiningDate || '[Date]',
      offeredSalary: offeredSalary || '[To be discussed]',
    });
    res.json({ subject, body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/email/sent — list emails sent by this user (or all for admin/manager)
router.get('/sent', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const query = isAdminOrManager ? {} : { from: req.user.id };
    if (search) query.subject = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [msgs, total] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('candidateId', 'name email phone')
        .populate('from', 'name role'),
      Message.countDocuments(query),
    ]);
    res.json({ messages: msgs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/email/smtp-status — check if SMTP is configured
router.get('/smtp-status', auth, authorize('admin'), async (req, res) => {
  const configured = !!(
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== 'your_gmail@gmail.com' &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'your_app_password'
  );
  res.json({
    configured,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || '587',
    user: configured ? process.env.SMTP_USER : null,
    from: process.env.EMAIL_FROM || null,
  });
});

module.exports = router;
