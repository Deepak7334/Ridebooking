import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Star, LogOut, ChevronRight,
  Clock, Shield, Phone, Mail, User, Wallet,
  CheckCircle2, XCircle, Save, X, Car,
} from 'lucide-react';
import axiosInstance from '../../api/axios';

/* ─── tiny helpers ─────────────────────────────────────── */
const initials = (name) =>
  name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

const fmt = (n) =>
  n !== undefined && n !== null ? Number(n).toLocaleString('en-IN') : '—';

/* ─── role config ─────────────────────────────────────── */
const ROLE = {
  customer: {
    label: 'Customer',
    bg: 'rgba(99,102,241,0.18)',
    border: 'rgba(99,102,241,0.35)',
    color: '#a5b4fc',
    avatarA: '#6366f1',
    avatarB: '#818cf8',
  },
  passenger: {
    label: 'Customer',
    bg: 'rgba(99,102,241,0.18)',
    border: 'rgba(99,102,241,0.35)',
    color: '#a5b4fc',
    avatarA: '#6366f1',
    avatarB: '#818cf8',
  },
  driver: {
    label: 'Driver',
    bg: 'rgba(245,166,35,0.18)',
    border: 'rgba(245,166,35,0.35)',
    color: '#fcd34d',
    avatarA: '#F5A623',
    avatarB: '#FF6B35',
  },
  admin: {
    label: 'Admin',
    bg: 'rgba(244,63,94,0.18)',
    border: 'rgba(244,63,94,0.35)',
    color: '#fb7185',
    avatarA: '#f43f5e',
    avatarB: '#e11d48',
  },
};

