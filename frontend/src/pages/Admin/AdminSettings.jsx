import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Save, RefreshCw } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/settings');
      setSettings(data.settings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put('/admin/settings', settings);
      alert('Settings updated successfully!');
    } catch (err) { alert('Failed to update settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-white/50 text-center">Loading settings...</div>;

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-8">
        
        {/* SURGE & COMMISSION */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Platform Config</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Surge Multiplier</label>
              <input type="number" step="0.1" required value={settings.surgeMultiplier} onChange={e => setSettings({...settings, surgeMultiplier: parseFloat(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" />
              <p className="text-[10px] text-white/40">Default is 1.0 (no surge). 1.5 = 50% extra.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Admin Commission (%)</label>
              <input type="number" step="1" required value={settings.adminCommissionPercent} onChange={e => setSettings({...settings, adminCommissionPercent: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400" />
              <p className="text-[10px] text-white/40">Platform cut from every ride.</p>
            </div>
          </div>
        </div>

        {/* BIKE FARES */}
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold text-[#38bdf8] mb-4">Bike Fares</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Base Fare (₹)</label>
              <input type="number" required value={settings.baseFareBike} onChange={e => setSettings({...settings, baseFareBike: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#38bdf8]" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Per Km Rate (₹)</label>
              <input type="number" required value={settings.perKmBike} onChange={e => setSettings({...settings, perKmBike: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#38bdf8]" />
            </div>
          </div>
        </div>

        {/* AUTO FARES */}
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold text-[#f5a623] mb-4">Auto Fares</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Base Fare (₹)</label>
              <input type="number" required value={settings.baseFareAuto} onChange={e => setSettings({...settings, baseFareAuto: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5a623]" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Per Km Rate (₹)</label>
              <input type="number" required value={settings.perKmAuto} onChange={e => setSettings({...settings, perKmAuto: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5a623]" />
            </div>
          </div>
        </div>

        {/* CAR FARES */}
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold text-[#a78bfa] mb-4">Car Fares</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Base Fare (₹)</label>
              <input type="number" required value={settings.baseFareCar} onChange={e => setSettings({...settings, baseFareCar: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#a78bfa]" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase">Per Km Rate (₹)</label>
              <input type="number" required value={settings.perKmCar} onChange={e => setSettings({...settings, perKmCar: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#a78bfa]" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black px-6 py-3 rounded-xl font-bold transition disabled:opacity-50">
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save Settings
          </button>
        </div>

      </form>
    </div>
  );
}
