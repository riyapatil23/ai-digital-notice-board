import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AlertTriangle, Clock, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

const ImportantNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch high priority notices
    api.get('/student/notices', { params: { priority: 'HIGH' } })
      .then(res => setNotices(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="bg-gradient-to-r from-rose-50/80 via-amber-50/60 to-white rounded-3xl p-6 md:p-8 text-slate-900 border border-rose-200/90 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl flex-shrink-0 mt-1">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900">Important & High-Priority Notices</h1>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            These announcements require immediate student attention, such as critical examination dates, compulsory submissions, and urgent institutional alerts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading high-priority notices...</div>
      ) : notices.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <AlertTriangle size={32} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No high-priority notices</h3>
          <p className="text-xs text-slate-500">There are currently no urgent action items requiring immediate attention.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map(notice => (
            <div
              key={notice._id}
              className="bg-white rounded-2xl border-l-4 border-l-rose-500 border border-slate-200 p-6 shadow-xs hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    High Priority
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {notice.category}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>

              <Link
                to={`/student/notice/${notice._id}`}
                className="block text-xl font-bold text-slate-900 hover:text-rose-600 transition"
              >
                {notice.title}
              </Link>

              <p className="text-xs text-slate-600 leading-relaxed">
                {notice.aiSummary || notice.summary}
              </p>

              {notice.deadline?.date && notice.deadline?.date !== 'Not specified in the notice' && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 w-fit">
                  <Clock size={14} className="text-rose-600" />
                  <span>Submission Deadline: {notice.deadline.date}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Link
                  to={`/student/notice/${notice._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  <span>Review Details</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportantNotices;
