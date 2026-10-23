import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Clock, Calendar, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const Deadlines = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/deadlines')
      .then(res => setDeadlines(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-white rounded-3xl p-6 md:p-8 text-slate-900 border border-amber-200/90 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl flex-shrink-0 mt-1">
          <Clock size={28} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900">Upcoming Notice Deadlines</h1>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            All approaching submission cutoffs, exam registrations, and fee payment deadlines extracted from official campus circulars.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading scheduled deadlines...</div>
      ) : deadlines.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <Clock size={32} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No upcoming deadlines</h3>
          <p className="text-xs text-slate-500">You are all caught up! No active deadlines pending.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deadlines.map(d => {
            const isUrgent = d.isUrgent;
            const isPassed = d.isPassed;

            return (
              <div
                key={d._id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4 ${
                  isPassed
                    ? 'border-slate-200 opacity-75'
                    : isUrgent
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {d.category || 'Notice'}
                    </span>

                    {isPassed ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                        Passed
                      </span>
                    ) : isUrgent ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {d.diffDays === 0 ? 'Due Today' : `Due in ${d.diffDays} day(s)`}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        In {d.diffDays} days
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/student/notice/${d._id}`}
                    className="block text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                  >
                    {d.title}
                  </Link>

                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 pt-1">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Date: {d.deadline?.date} {d.deadline?.time ? `(${d.deadline.time})` : ''}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/student/notice/${d._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
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

export default Deadlines;
