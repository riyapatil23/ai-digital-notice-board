import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import NoticeSummaryCard from '../../components/NoticeSummaryCard';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const StudentNoticeDetail = () => {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [activeView, setActiveView] = useState('ai'); // 'original' | 'ai'
  const [translatedNotice, setTranslatedNotice] = useState(null);
  const [language, setLanguage] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryingAi, setRetryingAi] = useState(false);
  const [translationCache, setTranslationCache] = useState({});

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await api.get(`/student/notices/${id}`);
        const found = res.data;
        setNotice(found);

        // Preload any pre-existing database translations
        if (found?.translations) {
          const preloaded = {};
          if (typeof found.translations === 'object') {
            Object.entries(found.translations).forEach(([k, v]) => {
              preloaded[k] = v;
            });
          }
          setTranslationCache(preloaded);
        }

        if (found && !found.isRead) {
          api.put(`/student/notices/${id}/read`).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load notice:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, [id]);

  const handleTranslate = async (langOrEvent) => {
    const targetLang = typeof langOrEvent === 'string' ? langOrEvent : langOrEvent?.target?.value;
    if (!targetLang || !notice) return;

    setLanguage(targetLang);

    if (targetLang === 'English') {
      return setTranslatedNotice(null);
    }

    if (translationCache[targetLang]) {
      setTranslatedNotice(translationCache[targetLang]);
      return;
    }

    setIsTranslating(true);
    try {
      const contentJson = {
        title: notice.title,
        summary: notice.aiSummary,
        simplifiedExplanation: notice.simplifiedExplanation,
        importantPoints: notice.importantPoints,
        dates: notice.dates,
        deadline: notice.deadline,
        requiredAction: notice.requiredAction || notice.actionRequired,
        eligibility: notice.eligibility,
        contactInformation: notice.contactInformation,
        links: notice.links
      };

      const res = await api.post(`/student/notices/${id}/translate`, {
        language: targetLang,
        contentJson
      });

      setTranslatedNotice(res.data);
      setTranslationCache((prev) => ({ ...prev, [targetLang]: res.data }));
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation service temporarily unavailable.');
      setLanguage('English');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRetryAi = async () => {
    try {
      setRetryingAi(true);
      const res = await api.post(`/notices/${id}/retry-ai`);
      setNotice(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not re-analyze notice.');
    } finally {
      setRetryingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <RefreshCw size={28} className="animate-spin text-indigo-600" />
        <p className="text-sm font-semibold">Loading notice details...</p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm text-center">
        <p className="text-slate-600 font-semibold mb-4">Notice not found or no longer available.</p>
        <Link
          to="/student/notices"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          <ArrowLeft size={14} /> Back to Notices
        </Link>
      </div>
    );
  }

  const activeData = translatedNotice || {
    title: notice.title,
    summary: notice.aiSummary || notice.summary,
    simplifiedExplanation: notice.simplifiedExplanation,
    importantPoints: notice.importantPoints,
    dates: notice.dates,
    deadline: notice.deadline,
    requiredAction: notice.requiredAction || notice.actionRequired,
    eligibility: notice.eligibility,
    contactInformation: notice.contactInformation,
    links: notice.links
  };

  const isPdf = notice.fileType?.includes('pdf') || /\.pdf$/i.test(notice.originalFileUrl || '');
  const isImage = notice.fileType?.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(notice.originalFileUrl || '');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/student/notices"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
          Back to Notice Board
        </Link>

        {/* Clear Toggle: Original vs AI Simplified */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-xs">
          <button
            onClick={() => setActiveView('original')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'original'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} className={activeView === 'original' ? 'text-indigo-600' : ''} />
            <span>Original</span>
          </button>

          <button
            onClick={() => setActiveView('ai')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'ai'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} />
            <span>AI Simplified</span>
          </button>
        </div>
      </div>

      {/* AI Processing Status Warning Banner (if failed) */}
      {notice.aiProcessingStatus === 'failed' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">AI Processing Notice: </span>
              <span>AI analysis encountered an error or timeout during upload. Fallback text is displayed.</span>
            </div>
          </div>
          <button
            onClick={handleRetryAi}
            disabled={retryingAi}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={retryingAi ? 'animate-spin' : ''} />
            <span>{retryingAi ? 'Retrying...' : 'Retry AI Analysis'}</span>
          </button>
        </div>
      )}

      {/* VIEW A: ORIGINAL NOTICE VIEW */}
      {activeView === 'original' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 md:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                  {notice.category}
                </span>
                <span className="text-xs text-slate-400">
                  Published: {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">{notice.title}</h1>
            </div>

            {notice.originalFileUrl && (
              <a
                href={`http://localhost:5000${notice.originalFileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                <ExternalLink size={14} /> Open file in new tab
              </a>
            )}
          </div>

          {/* Embedded Document Preview */}
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 min-h-[480px] flex items-center justify-center p-3">
            {isImage ? (
              <img
                src={`http://localhost:5000${notice.originalFileUrl}`}
                alt="Original Notice Document"
                className="max-h-[600px] max-w-full object-contain rounded-xl shadow-xs"
              />
            ) : isPdf ? (
              <iframe
                src={`http://localhost:5000${notice.originalFileUrl}`}
                title="Original Notice PDF"
                className="w-full h-[600px] rounded-xl border border-slate-200"
              />
            ) : (
              <div className="p-8 text-center text-slate-500">
                <FileText size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Uploaded File Preview</p>
                <a
                  href={`http://localhost:5000${notice.originalFileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 font-bold underline mt-1 block"
                >
                  Download or View File
                </a>
              </div>
            )}
          </div>

          {/* Raw Extracted Notice Text */}
          {notice.extractedText && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText size={15} className="text-slate-400" />
                <span>Extracted Document Text Content:</span>
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {notice.extractedText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW B: AI SIMPLIFIED VIEW */}
      {activeView === 'ai' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Metadata Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" /> Priority
              </p>
              <p className={`text-sm font-bold ${notice.priority === 'HIGH' ? 'text-rose-600' : 'text-slate-800'}`}>
                {notice.priority || 'LOW'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock size={12} className="text-rose-500" /> Deadline
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {notice.deadline?.date && notice.deadline?.date !== 'Not specified in the notice' ? notice.deadline.date : 'Not specified'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-blue-500" /> Venue / Department
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {notice.venue && notice.venue !== 'Not specified' ? notice.venue : notice.department || 'Not specified'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Users size={12} className="text-emerald-500" /> Target Audience
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {Array.isArray(notice.targetAudience) && notice.targetAudience.length > 0 ? notice.targetAudience.join(', ') : 'All Students'}
              </p>
            </div>
          </div>

          <NoticeSummaryCard
            summaryData={activeData}
            meta={{
              category: notice.category,
              createdAt: notice.createdAt,
              originalFileUrl: notice.originalFileUrl,
              fileType: notice.fileType
            }}
            language={language}
            onTranslate={handleTranslate}
            isTranslating={isTranslating}
          />
        </div>
      )}
    </div>
  );
};

export default StudentNoticeDetail;
