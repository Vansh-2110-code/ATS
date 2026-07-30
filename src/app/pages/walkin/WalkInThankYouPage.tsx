import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Copy, ArrowRight, Home } from 'lucide-react';

export function WalkInThankYouPage() {
  const navigate = useNavigate();
  const [referenceId, setReferenceId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ref = localStorage.getItem('walkin_reference_id');
    if (!ref) {
      navigate('/walkin/login');
      return;
    }
    setReferenceId(ref);
  }, [navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewStatus = () => {
    navigate('/walkin/dashboard');
  };

  const handleBackHome = () => {
    navigate('/walk-in');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Application Submitted!</h1>
          <p className="text-slate-600 mb-6">
            Your walk-in application has been successfully submitted. You can now track your application status.
          </p>

          {/* Reference ID Section */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-6">
            <p className="text-xs text-slate-600 mb-2 font-medium">Your Reference ID</p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-bold text-slate-900 flex-1 text-left">
                {referenceId}
              </code>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-900">
              <strong>Keep this reference ID safe.</strong> You'll need it to check your application status and during further communication with our team.
            </p>
          </div>

          {/* What's Next */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">What Happens Next?</h3>
            <ol className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="font-bold text-green-600">1.</span>
                <span>Our team will review your application</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-600">2.</span>
                <span>You'll receive updates via email and phone</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-600">3.</span>
                <span>Track your status anytime in the dashboard</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewStatus}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              Check Application Status
            </button>
            <button
              onClick={handleBackHome}
              className="w-full py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Need help? Contact us at <span className="font-medium">hrteamwhmc@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
