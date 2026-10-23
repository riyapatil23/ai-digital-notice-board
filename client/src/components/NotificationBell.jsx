import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Link as LinkIcon,
  AlertTriangle,
  Info,
  ExternalLink,
  X
} from 'lucide-react';

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // 1. Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.warn('Could not fetch unread count:', err.message);
    }
  };

  // 2. Fetch full notifications list
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
      const unread = (res.data || []).filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Could not fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Real-time Socket.IO Connection & Polling Fallback
  useEffect(() => {
    if (!user || !user._id) return;

    fetchUnreadCount();

    // Connect socket
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user._id);
    });

    socket.on('new_notification', (newNotif) => {
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [newNotif, ...prev]);

      // Trigger interactive Toast
      setActiveToast(newNotif);
      setTimeout(() => setActiveToast(null), 5000);
    });

    socket.on('notification_count_updated', () => {
      fetchUnreadCount();
    });

    // Polling fallback every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.emit('leave', user._id);
        socket.disconnect();
      }
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Mark single notification read
  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  // Delete notification
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const deletedItem = notifications.find(n => n._id === id);
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Navigate to notice upon click
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await api.patch(`/notifications/${notif._id}/read`).catch(() => {});
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    setIsOpen(false);

    const noticeId = notif.notice?._id || notif.notice || notif.noticeId?._id || notif.noticeId;
    if (noticeId) {
      if (user?.role === 'admin') {
        navigate(`/admin/notice/${noticeId}`);
      } else {
        navigate(`/student/notice/${noticeId}`);
      }
    } else if (notif.type === 'CONNECTION') {
      navigate(user?.role === 'admin' ? '/admin/connections' : '/student/connections');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'IMPORTANT_NOTICE':
        return <AlertTriangle size={15} className="text-amber-600" />;
      case 'DEADLINE':
        return <Clock size={15} className="text-rose-600" />;
      case 'CONNECTION':
        return <LinkIcon size={15} className="text-emerald-600" />;
      case 'AI_PROCESSING':
        return <Sparkles size={15} className="text-indigo-600" />;
      case 'EVENT':
        return <Calendar size={15} className="text-blue-600" />;
      default:
        return <Info size={15} className="text-indigo-600" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'IMPORTANT_NOTICE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Important</span>;
      case 'DEADLINE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Deadline</span>;
      case 'CONNECTION':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Connection</span>;
      case 'AI_PROCESSING':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">AI</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Notice</span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition active:scale-95 text-slate-700 flex items-center justify-center bg-white shadow-xs"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={19} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Real-time Toast Banner */}
      {activeToast && !isOpen && (
        <div
          onClick={() => handleNotificationClick(activeToast)}
          className="fixed bottom-6 right-6 z-50 bg-white border border-indigo-200 shadow-xl rounded-2xl p-4 max-w-sm flex items-start gap-3 cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-200 hover:border-indigo-400"
        >
          <div className="p-2 rounded-xl bg-indigo-50 flex-shrink-0">
            {getTypeIcon(activeToast.type)}
          </div>
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2">
              <h5 className="text-xs font-bold text-slate-900">{activeToast.title}</h5>
              {getTypeBadge(activeToast.type)}
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{activeToast.message}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dropdown Notification Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400">You will be alerted when new notices, deadlines or events occur.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const noticeObj = item.notice || item.noticeId;
                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50 group relative ${
                      !item.isRead ? 'bg-indigo-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Unread blue dot indicator */}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                    )}

                    <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        {getTypeBadge(item.type)}
                      </div>

                      <p className={`text-xs mt-1 leading-relaxed ${!item.isRead ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        {noticeObj && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                              View Notice <ExternalLink size={9} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (hover) */}
                    <div className="absolute right-2 top-2 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, item._id)}
                          title="Mark as read"
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white transition"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, item._id)}
                        title="Delete notification"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(user?.role === 'admin' ? '/admin/dashboard' : '/student/notifications');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
