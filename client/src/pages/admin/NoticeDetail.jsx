import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import NoticeSummaryCard from '../../components/NoticeSummaryCard';
import { ArrowLeft, Users, CheckCircle, Clock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

const AdminNoticeDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('English');
  const [translatedNotice, setTranslatedNotice] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [retryingAi, setRetryingAi] = useState(false);
  const [translationCache, setTranslationCache] = useState({});

  useEffect(() => {
    fetchNoticeData();
  }, [id]);

  const fetchNoticeData = () => {
    api.get(`/notices/${id}/stats`)
      .then((res) => {
        setData(res.data);
        if (res.data?.notice?.translations) {
          const preloaded = {};
          if (typeof res.data.notice.translations === 'object') {
            Object.entries(res.data.notice.translations).forEach(([k, v]) => {
              preloaded[k] = v;
            });
          }
          setTranslationCache(preloaded);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleRetryAi = async () => {
    try {
      setRetryingAi(true);
      const res = await api.post(`/notices/${id}/retry-ai`);
      setData(prev => ({ ...prev, notice: res.data }));
      alert('AI notice analysis re-processed successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retry AI processing');
    } finally {
      setRetryingAi(false);
    }
  };

  const handleTranslate = async (langOrEvent) => {
    const targetLang = typeof langOrEvent === 'string' ? langOrEvent : langOrEvent?.target?.value;
    if (!targetLang || !data?.notice) return;

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
      const notice = data.notice;
      const contentJson = {
        title: notice.title,
        summary: notice.aiSummary,
        importantPoints: notice.importantPoints,
        dates: notice.dates,
        deadline: notice.deadline,
        requiredAction: notice.requiredAction,
        eligibility: notice.eligibility,
        contactInformation: notice.contactInformation,
        links: notice.links
      };

      const res = await api.post('/personal/translate', {
        language: targetLang,
        contentJson,
        uploadId: id
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <RefreshCw size={28} className="animate-spin text-indigo-600" />
        <p className="text-sm font-semibold">Loading notice stats...</p>
      </div>
    );
  }

  if (!data || !data.notice) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm text-center">
        <p className="text-slate-600 font-semibold mb-4">Notice not found.</p>
        <Link
          to="/admin/history"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          <ArrowLeft size={14} /> Back to History
        </Link>
      </div>
    );
  }

  const { notice, stats } = data;

  const activeNoticeData = translatedNotice || {
    title: notice.title,
    summary: notice.aiSummary || notice.summary,
    importantPoints: notice.importantPoints,
    dates: notice.dates,
    deadline: notice.deadline,
    requiredAction: notice.requiredAction || notice.actionRequired,
    eligibility: notice.eligibility,
    contactInformation: notice.contactInformation,
    links: notice.links
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/history"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
          Back to Published Notices
        </Link>

        {notice.aiProcessingStatus === 'failed' && (
          <button
            onClick={handleRetryAi}
            disabled={retryingAi}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
          >
            <RefreshCw size={13} className={retryingAi ? 'animate-spin' : ''} />
            <span>{retryingAi ? 'Retrying...' : 'Retry Gemini AI Processing'}</span>
          </button>
        )}
      </div>

      {/* Admin Delivery Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reached</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalReached}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Read Receipts</p>
            <p className="text-2xl font-extrabold text-emerald-950 mt-0.5">{stats.read}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Unread</p>
            <p className="text-2xl font-extrabold text-amber-950 mt-0.5">{stats.unread}</p>
          </div>
        </div>
      </div>

      {/* Main Notice Summary Card */}
      <NoticeSummaryCard
        summaryData={activeNoticeData}
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
  );
};

export default AdminNoticeDetail;
