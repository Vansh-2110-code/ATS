import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckSquare, Plus, Edit2, Trash2, RefreshCw, X, AlertCircle,
  User, Clock, Flag, ChevronDown, ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-600',
  High: 'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-600',
};

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-slate-200 text-slate-400',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  assignedTo: [] as string[], // Changed to array
  assignedToNames: [] as string[], // Changed to array
  taskCategory: '',
  dueDate: '',
  priority: 'Medium',
  status: 'Pending',
  notes: '',
  jrNumbers: [] as string[], // New: JR# field
  jrNames: [] as string[], // New: JR names for display
};

const TASK_CATEGORIES = [
  'JR Follow-up',
  'Candidate Follow-up',
  'Interview Schedule',
  'Document Collection',
  'Offer Discussion',
  'Joining Verification',
  'Client Communication',
  'Internal Review',
];

export function TaskManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isTL = user?.role === 'tl';

  const [tasks, setTasks] = useState<any[]>([]);
  const [teamSummary, setTeamSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [jrList, setJrList] = useState<any[]>([]);
  const [loadingJRs, setLoadingJRs] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const data = await api.getTasks(params);
      setTasks(data.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
    if (isAdmin || isTL) {
      api.getTaskTeamSummary().then((d: any) => setTeamSummary(d.summary || [])).catch(() => {});
    }
  }, [fetchTasks, isAdmin, isTL]);

  const loadUsers = async () => {
    if (users.length > 0) return;
    setLoadingUsers(true);
    try {
      const data = await api.getUsers({ limit: '100' });
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadJRs = async () => {
    if (jrList.length > 0) return;
    setLoadingJRs(true);
    try {
      const data = await api.getJobs({ limit: '500' });
      setJrList(data.jobs || []);
    } catch {
      setJrList([]);
    } finally {
      setLoadingJRs(false);
    }
  };

  const openCreate = async () => {
    setEditTask(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setModalOpen(true);
    await loadUsers();
    await loadJRs();
  };

  const openEdit = async (task: any) => {
    setEditTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo.map((a: any) => a._id || a) : (task.assignedTo ? [task.assignedTo] : []),
      assignedToNames: task.assignedToNames || [],
      taskCategory: task.taskCategory || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority || 'Medium',
      status: task.status || 'Pending',
      notes: task.notes || '',
      jrNumbers: task.jrNumbers || [],
      jrNames: task.jrNames || [],
    });
    setError('');
    setModalOpen(true);
    await loadUsers();
    await loadJRs();
  };

  const handleAddAssignee = (userId: string) => {
    const selected = users.find(u => u._id === userId);
    if (selected && !form.assignedTo.includes(userId)) {
      setForm(prev => ({
        ...prev,
        assignedTo: [...prev.assignedTo, userId],
        assignedToNames: [...prev.assignedToNames, selected.name],
      }));
    }
  };

  const handleRemoveAssignee = (userId: string) => {
    setForm(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.filter(id => id !== userId),
      assignedToNames: prev.assignedToNames.filter((_, i) => prev.assignedTo[i] !== userId),
    }));
  };

  const handleAddJR = (jrNumber: string) => {
    const selected = jrList.find(j => j.jrNumber === jrNumber);
    if (selected && !form.jrNumbers.includes(jrNumber)) {
      setForm(prev => ({
        ...prev,
        jrNumbers: [...prev.jrNumbers, jrNumber],
        jrNames: [...prev.jrNames, `${jrNumber} - ${selected.jobTitle}`],
      }));
    }
  };

  const handleRemoveJR = (jrNumber: string) => {
    setForm(prev => ({
      ...prev,
      jrNumbers: prev.jrNumbers.filter(j => j !== jrNumber),
      jrNames: prev.jrNames.filter((_, i) => prev.jrNumbers[i] !== jrNumber),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Task title is required.'); return; }
    if (form.assignedTo.length === 0) { setError('Please assign the task to at least one person.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        assignedByName: user?.name || '',
      };
      if (editTask) {
        await api.updateTask(editTask._id, payload);
      } else {
        await api.createTask(payload);
      }
      setModalOpen(false);
      fetchTasks();
      // Refresh team summary
      if (isAdmin || isTL) {
        api.getTaskTeamSummary().then((d: any) => setTeamSummary(d.summary || [])).catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      setDeleteConfirm(null);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete.');
    }
  };

  const handleQuickStatus = async (task: any, newStatus: string) => {
    try {
      await api.updateTask(task._id, { status: newStatus });
      fetchTasks();
    } catch {}
  };

  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const urgentCount = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Completed').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>Team Tasks</h1>
            <p className="text-slate-500 text-sm mt-0.5">Assign and track team tasks</p>
          </div>
          {(isAdmin || isTL) && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-xl transition-colors"
              style={{ fontWeight: 500 }}>
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: pendingCount, color: 'text-slate-600', bg: 'bg-white', filter: 'Pending' },
            { label: 'In Progress', value: inProgressCount, color: 'text-blue-600', bg: 'bg-blue-50', filter: 'In Progress' },
            { label: 'Completed', value: completedCount, color: 'text-emerald-600', bg: 'bg-emerald-50', filter: 'Completed' },
            { label: 'Urgent', value: urgentCount, color: 'text-red-600', bg: 'bg-red-50', filter: '' },
          ].map((s, i) => (
            <button key={i} onClick={() => setStatusFilter(s.filter && statusFilter === s.filter ? '' : s.filter)}
              className={`${s.bg} rounded-2xl p-4 text-left shadow-sm border-2 transition-all ${s.filter && statusFilter === s.filter ? 'border-green-400' : 'border-transparent border-slate-100'}`}>
              <div className={`text-2xl ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-slate-500 text-sm mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Team Summary (admin/tl) */}
        {(isAdmin || isTL) && teamSummary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-slate-700 text-sm mb-4" style={{ fontWeight: 600 }}>Team Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {teamSummary.map((m: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 text-xs" style={{ fontWeight: 700 }}>
                      {m.memberName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-700 text-xs truncate" style={{ fontWeight: 600 }}>{m.memberName}</p>
                    <p className="text-slate-400 text-xs">{m.pending} pending · {m.completed} done</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="">All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="">All Priority</option>
            <option>Urgent</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          {(statusFilter || priorityFilter) && (
            <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 px-2 py-2 rounded-xl hover:bg-red-50">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button onClick={fetchTasks} className="p-2 text-slate-400 hover:text-green-600 rounded-xl hover:bg-green-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 ml-auto">{tasks.length} tasks</span>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
              <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No tasks found</p>
            </div>
          ) : (
              tasks.map(task => {
                const redirectUrl = task.entityType === 'candidate' 
                  ? `/recruiter/candidate/${task.entityId || task.candidateId}`
                  : task.entityType === 'job'
                    ? `/recruiter/jobs/${task.entityId}`
                    : null;

                return (
                  <div key={task._id} 
                    onClick={() => redirectUrl && navigate(redirectUrl)}
                    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-4 items-start ${task.status === 'Completed' ? 'opacity-70' : ''} ${redirectUrl ? 'cursor-pointer hover:border-green-300 transition-all' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className={`text-slate-800 text-sm ${task.status === 'Completed' ? 'line-through text-slate-400' : ''}`} style={{ fontWeight: 600 }}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || 'bg-slate-100 text-slate-500'}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-500'}`}>
                          {task.status}
                        </span>
                        {redirectUrl && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">View Source <ArrowRight className="w-2.5 h-2.5" /></span>}
                      </div>
                      {task.description && <p className="text-slate-500 text-xs mb-2 line-clamp-2">{task.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {Array.isArray(task.assignedToNames) ? task.assignedToNames.join(', ') : task.assignedToName}
                        </span>
                        {task.jrNumbers && task.jrNumbers.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">
                            JR: {task.jrNumbers.join(', ')}
                          </span>
                        )}
                        {task.taskCategory && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{task.taskCategory}</span>
                        )}
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? 'text-red-500' : ''}`}>
                            <Clock className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className="text-slate-300">· by {task.assignedByName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Quick status change */}
                      {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                        <div className="relative group" onClick={e => e.stopPropagation()}>
                          <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-green-600 px-2.5 py-1.5 bg-slate-50 hover:bg-green-50 rounded-xl transition-colors">
                            <ChevronDown className="w-3 h-3" /> Update
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 hidden group-hover:block min-w-32">
                            {['In Progress', 'Completed', 'Cancelled'].filter(s => s !== task.status).map(s => (
                              <button key={s} onClick={() => handleQuickStatus(task, s)}
                                className="block w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-green-600">
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {(isAdmin || isTL) && (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(task._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-slate-800" style={{ fontWeight: 700 }}>{editTask ? 'Edit Task' : 'New Task'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Task Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/30"
                    placeholder="Enter task title…" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Assign To * (Select multiple)</label>
                  <div className="flex gap-2 mb-2">
                    <select onChange={e => { if (e.target.value) handleAddAssignee(e.target.value); e.target.value = ''; }}
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none">
                      <option value="">{loadingUsers ? 'Loading users…' : 'Click to add team member'}</option>
                      {users.filter(u => !form.assignedTo.includes(u._id)).map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  {form.assignedTo.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.assignedToNames.map((name, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-lg">
                          <span style={{ fontWeight: 500 }}>{name}</span>
                          <button type="button" onClick={() => handleRemoveAssignee(form.assignedTo[i])}
                            className="text-green-500 hover:text-green-700 font-bold">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.assignedTo.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No assignees selected</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Task Category</label>
                  <div className="flex gap-2">
                    <select value={form.taskCategory} onChange={e => setForm(p => ({ ...p, taskCategory: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none">
                      <option value="">Select or type custom…</option>
                      {TASK_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={form.taskCategory}
                      onChange={e => setForm(p => ({ ...p, taskCategory: e.target.value }))}
                      placeholder="Custom task type"
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>JR# (Select one or more)</label>
                  <select onChange={e => { if (e.target.value) handleAddJR(e.target.value); e.target.value = ''; }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none mb-2">
                    <option value="">{loadingJRs ? 'Loading JRs…' : 'Click to add JR#'}</option>
                    {jrList.filter(j => !form.jrNumbers.includes(j.jrNumber)).map(j => (
                      <option key={j._id} value={j.jrNumber}>{j.jrNumber} - {j.jobTitle}</option>
                    ))}
                  </select>
                  {form.jrNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.jrNames.map((name, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg">
                          <span style={{ fontWeight: 500 }}>{name}</span>
                          <button type="button" onClick={() => handleRemoveJR(form.jrNumbers[i])}
                            className="text-blue-500 hover:text-blue-700 font-bold">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.jrNumbers.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No JRs selected (optional)</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Priority</label>
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none">
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end flex-shrink-0">
                <button onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  style={{ fontWeight: 500 }}>
                  {saving ? 'Saving…' : editTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
              <Flag className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="text-slate-800 mb-1" style={{ fontWeight: 700 }}>Delete this task?</h3>
              <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors" style={{ fontWeight: 500 }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
