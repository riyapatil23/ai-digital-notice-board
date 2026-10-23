import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import {
  LayoutDashboard,
  Bell,
  AlertTriangle,
  Clock,
  Link as LinkIcon,
  Sparkles,
  User,
  History,
  UploadCloud,
  LogOut,
  Search,
  Languages
} from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/student/notices?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'All Notices', path: '/student/notices', icon: Bell },
    { name: 'Important', path: '/student/important', icon: AlertTriangle },
    { name: 'Deadlines', path: '/student/deadlines', icon: Clock },
    { name: 'Connections', path: '/student/connections', icon: LinkIcon },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
    { name: 'AI Summarizer', path: '/student/ai-summarizer', icon: Sparkles },
    { name: 'Upload & OCR', path: '/student/upload', icon: UploadCloud },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/90 shadow-sm flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
                ApexCampus <span className="text-indigo-600">AI</span>
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">Student Notice Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/student/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 mb-2 flex items-center gap-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 w-full transition"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar: Search, Language, Notification Bell, Profile */}
        <header className="bg-white border-b border-slate-200/90 h-16 px-6 flex items-center justify-between gap-4 flex-shrink-0 z-10 shadow-2xs">
          
          {/* Left: Global Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-72 max-w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search circulars, exams, events..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
            />
          </form>

          {/* Right Actions: Language Indicator, Notification Bell, User Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">
              <Languages size={14} className="text-slate-400" />
              <span>Multi-lingual AI Ready</span>
            </div>

            {/* Reusable Real-time Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar Button */}
            <Link
              to="/student/profile"
              className="flex items-center gap-2 p-1 pl-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <span className="text-xs font-bold text-slate-800 hidden md:inline">{user?.name}</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
