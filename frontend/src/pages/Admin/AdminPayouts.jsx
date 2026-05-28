import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Wallet, CheckCircle } from 'lucide-react';

export default function AdminPayouts() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/payouts');
      setDrivers(data.drivers || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayouts(); }, []);

  const handleSettle = async (id, name) => {
    if (!window.confirm(`Are you sure you want to settle the balance for ${name}? This will reset their wallet to 0.`)) return;
    try {
      await axiosInstance.post(`/admin/payouts/settle/${id}`);
      fetchPayouts();
      alert(`Settled balance for ${name}!`);
    } catch (err) { alert('Failed to settle'); }
  };

  const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
          <Wallet size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Driver Payouts & Dues</h2>
          <p className="text-xs text-white/50">Manage wallet balances. Positive = You owe them. Negative = They owe you.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/50">
              <th className="p-4 font-semibold">Driver</th>
              <th className="p-4 font-semibold">Wallet Balance</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-white/40">Loading ledger...</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-white/40">All driver accounts are perfectly balanced!</td></tr>
            ) : drivers.map(d => {
              const owesPlatform = d.walletBalance < 0;
              return (
                <tr key={d._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white">{d.name}</p>
                    <p className="text-xs text-white/50">{d.phone}</p>
                  </td>
                  <td className="p-4">
                    <p className={`font-bold text-lg ${owesPlatform ? 'text-rose-400' : 'text-teal-400'}`}>
                      {owesPlatform ? '-' : '+'}₹{fmt(d.walletBalance)}
                    </p>
                  </td>
                  <td className="p-4">
                    {owesPlatform ? (
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 uppercase">Driver owes Platform</span>
                    ) : (
                      <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/20 uppercase">Platform owes Driver</span>
                    )}
                  </td>
                  <td className="p-4 flex justify-end">
                    <button onClick={() => handleSettle(d._id, d.name)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl transition">
                      <CheckCircle size={16} /> Settle Account
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
