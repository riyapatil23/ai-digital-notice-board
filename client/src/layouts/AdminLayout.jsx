import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Users,
  Link as LinkIcon,
  LogOut,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Create Notice', path: '/admin/create-notice', icon: FilePlus },
    { name: 'Notice History', path: '/admin/history', icon: History },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Connections', path: '/admin/connections', icon: LinkIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/90 shadow-sm flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
                ApexCampus <span className="text-blue-600">Admin</span>
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">Faculty & Officer Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={17} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 mb-2 flex items-center gap-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with NotificationBell */}
        <header className="bg-white border-b border-slate-200/90 h-16 px-6 flex items-center justify-between gap-4 flex-shrink-0 z-10 shadow-2xs">
          <h2 className="text-base font-bold text-slate-800">
            {navItems.find(i => location.pathname === i.path || (i.path !== '/admin/dashboard' && location.pathname.startsWith(i.path)))?.name || 'Administrator Console'}
          </h2>

          <div className="flex items-center gap-3">
            {/* Real-time NotificationBell for Admin */}
            <NotificationBell />

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">{user?.name}</span>
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
