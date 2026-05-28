import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      await axiosInstance.patch(`/admin/users/${id}/toggle`);
      fetchUsers();
    } catch (err) {
      alert('Action failed');
    }
  };

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.phone?.includes(search)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl max-w-md">
        <Search size={20} className="text-white/40 ml-2" />
        <input 
          type="text"
          placeholder="Search customers by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-white placeholder-white/40 flex-1 text-sm"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/50">
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Joined</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/40">Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/40">No customers found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{u.name}</td>
                  <td className="p-4 text-white/70">{u.phone}</td>
                  <td className="p-4 text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    {u.isActive !== false ? (
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20">ACTIVE</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20">SUSPENDED</span>
                    )}
                  </td>
                  <td className="p-4 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleToggleStatus(u._id)} 
                      className={`flex items-center gap-2 px-3 py-1.5 font-bold text-xs rounded-lg transition ${u.isActive !== false ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                    >
                      {u.isActive !== false ? <><ShieldAlert size={14}/> Suspend</> : <><ShieldCheck size={14}/> Reactivate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