/* ─── component ───────────────────────────────────────── */
const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  });
  const [stats, setStats] = useState({
    totalRides: null, completedRides: null, walletBalance: null, avgRating: null,
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name || '', email: user.email || '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [statsLoading, setStatsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const rc = ROLE[user.role] || ROLE.customer;

  /* ── mount animation trigger ── */
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  /* ── fetch fresh profile ── */
  useEffect(() => {
    axiosInstance.get('/auth/me')
      .then(({ data }) => {
        const u = data.user || data;
        setUser(u);
        setForm({ name: u.name || '', email: u.email || '' });
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => {/* use cached user */ });
  }, []);

  /* ── fetch ride stats ── */
  useEffect(() => {
    setStatsLoading(true);
    axiosInstance.get('/rides/user/history')
      .then(({ data }) => {
        const rides = Array.isArray(data.rides) ? data.rides : (Array.isArray(data) ? data : []);
        const completed = rides.filter((r) => r.status === 'completed');
        const ratings = completed.map((r) => r.rating).filter(Boolean);
        const avg = ratings.length
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : null;
        setStats({
          totalRides: rides.length,
          completedRides: completed.length,
          walletBalance: user.walletBalance ?? data.walletBalance ?? 0,
          avgRating: avg,
        });
      })
      .catch(() => {
        setStats({
          totalRides: 0, completedRides: 0,
          walletBalance: user.walletBalance ?? 0,
          avgRating: null,
        });
      })
      .finally(() => setStatsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── save profile ── */
  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      const { data } = await axiosInstance.put('/auth/profile', form);
      const updated = data.user || data;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed. Try again.', 'error');
    } finally { setSaving(false); }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: 'success' }), 3000);
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const inputCls = [
    'w-full rounded-xl px-4 py-3 text-sm text-white',
    'placeholder-white/30 outline-none transition-all duration-200',
    'border focus:border-indigo-400/70',
  ].join(' ');

  /* ── stat tiles ── */
  const statTiles = [
    { icon: Car, label: 'Total Rides', value: statsLoading ? '…' : fmt(stats.totalRides), color: '#6366f1' },
    { icon: CheckCircle2, label: 'Completed', value: statsLoading ? '…' : fmt(stats.completedRides), color: '#4ade80' },
    { icon: Wallet, label: 'Wallet', value: statsLoading ? '…' : `₹${fmt(stats.walletBalance)}`, color: '#F5A623' },
    { icon: Star, label: 'Avg Rating', value: statsLoading ? '…' : (stats.avgRating ?? '—'), color: '#fbbf24' },
  ];

  /* ── quick actions ── */
  const actions = [
    { icon: Clock, label: 'Ride History', sub: 'View all your past trips', path: '/rides/history' },
    ...(user.role === 'driver'
      ? [{ icon: Shield, label: 'Upload Documents', sub: 'Submit licence & vehicle RC', path: '/driver/documents' }]
      : []),
  ];

  return (
    <>
      {/* ── injected keyframes ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spinR {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.0); }
          50%       { box-shadow: 0 0 24px 4px rgba(245,166,35,0.22); }
        }
        .anim-fu-0  { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
        .anim-fu-1  { animation: fadeUp .55s .08s cubic-bezier(.22,1,.36,1) both; }
        .anim-fu-2  { animation: fadeUp .55s .16s cubic-bezier(.22,1,.36,1) both; }
        .anim-fu-3  { animation: fadeUp .55s .24s cubic-bezier(.22,1,.36,1) both; }
        .anim-fu-4  { animation: fadeUp .55s .32s cubic-bezier(.22,1,.36,1) both; }
        .anim-fi    { animation: fadeIn  .4s ease both; }
        .spin-icon  { animation: spinR 1s linear infinite; }
        .avatar-glow{ animation: pulseGlow 3s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .toast-enter { animation: fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div
        className="flex flex-col min-h-dvh overflow-hidden relative"
        style={{ background: '#070b14' }}
      >
        {/* ── ambient blobs ── */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
            width: '520px', height: '320px',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', top: '160px', right: '-60px',
            width: '280px', height: '280px',
            background: 'radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 70%)',
          }} />
        </div>

        {/* ── header ── */}
        <header
          className="relative flex items-center gap-3 px-4 sm:px-6 py-4 shrink-0 z-10"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(7,11,20,0.85)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center transition-all active:scale-90"
            style={{
              width: 42, height: 42,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#fff',
              flexShrink: 0,
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-1">
            <h1 className="text-white font-extrabold text-lg leading-tight tracking-tight">My Profile</h1>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>Manage your account</p>
          </div>

          {!editing && (
            <button
              onClick={() => { setEditing(true); setForm({ name: user.name || '', email: user.email || '' }); }}
              className="flex items-center gap-1.5 transition-all active:scale-90"
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.25)',
                color: '#F5A623',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Edit3 size={14} /> Edit
            </button>
          )}
        </header>

        {/* ── global toast ── */}
        {toast.text && (
          <div
            className="toast-enter fixed z-50 left-1/2"
            style={{
              top: 72,
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: toast.type === 'success' ? 'rgba(34,197,94,0.14)' : 'rgba(248,113,113,0.14)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
              color: toast.type === 'success' ? '#4ade80' : '#f87171',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {toast.type === 'success' ? '✓ ' : '✕ '}{toast.text}
          </div>
        )}

        {/* ── scrollable body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-lg mx-auto px-4 sm:px-5 py-6 pb-14 space-y-4">

            {/* ── avatar card ── */}
            <div
              className={`anim-fu-0 ${mounted ? '' : 'opacity-0'}`}
              style={{
                borderRadius: 24,
                padding: '28px 24px',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* avatar circle */}
              <div
                className="avatar-glow"
                style={{
                  width: 88, height: 88, borderRadius: 24, flexShrink: 0,
                  background: `linear-gradient(135deg, ${rc.avatarA}, ${rc.avatarB})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 900, color: '#fff',
                  boxShadow: `0 12px 40px ${rc.avatarA}44`,
                  letterSpacing: '-1px',
                }}
              >
                {initials(user.name)}
              </div>

              {/* info */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <h2 style={{
                  color: '#fff', fontSize: 22, fontWeight: 800,
                  letterSpacing: '-0.4px', marginBottom: 6,
                }}>
                  {user.name || 'User'}
                </h2>

                {/* role badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 14px', borderRadius: 99,
                  background: rc.bg, border: `1px solid ${rc.border}`,
                  color: rc.color, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.3px', marginBottom: 14,
                }}>
                  <Shield size={11} /> {rc.label}
                </span>

                {/* contact row */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  alignItems: 'center',
                }}>
                  {user.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                      <Phone size={13} style={{ color: 'rgba(255,255,255,0.28)' }} />
                      +91 {user.phone}
                    </div>
                  )}
                  {user.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                      <Mail size={13} style={{ color: 'rgba(255,255,255,0.28)' }} />
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── stats row ── */}
            <div
              className={`anim-fu-1 ${mounted ? '' : 'opacity-0'}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
              }}
            >
              {statTiles.map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 18, padding: '16px 14px',
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: `${color}1a`,
                    border: `1px solid ${color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p style={{
                      color: '#fff', fontSize: 18, fontWeight: 800,
                      letterSpacing: '-0.3px', lineHeight: 1,
                    }}>
                      {value}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 3, fontWeight: 500 }}>
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── edit / info card ── */}
            <div
              className={`anim-fu-2 ${mounted ? '' : 'opacity-0'}`}
              style={{
                borderRadius: 22, padding: 20,
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p style={{
                color: 'rgba(255,255,255,0.28)', fontSize: 10,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                marginBottom: 14,
              }}>
                {editing ? 'Edit Profile' : 'Account Details'}
              </p>

              {!editing ? (
                /* ── view mode ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Full Name', value: user.name || '—', icon: User },
                    { label: 'Phone', value: user.phone ? `+91 ${user.phone}` : '—', icon: Phone },
                    { label: 'Email', value: user.email || '—', icon: Mail },
                    ...(user.role === 'driver' ? [
                      { label: 'Vehicle Type', value: user.vehicleType ? user.vehicleType.charAt(0).toUpperCase() + user.vehicleType.slice(1) : '—', icon: Car },
                      {
                        label: 'Doc Verification',
                        value: user.docsVerified ? 'Verified' : 'Pending',
                        icon: user.docsVerified ? CheckCircle2 : XCircle,
                        valueColor: user.docsVerified ? '#4ade80' : '#fbbf24',
                      },
                    ] : []),
                  ].map(({ label, value, icon: Icon, valueColor }, i, arr) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Icon size={14} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13 }}>{label}</span>
                      </div>
                      <span style={{
                        color: valueColor || '#fff', fontSize: 13, fontWeight: 600,
                        textAlign: 'right', wordBreak: 'break-all',
                      }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── edit mode ── */
                <div className="anim-fi" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.3px' }}>
                      FULL NAME
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls}
                      placeholder="Your full name"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(99,102,241,0.6)';
                        e.target.style.background = 'rgba(255,255,255,0.07)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255,255,255,0.1)';
                        e.target.style.background = 'rgba(255,255,255,0.05)';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.3px' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      type="email"
                      className={inputCls}
                      placeholder="you@example.com"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(99,102,241,0.6)';
                        e.target.style.background = 'rgba(255,255,255,0.07)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255,255,255,0.1)';
                        e.target.style.background = 'rgba(255,255,255,0.05)';
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 2 }}>
                    <button
                      onClick={() => setEditing(false)}
                      style={{
                        flex: 1, padding: '13px 0', borderRadius: 13,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        cursor: 'pointer', transition: 'all .2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        flex: 1, padding: '13px 0', borderRadius: 13,
                        background: saving ? 'rgba(245,166,35,0.4)' : 'linear-gradient(135deg, #F5A623, #FF6B35)',
                        border: 'none',
                        color: saving ? 'rgba(0,0,0,0.5)' : '#111',
                        fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        cursor: saving ? 'not-allowed' : 'pointer', transition: 'all .2s',
                        boxShadow: saving ? 'none' : '0 4px 20px rgba(245,166,35,0.3)',
                      }}
                    >
                      {saving
                        ? <><span className="spin-icon" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%' }} /> Saving…</>
                        : <><Save size={14} /> Save Changes</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── quick actions ── */}
            <div
              className={`anim-fu-3 ${mounted ? '' : 'opacity-0'}`}
              style={{
                borderRadius: 22, overflow: 'hidden',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p style={{
                color: 'rgba(255,255,255,0.28)', fontSize: 10,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                padding: '16px 20px 10px',
              }}>
                Quick Actions
              </p>

              {actions.map((action, i) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px', textAlign: 'left',
                    background: 'transparent', border: 'none',
                    borderTop: i === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', transition: 'background .18s',
                    minHeight: 64,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: action.label === 'Ride History'
                      ? 'rgba(99,102,241,0.12)' : 'rgba(245,166,35,0.12)',
                    border: action.label === 'Ride History'
                      ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(245,166,35,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <action.icon size={17} style={{
                      color: action.label === 'Ride History' ? '#818cf8' : '#F5A623',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{action.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>{action.sub}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                </button>
              ))}
            </div>

            {/* ── logout ── */}
            <button
              onClick={handleLogout}
              className={`anim-fu-4 ${mounted ? '' : 'opacity-0'}`}
              style={{
                width: '100%', padding: '15px 0',
                borderRadius: 16, border: '1px solid rgba(248,113,113,0.2)',
                background: 'rgba(248,113,113,0.07)',
                color: '#f87171', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', transition: 'all .2s',
                minHeight: 52,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(248,113,113,0.14)';
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(248,113,113,0.07)';
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)';
              }}
            >
              <LogOut size={17} /> Logout
            </button>

          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
