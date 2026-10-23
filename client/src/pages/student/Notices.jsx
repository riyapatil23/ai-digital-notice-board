import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Bell,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Building2,
  CheckCircle2
} from 'lucide-react';

const StudentNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory, selectedPriority]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedPriority) params.priority = selectedPriority;
      const res = await api.get('/student/notices', { params });
      setNotices(res.data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = notices.filter(n => {
    if (filterType === 'unread' && n.isRead) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const titleMatch = (n.title || '').toLowerCase().includes(q);
      const deptMatch = (n.department || '').toLowerCase().includes(q);
      const catMatch = (n.category || '').toLowerCase().includes(q);
      const summaryMatch = (n.aiSummary || n.summary || '').toLowerCase().includes(q);
      return titleMatch || deptMatch || catMatch || summaryMatch;
    }
    return true;
  });

  const categories = ['All', 'Exam', 'Assignment', 'Placement', 'Scholarship', 'Fee', 'Event', 'General', 'Academic'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bell size={24} className="text-indigo-600" />
            <span>Campus Digital Notice Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse official announcements, examination schedules, deadlines, and circulars.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {categories.map((c) => {
            const val = c === 'All' ? '' : c;
            const isActive = selectedCategory === val;
            return (
              <button
                key={c}
                onClick={() => setSelectedCategory(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Priority & Read Filter Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority Only</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <button
            onClick={() => setFilterType(filterType === 'unread' ? 'all' : 'unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === 'unread'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filterType === 'unread' ? 'Showing Unread' : 'Filter Unread'}
          </button>
        </div>
      </div>

      {/* Notice Cards List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading notices...</div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Bell size={32} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No notices found</h3>
          <p className="text-xs text-slate-500">
            {searchTerm || selectedCategory || selectedPriority
              ? 'Try adjusting your filters or search keywords.'
              : 'You are all caught up! No active notices available.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const hasDeadline = notice.deadline?.date && notice.deadline?.date !== 'Not specified in the notice';
            const isHighPriority = notice.priority === 'HIGH';

            return (
              <div
                key={notice._id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-5 md:p-6 shadow-xs hover:shadow-md hover:border-indigo-300 flex flex-col md:flex-row md:items-start justify-between gap-5 relative group ${
                  !notice.isRead ? 'border-l-4 border-l-indigo-600 bg-indigo-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex-1 space-y-3">
                  
                  {/* Top Badges: Category, Department, Priority, Read/Unread */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {notice.category}
                    </span>

                    {notice.department && notice.department !== 'Not specified' && (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 flex items-center gap-1">
                        <Building2 size={12} className="text-slate-400" />
                        <span>{notice.department}</span>
                      </span>
                    )}

                    {isHighPriority && (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-rose-600" />
                        <span>High Priority</span>
                      </span>
                    )}

                    {!notice.isRead ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                        Unread
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-500" /> Read
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <Link
                    to={`/student/notice/${notice._id}`}
                    className="block text-lg md:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug"
                  >
                    {notice.title}
                  </Link>

                  {/* AI Summary Preview */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {notice.aiSummary || notice.summary || 'Summary not available.'}
                  </p>

                  {/* Dates & Deadline Info */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Published: {new Date(notice.createdAt).toLocaleDateString()}</span>
                    </span>

                    {hasDeadline && (
                      <span className="flex items-center gap-1.5 font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                        <Clock size={13} className="text-rose-600" />
                        <span>Deadline: {notice.deadline.date}</span>
                      </span>
                    )}
                  </div>

                </div>

                {/* Right Action Button */}
                <div className="flex-shrink-0 flex md:flex-col items-center justify-between md:justify-center gap-3">
                  <Link
                    to={`/student/notice/${notice._id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200"
                  >
                    <span>View Notice</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentNotices;
