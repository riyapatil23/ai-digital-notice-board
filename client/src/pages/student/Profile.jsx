import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { User, Mail, Shield, Building, Award, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your student account and institutional credentials.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold text-2xl flex items-center justify-center">
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs font-semibold text-indigo-600 capitalize bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
              Role: {user?.role}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Mail size={14} /> Email Address
            </span>
            <p className="text-sm font-bold text-slate-800">{user?.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Shield size={14} /> Student Access
            </span>
            <p className="text-sm font-bold text-slate-800">Verified Institutional User</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Building size={14} /> Campus Platform
            </span>
            <p className="text-sm font-bold text-slate-800">ApexCampus AI Digital Notice Board</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Calendar size={14} /> AI Processing Engine
            </span>
            <p className="text-sm font-bold text-slate-800">Google Gemini 3.5 Flash</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
