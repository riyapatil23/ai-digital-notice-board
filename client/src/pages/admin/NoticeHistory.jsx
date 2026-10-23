import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const NoticeHistory = () => {
  const [notices, setNotices] = useState([]);
  useEffect(() => { api.get('/notices').then(res => setNotices(res.data)); }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Notice History</h2>
      {notices.length === 0 ? <p className="text-gray-500 text-center py-8">No notices published yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-sm">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Published Date</th>
                <th className="p-4">Students Reached</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {notices.map(notice => (
                <tr key={notice._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{notice.title}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{notice.category}</span></td>
                  <td className="p-4 text-sm text-gray-600">{new Date(notice.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm">{notice.studentsReachedCount}</td>
                  <td className="p-4"><Link to={`/admin/notice/${notice._id}`} className="text-blue-600 hover:underline text-sm font-medium">View Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default NoticeHistory;
