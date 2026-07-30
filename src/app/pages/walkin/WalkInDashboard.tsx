import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Loader2, AlertCircle, Clock, CheckCircle2, User, Download, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  'Walk-in Submitted': 'bg-blue-50 border-blue-200 text-blue-700',
  'Under Review': 'bg-amber-50 border-amber-200 text-amber-700',
  'Interview Scheduled': 'bg-purple-50 border-purple-200 text-purple-700',
  'Interview Completed': 'bg-indigo-50 border-indigo-200 text-indigo-700',
  'Selected': 'bg-green-50 border-green-200 text-green-700',
  'Rejected': 'bg-red-50 border-red-200 text-red-700',
  'On Hold': 'bg-slate-50 border-slate-200 text-slate-700',
};

const STATUS_ICONS: Record<string, any> = {
  'Walk-in Submitted': <Clock className="w-5 h-5" />,
  'Under Review': <Loader2 className="w-5 h-5 animate-spin" />,
  'Interview Scheduled': <Clock className="w-5 h-5" />,
  'Interview Completed': <CheckCircle2 className="w-5 h-5" />,
  'Selected': <CheckCircle2 className="w-5 h-5" />,
  'Rejected': <AlertCircle className="w-5 h-5" />,
  'On Hold': <Clock className="w-5 h-5" />,
};

export function WalkInDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicationData, setApplicationData] = useState<any>(null);

  useEffect(() => {
    if (!user || user.role !== 'walkin') {
      navigate('/login');
      return;
    }

    fetchApplicationStatus();
  }, [navigate, user]);

  const fetchApplicationStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getWalkInStatus();
      setApplicationData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load application status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDownloadResume = async () => {
    if (!applicationData?.resumeUrl) return;
    try {
      const link = document.createElement('a');
      link.href = applicationData.resumeUrl;
      link.download = `resume-${applicationData.referenceId}.pdf`;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Application Dashboard</h1>
            <p className="text-slate-600 mt-1">Track your walk-in application status</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Unable to load application</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* No Application */}
        {!loading && !error && !applicationData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">No Application Found</h2>
            <p className="text-slate-600 mb-6">
              You haven't submitted an application yet. Start by filling out the application form.
            </p>
            <button
              onClick={() => navigate('/walkin/form')}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Application
            </button>
          </div>
        )}

        {/* Application Card */}
        {applicationData && (
          <>
            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                    <p className="text-slate-600 text-sm">{user?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium mb-1">Reference ID</p>
                  <p className="text-lg font-mono font-bold text-slate-900">{applicationData.referenceId || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-sm font-bold text-slate-600 uppercase mb-4">Application Status</h3>
              <div className={`border-2 rounded-lg p-4 flex items-center gap-3 ${STATUS_COLORS[applicationData.status] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {STATUS_ICONS[applicationData.status] || <Clock className="w-5 h-5" />}
                <div className="flex-1">
                  <p className="font-semibold">{applicationData.status || 'Pending'}</p>
                  {applicationData.statusUpdatedAt && (
                    <p className="text-xs opacity-75">
                      Updated: {new Date(applicationData.statusUpdatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-sm font-bold text-slate-600 uppercase mb-4">Application Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Submitted Date</p>
                  <p className="text-base font-semibold text-slate-900">
                    {applicationData.submittedAt ? new Date(applicationData.submittedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Location</p>
                  <p className="text-base font-semibold text-slate-900">
                    {applicationData.city}, {applicationData.state || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Qualification</p>
                  <p className="text-base font-semibold text-slate-900">{applicationData.qualification || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Experience</p>
                  <p className="text-base font-semibold text-slate-900">
                    {applicationData.experienceYears || '0'} years
                  </p>
                </div>

                {applicationData.assignedRecruiter && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-600 font-medium mb-1">Assigned Recruiter</p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{applicationData.assignedRecruiter.name}</p>
                        <p className="text-sm text-slate-600">{applicationData.assignedRecruiter.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Details (if scheduled) */}
            {applicationData.interviewDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-bold text-blue-900 uppercase mb-4">Interview Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">Interview Date</p>
                    <p className="text-base font-semibold text-blue-900">
                      {new Date(applicationData.interviewDetails.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">Interview Time</p>
                    <p className="text-base font-semibold text-blue-900">
                      {applicationData.interviewDetails.scheduledTime || 'TBD'}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-blue-700 font-medium mb-1">Interview Type</p>
                    <p className="text-base font-semibold text-blue-900">
                      {applicationData.interviewDetails.interviewType || 'Video Call'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Reason (if applicable) */}
            {applicationData.status === 'Rejected' && applicationData.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-bold text-red-900 uppercase mb-2">Feedback</h3>
                <p className="text-red-800">{applicationData.rejectionReason}</p>
              </div>
            )}

            {/* Resume Section */}
            {applicationData.resumeUrl && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-600 uppercase mb-4">Resume</h3>
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Download className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Your Resume</p>
                      <p className="text-xs text-slate-600">Uploaded on {new Date(applicationData.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadResume}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/walk-in')}
                className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Back to Home
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
