import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { UserMinus, Check, X } from 'lucide-react';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  useEffect(() => { fetchConnections(); }, []);
  const fetchConnections = async () => { const res = await api.get('/connections/student'); setConnections(res.data); };

  const updateStatus = async (id, status) => {
    await api.put(`/connections/student/${id}`, { status });
    fetchConnections();
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">My Connections</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map(conn => (
          <div key={conn._id} className="border p-4 rounded-lg relative flex flex-col justify-between h-full">
            <div>
              <p className="font-semibold text-lg">{conn.adminId.name}</p>
              <p className="text-gray-500 text-sm mb-2">{conn.adminId.email}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${conn.status === 'accepted' ? 'bg-green-100 text-green-800' : conn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {conn.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-4 flex space-x-2">
              {conn.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(conn._id, 'accepted')} className="flex-1 flex justify-center items-center space-x-1 bg-green-500 text-white hover:bg-green-600 py-1.5 rounded transition text-sm font-medium"><Check size={16} /> <span>Accept</span></button>
                  <button onClick={() => updateStatus(conn._id, 'rejected')} className="flex-1 flex justify-center items-center space-x-1 bg-gray-200 text-gray-800 hover:bg-gray-300 py-1.5 rounded transition text-sm font-medium"><X size={16} /> <span>Reject</span></button>
                </>
              )}
              {conn.status === 'accepted' && (
                <button onClick={() => updateStatus(conn._id, 'rejected')} className="w-full flex justify-center items-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 py-1.5 rounded transition text-sm font-medium"><UserMinus size={16} /> <span>Remove</span></button>
              )}
            </div>
          </div>
        ))}
      </div>
      {connections.length === 0 && <p className="text-gray-500 text-center py-8">No connections yet.</p>}
    </div>
  );
};
export default Connections;
