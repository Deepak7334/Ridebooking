import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Tag, Plus, Trash2, CheckCircle, XCircle, X } from 'lucide-react';

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '', discountPercent: 10, maxDiscountAmount: 50, minRideAmount: 100, isActive: true
  });

  const fetchPromos = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/promos');
      setPromos(data.promos || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/admin/promos', formData);
      alert('Promo code created!');
      setShowModal(false);
      fetchPromos();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create promo'); }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await axiosInstance.put(`/admin/promos/${id}`, { isActive: !currentStatus });
      fetchPromos();
    } catch (err) { alert('Action failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await axiosInstance.delete(`/admin/promos/${id}`);
      fetchPromos();
    } catch (err) { alert('Delete failed'); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Tag size={20} className="text-fuchsia-400"/> Promo Codes</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-white px-5 py-2.5 rounded-xl font-bold transition">
          <Plus size={18} /> New Promo
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/50">
              <th className="p-4 font-semibold">Code</th>
              <th className="p-4 font-semibold">Discount</th>
              <th className="p-4 font-semibold">Limits</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-white/40">Loading promos...</td></tr>
            ) : promos.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-white/40">No promo codes found.</td></tr>
            ) : promos.map(p => (
              <tr key={p._id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white tracking-widest">{p.code}</td>
                <td className="p-4 text-fuchsia-400 font-bold">{p.discountPercent}% OFF</td>
                <td className="p-4 text-white/70">
                  <p>Max: ₹{p.maxDiscountAmount}</p>
                  <p className="text-xs text-white/40">Min ride: ₹{p.minRideAmount}</p>
                </td>
                <td className="p-4">
                  {p.isActive ? (
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20">ACTIVE</span>
                  ) : (
                    <span className="px-2 py-1 bg-white/10 text-white/40 text-xs font-bold rounded-lg border border-white/10">DISABLED</span>
                  )}
                </td>
                <td className="p-4 flex items-center justify-end gap-2">
                  <button onClick={() => handleToggle(p._id, p.isActive)} className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition" title="Toggle Status">
                    {p.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button onClick={() => handleDelete(p._id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0c14] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-lg font-bold text-white">Create Promo Code</h2>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/50 text-xs font-bold uppercase">Code Name</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-400 uppercase font-bold tracking-widest" placeholder="WELCOME50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase">Discount %</label>
                  <input type="number" required min="1" max="100" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-bold uppercase">Max Discount (₹)</label>
                  <input type="number" required min="1" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/50 text-xs font-bold uppercase">Min Ride Amount (₹)</label>
                <input type="number" required min="0" value={formData.minRideAmount} onChange={e => setFormData({...formData, minRideAmount: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-400" />
              </div>
              <button type="submit" className="mt-4 w-full py-3.5 bg-fuchsia-500 hover:bg-fuchsia-400 rounded-xl text-white font-bold transition">Create Promo Code</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
