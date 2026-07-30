import { X, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SalarySlipAccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, durationDays: number) => Promise<void>;
  salaryMonth: string;
  salaryYear: number;
}

export function SalarySlipAccessRequestModal({
  isOpen,
  onClose,
  onSubmit,
  salaryMonth,
  salaryYear,
}: SalarySlipAccessRequestModalProps) {
  const [reason, setReason] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for access request');
      return;
    }
    if (durationDays < 1 || durationDays > 30) {
      setError('Duration must be between 1 and 30 days');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(reason, durationDays);
      setReason('');
      setDurationDays(7);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Request Access</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          <p>
            Request access to view and download salary slip for{' '}
            <span style={{ fontWeight: 600 }}>
              {salaryMonth} {salaryYear}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-xs text-slate-600 mb-1.5" style={{ fontWeight: 600 }}>
              Reason for Access *
            </label>
            <textarea
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="e.g., Bank verification, loan application, document submission..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-20 resize-none focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs text-slate-600 mb-1.5" style={{ fontWeight: 600 }}>
              Access Duration (Days) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                value={durationDays}
                onChange={e => setDurationDays(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg min-w-[60px] text-center">
                <span style={{ fontWeight: 600 }} className="text-sm text-slate-800">
                  {durationDays}d
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Access will expire after {durationDays} {durationDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
