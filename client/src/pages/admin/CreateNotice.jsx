import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileText, Image as ImageIcon, X, Sparkles, AlertTriangle, Building2, Clock } from 'lucide-react';

const CreateNotice = () => {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('LOW');
  const [department, setDepartment] = useState('');
  const [venue, setVenue] = useState('');
  const [connections, setConnections] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/connections/admin')
      .then(res => setConnections((res.data || []).filter(c => c.status === 'accepted')))
      .catch(err => console.warn('Could not load connections:', err));
  }, []);

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (selected.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(selected.name)) {
        setImagePreview(URL.createObjectURL(selected));
      } else {
        setImagePreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a notice document or image file');

    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('category', category);
    formData.append('priority', priority);
    if (department) formData.append('department', department);
    if (venue) formData.append('venue', venue);
    if (selectedStudents.length > 0) formData.append('targetStudentsStr', JSON.stringify(selectedStudents));

    try {
      setIsLoading(true);
      const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name);
      setStatus(isImg ? 'Scanning image notice with Tesseract OCR & extracting information with Gemini AI...' : 'Parsing PDF document & analyzing notice with Gemini AI...');

      await api.post('/notices', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStatus('Notice successfully published, analyzed, and broadcasted to students!');
      setTimeout(() => navigate('/admin/history'), 1200);
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to process notice.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/90 pb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Publish Official Notice</h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload PDF circulars or image photos. Gemini AI will automatically extract title, department, priority, dates, deadlines, and action items.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Section */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Notice File (PDF, JPG, PNG, WEBP, Scanned Notice) *
          </label>
          
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,image/*"
            onChange={handleFileChange}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
            required={!file}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Accepts PDF documents and photos/screenshots. High-resolution OCR and Gemini AI will automatically process the content.
          </p>

          {/* Image Thumbnail Preview */}
          {imagePreview && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={imagePreview} alt="Selected notice" className="w-16 h-16 object-cover rounded-lg border shadow-xs" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{file.name}</p>
                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    IMAGE OCR READY
                  </span>
                </div>
              </div>
              <button type="button" onClick={clearFile} className="text-rose-600 hover:text-rose-800 p-1">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Notice Title (Optional - AI extracts if blank)
          </label>
          <input
            type="text"
            placeholder="Leave blank to auto-detect with Gemini AI"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white"
            >
              {['General', 'Exam', 'Assignment', 'Placement', 'Scholarship', 'Fee', 'Event', 'Holiday', 'Academic'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="LOW">LOW (Standard announcement)</option>
              <option value="MEDIUM">MEDIUM (Requires attention)</option>
              <option value="HIGH">HIGH (Urgent alert / Deadline)</option>
            </select>
          </div>
        </div>

        {/* Department & Venue Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Issuing Department (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Examination Section, CS Dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Venue / Location (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Auditorium Hall A, Lab 3"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Target Students */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Students (Leave empty to broadcast to ALL students)
            </label>
            {selectedStudents.length > 0 && (
              <span className="text-[11px] font-semibold text-indigo-600">
                {selectedStudents.length} selected
              </span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto border border-slate-200 p-3 rounded-xl space-y-2 bg-slate-50">
            {connections.length === 0 ? (
              <p className="text-xs text-slate-500">
                No individual student connections selected. Notice will broadcast to all registered students.
              </p>
            ) : (
              connections.map(c => (
                <label key={c.studentId._id} className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(c.studentId._id)}
                    onChange={() => handleStudentToggle(c.studentId._id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{c.studentId.name} ({c.studentId.email})</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Status / Loading Alert */}
        {status && (
          <div className={`p-3.5 rounded-xl font-medium text-xs border flex items-center gap-2 ${
            isLoading ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <Sparkles size={16} className={isLoading ? 'animate-spin text-indigo-600' : 'text-emerald-600'} />
            <span>{status}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isLoading}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Sparkles size={18} className="animate-spin" />
              <span>Analyzing & Broadcasting Notice...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Publish & Analyze Notice</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateNotice;
