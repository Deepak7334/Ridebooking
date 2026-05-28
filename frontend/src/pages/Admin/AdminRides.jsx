import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Search, MapPin, Navigation, XCircle, CheckCircle } from 'lucide-react';

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRides = async () => {
    try {
      const { data } = await axiosInstance.get(`/admin/rides${statusFilter ? `?status=${statusFilter}` : ''}`);
      setRides(data.rides || []);
    } catch (error) {
      console.error('Error fetching rides', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await axiosInstance.patch(`/admin/rides/${id}/cancel`);
      fetchRides();
    } catch (err) { alert(err.response?.data?.message || 'Failed to cancel'); }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Force complete this ride?')) return;
    try {
      await axiosInstance.patch(`/admin/rides/${id}/complete`);
      fetchRides();
    } catch (err) { alert(err.response?.data?.message || 'Failed to complete'); }
  };

  const filtered = rides.filter(r => 
    r.passengerId?.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.driverId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.pickupLocation?.address?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'started': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'accepted': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-orange-500/10 text-orange-400 border-orange-500/20'; // requested
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl flex-1 min-w-[250px]">
          <Search size={20} className="text-white/40 ml-2" />
          <input 
            type="text"
            placeholder="Search by passenger, driver, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-white placeholder-white/40 flex-1 text-sm"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111827] border border-white/10 text-white text-sm rounded-xl p-3 outline-none focus:border-[#F5A623]"
        >
          <option value="">All Statuses</option>
          <option value="requested">Requested</option>
          <option value="accepted">Accepted</option>
          <option value="started">Started</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/50">
                <th className="p-4 font-semibold">Ride Info</th>
                <th className="p-4 font-semibold">Route</th>
                <th className="p-4 font-semibold">Fare</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/40">Loading rides...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/40">No rides found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white mb-1"><span className="text-white/50 font-normal">P:</span> {r.passengerId?.name || 'Unknown'}</p>
                    <p className="font-bold text-white"><span className="text-white/50 font-normal">D:</span> {r.driverId?.name || 'Unassigned'}</p>
                    <p className="text-xs text-white/40 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-green-400 mt-0.5 shrink-0" />
                        <span className="text-white/80 line-clamp-1" title={r.pickupLocation?.address}>{r.pickupLocation?.address || 'Lat/Lng point'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation size={14} className="text-red-400 mt-0.5 shrink-0" />
                        <span className="text-white/80 line-clamp-1" title={r.dropoffLocation?.address}>{r.dropoffLocation?.address || 'Lat/Lng point'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-[#34d399]">₹{r.fare}</p>
                    <p className="text-xs text-white/50 capitalize">{r.paymentMethod}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${getStatusColor(r.status)} uppercase`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-2 h-full">
                    {!['completed', 'cancelled'].includes(r.status) && (
                      <>
                        <button onClick={() => handleComplete(r._id)} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition" title="Force Complete">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleCancel(r._id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition" title="Cancel Ride">
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
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
