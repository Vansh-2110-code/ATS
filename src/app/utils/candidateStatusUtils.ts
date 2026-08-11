export const RECRUITER_STATUSES = [
  'New',
  'Screening',
  'Contacted',
  'Interested',
  'Selected for Call',
  'Interview Scheduled',
  'Eligible Candidates',
  'Wrong Number',
  'Unreachable',
  'Did Not Pick',
  'Unanswered Calls',
  'Call Back',
  'HR Shortlist',
  'Written Test',
  'Operations Round',
  'Document Pending',
  'Documentation',
  'Walk-in Submitted',
] as const;

export const TL_MANAGEMENT_STATUSES = [
  'Selected',
  'Yet To Join',
  'Joined',
  'Rejected',
  'Exited',
] as const;

export const GLOBAL_STATUSES = [
  'Black List',
] as const;

export const CANDIDATE_STATUS_OPTIONS = [
  'New',
  'Screening',
  'Contacted',
  'Interested',
  'Selected for Call',
  'Interview Scheduled',
  'Selected',
  'Rejected',
  'Eligible Candidates',
  'Wrong Number',
  'Unreachable',
  'Did Not Pick',
  'Unanswered Calls',
  'Call Back',
  'HR Shortlist',
  'Written Test',
  'Operations Round',
  'Document Pending',
  'Documentation',
  'Yet To Join',
  'Joined',
  'Walk-in Submitted',
  'Exited',
] as const;

export type CandidateStatus = typeof CANDIDATE_STATUS_OPTIONS[number];

export function isTLOnlyStatus(status: string): boolean {
  return (TL_MANAGEMENT_STATUSES as readonly string[]).includes(status);
}

export function canUserUpdateCandidateStatus(status: string, role?: string): boolean {
  if (!role) return false;
  const isTLOrAbove = ['admin', 'tl', 'manager'].includes(role);
  if (isTLOnlyStatus(status)) {
    return isTLOrAbove;
  }
  return true;
}

export const CANDIDATE_STATUS_COLORS: Record<string, string> = {
  New: 'bg-slate-100 text-slate-600 border-slate-200',
  Screening: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Contacted: 'bg-green-100 text-green-700 border-green-200',
  Interested: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Selected for Call': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Interview Scheduled': 'bg-violet-100 text-violet-700 border-violet-200',
  Selected: 'bg-teal-100 text-teal-700 border-teal-200',
  Rejected: 'bg-red-100 text-red-600 border-red-200',
  'Eligible Candidates': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Wrong Number': 'bg-orange-100 text-orange-700 border-orange-200',
  Unreachable: 'bg-orange-100 text-orange-700 border-orange-200',
  'Did Not Pick': 'bg-amber-100 text-amber-700 border-amber-200',
  'Unanswered Calls': 'bg-amber-100 text-amber-700 border-amber-200',
  'Call Back': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'HR Shortlist': 'bg-purple-100 text-purple-700 border-purple-200',
  'Written Test': 'bg-blue-100 text-blue-700 border-blue-200',
  'Operations Round': 'bg-sky-100 text-sky-700 border-sky-200',
  'Document Pending': 'bg-rose-100 text-rose-700 border-rose-200',
  Documentation: 'bg-sky-100 text-sky-700 border-sky-200',
  'Yet To Join': 'bg-purple-100 text-purple-700 border-purple-200',
  Joined: 'bg-green-100 text-green-700 border-green-200',
  'Walk-in Submitted': 'bg-teal-100 text-teal-700 border-teal-200',
  Exited: 'bg-red-100 text-red-700 border-red-200',

  // Additional aliases
  Eligible: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Not Eligible': 'bg-red-100 text-red-700 border-red-200',
  'Not Interested': 'bg-rose-100 text-rose-700 border-rose-200',
  'No Response': 'bg-slate-100 text-slate-600 border-slate-200',
  'Duplicate-Client': 'bg-orange-100 text-orange-700 border-orange-200',
  Hold: 'bg-amber-100 text-amber-700 border-amber-200',
  'Submitted to Client': 'bg-blue-100 text-blue-700 border-blue-200',
  'Walkin Company': 'bg-sky-100 text-sky-700 border-sky-200',
  'Walkin WHM': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'No Show': 'bg-rose-100 text-rose-700 border-rose-200',
  'VNA Select': 'bg-teal-100 text-teal-700 border-teal-200',
  'VNA Reject': 'bg-pink-100 text-pink-700 border-pink-200',
  'Test Select': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Test Reject': 'bg-rose-100 text-rose-700 border-rose-200',
  'L1 Select': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'L1 Reject': 'bg-red-100 text-red-800 border-red-300',
  'L2 Select': 'bg-teal-100 text-teal-800 border-teal-300',
  'L2 Reject': 'bg-rose-100 text-rose-800 border-rose-300',
  'Final Select': 'bg-green-100 text-green-800 border-green-300',
  'Final Reject': 'bg-red-100 text-red-800 border-red-300',
  'Document Initialized': 'bg-purple-100 text-purple-800 border-purple-300',
  'Documentation Completed': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Documentation Incomplete': 'bg-amber-100 text-amber-800 border-amber-300',
  'Waiting for Offer': 'bg-blue-100 text-blue-800 border-blue-300',
  'Offer Accept': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Offer Reject': 'bg-orange-100 text-orange-800 border-orange-300',
  'Black List': 'bg-stone-800 text-white border-stone-900',
};
