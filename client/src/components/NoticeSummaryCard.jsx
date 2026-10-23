import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Phone,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Printer,
  X,
  Languages,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  ArrowRight,
  ListTodo,
  FileCheck2,
  Users2
} from 'lucide-react';

const NoticeSummaryCard = ({
  summaryData,
  meta = {},
  onClose = null,
  language = 'English',
  onTranslate = null,
  isTranslating = false
}) => {
  const [copied, setCopied] = useState(false);
  const [showOriginalPreview, setShowOriginalPreview] = useState(false);
  const [showAllRequirements, setShowAllRequirements] = useState(false);
  const [completedActions, setCompletedActions] = useState({});

  if (!summaryData) return null;

  // Normalize data keys
  const title = summaryData.title || meta.title || 'Official Document Notice';
  const summaryText = summaryData.summary || summaryData.aiSummary || 'Summary not available.';
  const importantPoints = Array.isArray(summaryData.importantPoints) ? summaryData.importantPoints : [];
  const dates = Array.isArray(summaryData.dates) ? summaryData.dates : [];
  const deadline = summaryData.deadline || {};
  const requiredAction = summaryData.requiredAction;
  const eligibility = summaryData.eligibility;
  const contactInformation = Array.isArray(summaryData.contactInformation) ? summaryData.contactInformation : [];
  const links = Array.isArray(summaryData.links) ? summaryData.links : [];

  // Clean raw deadline values
  const rawDeadlineDate = deadline.date && deadline.date !== 'Not specified in the notice' ? deadline.date : null;
  const rawDeadlineTime = deadline.time && deadline.time !== 'Not specified in the notice' ? deadline.time : null;

  const hasAction = requiredAction && requiredAction !== 'Not specified in the notice';
  const hasEligibility = eligibility && eligibility !== 'Not specified in the notice';

  // Dynamic Deadline Calculation against current date/time
  const deadlineAnalysis = useMemo(() => {
    if (!rawDeadlineDate) {
      return {
        status: 'none',
        badge: 'Schedule Pending',
        bgClass: 'bg-slate-50 border-slate-200 text-slate-700',
        badgeClass: 'bg-slate-200 text-slate-700',
        message: 'No specific submission deadline was detected in this notice.'
      };
    }

    const now = new Date();
    // Normalize date string for parsing (strip ordinal suffixes like 15th, 1st, 2nd, 3rd)
    const normalizedDateStr = rawDeadlineDate.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
    const parsedDate = new Date(normalizedDateStr);

    if (isNaN(parsedDate.getTime())) {
      // Unparseable string format (e.g. descriptive deadline)
      return {
        status: 'active',
        badge: 'Deadline Listed',
        bgClass: 'bg-amber-50 border-amber-200 text-amber-900',
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
        message: 'Please review the exact scheduled date specified in the notice.'
      };
    }

    // Attach exact time if available
    if (rawDeadlineTime) {
      const timeMatch = rawDeadlineTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2] || '0', 10);
        const ampm = (timeMatch[3] || '').toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        parsedDate.setHours(hours, minutes, 0, 0);
      }
    } else {
      parsedDate.setHours(23, 59, 59, 999);
    }

    const diffMs = parsedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return {
        status: 'passed',
        badge: 'Deadline Passed',
        bgClass: 'bg-rose-50 border-rose-200 text-rose-900',
        badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
        isPassed: true,
        message: 'The deadline has passed. Check the original notice for extensions or updated instructions.'
      };
    } else if (diffDays <= 1) {
      return {
        status: 'today',
        badge: 'Due Today / Urgent',
        bgClass: 'bg-amber-50 border-amber-300 text-amber-950',
        badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
        message: 'Submissions close today. Complete your action items immediately.'
      };
    } else if (diffDays <= 4) {
      return {
        status: 'approaching',
        badge: `Due in ${diffDays} Days`,
        bgClass: 'bg-amber-50/80 border-amber-200 text-amber-900',
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
        message: 'Approaching deadline. Plan your submission soon.'
      };
    } else {
      return {
        status: 'upcoming',
        badge: `Upcoming (${diffDays} days left)`,
        bgClass: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
        badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        message: 'Active upcoming notice. Ensure requirements are met before due date.'
      };
    }
  }, [rawDeadlineDate, rawDeadlineTime]);

  // Extract structured key facts from source data
  const keyFacts = useMemo(() => {
    const facts = [];

    if (hasEligibility) {
      facts.push({
        id: 'eligibility',
        label: 'Eligibility',
        value: eligibility,
        icon: UserCheck
      });
    }

    // Detect Event Date from dates list or text
    const eventDateObj = dates.find(d => /event|scheduled|held|exam|presentation/i.test(d.label || ''));
    if (eventDateObj) {
      facts.push({
        id: 'eventDate',
        label: eventDateObj.label || 'Event Date',
        value: eventDateObj.date,
        icon: Calendar
      });
    }

    // Detect Team Size from points
    const teamPoint = importantPoints.find(p => /team\s*size|group|individual/i.test(p));
    if (teamPoint) {
      const match = teamPoint.match(/team\s*size\s*:[^,.\n]+/i);
      facts.push({
        id: 'teamSize',
        label: 'Participation Format',
        value: match ? match[0] : teamPoint.slice(0, 45),
        icon: Users2
      });
    }

    // Category / Authority
    if (meta.category) {
      facts.push({
        id: 'category',
        label: 'Category',
        value: meta.category,
        icon: FileCheck2
      });
    }

    return facts;
  }, [eligibility, hasEligibility, dates, importantPoints, meta.category]);

  // Partition action items from general guidelines
  const actionChecklist = useMemo(() => {
    const list = [];

    if (hasAction) {
      list.push({
        id: 'primary-action',
        title: requiredAction,
        isMandatory: true,
        deadline: rawDeadlineDate ? `${rawDeadlineDate}${rawDeadlineTime ? ` (${rawDeadlineTime})` : ''}` : null
      });
    }

    // Extract action-oriented points from importantPoints
    importantPoints.forEach((point, idx) => {
      if (/^(submit|register|pay|fill|attend|upload|prepare|deposit|send)\b/i.test(point.trim())) {
        list.push({
          id: `point-action-${idx}`,
          title: point,
          isMandatory: /compulsory|mandatory|must/i.test(point),
          deadline: null
        });
      }
    });

    return list;
  }, [hasAction, requiredAction, importantPoints, rawDeadlineDate, rawDeadlineTime]);

  // Remaining guidelines & requirements
  const secondaryGuidelines = useMemo(() => {
    return importantPoints.filter(point => {
      return !actionChecklist.some(a => a.title === point);
    });
  }, [importantPoints, actionChecklist]);

  const toggleActionDone = (id) => {
    setCompletedActions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = () => {
    let text = `📢 ${title.toUpperCase()}\n\n`;
    if (rawDeadlineDate) text += `⏳ DEADLINE: ${rawDeadlineDate} ${rawDeadlineTime ? `(${rawDeadlineTime})` : ''}\n`;
    if (hasAction) text += `🎯 ACTION REQUIRED: ${requiredAction}\n`;
    if (hasEligibility) text += `👥 ELIGIBILITY: ${eligibility}\n`;
    if (dates.length > 0) {
      text += `\n📅 IMPORTANT DATES:\n` + dates.map(d => `• ${d.label || 'Date'}: ${d.date}`).join('\n') + '\n';
    }
    if (importantPoints.length > 0) {
      text += `\n📋 KEY REQUIREMENTS:\n` + importantPoints.map((p, i) => `${i + 1}. ${p}`).join('\n');
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const languagesList = [
    { label: 'English', value: 'English' },
    { label: 'मराठी', value: 'Marathi' },
    { label: 'हिन्दी', value: 'Hindi' },
    { label: 'ગુજરાતી', value: 'Gujarati' },
  ];

  const extraLanguages = [
    { label: 'தமிழ் (Tamil)', value: 'Tamil' },
    { label: 'తెలుగు (Telugu)', value: 'Telugu' },
    { label: 'ಕನ್ನಡ (Kannada)', value: 'Kannada' },
    { label: 'বাংলা (Bengali)', value: 'Bengali' },
    { label: 'ਪੰਜਾਬੀ (Punjabi)', value: 'Punjabi' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200">
      
      {/* =========================================================================
          A. COMPACT, QUIET HEADER
      ========================================================================= */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-slate-700">
        
        {/* Left: AI Badge & Category */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
            <Sparkles size={13} className="text-indigo-600" />
            <span>AI Notice Summary</span>
          </div>

          {meta.category && (
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              {meta.category}
            </span>
          )}

          {meta.createdAt && (
            <span className="text-xs text-slate-400">
              {new Date(meta.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          )}
        </div>

        {/* Right: Language Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onTranslate && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <Languages size={13} className="text-slate-400 ml-1.5 mr-0.5" />
              {languagesList.map((lang) => {
                const isActive = language === lang.value;
                return (
                  <button
                    key={lang.value}
                    onClick={() => onTranslate(lang.value)}
                    disabled={isTranslating}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isActive && isTranslating ? '...' : lang.label}
                  </button>
                );
              })}

              <select
                value={languagesList.some(l => l.value === language) ? '' : language}
                onChange={(e) => {
                  if (e.target.value) onTranslate(e.target.value);
                }}
                disabled={isTranslating}
                className="bg-transparent text-slate-600 text-xs font-medium px-1.5 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value="">More</option>
                {extraLanguages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Copy Summary Action */}
          <button
            onClick={copyToClipboard}
            title="Copy summary"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-xs"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* View Original File Toggle */}
          {meta.originalFileUrl && (
            <button
              onClick={() => setShowOriginalPreview(!showOriginalPreview)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <Eye size={13} className="text-indigo-600" />
              <span>{showOriginalPreview ? 'Hide File' : 'Original Notice'}</span>
            </button>
          )}

          {/* Print Action */}
          <button
            onClick={handlePrint}
            title="Print summary"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
          >
            <Printer size={14} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Embedded Original Document Preview Drawer */}
      {showOriginalPreview && meta.originalFileUrl && (
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="flex justify-between items-center mb-2 px-1 text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-600" /> Source Notice Verification View
            </span>
            <div className="flex items-center gap-3">
              <a
                href={`http://localhost:5000${meta.originalFileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium underline inline-flex items-center gap-1"
              >
                <ExternalLink size={12} /> Open in new tab
              </a>
              <button
                onClick={() => setShowOriginalPreview(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 h-96 shadow-xs flex items-center justify-center p-2">
            {meta.fileType?.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(meta.originalFileUrl || '') ? (
              <img
                src={`http://localhost:5000${meta.originalFileUrl}`}
                alt="Original Notice Image"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <iframe
                src={`http://localhost:5000${meta.originalFileUrl}`}
                title="Original Notice Document"
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN LAYOUT: 2 COLUMNS ON DESKTOP, STACKED ON MOBILE
      ========================================================================= */}
      <div className="p-6 md:p-8 space-y-6">
        
        {/* =======================================================================
            B. NOTICE OVERVIEW (TITLE & 1-2 SENTENCE PLAIN-LANGUAGE SUMMARY)
        ======================================================================= */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug break-words">
            {title}
          </h1>

          <p className="text-base text-slate-700 leading-relaxed font-normal">
            {summaryText}
          </p>

          {/* Plain "What you need to know" statement */}
          {hasAction && (
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-3 text-xs text-blue-900 flex items-start gap-2.5">
              <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-blue-950">What you need to know: </span>
                <span>{requiredAction}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* =====================================================================
              LEFT COLUMN: WHAT YOU NEED TO DO & REQUIREMENTS (~60% WIDTH)
          ===================================================================== */}
          <div className="lg:col-span-7 space-y-6">

            {/* E. WHAT YOU NEED TO DO (ACTION-FIRST CHECKLIST) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ListTodo size={18} className="text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    What You Need to Do
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {actionChecklist.length} Action{actionChecklist.length === 1 ? '' : 's'} Required
                </span>
              </div>

              {actionChecklist.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  No specific submission actions required. Read the guidelines below for reference.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {actionChecklist.map((item, index) => {
                    const isDone = !!completedActions[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleActionDone(item.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isDone
                            ? 'bg-slate-50 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/50 text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
                            isDone
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white hover:border-indigo-400'
                          }`}
                        >
                          {isDone && <Check size={13} strokeWidth={3} />}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-semibold leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {item.title}
                            </span>
                            {item.isMandatory && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wide">
                                Mandatory
                              </span>
                            )}
                          </div>

                          {item.deadline && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              Due: <span className="font-semibold text-slate-700">{item.deadline}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* F. IMPORTANT REQUIREMENTS & DETAILS */}
            {secondaryGuidelines.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileCheck2 size={18} className="text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Important Rules & Guidelines
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {secondaryGuidelines.length} Requirement Details
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(showAllRequirements ? secondaryGuidelines : secondaryGuidelines.slice(0, 4)).map((req, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {req}
                      </p>
                    </div>
                  ))}
                </div>

                {secondaryGuidelines.length > 4 && (
                  <button
                    onClick={() => setShowAllRequirements(!showAllRequirements)}
                    className="w-full pt-1 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 transition"
                  >
                    {showAllRequirements ? (
                      <>
                        <span>Show fewer requirements</span>
                        <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        <span>Show all {secondaryGuidelines.length} requirements</span>
                        <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* CONTACTS & OFFICIAL LINKS */}
            {(contactInformation.length > 0 || links.length > 0) && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Contacts & Verification Links
                </h4>

                {contactInformation.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {contactInformation.map((info, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-xs"
                      >
                        <Phone size={12} className="text-slate-400" />
                        <span>{info}</span>
                      </span>
                    ))}
                  </div>
                )}

                {links.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:border-blue-300 shadow-xs transition truncate max-w-xs"
                      >
                        <ExternalLink size={12} />
                        <span className="truncate">{link}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =====================================================================
              RIGHT COLUMN: DEADLINE SPOTLIGHT, KEY FACTS & TIMELINE (~40% WIDTH)
          ===================================================================== */}
          <div className="lg:col-span-5 space-y-6">

            {/* C. DEADLINE SPOTLIGHT (MOST NOTICEABLE ELEMENT) */}
            <div className={`rounded-2xl border p-5 shadow-xs space-y-3 transition-all ${deadlineAnalysis.bgClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500" />
                  Primary Deadline
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${deadlineAnalysis.badgeClass}`}>
                  {deadlineAnalysis.badge}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Due Date</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                  {rawDeadlineDate || 'Refer to Notice Schedule'}
                </h3>
                {rawDeadlineTime && (
                  <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                    <Clock size={13} className="text-slate-400" />
                    Time: {rawDeadlineTime}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/70 text-xs text-slate-600 leading-relaxed">
                {deadlineAnalysis.message}
              </div>
            </div>

            {/* D. KEY FACTS AT A GLANCE */}
            {keyFacts.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                  Key Facts at a Glance
                </h3>

                <div className="divide-y divide-slate-100 text-xs">
                  {keyFacts.map((fact) => {
                    const IconComponent = fact.icon;
                    return (
                      <div key={fact.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                        <IconComponent size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">{fact.label}</p>
                          <p className="font-bold text-slate-800 mt-0.5 leading-snug">{fact.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* G. IMPORTANT DATES TIMELINE */}
            {dates.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    Important Dates Timeline
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {dates.length} Milestone{dates.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="relative pl-4 space-y-3 pt-2">
                  {/* Subtle vertical connecting line */}
                  <div className="absolute left-1.5 top-3 bottom-2 w-0.5 bg-slate-200" />

                  {dates.map((d, idx) => (
                    <div key={idx} className="relative flex items-start justify-between gap-3 text-xs">
                      {/* Timeline dot */}
                      <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-600" />
                      <span className="text-slate-600 font-medium">{d.label || 'Scheduled Milestone'}</span>
                      <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {d.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* =======================================================================
            H. ORIGINAL NOTICE & TRUST FOOTER
        ======================================================================= */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-slate-400" />
            <span>AI-Assisted Notice Summary • Always verify with original notice for final submission.</span>
          </div>

          <div className="flex items-center gap-3">
            {meta.originalFileUrl && (
              <a
                href={`http://localhost:5000${meta.originalFileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1"
              >
                <span>Read Original Document</span>
                <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={copyToClipboard}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              {copied ? 'Copied' : 'Copy Summary'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NoticeSummaryCard;
