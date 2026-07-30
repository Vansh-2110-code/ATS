import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Phone, Clock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import api from '../../services/api';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  navigateTo?: string;
  read: boolean;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-green-600', bg: 'bg-green-100' },
  alert: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  interview: { icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-100' },
  info: { icon: Info, color: 'text-slate-500', bg: 'bg-slate-100' },
  resume: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
  candidate: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
  walkin: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
};

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications({ limit: '100' });
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await api.markNotificationRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch { /* ignore */ }
    }
    
    if (notif.navigateTo) {
      navigate(notif.navigateTo);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">View all your recent alerts and activity</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 sm:flex-none border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-green-500"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>
          
          <button 
            onClick={markAllRead}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
            style={{ fontWeight: 500 }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Mark All Read</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <span className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin inline-block mb-3" />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg text-slate-700" style={{ fontWeight: 600 }}>No Notifications</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              {filter === 'unread' 
                ? "You've read all your notifications. You're all caught up!"
                : "You don't have any notifications right now."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map(n => {
              const { icon: Icon, color, bg } = NOTIF_ICONS[n.type] || NOTIF_ICONS['info'];
              
              const diffMs = Date.now() - new Date(n.createdAt).getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHrs = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHrs / 24);
              
              let timeAgo = 'Just now';
              if (diffDays > 0) timeAgo = `${diffDays} days ago`;
              else if (diffHrs > 0) timeAgo = `${diffHrs} hours ago`;
              else if (diffMins > 0) timeAgo = `${diffMins} minutes ago`;

              return (
                <div 
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-green-50/20' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-slate-800 text-sm" style={{ fontWeight: n.read ? 500 : 700 }}>
                        {n.title}
                      </p>
                      <span className="text-slate-400 text-xs whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 leading-relaxed ${n.read ? 'text-slate-500' : 'text-slate-700'}`}>
                      {n.message}
                    </p>
                  </div>
                  
                  {!n.read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
