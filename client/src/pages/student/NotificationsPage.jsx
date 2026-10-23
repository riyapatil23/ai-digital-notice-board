import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await api.patch(`/notifications/${notif._id}/read`).catch(() => {});
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    }

    const noticeId = notif.notice?._id || notif.notice || notif.noticeId?._id || notif.noticeId;
    if (noticeId) {
      navigate(`/student/notice/${noticeId}`);
    } else if (notif.type === 'CONNECTION') {
      navigate('/student/connections');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bell size={24} className="text-indigo-600" />
            <span>All Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications for notices, deadlines, connections, and AI events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200"
          >
            <CheckCheck size={14} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <Bell size={32} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No notifications</h3>
          <p className="text-xs text-slate-500">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {notifications.map((n) => {
            const noticeObj = n.notice || n.noticeId;
            return (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`p-4 md:p-5 flex items-start justify-between gap-4 transition hover:bg-slate-50 cursor-pointer ${
                  !n.isRead ? 'bg-indigo-50/30' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {n.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{n.message}</p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span>{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {noticeObj && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                            View Notice <ExternalLink size={10} />
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
