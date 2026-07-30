const nodemailer = require('nodemailer');

// ── Transporter ──────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Email Templates (from PDF spec) ─────────────────────────
const VENUE = `White Horse Manpower Consultancy Private Limited
#12 Office 156, 3rd Floor
Jumma Masjid Golden Complex
Jumma Masjid Road (Exit of Commercial Street)
Bangalore – 560051`;

const buildTemplate = (type, data) => {
  const {
    candidateName = '[Candidate Name]',
    role = '[Role]',
    company = '[Company]',
    interviewDate = '[Date]',
    interviewTime = '[Time]',
    interviewMode = 'Face-to-Face',
    recruiterName = '[Recruiter Name]',
    recruiterEmail = '[Recruiter Email]',
    jobLocation = '[Location]',
    joiningDate = '[Joining Date]',
    offeredSalary = '[Offered Salary]',
  } = data;

  switch (type) {
    case 'interview_call_letter': {
      const subject = `Interview Invitation – ${role} | ${company}`;
      const body = `Dear ${candidateName},

Greetings from White Horse Manpower Consultancy Pvt. Ltd.

We are pleased to inform you that you have been shortlisted for an interview for the position of ${role} with ${company}.

Below are the details of your interview:

Interview Date: ${interviewDate}
Interview Time: ${interviewTime} IST
Interview Mode: ${interviewMode}
${interviewMode === 'Face-to-Face' ? `\nVenue:\n${VENUE}` : ''}

Kindly carry the following documents with you:
1. 2–3 copies of your updated resume
2. Two passport-size photographs
3. Government ID proof (Aadhar / PAN / Passport)
4. Copies of educational certificates
5. Previous employment documents (if applicable)
6. Last three months' salary slips
7. Bank account details or passbook copy

Please ensure that you arrive 15 minutes before the scheduled time.

For any queries, feel free to contact us.

We look forward to meeting you.

Best Regards,
${recruiterName}
White Horse Manpower Consultancy Pvt. Ltd.
${recruiterEmail}`;
      return { subject, body };
    }

    case 'second_round_call_letter': {
      const subject = `Second Round Interview Confirmation – ${role} | ${company}`;
      const body = `Dear ${candidateName},

Congratulations!

Based on your performance in the initial screening round, you have been shortlisted for the Second Round Face-to-Face Interview for the position of ${role} with ${company}.

Please find the interview details below:

Interview Date: ${interviewDate}
Interview Time: ${interviewTime} IST
Interview Mode: Face-to-Face

Venue:
${VENUE}

Please carry the following documents:
1. Updated Resume (2 copies)
2. Passport-size photographs
3. Government ID proof
4. Educational certificates
5. Previous employment documents
6. Salary slips for the last 3 months

Kindly be present 15 minutes before the scheduled interview time.

We wish you the very best for your interview.

Best Regards,
${recruiterName}
White Horse Manpower Consultancy Pvt. Ltd.`;
      return { subject, body };
    }

    case 'final_round_call_letter': {
      const subject = `Final Round Interview Invitation – ${role} | ${company}`;
      const body = `Dear ${candidateName},

We are pleased to inform you that you have been shortlisted for the Final Round Interview for the position of ${role} with ${company}.

Your interview has been scheduled as per the following details:

Interview Date: ${interviewDate}
Interview Time: ${interviewTime} IST
Interview Mode: ${interviewMode}
${interviewMode === 'Face-to-Face' ? `\nVenue:\n${VENUE}` : ''}

Please bring the following documents:
1. Updated Resume
2. Passport-size photographs
3. Government ID proof
4. Educational certificates
5. Experience certificates (if applicable)

We wish you success in your final round interview.

Best Regards,
${recruiterName}
White Horse Manpower Consultancy Pvt. Ltd.`;
      return { subject, body };
    }

    case 'offer_letter': {
      const subject = `Initial Offer Confirmation – ${role} | ${company}`;
      const body = `Dear ${candidateName},

Congratulations!

We are pleased to inform you that you have been selected for the position of ${role} with ${company}, based on your interview performance.

Below are the preliminary details of your offer:

Designation: ${role}
Company: ${company}
Location: ${jobLocation}
Proposed Joining Date: ${joiningDate}
Offered Salary: ${offeredSalary}

The formal offer letter will be shared with you shortly after completion of documentation and approval processes.

Kindly confirm your acceptance of this initial offer by replying to this email.

We look forward to welcoming you to the organization.

Best Regards,
${recruiterName}
White Horse Manpower Consultancy Pvt. Ltd.
${recruiterEmail}`;
      return { subject, body };
    }

    case 'selection_mail': {
      const subject = `Selection Confirmation – ${role} | ${company}`;
      const body = `Dear ${candidateName},

Congratulations!

We are delighted to inform you that you have been selected for the position of ${role} with ${company}.

Your performance throughout the interview process has been impressive, and we believe you will be a great addition to the team.

Next Steps:
- Our HR team will reach out to you shortly with the formal offer letter.
- Proposed Date of Joining: ${joiningDate}
- Offered Salary: ${offeredSalary}

Please reply to this email confirming your acceptance.

We look forward to welcoming you aboard!

Best Regards,
${recruiterName}
White Horse Manpower Consultancy Pvt. Ltd.
${recruiterEmail}`;
      return { subject, body };
    }

    default:
      return { subject: `Message from White Horse Manpower`, body: '' };
  }
};

