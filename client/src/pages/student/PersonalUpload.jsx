import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import NoticeSummaryCard from '../../components/NoticeSummaryCard';
import {
  UploadCloud,
  Sparkles,
  History,
  AlertCircle,
  FileCheck,
  RefreshCw,
  X,
  ArrowRight,
  Image as ImageIcon,
  FileText,
  Camera,
  CheckCircle2,
  ScanLine
} from 'lucide-react';

const PersonalUpload = () => {
  const [file, setFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadMode, setUploadMode] = useState('all'); // 'all' | 'image' | 'pdf'
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeUpload, setActiveUpload] = useState(null);
  const [language, setLanguage] = useState('English');
  const [translatedData, setTranslatedData] = useState(null);
  const [isTranslatingLanguage, setIsTranslatingLanguage] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  const fileInputRef = useRef(null);

  // Generate and cleanup object URLs for image preview thumbnails
  useEffect(() => {
    if (file && (file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name))) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [file]);

  const handleTranslatePersonal = async (targetLang) => {
    setLanguage(targetLang);
    if (!activeUpload) return;
    if (targetLang === 'English') {
      setTranslatedData(null);
      return;
    }
    const cacheKey = `${activeUpload._id || 'temp'}_${targetLang}`;
    if (translationCache[cacheKey]) {
      setTranslatedData(translationCache[cacheKey]);
      return;
    }
    try {
      setIsTranslatingLanguage(true);
      const res = await api.post('/personal/translate', {
        language: targetLang,
        contentJson: activeUpload.aiSummary,
        uploadId: activeUpload._id
      });
      setTranslatedData(res.data);
      setTranslationCache((prev) => ({ ...prev, [cacheKey]: res.data }));
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setIsTranslatingLanguage(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selected) => {
    const isImg = selected.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(selected.name);
    const isPdf = selected.type === 'application/pdf' || /\.pdf$/i.test(selected.name);

    if (uploadMode === 'image' && !isImg) {
      return alert('Please select an image file (JPG, PNG, WEBP, Camera photo, or Screenshot).');
    }
    if (uploadMode === 'pdf' && !isPdf) {
      return alert('Please select a PDF document.');
    }

    setFile(selected);
    setStatus('');
  };

  const removeFile = (e) => {
    e?.stopPropagation();
    setFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name);
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      setStatus(
        isImage
          ? 'Scanning image with High-Resolution OCR to extract text and generate summary...'
          : 'Parsing document and analyzing notice with AI...'
      );

      const res = await api.post('/personal/summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setActiveUpload(res.data);
      setTranslatedData(null);
      setLanguage('English');
      setStatus('');
      setFile(null);
      setImagePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to process document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Light Clean Header */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-white rounded-3xl p-6 md:p-8 text-slate-900 shadow-sm border border-slate-200/90 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-indigo-600" />
            AI Document & Image Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Upload & Summarize Notice
          </h1>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            Upload circulars, letters, scholarship notices, or photos taken from college notice boards. Our AI reads both <strong>PDF documents</strong> and <strong>images</strong> (photos, WhatsApp screenshots, circular photos) to extract deadlines, dates, and action items.
          </p>
        </div>

        {/* Quick Link to Central History */}
        <div className="relative z-10 flex-shrink-0">
          <Link
            to="/student/history?tab=personal"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs transition active:scale-95 shadow-xs"
          >
            <History size={15} className="text-indigo-600" />
            <span>Saved History</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        
        {/* Format Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Choose upload format:
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setUploadMode('all'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                uploadMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Formats
            </button>

            <button
              type="button"
              onClick={() => { setUploadMode('image'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                uploadMode === 'image'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Camera size={13} />
              <span>Image Notice (JPG, PNG, Photo)</span>
            </button>

            <button
              type="button"
              onClick={() => { setUploadMode('pdf'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                uploadMode === 'pdf'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileText size={13} />
              <span>PDF Document</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-10 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
                : file
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={
                uploadMode === 'image'
                  ? 'image/*,.jpg,.jpeg,.png,.webp,.bmp'
                  : uploadMode === 'pdf'
                  ? '.pdf'
                  : '.pdf,.jpg,.jpeg,.png,.webp,.bmp,image/*'
              }
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3.5">
                {/* Visual Image Preview Thumbnail if file is an image */}
                {imagePreviewUrl ? (
                  <div className="relative group/thumb">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-md bg-slate-900/5 flex items-center justify-center">
                      <img
                        src={imagePreviewUrl}
                        alt="Selected notice preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow">
                      PHOTO / IMAGE
                    </span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <FileCheck size={32} />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-center gap-2">
                    <h4 className="text-base font-bold text-slate-800">{file.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                      {imagePreviewUrl ? 'IMAGE OCR' : 'PDF PARSER'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to change file
                  </p>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  className="mt-1 text-xs text-rose-600 hover:text-rose-700 font-semibold underline flex items-center gap-1"
                >
                  <X size={13} /> Remove selected file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  {uploadMode === 'image' ? (
                    <Camera size={32} />
                  ) : uploadMode === 'pdf' ? (
                    <FileText size={32} />
                  ) : (
                    <UploadCloud size={32} />
                  )}
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    {uploadMode === 'image'
                      ? 'Select notice photo, screenshot, or drag & drop here'
                      : uploadMode === 'pdf'
                      ? 'Select PDF circular document or drag & drop here'
                      : 'Choose an image notice, PDF circular, or drag & drop here'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP, Camera Photos, WhatsApp Screenshots & PDF Documents (up to 25MB)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1.5 border border-indigo-200">
                    <ImageIcon size={14} />
                    Browse Photo / Image Notice
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1.5 border border-slate-200">
                    <FileText size={14} />
                    Browse PDF Document
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status Alert with OCR details */}
          {status && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 text-sm ${
                isLoading
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {isLoading ? (
                <RefreshCw size={18} className="animate-spin text-blue-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">
                <p className="font-semibold flex items-center gap-2">
                  <span>{isLoading ? 'AI OCR & Analysis In Progress' : 'Notice Analysis Alert'}</span>
                  {file?.type.startsWith('image/') && (
                    <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-black uppercase">
                      OCR Active
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5 opacity-90">{status}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || isLoading}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 ${
              !file || isLoading
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-indigo-200'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>
                  {file?.type.startsWith('image/')
                    ? 'Scanning Image with OCR & Generating Summary...'
                    : 'Processing Document & Generating Summary...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>
                  {file?.type.startsWith('image/')
                    ? 'Scan Image & Generate Summary with AI'
                    : 'Summarize Notice with AI'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active AI Summary View */}
      {activeUpload && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <span>Current Document Summary</span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {activeUpload.fileType?.includes('pdf') ? 'PDF Source' : 'Image OCR Source'}
              </span>
            </h3>
            <div className="flex items-center gap-3">
              <Link
                to="/student/history?tab=personal"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition"
              >
                <History size={13} /> Saved in History • View All
              </Link>
              <button
                onClick={() => setActiveUpload(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <NoticeSummaryCard
            summaryData={translatedData || activeUpload.aiSummary}
            meta={{
              originalFileUrl: activeUpload.originalFileUrl,
              fileType: activeUpload.fileType,
              createdAt: activeUpload.createdAt,
              category: 'Personal Document'
            }}
            language={language}
            onTranslate={handleTranslatePersonal}
            isTranslating={isTranslatingLanguage}
            onClose={() => {
              setActiveUpload(null);
              setTranslatedData(null);
              setLanguage('English');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PersonalUpload;
