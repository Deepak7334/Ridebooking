import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import axiosInstance from '../../api/axios';
import DriverBottomNav from './DriverBottomNav';

/* ── vehicle maps ── */
const VEHICLE_ICONS  = { auto: '🛺', car: '🚗', bike: '🏍️' };
const VEHICLE_LABELS = { auto: 'Auto', car: 'Cab', bike: 'Bike' };

/* ─── Route Pill ─── */
const RoutePill = ({ pickup, drop }) => (
  <div style={{
    display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14,
    background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.07)'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%', background: '#4ade80',
        boxShadow: '0 0 8px rgba(74,222,128,.8)', flexShrink: 0
      }} />
      <div style={{
        width: 1.5, flex: 1, minHeight: 22, margin: '5px 0',
        background: 'linear-gradient(to bottom,rgba(74,222,128,.4),rgba(251,113,133,.4))'
      }} />
      <div style={{
        width: 10, height: 10, borderRadius: 3, background: '#fb7185',
        boxShadow: '0 0 8px rgba(251,113,133,.8)', flexShrink: 0
      }} />
    </div>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <p style={{ color: 'rgba(255,255,255,.28)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>Pickup</p>
        <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {pickup || 'Pickup location'}
        </p>
      </div>
      <div>
        <p style={{ color: 'rgba(255,255,255,.28)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>Drop</p>
        <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {drop || 'Drop location'}
        </p>
      </div>
    </div>
  </div>
);

/* ══════════════════════════ MAIN COMPONENT ══════════════════════════ */
export default function DriverDashboard() {
  const navigate = useNavigate();
  const { socket, driverGoOnline, driverGoOffline } = useSocket();

  const [isOnline,       setIsOnline]       = useState(false);

  // Ensure driver online state loads from backend on first render.
  // This fixes “driver data not loading initially” + “state not syncing”.
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const r = await axiosInstance.get('/driver/availability');
        setIsOnline(!!r.data?.isOnline);
        if (!!r.data?.isOnline) {
          // Prime ride list for immediate responsiveness after refresh
          try {
            await fetchAvailableRides();
          } catch {}
        }
      } catch {}
    };
    if (localStorage.getItem('authToken')) loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRide,    setCurrentRide]    = useState(null);
  const [earnings,       setEarnings]       = useState({ totalEarnings: 0, totalRides: 0 });
  const [user,           setUser]           = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading,        setLoading]        = useState(false);
  const [otpInput,       setOtpInput]       = useState('');
  const [otpError,       setOtpError]       = useState('');
  const [toggling,       setToggling]       = useState(false);

  /* ── auth guard + initial fetch ── */
  useEffect(() => {
    if (!localStorage.getItem('authToken')) { navigate('/login'); return; }
    fetchEarnings();
  }, [navigate]);

  /* ── socket: ride events ── */
  useEffect(() => {
    if (!socket || !isOnline) return;
    const onNew   = ({ ride }) => setAvailableRides(p => p.find(r => r._id === ride._id) ? p : [ride, ...p]);
    const onTaken = ({ rideId }) => setAvailableRides(p => p.filter(r => r._id !== rideId));
    socket.on('new-ride-request', onNew);
    socket.on('ride-taken', onTaken);
    return () => { socket.off('new-ride-request', onNew); socket.off('ride-taken', onTaken); };
  }, [socket, isOnline]);

  /* ── re-join available-drivers room on reconnect (if online) ── */
  useEffect(() => {
    if (!socket) return;
    const onReconnect = () => {
      if (isOnline) {
        driverGoOnline();
        console.log('🔄 Re-joined available-drivers room after reconnect');
      }
    };
    socket.on('connect', onReconnect);
    return () => socket.off('connect', onReconnect);
  }, [socket, isOnline, driverGoOnline]);

  /* ── geolocation ── */
  useEffect(() => {
    if (!isOnline && !currentRide) return;
    
    const sendLocation = async ({ coords }) => {
      const loc = { lat: coords.latitude, lng: coords.longitude };
      if (currentRide && ['accepted', 'started'].includes(currentRide.status))
        try { await axiosInstance.patch(`/rides/${currentRide._id}/location`, { location: loc }); } catch {}
      if (isOnline)
        try { await axiosInstance.put('/driver/location', { latitude: loc.lat, longitude: loc.lng }); } catch {}
    };

    let id;
    if (navigator.geolocation) {
      // Immediately send location at least once
      navigator.geolocation.getCurrentPosition(sendLocation, err => console.warn(err), { enableHighAccuracy: true });
      // Then watch for changes
      id = navigator.geolocation.watchPosition(sendLocation, err => console.warn(err), { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 });
    }
    return () => { if (id) navigator.geolocation.clearWatch(id); };
  }, [isOnline, currentRide]);

  /* ── API helpers ── */
  const fetchEarnings = async () => {
    try {
      const r = await axiosInstance.get('/driver/earnings');
      setEarnings({ totalEarnings: r.data.totalEarnings || 0, totalRides: r.data.totalRides || 0 });
    } catch {}
  };
  const fetchAvailableRides = async () => {
    try { const r = await axiosInstance.get('/driver/available-rides'); setAvailableRides(r.data.rides || []); } catch {}
  };
  const toggleOnline = async () => {
    setToggling(true);
    try {
      const r = await axiosInstance.put('/driver/availability', { isOnline: !isOnline });
      const newOnlineState = r.data.isOnline;
      setIsOnline(newOnlineState);
      // Tell socket server to join/leave the available-drivers room
      if (newOnlineState) {
        driverGoOnline();
        fetchAvailableRides();
      } else {
        driverGoOffline();
        setAvailableRides([]);
      }
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setToggling(false); }
  };
  const acceptRide = async (id) => {
    setLoading(true);
    try {
      const r = await axiosInstance.patch(`/rides/${id}/accept`);
      setCurrentRide(r.data.ride);
      setAvailableRides(p => p.filter(ride => ride._id !== id));
      // Join the ride room so driver gets rideStarted/Completed events
      if (socket) {
        socket.emit('join-ride', id);
        console.log('🚪 Driver joined ride room:', id);
      }
      // Go offline from available-drivers room — driver is busy
      driverGoOffline();
    } catch (e) { alert(e.response?.data?.message || 'Failed to accept. Ride may have been taken.'); }
    finally { setLoading(false); }
  };
  const startRide = async () => {
    if (otpInput.length < 4) return setOtpError('Enter 4-digit OTP');
    setLoading(true); setOtpError('');
    try {
      const r = await axiosInstance.patch(`/rides/${currentRide._id}/start`, { otp: otpInput });
      setCurrentRide(r.data.ride); setOtpInput('');
    } catch (e) { setOtpError(e.response?.data?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };
  const completeRide = async () => {
    setLoading(true);
    try {
      const rideId = currentRide._id;
      await axiosInstance.patch(`/rides/${rideId}/complete`);
      // Leave ride room
      if (socket) socket.emit('leave-ride', rideId);
      setCurrentRide(null);
      fetchEarnings();
      // Rejoin available-drivers room if still online
      if (isOnline) driverGoOnline();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const vIcon = VEHICLE_ICONS[user.vehicleType] || '🏍️';

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div id="dd-wrap">

      {/* ═══ GLOBAL STYLES ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #070b14; overflow-x: hidden; }

        #dd-wrap {
          min-height: 100dvh;
          width: 100%;
          background: #070b14;
          font-family: 'Inter', system-ui, sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* ── scrollbar ── */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 4px; }

        /* ─── HEADER ─── */
        #dd-header {
          position: sticky; top: 0; z-index: 60;
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
          background: rgba(7,11,20,.88);
          backdrop-filter: blur(24px) saturate(1.6);
          -webkit-backdrop-filter: blur(24px) saturate(1.6);
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        @media (min-width: 640px)  { #dd-header { padding: 14px 24px; } }
        @media (min-width: 1024px) { #dd-header { padding: 16px 40px; } }

        /* ─── SCROLL AREA ─── */
        #dd-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px 14px 110px;
        }
        @media (min-width: 480px)  { #dd-scroll { padding: 22px 18px 110px; } }
        @media (min-width: 768px)  { #dd-scroll { padding: 28px 28px 100px; } }
        @media (min-width: 1024px) { #dd-scroll { padding: 36px 60px 80px;  } }

        #dd-inner {
          max-width: 1080px;
          margin: 0 auto;
          width: 100%;
        }

        /* ─── STATS GRID 2×2 ─── */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 768px)  { .stats-grid { gap: 14px; margin-bottom: 24px; } }
        @media (min-width: 1024px) { .stats-grid { gap: 18px; margin-bottom: 28px; } }

        /* ─── RIDE REQUESTS GRID ─── */
        .rides-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 600px)  { .rides-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 1100px) { .rides-grid { grid-template-columns: repeat(3,1fr); } }

        /* ─── BOTTOM TAB BAR ─── */
        #dd-tabbar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 60;
          display: flex; align-items: stretch;
          height: 64px;
          background: rgba(7,11,20,.96);
          backdrop-filter: blur(28px) saturate(1.5);
          -webkit-backdrop-filter: blur(28px) saturate(1.5);
          border-top: 1px solid rgba(255,255,255,.07);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .tab-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,.28); font-size: 10px; font-weight: 600;
          font-family: inherit; letter-spacing: .04em;
          transition: color .18s ease;
          min-height: 44px;
          -webkit-tap-highlight-color: transparent;
        }
        .tab-btn.active { color: #F5A623; }
        .tab-btn svg { width: 20px; height: 20px; }
        .tab-btn .tab-dot {
          width: 4px; height: 4px; border-radius: 50%; background: #F5A623;
          margin-top: 1px; opacity: 0; transition: opacity .18s;
        }
        .tab-btn.active .tab-dot { opacity: 1; }

        /* ─── TOGGLE SWITCH ─── */
        .toggle-track {
          width: 56px; height: 30px; border-radius: 999px; cursor: pointer;
          position: relative; flex-shrink: 0; transition: background .3s ease; border: none;
          padding: 0;
        }
        .toggle-thumb {
          position: absolute; top: 4px;
          width: 22px; height: 22px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,.45);
          transition: transform .32s cubic-bezier(.34,1.56,.64,1);
        }

        /* ─── OTP BOXES ─── */
        .otp-wrap { display: flex; gap: 10px; justify-content: center; }
        .otp-box {
          width: 58px; height: 68px;
          background: rgba(0,0,0,.4);
          border: 2px solid rgba(99,102,241,.2);
          border-radius: 16px;
          color: #fff; font-size: 1.9rem; font-weight: 700;
          text-align: center; outline: none; caret-color: #818cf8;
          font-family: 'Inter', monospace;
          transition: border-color .2s, box-shadow .2s;
        }
        .otp-box:focus { border-color: rgba(99,102,241,.65); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
        .otp-box.otp-err { border-color: rgba(248,113,113,.55); }
        .otp-box.otp-filled { border-color: rgba(99,102,241,.45); background: rgba(99,102,241,.08); }
        @media (max-width: 360px) { .otp-box { width: 50px; height: 60px; font-size: 1.6rem; } }

        /* ─── RADAR / RIPPLE ─── */
        .radar-wrap {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 160px; height: 160px; margin: 0 auto;
        }
        .radar-ring {
          position: absolute; border-radius: 50%;
          border: 1.5px solid rgba(74,222,128,.35);
          animation: radarPulse 2.8s ease-out infinite;
        }
        .radar-ring:nth-child(2) { animation-delay: .9s; }
        .radar-ring:nth-child(3) { animation-delay: 1.8s; }
        .radar-core {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg,rgba(74,222,128,.18),rgba(74,222,128,.06));
          border: 2px solid rgba(74,222,128,.5);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; position: relative; z-index: 1;
          box-shadow: 0 0 28px rgba(74,222,128,.25), inset 0 1px 0 rgba(255,255,255,.1);
        }

        /* ─── OFFLINE PULSE BUTTON ─── */
        .go-online-btn {
          position: relative; border: none; cursor: pointer; border-radius: 50%;
          width: 160px; height: 160px; margin: 0 auto; display: flex;
          flex-direction: column; align-items: center; justify-content: center; gap: 6px;
          background: linear-gradient(135deg, #F5A623, #FF6B35);
          box-shadow: 0 8px 40px rgba(245,166,35,.5), inset 0 1px 0 rgba(255,255,255,.2);
          color: #07080e; font-family: inherit; font-weight: 800; font-size: 15px;
          letter-spacing: .04em; text-transform: uppercase;
          animation: goOnlinePulse 2.2s ease-in-out infinite;
          transition: transform .2s ease, box-shadow .2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .go-online-btn:hover { transform: scale(1.06); box-shadow: 0 14px 50px rgba(245,166,35,.65); }
        .go-online-btn:disabled { animation: none; opacity: .55; cursor: not-allowed; }
        .go-online-ring {
          position: absolute; inset: -16px; border-radius: 50%;
          border: 2px solid rgba(245,166,35,.28);
          animation: goOnlineRing 2.2s ease-in-out infinite;
        }
        .go-online-ring2 {
          position: absolute; inset: -32px; border-radius: 50%;
          border: 1.5px solid rgba(245,166,35,.14);
          animation: goOnlineRing 2.2s ease-in-out infinite .4s;
        }

        /* ─── CARDS ─── */
        .glass-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px;
        }
        .stat-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 18px; padding: 16px 14px;
          transition: transform .22s ease, background .22s ease, box-shadow .22s ease;
          cursor: default;
        }
        .stat-card:hover {
          background: rgba(255,255,255,.055);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,.25);
        }
        @media (min-width: 768px) { .stat-card { padding: 20px 18px; } }

        .ride-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px; overflow: hidden;
          transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
        }
        .ride-card:hover {
          border-color: rgba(245,166,35,.28);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,.3);
        }

        /* ─── BUTTONS ─── */
        .btn-amber {
          background: linear-gradient(135deg, #F5A623, #FF6B35);
          box-shadow: 0 6px 24px rgba(245,166,35,.3), inset 0 1px 0 rgba(255,255,255,.18);
          color: #07080e; font-weight: 700; border: none; cursor: pointer;
          border-radius: 14px; display: flex; align-items: center;
          justify-content: center; gap: 8px; transition: all .22s cubic-bezier(.16,1,.3,1);
          font-family: inherit; letter-spacing: .02em;
        }
        .btn-amber:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(245,166,35,.45); }
        .btn-amber:active:not(:disabled) { transform: translateY(0); }
        .btn-amber:disabled { opacity: .38; cursor: not-allowed; }

        .btn-green {
          background: linear-gradient(135deg, #4ade80, #16a34a);
          box-shadow: 0 6px 24px rgba(74,222,128,.25), inset 0 1px 0 rgba(255,255,255,.18);
          color: #07080e; font-weight: 700; border: none; cursor: pointer;
          border-radius: 14px; display: flex; align-items: center;
          justify-content: center; gap: 8px; transition: all .22s ease;
          font-family: inherit; letter-spacing: .02em;
        }
        .btn-green:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(74,222,128,.4); }
        .btn-green:active:not(:disabled) { transform: translateY(0); }
        .btn-green:disabled { opacity: .38; cursor: not-allowed; }

        .btn-red {
          background: rgba(248,113,113,.08);
          border: 1px solid rgba(248,113,113,.22);
          color: #f87171; font-weight: 700; cursor: pointer;
          border-radius: 14px; display: flex; align-items: center;
          justify-content: center; gap: 8px; transition: all .22s ease;
          font-family: inherit;
        }
        .btn-red:hover:not(:disabled) { background: rgba(248,113,113,.15); transform: translateY(-2px); }
        .btn-red:disabled { opacity: .38; cursor: not-allowed; }

        /* ─── SECTION LABEL ─── */
        .sec-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .14em; color: rgba(255,255,255,.22);
          margin-bottom: 12px; display: block;
        }

        /* ─── STATUS BADGE ─── */
        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 99px;
          font-size: 11px; font-weight: 700; letter-spacing: .04em;
        }

        /* ─── ANIMATIONS ─── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes appear {
          from { opacity: 0; transform: translateY(10px) scale(.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 0   rgba(74,222,128,.45); }
          50%      { box-shadow: 0 0 0 7px rgba(74,222,128,0);   }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes spin   { to{ transform: rotate(360deg); } }

        @keyframes radarPulse {
          0%   { width: 60px; height: 60px; opacity: .9; }
          100% { width: 160px; height: 160px; opacity: 0; }
        }
        @keyframes goOnlinePulse {
          0%,100% { box-shadow: 0 8px 40px rgba(245,166,35,.5), inset 0 1px 0 rgba(255,255,255,.2); }
          50%      { box-shadow: 0 8px 60px rgba(245,166,35,.75), inset 0 1px 0 rgba(255,255,255,.2); }
        }
        @keyframes goOnlineRing {
          0%   { opacity: .7; transform: scale(1);    }
          100% { opacity: 0;  transform: scale(1.18); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .anim-up     { animation: fadeUp .38s cubic-bezier(.16,1,.3,1) both; }
        .anim-appear { animation: appear .32s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade   { animation: fadeIn .22s ease both; }
        .pulse-glow  { animation: pulseGlow 2s infinite; }
        .blink       { animation: blink 1.4s infinite; }
      `}</style>

      {/* ════════════════ HEADER ════════════════ */}
      <header id="dd-header">
        {/* Left: Logo + Driver name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Rapido Logo */}
          <div style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#F5A623,#FF6B35)',
            boxShadow: '0 4px 16px rgba(245,166,35,.38)',
            fontSize: 20
          }}>{vIcon}</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                fontSize: 17, fontWeight: 900, letterSpacing: '-.01em', color: '#fff',
                lineHeight: 1
              }}>RAPIDO</span>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#F5A623',
                textTransform: 'uppercase', letterSpacing: '.12em',
                background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.2)',
                padding: '1px 6px', borderRadius: 5
              }}>Driver</span>
            </div>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)',
              marginTop: 2, lineHeight: 1
            }}>{user.name || 'Driver'}</p>
          </div>
        </div>

        {/* Right: Online/Offline toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status text */}
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: 11, fontWeight: 700,
              color: isOnline ? '#4ade80' : 'rgba(255,255,255,.3)',
              letterSpacing: '.04em',
              transition: 'color .3s'
            }}>
              {toggling ? 'Updating…' : isOnline ? 'Online' : 'Offline'}
            </p>
            {isOnline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
                  animation: 'pulseGlow 2s infinite'
                }} />
                <span style={{ fontSize: 9, color: 'rgba(74,222,128,.6)', fontWeight: 600 }}>Live</span>
              </div>
            )}
          </div>

          {/* Toggle switch */}
          <button
            className="toggle-track"
            disabled={toggling}
            onClick={toggleOnline}
            aria-label="Toggle online status"
            style={{
              background: isOnline
                ? 'linear-gradient(135deg,#4ade80,#16a34a)'
                : 'rgba(255,255,255,.1)',
              border: isOnline ? 'none' : '1px solid rgba(255,255,255,.12)',
              boxShadow: isOnline ? '0 4px 14px rgba(74,222,128,.35)' : 'none',
              opacity: toggling ? .5 : 1,
              cursor: toggling ? 'wait' : 'pointer',
            }}
          >
            <span className="toggle-thumb" style={{
              transform: isOnline ? 'translateX(30px)' : 'translateX(4px)',
              background: isOnline ? '#fff' : 'rgba(255,255,255,.7)',
            }} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'rgba(248,113,113,.07)',
              border: '1px solid rgba(248,113,113,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(248,113,113,.8)',
              transition: 'all .2s'
            }}
          >
            {/* Logout icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ════════════════ SCROLL AREA ════════════════ */}
      <div id="dd-scroll">
        <div id="dd-inner">

          {/* ── docs warning banner ── */}
          {!user.docsVerified && (
            <div className="anim-up" style={{
              marginBottom: 18,
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(245,166,35,.06)',
              border: '1px solid rgba(245,166,35,.2)',
              display: 'flex', alignItems: 'flex-start', gap: 12
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: 'rgba(245,166,35,.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
              }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#F5A623', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Documents Pending</p>
                <p style={{ color: 'rgba(255,255,255,.38)', fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
                  Upload your Driving License &amp; RC Book to receive rides.
                </p>
                <button
                  onClick={() => navigate('/driver/documents')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#F5A623', fontSize: 12, fontWeight: 700,
                    textDecoration: 'underline', fontFamily: 'inherit',
                    letterSpacing: '.04em', textTransform: 'uppercase'
                  }}
                >Upload Now →</button>
              </div>
            </div>
          )}

          {/* ════ STATS 2×2 GRID ════ */}
          <span className="sec-label anim-up">Today's Overview</span>
          <div className="stats-grid">
            {/* Earnings */}
            <div className="stat-card anim-up" style={{ animationDelay: '0ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: 'rgba(74,222,128,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>💰</div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,.5)" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <p style={{
                color: '#4ade80', fontSize: 'clamp(1.35rem,4vw,1.8rem)',
                fontWeight: 800, lineHeight: 1, marginBottom: 4, letterSpacing: '-.01em'
              }}>₹{earnings.totalEarnings}</p>
              <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Today's Earnings</p>
            </div>

            {/* Rides Completed */}
            <div className="stat-card anim-up" style={{ animationDelay: '60ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: 'rgba(99,102,241,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>🚀</div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.5)" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <p style={{
                color: '#818cf8', fontSize: 'clamp(1.35rem,4vw,1.8rem)',
                fontWeight: 800, lineHeight: 1, marginBottom: 4, letterSpacing: '-.01em'
              }}>{earnings.totalRides}</p>
              <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Rides Today</p>
            </div>

            {/* Rating */}
            <div className="stat-card anim-up" style={{ animationDelay: '120ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: 'rgba(245,166,35,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>⭐</div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(245,166,35,.5)" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <p style={{
                color: '#F5A623', fontSize: 'clamp(1.35rem,4vw,1.8rem)',
                fontWeight: 800, lineHeight: 1, marginBottom: 4, letterSpacing: '-.01em'
              }}>4.9</p>
              <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Rating</p>
            </div>

            {/* Hours Online */}
            <div className="stat-card anim-up" style={{ animationDelay: '180ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: 'rgba(34,211,238,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>⏱️</div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(34,211,238,.5)" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <p style={{
                color: '#22d3ee', fontSize: 'clamp(1.35rem,4vw,1.8rem)',
                fontWeight: 800, lineHeight: 1, marginBottom: 4, letterSpacing: '-.01em'
              }}>6h 20m</p>
              <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Hours Online</p>
            </div>
          </div>

          {/* ════ ACTIVE RIDE ════ */}
          {currentRide && (
            <div className="anim-up" style={{ animationDelay: '80ms', marginBottom: 20 }}>
              <span className="sec-label">Active Ride</span>
              <div style={{
                borderRadius: 22, overflow: 'hidden',
                background: 'rgba(99,102,241,.06)',
                border: '1px solid rgba(99,102,241,.2)',
                boxShadow: '0 8px 40px rgba(99,102,241,.1)'
              }}>
                {/* Active ride header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'rgba(99,102,241,.08)',
                  borderBottom: '1px solid rgba(99,102,241,.12)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 11, background: 'rgba(99,102,241,.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                    }}>⚡</div>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Active Ride</p>
                      <p style={{ color: 'rgba(129,140,248,.6)', fontSize: 11, marginTop: 2 }}>
                        {currentRide.passengerId?.name || 'Passenger'}
                      </p>
                    </div>
                  </div>
                  {/* Status badge */}
                  <div className="status-badge" style={{
                    background: currentRide.status === 'accepted'
                      ? 'rgba(245,166,35,.12)' : 'rgba(74,222,128,.12)',
                    border: `1px solid ${currentRide.status === 'accepted'
                      ? 'rgba(245,166,35,.25)' : 'rgba(74,222,128,.25)'}`,
                    color: currentRide.status === 'accepted' ? '#F5A623' : '#4ade80',
                    textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 10
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: currentRide.status === 'accepted' ? '#F5A623' : '#4ade80'
                    }} />
                    {currentRide.status}
                  </div>
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <RoutePill
                    pickup={currentRide.pickupLocation?.address}
                    drop={currentRide.dropoffLocation?.address}
                  />

                  {/* Fare */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(245,166,35,.07)', border: '1px solid rgba(245,166,35,.18)',
                    borderRadius: 14, padding: '12px 16px'
                  }}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,.28)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Fare</p>
                      <p style={{ color: '#F5A623', fontSize: 'clamp(1.6rem,4vw,2rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-.01em' }}>₹{currentRide.fare}</p>
                    </div>
                    <div style={{ fontSize: 28, opacity: .6 }}>💳</div>
                  </div>

                  {/* OTP section */}
                  {currentRide.status === 'accepted' && (
                    <div className="anim-fade">
                      <p style={{
                        color: 'rgba(129,140,248,.5)', fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.14em',
                        textAlign: 'center', marginBottom: 12
                      }}>Enter Customer OTP to Start Ride</p>

                      {/* 4 individual OTP boxes */}
                      <div className="otp-wrap" style={{ marginBottom: otpError ? 8 : 14 }}>
                        {[0, 1, 2, 3].map(i => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            className={`otp-box ${otpError ? 'otp-err' : ''} ${otpInput[i] ? 'otp-filled' : ''}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpInput[i] || ''}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              const arr = otpInput.split('');
                              arr[i] = val;
                              const next = arr.join('').slice(0, 4);
                              setOtpInput(next);
                              setOtpError('');
                              if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Backspace' && !otpInput[i] && i > 0) {
                                document.getElementById(`otp-${i - 1}`)?.focus();
                              }
                            }}
                          />
                        ))}
                      </div>

                      {otpError && (
                        <p className="anim-fade" style={{
                          color: '#f87171', fontSize: 12, fontWeight: 500,
                          textAlign: 'center', marginBottom: 10
                        }}>{otpError}</p>
                      )}

                      <button
                        className="btn-amber"
                        onClick={startRide}
                        disabled={loading || otpInput.length < 4}
                        style={{ width: '100%', padding: '14px', fontSize: 14, borderRadius: 14 }}
                      >
                        {loading ? (
                          <svg style={{ animation: 'spin .8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        ) : '🚀'} {loading ? 'Verifying OTP…' : 'Start Ride'}
                      </button>
                    </div>
                  )}

                  {/* Complete ride */}
                  {currentRide.status === 'started' && (
                    <div className="anim-fade">
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                        borderRadius: 12, background: 'rgba(74,222,128,.07)',
                        border: '1px solid rgba(74,222,128,.15)', marginBottom: 12
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulseGlow 2s infinite' }} />
                        <p style={{ color: 'rgba(74,222,128,.8)', fontSize: 12, fontWeight: 600 }}>Ride in progress — drive safe!</p>
                      </div>
                      <button
                        className="btn-green"
                        onClick={completeRide}
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: 14, borderRadius: 14 }}
                      >
                        {loading ? (
                          <svg style={{ animation: 'spin .8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        )}
                        {loading ? 'Completing Ride…' : 'Complete Ride'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════ ONLINE STATE ════ */}
          {isOnline && !currentRide && (
            <div className="anim-up" style={{ animationDelay: '100ms', marginBottom: 20 }}>

              {/* Radar waiting animation */}
              <div style={{
                borderRadius: 22,
                background: 'rgba(74,222,128,.03)',
                border: '1px solid rgba(74,222,128,.12)',
                padding: '32px 20px',
                textAlign: 'center',
                marginBottom: 20
              }}>
                <div className="radar-wrap" style={{ marginBottom: 20 }}>
                  <div className="radar-ring" style={{ width: 60, height: 60 }} />
                  <div className="radar-ring" style={{ width: 60, height: 60 }} />
                  <div className="radar-ring" style={{ width: 60, height: 60 }} />
                  <div className="radar-core">{vIcon}</div>
                </div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                  Waiting for rides…
                </p>
                <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, lineHeight: 1.6 }}>
                  You're live! New ride requests will appear below in real time.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 14, padding: '5px 14px', borderRadius: 99,
                  background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)'
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'pulseGlow 2s infinite' }} />
                  <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>ONLINE · LIVE</span>
                </div>
              </div>

              {/* Available Rides */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="sec-label" style={{ marginBottom: 0 }}>Ride Requests</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, fontWeight: 700 }}>
                    {availableRides.length}
                  </span>
                  {availableRides.length > 0 && (
                    <div className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  )}
                </div>
              </div>

              {availableRides.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, opacity: .2, marginBottom: 14 }}>🔍</div>
                  <p style={{ color: 'rgba(255,255,255,.45)', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                    No requests yet
                  </p>
                  <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 12, maxWidth: 200, margin: '0 auto', lineHeight: 1.7 }}>
                    New ride requests appear here in real time
                  </p>
                </div>
              ) : (
                <div className="rides-grid">
                  {availableRides.map((ride, idx) => (
                    <div
                      key={ride._id}
                      className="ride-card anim-appear"
                      style={{ animationDelay: `${idx * 65}ms` }}
                    >
                      {/* Ride card header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px 12px',
                        borderBottom: '1px solid rgba(255,255,255,.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{
                            width: 46, height: 46, borderRadius: 15, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                            background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.15)'
                          }}>
                            👤
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                              {ride.passengerId?.name || 'Passenger'}
                            </p>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                              padding: '2px 7px', borderRadius: 6,
                              background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.18)'
                            }}>
                              <span style={{ fontSize: 11 }}>{VEHICLE_ICONS[ride.vehicleType] || '🏍️'}</span>
                              <span style={{ color: '#F5A623', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                {VEHICLE_LABELS[ride.vehicleType] || ride.vehicleType}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Fare */}
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Fare</p>
                          <p style={{ color: '#F5A623', fontSize: '1.55rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-.01em' }}>₹{ride.fare}</p>
                        </div>
                      </div>

                      {/* Route */}
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                        <RoutePill
                          pickup={ride.pickupLocation?.address}
                          drop={ride.dropoffLocation?.address}
                        />
                        {/* Distance chip */}
                        {ride.distance && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
                            padding: '3px 10px', borderRadius: 8,
                            background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)'
                          }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,.7)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
                            <span style={{ color: 'rgba(129,140,248,.8)', fontSize: 11, fontWeight: 600 }}>{ride.distance} km</span>
                          </div>
                        )}
                      </div>

                      {/* Accept + Decline */}
                      <div style={{ padding: '12px 14px', display: 'flex', gap: 10 }}>
                        <button
                          className="btn-red"
                          disabled={loading}
                          onClick={() => setAvailableRides(p => p.filter(r => r._id !== ride._id))}
                          style={{ flex: '0 0 auto', padding: '12px 14px', fontSize: 13, borderRadius: 12 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                        <button
                          className="btn-green"
                          onClick={() => acceptRide(ride._id)}
                          disabled={loading}
                          style={{ flex: 1, padding: '12px', fontSize: 14, borderRadius: 12 }}
                        >
                          {loading ? (
                            <svg style={{ animation: 'spin .8s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                          {loading ? 'Accepting…' : 'Accept'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ OFFLINE STATE ════ */}
          {!isOnline && !currentRide && (
            <div className="anim-up" style={{ animationDelay: '150ms', marginBottom: 20 }}>
              <div style={{
                borderRadius: 24,
                background: 'rgba(255,255,255,.02)',
                border: '1px solid rgba(255,255,255,.06)',
                padding: '56px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center',
              }}>
                <p style={{
                  color: 'rgba(255,255,255,.55)', fontWeight: 800, fontSize: 20,
                  marginBottom: 8, letterSpacing: '-.01em'
                }}>You're Offline</p>
                <p style={{
                  color: 'rgba(255,255,255,.2)', fontSize: 13, lineHeight: 1.7,
                  maxWidth: 240, marginBottom: 40
                }}>
                  Tap below to go online and start receiving ride requests.
                </p>

                {/* Big pulsing Go Online button */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!toggling && (
                    <>
                      <div className="go-online-ring" />
                      <div className="go-online-ring2" />
                    </>
                  )}
                  <button
                    className="go-online-btn"
                    onClick={toggleOnline}
                    disabled={toggling}
                    aria-label="Go Online"
                  >
                    {toggling ? (
                      <svg style={{ animation: 'spin .8s linear infinite', width: 28, height: 28 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em' }}>GO ONLINE</span>
                      </>
                    )}
                  </button>
                </div>

                {toggling && (
                  <p style={{ color: 'rgba(245,166,35,.6)', fontSize: 12, fontWeight: 600, marginTop: 32 }}>
                    Going online…
                  </p>
                )}
              </div>
            </div>
          )}

        </div>{/* /dd-inner */}
      </div>{/* /dd-scroll */}

      {/* ════════════════ BOTTOM TAB BAR ════════════════ */}
      <DriverBottomNav />

    </div>
  );
}