// ── Send Email ───────────────────────────────────────────────
const sendEmail = async ({ to, toName, subject, body, replyTo, attachments, from, cc }) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_gmail@gmail.com') {
    // SMTP not configured — log and return mock success
    console.log(`[EMAIL MOCK] To: ${to} | CC: ${cc ? cc.join(', ') : 'None'} | Subject: ${subject}`);
    return { messageId: 'mock-' + Date.now() };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: from || process.env.EMAIL_FROM || `White Horse Manpower <${process.env.SMTP_USER}>`,
    to: toName ? `${toName} <${to}>` : to,
    cc: cc || [],
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
    replyTo: replyTo || process.env.SMTP_USER,
    attachments: attachments || [],
  });
  return info;
};

// Automatically share candidate data with Ahmed sir
const shareCandidateWithAhmedSir = async (candidate, actionType = 'created') => {
  const toEmail = process.env.AHMED_SIR_EMAIL || 'ahmed@whitehorsemanpower.in';
  const subject = `[ATS Notification] Candidate ${actionType.toUpperCase()}: ${candidate.name} - ${candidate.positionApplied || 'No Position'}`;
  
  const body = `Dear Ahmed Sir,
  
A candidate record has been successfully ${actionType} in the ATS.

CANDIDATE DETAILS:
------------------
Name: ${candidate.name}
Email: ${candidate.email || 'N/A'}
Phone: ${candidate.phone}
Alternative Phone: ${candidate.altPhone || 'N/A'}
Gender: ${candidate.gender || 'N/A'}
Date of Birth: ${candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'}
Age: ${candidate.candidateAge || 'N/A'}

PROFESSIONAL DETAILS:
---------------------
Position Applied: ${candidate.positionApplied || 'N/A'}
Job Requirement (JR): ${candidate.jrNumber || 'N/A'}
Client Name: ${candidate.clientName || 'N/A'}
Experience: ${candidate.experience || 'N/A'}
Current CTC: ${candidate.currentCTC || 'N/A'}
Expected CTC: ${candidate.expectedCTC || 'N/A'}
Notice Period: ${candidate.noticePeriod || 'N/A'}
Current Company: ${candidate.currentCompany || 'N/A'}
Key Skills: ${Array.isArray(candidate.skills) ? candidate.skills.join(', ') : (candidate.skills || 'N/A')}

LOCATION DETAILS:
-----------------
Current Location: ${candidate.currentLocation || 'N/A'}
Preferred Location: ${candidate.preferredLocation || 'N/A'}
City: ${candidate.city || 'N/A'}
Local Area: ${candidate.localArea || 'N/A'}

RECRUITER & WORKFLOW DETAILS:
-----------------------------
Assigned Recruiter: ${candidate.assignedRecruiterName || 'N/A'}
Sourced By: ${candidate.sourcedBy || 'N/A'}
Source: ${candidate.source || 'N/A'}
Status: ${candidate.status || 'New'}
Current Stage: ${candidate.currentStage || 'Applied'}
Comments/Notes: ${candidate.comments || 'N/A'}

Saved At: ${new Date(candidate.updatedAt || candidate.createdAt || Date.now()).toLocaleString('en-IN')}

Best Regards,
ATS Automated Notification System`;

  const attachments = [];
  if (candidate.resumePath) {
    const path = require('path');
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
    const relativePath = candidate.resumePath.replace(/^\/uploads/, '');
    const absoluteResumePath = path.join(uploadDir, relativePath);
    
    if (fs.existsSync(absoluteResumePath)) {
      attachments.push({
        filename: candidate.resumeOriginalName || 'Resume.pdf',
        path: absoluteResumePath
      });
    }
  }

  return sendEmail({
    to: toEmail,
    toName: 'Ahmed Sir',
    subject,
    body,
    attachments
  });
};

module.exports = { buildTemplate, sendEmail, shareCandidateWithAhmedSir };
