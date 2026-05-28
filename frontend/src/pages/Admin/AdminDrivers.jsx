import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { CheckCircle, XCircle, Search, Trash2, Plus, Edit, X } from 'lucide-react';

export default function AdminDrivers({ onRefreshStats }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', alternatePhone: '',
    aadharNumber: '', panCard: '', address: '', password: '',
    vehicleType: 'bike', vehicleNumber: ''
  });

  const fetchDrivers = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/drivers');
      setDrivers(data.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await axiosInstance.patch(`/admin/drivers/${userId}/approve`);
      fetchDrivers();
      onRefreshStats?.();
    } catch (err) { alert('Action failed'); }
  };

  const handleReject = async (userId) => {
    try {
      await axiosInstance.patch(`/admin/drivers/${userId}/reject`);
      fetchDrivers();
      onRefreshStats?.();
    } catch (err) { alert('Action failed'); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this driver permanently?')) return;
    try {
      await axiosInstance.delete(`/admin/drivers/${userId}`);
      fetchDrivers();
      onRefreshStats?.();
    } catch (err) { alert('Delete failed'); }
  };

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData({
      firstName: '', lastName: '', phone: '', alternatePhone: '',
      aadharNumber: '', panCard: '', address: '', password: '',
      vehicleType: 'bike', vehicleNumber: ''
    });
    setShowModal(true);
  };

  const openEditModal = (d) => {
    setEditingDriver(d);
    setFormData({
      firstName: d.userId?.firstName || d.userId?.name?.split(' ')[0] || '',
      lastName: d.userId?.lastName || d.userId?.name?.split(' ').slice(1).join(' ') || '',
      phone: d.userId?.phone || '',
      alternatePhone: d.userId?.alternatePhone || '',
      aadharNumber: d.userId?.aadharNumber || '',
      panCard: d.userId?.panCard || '',
      address: d.userId?.address || '',
      password: '', // Leave blank for edit unless changing
      vehicleType: d.vehicleType || 'bike',
      vehicleNumber: d.vehicleNumber || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await axiosInstance.put(`/admin/drivers/${editingDriver.userId._id}`, formData);
        alert('Driver updated successfully!');
      } else {
        await axiosInstance.post('/admin/drivers', formData);
        alert('Driver added successfully!');
      }
      setShowModal(false);
      fetchDrivers();
      onRefreshStats?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const filtered = drivers.filter(d => 
    d.userId?.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.userId?.phone?.includes(search)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl w-full max-w-md">
          <Search size={20} className="text-white/40 ml-2" />
          <input 
            type="text"
            placeholder="Search drivers by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-white placeholder-white/40 flex-1 text-sm"
          />
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-3 bg-amber-400 text-black font-bold rounded-2xl hover:bg-amber-300 transition shadow-[0_0_20px_rgba(245,166,35,.3)]">
          <Plus size={18} /> Add Driver
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/50">
                <th className="p-4 font-semibold">Driver Details</th>
                <th className="p-4 font-semibold">Vehicle</th>
                <th className="p-4 font-semibold">Origin</th>
                <th className="p-4 font-semibold">Verification</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/40">Loading drivers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-white/40">No drivers found.</td></tr>
              ) : filtered.map(d => (
                <tr key={d._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white">{d.userId?.name || 'Unknown'}</p>
                    <p className="text-xs text-white/50">{d.userId?.phone}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white/90 capitalize">{d.vehicleType}</p>
                    <p className="text-xs text-white/50 uppercase">{d.vehicleNumber}</p>
                  </td>
                  <td className="p-4">
                    {d.userId?.createdBy === 'admin' ? (
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20">ADMIN ADDED</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20">SELF REGISTERED</span>
                    )}
                  </td>
                  <td className="p-4">
                    {d.docsVerified ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><CheckCircle size={14}/> Verified</span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-400 text-xs font-bold"><XCircle size={14}/> Pending</span>
                    )}
                  </td>
                  <td className="p-4 flex items-center justify-end gap-2">
                    {!d.docsVerified && (
                      <button onClick={() => handleApprove(d.userId?._id)} className="px-3 py-1.5 bg-green-500 text-black font-bold text-xs rounded-lg hover:bg-green-400 transition" title="Approve"><CheckCircle size={16}/></button>
                    )}
                    {d.docsVerified && (
                      <button onClick={() => handleReject(d.userId?._id)} className="px-3 py-1.5 bg-orange-500 text-black font-bold text-xs rounded-lg hover:bg-orange-400 transition" title="Suspend"><XCircle size={16}/></button>
                    )}
                    <button onClick={() => openEditModal(d)} className="p-1.5 bg-white/10 text-white hover:bg-white/20 rounded-lg transition"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(d.userId?._id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0c14] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
              <h2 className="text-xl font-bold text-white">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">First Name</label>
                  <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="John" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Last Name</label>
                  <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="Doe" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Mobile Number *</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="+91 9876543210" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Alternate Number (Optional)</label>
                  <input value={formData.alternatePhone} onChange={e => setFormData({...formData, alternatePhone: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="+91 0000000000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Aadhar Number</label>
                  <input required value={formData.aadharNumber} onChange={e => setFormData({...formData, aadharNumber: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="0000 0000 0000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">PAN Card</label>
                  <input required value={formData.panCard} onChange={e => setFormData({...formData, panCard: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="ABCDE1234F" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Full Address</label>
                <textarea required rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="123 Street Name, City, State, PIN" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Vehicle Type</label>
                  <select value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50">
                    <option value="bike" className="bg-[#0a0c14]">Bike</option>
                    <option value="auto" className="bg-[#0a0c14]">Auto</option>
                    <option value="car" className="bg-[#0a0c14]">Car</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Vehicle Number</label>
                  <input required value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" placeholder="KA 01 AB 1234" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider">Login Password</label>
                <input type="text" required={!editingDriver} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="bg-white/5 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 outline-none focus:border-amber-400" placeholder={editingDriver ? "Leave blank to keep unchanged" : "Create a password for driver login"} />
                {!editingDriver && <p className="text-amber-400/50 text-xs">The driver will use their Mobile Number and this Password to log in.</p>}
              </div>

              <div className="pt-4 mt-2 border-t border-white/10 flex gap-3 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 rounded-xl text-black font-bold transition">{editingDriver ? 'Save Changes' : 'Create Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
