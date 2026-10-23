import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { UserMinus } from 'lucide-react';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  useEffect(() => { fetchConnections(); }, []);
  const fetchConnections = async () => { const res = await api.get('/connections/admin'); setConnections(res.data); };

  const removeConnection = async (id) => {
    if(window.confirm('Are you sure?')) {
      await api.delete(`/connections/admin/${id}`);
      fetchConnections();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Connections</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map(conn => (
          <div key={conn._id} className="border p-4 rounded-lg relative flex flex-col justify-between h-full">
            <div>
              <p className="font-semibold text-lg">{conn.studentId.name}</p>
              <p className="text-gray-500 text-sm mb-2">{conn.studentId.email}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${conn.status === 'accepted' ? 'bg-green-100 text-green-800' : conn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {conn.status.toUpperCase()}
              </span>
            </div>
            <button onClick={() => removeConnection(conn._id)} className="mt-4 flex justify-center items-center space-x-1 text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded transition text-sm font-medium w-full">
              <UserMinus size={16} /> <span>Remove</span>
            </button>
          </div>
        ))}
      </div>
      {connections.length === 0 && <p className="text-gray-500 text-center py-8">No connections yet.</p>}
    </div>
  );
};
export default Connections;
