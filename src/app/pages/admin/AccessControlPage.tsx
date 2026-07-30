import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Save, Loader2, Users, Eye, X, Lock } from 'lucide-react';
import api from '../../services/api';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  recruiter: 'Front-line hiring staff responsible for sourcing candidates, making calls, and managing the pipeline.',
  tl: 'Team Lead oversees a group of recruiters, reviews resumes, corrects flagged entries, and tracks daily performance.',
  manager: 'Manager has a high-level view of all recruitment activity, performance reports, and financial metrics.',
  admin: 'System Administrator with full access to all modules, user management, and configuration settings.',
};

const ROLE_FEATURES: Record<string, string[]> = {
  recruiter: ['View & add resumes', 'Make calls & register walk-ins', 'Day-to-day candidate pipeline'],
  tl: ['Everything a recruiter can do', 'View all call history', 'Manage team & correct resumes', 'View performance reports'],
  manager: ['Full visibility on reports & exports', 'Access salary & revenue data', 'Manage team overview'],
  admin: ['Full system access', 'User management & access control', 'System logs & audit trail', 'All permissions unlocked'],
};

type Permission = {
  key: string;
  label: string;
  desc: string;
};

type RolePermissions = {
  [key: string]: boolean;
};

const PERMISSIONS: Permission[] = [
  { key: 'view_resumes', label: 'View Resumes', desc: 'Access candidate resume list' },
  { key: 'add_resumes', label: 'Add Resumes', desc: 'Upload and create candidate profiles' },
  { key: 'edit_resumes', label: 'Edit Resumes', desc: 'Modify candidate information' },
  { key: 'delete_resumes', label: 'Delete Resumes', desc: 'Remove candidate profiles' },
  { key: 'make_calls', label: 'Make Calls', desc: 'Use in-app calling feature' },
  { key: 'view_call_history', label: 'View Call History', desc: 'Access all call logs' },
  { key: 'walkin_register', label: 'Walk-In Registration', desc: 'Register walk-in candidates' },
  { key: 'view_reports', label: 'View Reports', desc: 'Access performance reports' },
  { key: 'export_reports', label: 'Export Reports', desc: 'Download and export data' },
  { key: 'manage_team', label: 'Manage Team', desc: 'View team performance overview' },
  { key: 'view_salary', label: 'View Salary', desc: 'Access salary module' },
  { key: 'view_revenue', label: 'View Revenue', desc: 'Access revenue dashboard' },
  { key: 'manage_users', label: 'Manage Users', desc: 'Add or remove system users' },
  { key: 'access_control', label: 'Access Control', desc: 'Modify role permissions' },
  { key: 'view_logs', label: 'View System Logs', desc: 'Access audit and activity logs' },
  { key: 'manage_attendance', label: 'Manage Attendance', desc: 'View and edit attendance records' },
];

type Role = 'recruiter' | 'tl' | 'manager' | 'admin';

