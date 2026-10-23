import React, { useState } from 'react';
import api from '../../services/api';
import { Search, UserPlus } from 'lucide-react';

const Students = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`/connections/search-students?search=${search}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendRequest = async (studentId) => {
    try {
      await api.post('/connections/admin', { studentId });
      setMessage('Connection request sent!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error sending request');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Find Students</h2>
      <form onSubmit={handleSearch} className="flex space-x-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 font-medium">Search</button>
      </form>
      {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-center">{message}</div>}
      <div className="space-y-4">
        {results.map(student => (
          <div key={student._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-500">{student.email}</p>
            </div>
            <button onClick={() => sendRequest(student._id)} className="flex items-center space-x-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200 transition">
              <UserPlus size={16} /><span>Connect</span>
            </button>
          </div>
        ))}
        {results.length === 0 && search && <p className="text-center text-gray-500">No students found.</p>}
      </div>
    </div>
  );
};
export default Students;
