import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({ connections: 0, notices: 0 });
  const [recentNotices, setRecentNotices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connRes, noticeRes] = await Promise.all([api.get('/connections/admin'), api.get('/notices')]);
        const acceptedConn = connRes.data.filter(c => c.status === 'accepted');
        setStats({ connections: acceptedConn.length, notices: noticeRes.data.length });
        setRecentNotices(noticeRes.data.slice(0, 5));
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users size={24} /></div>
          <div><p className="text-gray-500 text-sm">Connected Students</p><p className="text-2xl font-bold">{stats.connections}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full"><FileText size={24} /></div>
          <div><p className="text-gray-500 text-sm">Published Notices</p><p className="text-2xl font-bold">{stats.notices}</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recent Notices</h3>
          <Link to="/admin/history" className="text-blue-600 text-sm hover:underline">View All</Link>
        </div>
        <div className="p-0">
          {recentNotices.length === 0 ? <p className="p-6 text-gray-500 text-center">No notices published yet.</p> : (
            <ul className="divide-y">
              {recentNotices.map(notice => (
                <li key={notice._id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <Link to={`/admin/notice/${notice._id}`} className="font-medium text-gray-800 hover:text-blue-600">{notice.title}</Link>
                    <p className="text-sm text-gray-500">{new Date(notice.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{notice.category}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