const ROLES: { key: Role; label: string; color: string; dot: string }[] = [
  { key: 'recruiter', label: 'Recruiter', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'tl', label: 'Team Lead', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { key: 'manager', label: 'Manager', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { key: 'admin', label: 'Admin', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
];

const DEFAULT_PERMISSIONS: Record<Role, RolePermissions> = {
  recruiter: {
    view_resumes: true, add_resumes: true, edit_resumes: false, delete_resumes: false,
    make_calls: true, view_call_history: false, walkin_register: true,
    view_reports: false, export_reports: false, manage_team: false,
    view_salary: false, view_revenue: false, manage_users: false, access_control: false,
    view_logs: false, manage_attendance: false,
  },
  tl: {
    view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false,
    make_calls: true, view_call_history: true, walkin_register: true,
    view_reports: true, export_reports: false, manage_team: true,
    view_salary: false, view_revenue: false, manage_users: false, access_control: false,
    view_logs: false, manage_attendance: false,
  },
  manager: {
    view_resumes: true, add_resumes: false, edit_resumes: false, delete_resumes: false,
    make_calls: false, view_call_history: true, walkin_register: false,
    view_reports: true, export_reports: true, manage_team: true,
    view_salary: true, view_revenue: true, manage_users: false, access_control: false,
    view_logs: false, manage_attendance: false,
  },
  admin: {
    view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: true,
    make_calls: true, view_call_history: true, walkin_register: true,
    view_reports: true, export_reports: true, manage_team: true,
    view_salary: true, view_revenue: true, manage_users: true, access_control: true,
    view_logs: true, manage_attendance: true,
  },
};

export function AccessControlPage() {
  const [activeRole, setActiveRole] = useState<Role>('recruiter');
  const [permissions, setPermissions] = useState({ ...DEFAULT_PERMISSIONS });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getPermissions();
        if (data.permissions) {
          setPermissions(prev => ({ ...prev, ...data.permissions }));
        }
      } catch (err) {
        console.error('Failed to load permissions:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Load user role counts
    api.getUsers().then((data: any) => {
      const list = data.users || data || [];
      const counts: Record<string, number> = { recruiter: 0, tl: 0, manager: 0, admin: 0 };
      list.forEach((u: any) => { if (counts[u.role] !== undefined) counts[u.role]++; });
      setRoleCounts(counts);
    }).catch(() => {});
  }, []);

  const toggle = (perm: string) => {
    if (activeRole === 'admin') return;
    setPermissions(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [perm]: !prev[activeRole][perm],
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updatePermissions(permissions);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(permissions[activeRole]).filter(Boolean).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>Access Control</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage role-based permissions for the system</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors"
          style={{ fontWeight: 600 }}
        >
          <Save className="w-4 h-4" />
          Save Permissions
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <button
            key={r.key}
            onClick={() => { setActiveRole(r.key); setShowDetail(false); }}
            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
              activeRole === r.key
                ? 'border-green-300 bg-green-50 shadow-sm'
                : 'border-slate-100 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.color}`}>
                <Shield className="w-4 h-4" />
              </div>
              {roleCounts[r.key] !== undefined && (
                <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3 h-3" />{roleCounts[r.key]}
                </span>
              )}
            </div>
            <p className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>{r.label}</p>
            <p className="text-slate-400 text-xs mt-1">
              {Object.values(permissions[r.key]).filter(Boolean).length} / {PERMISSIONS.length} permissions
            </p>
          </button>
        ))}
      </div>

      {/* Role Detail Panel */}
      {activeRole && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ROLES.find(r => r.key === activeRole)?.color}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-slate-800" style={{ fontWeight: 700 }}>{ROLES.find(r => r.key === activeRole)?.label}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{ROLE_DESCRIPTIONS[activeRole]}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetail(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0"
              style={{ fontWeight: 500 }}
            >
              <Eye className="w-3.5 h-3.5" />
              {showDetail ? 'Hide Details' : 'View Details'}
            </button>
          </div>
          {showDetail && (
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2" style={{ fontWeight: 600 }}>Role Capabilities</p>
                <ul className="space-y-1.5">
                  {ROLE_FEATURES[activeRole].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2" style={{ fontWeight: 600 }}>Permission Summary</p>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.round((Object.values(permissions[activeRole]).filter(Boolean).length / PERMISSIONS.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600" style={{ fontWeight: 600 }}>
                    {Math.round((Object.values(permissions[activeRole]).filter(Boolean).length / PERMISSIONS.length) * 100)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PERMISSIONS.filter(p => permissions[activeRole][p.key]).map(p => (
                    <span key={p.key} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100" style={{ fontWeight: 500 }}>
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
              {ROLES.find(r => r.key === activeRole)?.label} Permissions
            </h2>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
              {enabledCount} enabled
            </span>
          </div>
          {activeRole === 'admin' && (
            <span className="text-xs text-slate-400">Admin has all permissions by default</span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-0 divide-x-0 sm:divide-x divide-y sm:divide-y-0 divide-slate-50">
          {PERMISSIONS.map((perm, i) => {
            const enabled = permissions[activeRole][perm.key];
            const isAdmin = activeRole === 'admin';
            return (
              <div
                key={perm.key}
                className={`flex items-center justify-between px-5 py-3.5 ${!isAdmin ? 'hover:bg-slate-50 cursor-pointer' : ''} transition-colors border-b border-slate-50`}
                onClick={() => toggle(perm.key)}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{perm.label}</p>
                  <p className="text-slate-400 text-xs">{perm.desc}</p>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                  enabled ? 'bg-green-600' : 'bg-slate-200'
                } ${isAdmin ? 'opacity-60' : ''}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
