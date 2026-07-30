const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/controllers/candidate.controller.js';
let content = fs.readFileSync(file, 'utf8');

const mapFunc = `const mapSubStatusToGlobalStatus = (subStatus) => {
  if (!subStatus) return null;
  const statusMap = {
    'Eligible': 'Eligible Candidates',
    'SPOC Shortlisted': 'HR Shortlist',
    'Interview Scheduled': 'Interview Scheduled',
    'Interview Completed': 'Interview Scheduled',
    'Selected': 'Selected',
    'Joined': 'Joined',
    'Rejected – Communication': 'Rejected',
    'Rejected – Experience Mismatch': 'Rejected',
    'Rejected – Salary Mismatch': 'Rejected',
    'Rejected – Location Constraint': 'Rejected',
    'Rejected – Notice Period': 'Rejected',
    'Rejected – Second Round': 'Rejected',
    'Rejected – Interview Round': 'Rejected',
    'Offer Released': 'Selected',
    'Offer Accepted': 'Selected',
    'Offer Declined': 'Rejected',
    'No response': 'Did Not Pick',
    'Not reachable': 'Unreachable',
    'Call back scheduled': 'Call Back',
    'Screening in Progress': 'Contacted',
    'On Hold': 'Contacted',
    'Duplicate Profile': 'Rejected',
    'Not Interested': 'Rejected',
    'Other': 'Contacted',
    'Interview Rescheduled': 'Interview Scheduled',
    'Interview Feedback Pending': 'Interview Scheduled',
    'Shortlisted': 'Selected for Call',
    'HR Round Scheduled': 'Interview Scheduled',
    'Final Round Scheduled': 'Interview Scheduled',
    'Offer in Progress': 'Selected',
    'Offer Approval Pending': 'Selected',
    'Salary Negotiation in Progress': 'Selected',
    'Documents Pending': 'Document Pending',
    'Background Verification Initiated': 'Documentation',
    'Background Verification Cleared': 'Documentation',
    'Background Verification Failed': 'Rejected',
    'Joining Date Confirmed': 'Yet To Join',
    'Joining Postponed': 'Yet To Join'
  };
  if (statusMap[subStatus]) return statusMap[subStatus];
  
  const CANDIDATE_STATUSES = [
    'New', 'Contacted', 'Interested', 'Selected for Call',
    'Interview Scheduled', 'Selected', 'Rejected',
    'Eligible Candidates', 'Wrong Number', 'Unreachable',
    'Did Not Pick', 'Unanswered Calls', 'Call Back',
    'HR Shortlist', 'Written Test', 'Operations Round',
    'Document Pending', 'Documentation', 'Yet To Join', 'Joined',
    'Walk-in Submitted', 'Exited'
  ];
  if (CANDIDATE_STATUSES.includes(subStatus)) return subStatus;
  
  return null;
};

// POST /api/candidates`;

const targetSync = `    // Auto-sync global status with latest sub-status updates
    if (data.candidateStatusPostOffer) {
      data.status = data.candidateStatusPostOffer;
    } else if (data.finalInterviewStatus) {
      data.status = data.finalInterviewStatus;
    } else if (data.interviewStatus) {
      data.status = data.interviewStatus;
    } else if (data.firstCallStatus) {
      data.status = data.firstCallStatus;
    }`;

const replaceSync = `    // Auto-sync global status with latest sub-status updates
    let mappedStatus = null;
    if (data.candidateStatusPostOffer) mappedStatus = mapSubStatusToGlobalStatus(data.candidateStatusPostOffer);
    else if (data.finalInterviewStatus) mappedStatus = mapSubStatusToGlobalStatus(data.finalInterviewStatus);
    else if (data.interviewStatus) mappedStatus = mapSubStatusToGlobalStatus(data.interviewStatus);
    else if (data.firstCallStatus) mappedStatus = mapSubStatusToGlobalStatus(data.firstCallStatus);
    if (mappedStatus) data.status = mappedStatus;`;

content = content.replace('// POST /api/candidates', mapFunc);
content = content.replace(targetSync, replaceSync);
content = content.replace(targetSync, replaceSync);

fs.writeFileSync(file, content);
console.log('Success');
