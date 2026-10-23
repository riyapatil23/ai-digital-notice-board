import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import NoticeSummaryCard from '../../components/NoticeSummaryCard';
import {
  Search,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  History as HistoryIcon,
  Bell,
  UploadCloud,
  RefreshCw,
  X
} from 'lucide-react';

const StudentHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'notices' ? 'notices' : 'personal';
  const [activeTab, setActiveTab] = useState(initialTab);

  // --- Personal Upload Summaries State ---
  const [personalHistory, setPersonalHistory] = useState([]);
  const [personalSearch, setPersonalSearch] = useState('');
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [activeModalUpload, setActiveModalUpload] = useState(null);
  const [modalLanguage, setModalLanguage] = useState('English');
  const [modalTranslatedData, setModalTranslatedData] = useState(null);
  const [isTranslatingModal, setIsTranslatingModal] = useState(false);
  const [modalTranslationCache, setModalTranslationCache] = useState({});

  // --- College Notices State ---
  const [collegeNotices, setCollegeNotices] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeCategory, setCollegeCategory] = useState('');
  const [loadingCollege, setLoadingCollege] = useState(true);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'notices' || tabParam === 'personal') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch Personal History
  useEffect(() => {
    fetchPersonalHistory();
  }, []);

  const fetchPersonalHistory = async () => {
    try {
      setLoadingPersonal(true);
      const res = await api.get('/personal/history');
      setPersonalHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching personal upload history:', err);
    } finally {
      setLoadingPersonal(false);
    }
  };

  // Fetch College Notices History
  useEffect(() => {
    fetchCollegeNotices();
  }, [collegeSearch, collegeCategory]);

  const fetchCollegeNotices = async () => {
    try {
      setLoadingCollege(true);
      let url = '/student/notices?';
      if (collegeSearch) url += `search=${encodeURIComponent(collegeSearch)}&`;
      if (collegeCategory) url += `category=${encodeURIComponent(collegeCategory)}`;
      const res = await api.get(url);
      setCollegeNotices(res.data || []);
    } catch (err) {
      console.error('Error fetching college notices history:', err);
    } finally {
      setLoadingCollege(false);
    }
  };

  // Handle translation inside active preview modal
  const handleTranslateModal = async (targetLang) => {
    setModalLanguage(targetLang);
    if (!activeModalUpload) return;
    if (targetLang === 'English') {
      setModalTranslatedData(null);
      return;
    }

    const cacheKey = `${activeModalUpload._id}_${targetLang}`;
    if (modalTranslationCache[cacheKey]) {
      setModalTranslatedData(modalTranslationCache[cacheKey]);
      return;
    }

    try {
      setIsTranslatingModal(true);
      const res = await api.post('/personal/translate', {
        language: targetLang,
        contentJson: activeModalUpload.aiSummary,
        uploadId: activeModalUpload._id
      });
      setModalTranslatedData(res.data);
      setModalTranslationCache((prev) => ({ ...prev, [cacheKey]: res.data }));
    } catch (err) {
      console.error('Translation failed:', err);
      alert('Translation service temporarily unavailable.');
      setModalLanguage('English');
    } finally {
      setIsTranslatingModal(false);
    }
  };

  const openSummaryModal = (item) => {
    setActiveModalUpload(item);
    setModalTranslatedData(null);
    setModalLanguage('English');

    // Pre-seed cached translations from MongoDB if available
    if (item.translations && typeof item.translations === 'object') {
      const preloaded = {};
      Object.entries(item.translations).forEach(([k, v]) => {
        preloaded[`${item._id}_${k}`] = v;
      });
      setModalTranslationCache((prev) => ({ ...prev, ...preloaded }));
    }
  };

  const filteredPersonal = personalHistory.filter((item) => {
    const title = item.aiSummary?.title || '';
    const summary = item.aiSummary?.summary || '';
    const q = personalSearch.toLowerCase();
    return title.toLowerCase().includes(q) || summary.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <HistoryIcon size={14} />
            Central Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            History & Saved Summaries
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Access past personal document summaries and your official college notices archive.
          </p>
        </div>

        <Link
          to="/student/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition"
        >
          <UploadCloud size={16} />
          Upload New Document
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => switchTab('personal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
            activeTab === 'personal'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles size={15} className={activeTab === 'personal' ? 'text-amber-400' : 'text-slate-400'} />
          Personal Document Summaries
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'personal' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {personalHistory.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('notices')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
            activeTab === 'notices'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell size={15} className={activeTab === 'notices' ? 'text-amber-400' : 'text-slate-400'} />
          College Notices History
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'notices' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {collegeNotices.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: PERSONAL DOCUMENT SUMMARIES
      ========================================================================= */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          {/* Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search document summaries..."
                value={personalSearch}
                onChange={(e) => setPersonalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white shadow-xs"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Showing {filteredPersonal.length} of {personalHistory.length} uploaded summaries
            </p>
          </div>

          {/* Summaries Grid */}
          {loadingPersonal ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200">
              <RefreshCw size={28} className="animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Loading document summaries...</p>
            </div>
          ) : personalHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText size={28} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">No Document Summaries Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Upload notices, circulars, or circular PDFs in 'Upload & Summarize' to automatically generate and save them here.
                </p>
              </div>
              <Link
                to="/student/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition"
              >
                <UploadCloud size={14} /> Go to Upload & Summarize
              </Link>
            </div>
          ) : filteredPersonal.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
              No document summaries matched "{personalSearch}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPersonal.map((item) => {
                const summary = item.aiSummary || {};
                const deadline = summary.deadline;
                const hasDeadline = deadline && deadline.date && deadline.date !== 'Not specified in the notice';

                return (
                  <div
                    key={item._id}
                    onClick={() => openSummaryModal(item)}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group relative"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                          {item.fileType?.includes('pdf') ? 'PDF Document' : 'Image Notice'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2">
                        {summary.title || 'Untitled Document Notice'}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {summary.summary || 'Summary details available in full preview.'}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                      {hasDeadline ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                          <Clock size={12} /> {deadline.date}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Standard Notice</span>
                      )}

                      <div className="flex items-center gap-3">
                        <a
                          href={`http://localhost:5000${item.originalFileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> Source
                        </a>
                        <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                          View Summary <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: COLLEGE NOTICES HISTORY
      ========================================================================= */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search notices by title..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-56">
              <select
                value={collegeCategory}
                onChange={(e) => setCollegeCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl p-2.5 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">All Categories</option>
                {['General', 'Exam', 'Assignment', 'Placement', 'Scholarship', 'Fee', 'Event', 'Holiday', 'Academic'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {loadingCollege ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Loading notices...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-4 rounded-l-xl">Notice Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Published Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-r-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collegeNotices.map((notice) => (
                    <tr key={notice._id} className="hover:bg-slate-50/80 transition">
                      <td className={`p-4 text-sm ${!notice.isRead ? 'font-black text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notice.title}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                          {notice.category}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(notice.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            notice.isRead
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {notice.isRead ? 'Read' : 'New / Unread'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/student/notice/${notice._id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          View Notice <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {collegeNotices.length === 0 && (
                <p className="text-center py-12 text-slate-400 text-xs font-medium">No notices found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          FULL SUMMARY DETAIL MODAL (WHEN A PERSONAL SUMMARY CARD IS CLICKED)
      ========================================================================= */}
      {activeModalUpload && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl my-8">
            <button
              onClick={() => setActiveModalUpload(null)}
              className="absolute -top-12 right-0 text-white hover:text-amber-400 flex items-center gap-1 text-xs font-bold"
            >
              <X size={18} /> Close Summary
            </button>
            <NoticeSummaryCard
              summaryData={modalTranslatedData || activeModalUpload.aiSummary}
              meta={{
                originalFileUrl: activeModalUpload.originalFileUrl,
                fileType: activeModalUpload.fileType,
                createdAt: activeModalUpload.createdAt,
                category: 'Personal Document'
              }}
              language={modalLanguage}
              onTranslate={handleTranslateModal}
              isTranslating={isTranslatingModal}
              onClose={() => setActiveModalUpload(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
