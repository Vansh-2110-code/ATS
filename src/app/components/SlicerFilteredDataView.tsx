import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { X, Filter, Loader2, UserCheck, Eye, Phone, Calendar } from 'lucide-react';
import api from '../services/api';

interface SlicerFilteredDataViewProps {
  slicerName: string;
  onClear: () => void;
  division?: string;
  recruiter?: string;
  company?: string;
  customer?: string;
  title?: string;
}

export function SlicerFilteredDataView({
  slicerName,
  onClear,
  division,
  recruiter,
  company,
  customer,
  title,
}: SlicerFilteredDataViewProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    if (!slicerName || slicerName === 'All') {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const fetchFilteredCandidates = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { limit: '100' };
        if (slicerName !== 'Today Calls' && slicerName !== 'Follow-Ups' && slicerName !== 'Resume Inflow') {
          params.status = slicerName;
        }
        if (division && division !== 'All') params.division = division;
        if (recruiter && recruiter !== 'All') params.recruiter = recruiter;
        if (company) params.company = company;
        if (customer) params.customer = customer;

        const res = await api.getCandidates(params);
        const list = res.candidates || res.data || (Array.isArray(res) ? res : []);
        setCandidates(list);
      } catch (err) {
        console.error('Failed to load slicer candidates:', err);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredCandidates();
  }, [slicerName, division, recruiter, company, customer]);

  if (!slicerName || slicerName === 'All') return null;

  return (
    <div className="bg-white rounded-xl border border-green-200 shadow-md overflow-hidden space-y-0 transition-all my-4">
      {/* Slicer Header Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 border-b border-green-200 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{title || 'Slicer Filtered Data'} — <span className="text-green-700 font-extrabold">{slicerName}</span></span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-600 text-white font-bold">
                {loading ? '...' : candidates.length} Records Found
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Showing candidates strictly filtered for this metric slicer</p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
          <span>Clear Slicer Filter</span>
        </button>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No candidate records found matching status: <strong className="text-slate-600">"{slicerName}"</strong>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Top Horizontal Scrollbar Bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100/90 border-b border-slate-200 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Top Scrollbar</span>
            </div>
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="overflow-x-auto max-w-full flex-1 ml-4 py-0.5 cursor-pointer"
              style={{ scrollbarWidth: 'auto' }}
            >
              <div style={{ width: '1200px', height: '1px' }} />
            </div>
          </div>

          <div
            ref={tableScrollRef}
            onScroll={handleTableScroll}
            className="overflow-x-auto max-h-[450px] overflow-y-auto"
          >
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-xs">
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Candidate Name</th>
                <th className="px-5 py-3 font-semibold">Contact / Phone</th>
                <th className="px-5 py-3 font-semibold">Position Applied</th>
                <th className="px-5 py-3 font-semibold">Company / Client</th>
                <th className="px-5 py-3 font-semibold">Division</th>
                <th className="px-5 py-3 font-semibold">Recruiter</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {candidates.map((c: any, i: number) => (
                <tr key={c._id || c.id || i} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-900">{c.name}</td>
                  <td className="px-5 py-3 text-slate-500">{c.phone || c.email || '—'}</td>
                  <td className="px-5 py-3 text-slate-700 font-medium">{c.positionApplied || '—'}</td>
                  <td className="px-5 py-3 text-blue-600 font-semibold">{c.clientName || c.companyName || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {c.division || 'BPO'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{c.assignedRecruiterName || c.sourcedBy || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      c.status === 'Joined' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      c.status === 'Yet To Join' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      c.status === 'Selected' || c.status === 'Offer Released' ? 'bg-pink-100 text-pink-800 border-pink-200' :
                      c.status === 'Interview Scheduled' ? 'bg-violet-100 text-violet-800 border-violet-200' :
                      c.status === 'Screening' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {c.status || c.currentStage || 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/admin/candidate/${c._id || c.id}`}
                      className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-semibold text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
