import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import {
  Bell,
  Clock,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Building2
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalNotices: 0, unreadNotices: 0 });
  const [deadlines, setDeadlines] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [highPriorityNotice, setHighPriorityNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [noticesRes, deadlinesRes] = await Promise.all([
          api.get('/student/notices'),
          api.get('/student/deadlines')
        ]);
        const notices = noticesRes.data || [];
        const unread = notices.filter(n => !n.isRead).length;
        setStats({ totalNotices: notices.length, unreadNotices: unread });
        setRecentNotices(notices.slice(0, 6));
        setDeadlines((deadlinesRes.data || []).slice(0, 4));

        const urgent = notices.find(n => n.priority === 'HIGH' && !n.isRead);
        if (urgent) setHighPriorityNotice(urgent);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
            <Sparkles size={13} className="text-amber-300" />
            <span>AI-Powered Campus Notice Board</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-indigo-100 text-xs md:text-sm leading-relaxed">
            Stay up to date with institutional circulars, exam schedules, and deadlines simplified by Gemini AI.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
          <Link
            to="/student/ai-summarizer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition active:scale-95 shadow-sm"
          >
            <Sparkles size={15} className="text-indigo-600" />
            <span>Ask AI / Summarize</span>
          </Link>
          <Link
            to="/student/notices"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-bold text-xs border border-white/20 transition active:scale-95"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Urgent High-Priority Notice Alert Banner */}
      {highPriorityNotice && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">
                  High-Priority Notice
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200/80 text-rose-900">
                  Unread
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{highPriorityNotice.title}</p>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{highPriorityNotice.aiSummary || highPriorityNotice.summary}</p>
            </div>
          </div>

          <Link
            to={`/student/notice/${highPriorityNotice._id}`}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition whitespace-nowrap self-start sm:self-center flex items-center gap-1.5"
          >
            <span>Read Urgently</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Bell size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Notices</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalNotices}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unread Notices</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.unreadNotices}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Deadlines</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{deadlines.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Notices & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Notices */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Campus Notices</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest official publications from college departments</p>
            </div>
            <Link to="/student/notices" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
              View All Notices →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentNotices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No recent notices available.</div>
            ) : (
              recentNotices.map((notice) => (
                <div
                  key={notice._id}
                  className={`p-4 md:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition group ${
                    !notice.isRead ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {notice.category}
                      </span>
                      {notice.priority === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          High Priority
                        </span>
                      )}
                      {!notice.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                      )}
                    </div>

                    <Link
                      to={`/student/notice/${notice._id}`}
                      className="block text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition truncate"
                    >
                      {notice.title}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-1">{notice.aiSummary || notice.summary}</p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      {notice.department && notice.department !== 'Not specified' && (
                        <>
                          <span>•</span>
                          <span>{notice.department}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/student/notice/${notice._id}`}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition flex-shrink-0"
                  >
                    <ArrowRight size={15} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Deadlines */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden h-fit">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Approaching Deadlines</h3>
            </div>
            <Link to="/student/deadlines" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              All →
            </Link>
          </div>

          <div className="p-4 md:p-5 space-y-3">
            {deadlines.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No upcoming deadlines detected.</div>
            ) : (
              deadlines.map((d) => (
                <div
                  key={d._id}
                  className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 space-y-1.5 hover:border-rose-200 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500">{d.category || 'Notice'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {d.diffDays === 0 ? 'Today' : `in ${d.diffDays}d`}
                    </span>
                  </div>
                  <Link
                    to={`/student/notice/${d._id}`}
                    className="block text-xs font-bold text-slate-900 hover:text-rose-700 transition leading-snug truncate"
                  >
                    {d.title}
                  </Link>
                  <p className="text-[11px] text-rose-700 font-semibold">
                    Cut-off: {d.deadline?.date}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
