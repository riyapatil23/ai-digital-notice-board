import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  ListTodo,
  HelpCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const AISummarizer = () => {
  const [notices, setNotices] = useState([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    // Fetch available notices so students can easily pick one from dropdown
    api.get('/student/notices')
      .then(res => setNotices(res.data || []))
      .catch(err => console.warn('Could not load student notices:', err));
  }, []);

  const handleNoticeSelect = (e) => {
    const id = e.target.value;
    setSelectedNoticeId(id);
    if (!id) return;

    const found = notices.find(n => n._id === id);
    if (found) {
      // Auto-fill or show selection
      setNoticeText(found.extractedText || found.aiSummary || found.title || '');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!noticeText.trim() && !selectedNoticeId) {
      return setError('Please paste notice text or select an existing notice from the dropdown.');
    }

    setIsLoading(true);
    setError('');
    setAiResult(null);

    try {
      const res = await api.post('/personal/ask-ai', {
        text: noticeText.trim(),
        noticeId: selectedNoticeId || undefined
      });
      setAiResult(res.data);
    } catch (err) {
      console.error('Ask AI error:', err);
      setError('AI could not process this notice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setNoticeText('');
    setSelectedNoticeId('');
    setAiResult(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-white rounded-3xl p-6 md:p-8 text-slate-900 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-indigo-600" />
            Personal AI Notice Assistant
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Ask AI / Summarize Notice
          </h1>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            Have a complicated college notice? Paste the circular text or choose an existing notice below. Gemini AI breaks down the notice into 6 student-friendly answers: what it is, key points, what you should do, dates, deadlines, and eligibility.
          </p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <form onSubmit={handleAnalyze} className="space-y-6">
          
          {/* Quick Selector Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select from your published notices (optional):
            </label>
            <select
              value={selectedNoticeId}
              onChange={handleNoticeSelect}
              className="w-full border border-slate-300 p-3 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-800"
            >
              <option value="">-- Choose an existing notice, or paste custom text below --</option>
              {notices.map(n => (
                <option key={n._id} value={n._id}>
                  {n.title} ({n.category} • {new Date(n.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Paste Text Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Notice Content / Circular Text:
              </label>
              {noticeText && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear text
                </button>
              )}
            </div>
            <textarea
              rows={6}
              value={noticeText}
              onChange={(e) => {
                setNoticeText(e.target.value);
                if (error) setError('');
              }}
              placeholder="Paste notice circular text, email announcement, exam schedule text, or syllabus circular instructions here..."
              className="w-full border border-slate-300 p-4 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-indigo-500 font-normal leading-relaxed text-slate-800 bg-white shadow-xs"
            />
          </div>

          {/* Loading State Banner */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 animate-pulse">
              <RefreshCw size={20} className="animate-spin text-indigo-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">AI is analyzing the notice...</p>
                <p className="text-xs text-indigo-700 mt-0.5">Extracting key points, actionable steps, deadlines, and eligibility using Gemini AI.</p>
              </div>
            </div>
          )}

          {/* Error State Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">AI could not process this notice. Please try again.</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || (!noticeText.trim() && !selectedNoticeId)}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition active:scale-[0.99] shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>AI is analyzing the notice...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Ask AI / Analyze Notice</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* AI Structured Answers (6 Key Output Cards) */}
      {aiResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" />
              <span>AI Analysis Results</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Analysis Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Simple Explanation */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <BookOpen size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider">1. Simple Explanation</h4>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {aiResult.simpleExplanation}
              </p>
            </div>

            {/* 2. Key Points */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-800">
                <ListTodo size={18} className="text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">2. Key Points</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                {(aiResult.keyPoints || []).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. What Should I Do? */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-800">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">3. What Should I Do?</h4>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs font-semibold text-emerald-950 leading-relaxed">
                {aiResult.whatShouldIDo}
              </div>
            </div>

            {/* 4. Important Date */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Calendar size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider">4. Important Date</h4>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {aiResult.importantDate || 'Not specified'}
              </p>
              <p className="text-[11px] text-slate-400">Scheduled start or event date specified in the notice.</p>
            </div>

            {/* 5. Deadline */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-700">
                <Clock size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider">5. Deadline</h4>
              </div>
              <p className="text-lg font-bold text-rose-950 mt-1">
                {aiResult.deadline || 'Not specified'}
              </p>
              <p className="text-[11px] text-slate-400">Action submission / payment cut-off date.</p>
            </div>

            {/* 6. Who is this for? */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <Users size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider">6. Who Is This For? (Target Audience)</h4>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {aiResult.whoIsThisFor || 'All Enrolled Students'}
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AISummarizer;
