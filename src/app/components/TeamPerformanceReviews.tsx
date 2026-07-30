import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Star, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../services/api';

export function TeamPerformanceReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employee: '',
    reviewPeriodStart: new Date().toISOString().slice(0, 10),
    reviewPeriodEnd: new Date().toISOString().slice(0, 10),
    rating: 4,
    comments: '',
    metrics: {
      targetCalls: 50,
      actualCalls: 0,
      targetInterviews: 10,
      actualInterviews: 0,
      targetPlacements: 2,
      actualPlacements: 0,
    }
  });

  // Fetch eligible users based on creator role:
  // TLs can only review Recruiters. Admin/Manager can review Recruiters and Team Leads.
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (user?.role === 'tl') {
          // TL: fetch team members / recruiters
          const teamData = await api.getTeamMembers();
          const members = Array.isArray(teamData) ? teamData : (teamData?.members || []);
          const list = members.map((m: any) => ({
            _id: m.employeeId?._id || m.employeeId || m._id,
            name: m.employeeId?.name || m.name || 'Recruiter',
            role: 'recruiter',
            employeeId: m.employeeId?.employeeId || m.employeeIdStr || ''
          }));
          if (list.length === 0) {
            const allRecs = await api.getUsers({ role: 'recruiter' });
            setEligibleUsers(allRecs?.users || []);
          } else {
            setEligibleUsers(list);
          }
        } else {
          // Admin & Manager: fetch recruiters and team leaders
          const allUsers = await api.getUsers({ limit: '200' });
          const usersList = Array.isArray(allUsers) ? allUsers : (allUsers?.users || []);
          const filtered = usersList.filter((u: any) => u.role === 'recruiter' || u.role === 'tl');
          setEligibleUsers(filtered);
        }
      } catch (err) {
        console.error('Failed to fetch eligible users for reviews:', err);
      }
    };
    fetchUsers();
  }, [user?.role]);

  useEffect(() => {
    fetchReviews();
  }, [dateRange, customFrom, customTo, selectedEmployee]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { dateRange: dateRange.toLowerCase() };
      if (dateRange === 'Custom') {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      }
      if (selectedEmployee && selectedEmployee !== 'All') {
        params.employee = selectedEmployee;
      }

      const res = await api.getReviews(params);
      setReviews(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.employee) {
      setErrorMsg('Please select an employee to review.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createReview(formData);
      setShowModal(false);
      setFormData({
        employee: '',
        reviewPeriodStart: new Date().toISOString().slice(0, 10),
        reviewPeriodEnd: new Date().toISOString().slice(0, 10),
        rating: 4,
        comments: '',
        metrics: {
          targetCalls: 50,
          actualCalls: 0,
          targetInterviews: 10,
          actualInterviews: 0,
          targetPlacements: 2,
          actualPlacements: 0,
        }
      });
      fetchReviews();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this performance review?')) return;
    try {
      await api.deleteReview(id);
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const DATE_TABS = ['Week', 'Month', 'Quarter', 'Year', 'All', 'Custom'];
  const canCreate = ['admin', 'manager', 'tl'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Component Header */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-slate-800 text-base font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <span>Team Performance Reviews</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Add and track performance reviews for recruiters {user?.role !== 'tl' ? 'and team leads' : ''}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => { setErrorMsg(''); setShowModal(true); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Performance Review</span>
          </button>
        )}
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Time Frame & Custom Dates */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold">TIME FRAME:</span>
            <div className="flex gap-1 flex-wrap">
              {DATE_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setDateRange(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    dateRange === tab ? 'bg-green-600 text-white font-semibold shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {dateRange === 'Custom' && (
              <div className="flex items-center gap-2 ml-2 flex-wrap bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">From</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-md text-xs outline-none focus:border-green-400 bg-white"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">To</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-md text-xs outline-none focus:border-green-400 bg-white"
                  />
                </div>
                {(customFrom || customTo) && (
                  <button
                    onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Employee Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">EMPLOYEE FILTER:</span>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-green-500 bg-white cursor-pointer min-w-[180px]"
            >
              <option value="All">All Team Members</option>
              {eligibleUsers.map(u => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.name} ({u.role === 'tl' ? 'Team Lead' : 'Recruiter'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            Loading performance reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-sm">
            No performance reviews found for the selected filter.
          </div>
        ) : (
          reviews.map(review => (
            <div
              key={review._id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Employee Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{review.employee?.name || 'Employee'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        review.employee?.role === 'tl' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {review.employee?.role === 'tl' ? 'Team Lead' : 'Recruiter'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(review.reviewPeriodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(review.reviewPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </p>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{review.rating} / 5</span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                {review.metrics && (
                  <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Calls (T/A)</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {review.metrics.targetCalls || 0} / {review.metrics.actualCalls || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Intv (T/A)</p>
                      <p className="text-xs font-bold text-violet-700 mt-0.5">
                        {review.metrics.targetInterviews || 0} / {review.metrics.actualInterviews || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Joined (T/A)</p>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        {review.metrics.targetPlacements || 0} / {review.metrics.actualPlacements || 0}
                      </p>
                    </div>
                  </div>
                )}

                {/* Feedback Comments */}
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Feedback & Comments</p>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100/50">
                    "{review.comments}"
                  </p>
                </div>
              </div>

              {/* Reviewer & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>Reviewed by <strong className="text-slate-700">{review.reviewer?.name || 'Admin'}</strong></span>
                
                {(user?.role === 'admin' || user?.role === 'manager' || user?._id === review.reviewer?._id) && (
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Add Performance Review</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submit performance rating and targets for a team member</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Employee Selector */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-600 font-semibold mb-1">Select Employee *</label>
                  <select
                    required
                    value={formData.employee}
                    onChange={e => setFormData({ ...formData, employee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-green-500 bg-white"
                  >
                    <option value="">Select Employee</option>
                    {eligibleUsers.map(u => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.role === 'tl' ? 'Team Lead' : 'Recruiter'})
                      </option>
                    ))}
                  </select>
                  {user?.role === 'tl' && (
                    <p className="text-[10px] text-slate-400 mt-1">Note: Team Leads can only submit reviews for Recruiters.</p>
                  )}
                </div>

                {/* Rating Input */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-600 font-semibold mb-1">Performance Rating (1 to 5) *</label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-slate-700 text-sm">{formData.rating} / 5</span>
                  </div>
                </div>

                {/* Period Start & End */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={formData.reviewPeriodStart}
                    onChange={e => setFormData({ ...formData, reviewPeriodStart: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-green-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={formData.reviewPeriodEnd}
                    onChange={e => setFormData({ ...formData, reviewPeriodEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-green-500 bg-white"
                  />
                </div>
              </div>

              {/* Target & Actual Metrics */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs">Performance Metrics (Target vs. Actual)</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Target Calls</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.metrics.targetCalls}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, targetCalls: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Actual Calls</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.metrics.actualCalls}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, actualCalls: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Target Interviews</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.metrics.targetInterviews}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, targetInterviews: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Actual Interviews</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.metrics.actualInterviews}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, actualInterviews: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Target Placements</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.metrics.targetPlacements}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, targetPlacements: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Actual Placements</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.metrics.actualPlacements}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, actualPlacements: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Feedback Comments */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Feedback & Recommendations *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter constructive feedback, key accomplishments, or growth areas..."
                  value={formData.comments}
                  onChange={e => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-green-500 bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Save Performance Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
