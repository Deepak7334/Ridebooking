import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Phone, MessageCircle, Star, Shield } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

/* ─── constants ─────────────────────────────────────────────────────────── */
const VEHICLE_ICONS = { auto: '🛺', car: '🚗', bike: '🏍️' };

/* ─── component ─────────────────────────────────────────────────────────── */
const LookingForDriver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideData = location.state || {};
  const { socket, isConnected, joinRideRoom, leaveRideRoom } = useSocket();

  const [dots, setDots]         = useState(1);
  const [driver, setDriver]     = useState(null);
  const [rideBooked, setRideBooked] = useState(false);
  const handledRef              = useRef(false); // prevent double-navigation

  /* animated dots 1 → 2 → 3 → 1 … */
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d === 3 ? 1 : d + 1)), 600);
    return () => clearInterval(t);
  }, []);

  /* ── Guard: redirect home if no rideId ── */
  useEffect(() => {
    if (!rideData.rideId) navigate('/home', { replace: true });
  }, [rideData.rideId, navigate]);

  /* ── Helper: handle rideAccepted event ── */
  const handleAccepted = React.useCallback((data) => {
    if (handledRef.current) return; // already handled
    handledRef.current = true;

    const d = data.ride?.driverId;
    const driverInfo = {
      name:          d?.name          || 'Your Driver',
      phone:         d?.phone         || '',
      vehicleType:   d?.vehicleType   || rideData.vehicle || 'bike',
      vehicleNumber: d?.vehicleNumber || 'XX 00 XX 0000',
      rating:        d?.averageRating || 4.8,
    };

    setDriver(driverInfo);
    setRideBooked(true);

    // Show success popup for 2s then redirect to live tracking
    setTimeout(() => {
      navigate('/ride/tracking', {
        replace: true,
        state: {
          ...rideData,
          rideId: data.ride?._id || rideData.rideId,
          status: 'accepted',
          driver: driverInfo,
        },
      });
    }, 2000);
  }, [rideData, navigate]);

  /* ── Socket: join ride room + listen for rideAccepted ── */
  useEffect(() => {
    if (!rideData.rideId || !socket) return;

    // Join the ride room immediately
    joinRideRoom(rideData.rideId);

    socket.on('rideAccepted', handleAccepted);

    return () => {
      socket.off('rideAccepted', handleAccepted);
      leaveRideRoom(rideData.rideId);
    };
  }, [rideData.rideId, socket, joinRideRoom, leaveRideRoom, handleAccepted]);

  /* ── Rejoin ride room on socket reconnect ── */
  useEffect(() => {
    if (!socket || !rideData.rideId) return;
    const onConnect = () => {
      joinRideRoom(rideData.rideId);
      console.log('🔄 Re-joined ride room after reconnect:', rideData.rideId);
    };
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, [socket, rideData.rideId, joinRideRoom]);

  /* ── Fallback polling: check ride status every 5s ── */
  useEffect(() => {
    if (!rideData.rideId || rideBooked) return;

    const poll = async () => {
      try {
        const { default: axiosInstance } = await import('../../api/axios');
        const res = await axiosInstance.get(`/rides/${rideData.rideId}`);
        const ride = res.data.ride;
        if (ride && ride.status === 'accepted' && !handledRef.current) {
          handleAccepted({ ride });
        }
      } catch (err) {
        console.warn('Polling error:', err.message);
      }
    };

    // Check immediately on mount (handles page refresh)
    poll();

    // Then poll every 5 seconds as fallback
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [rideData.rideId, rideBooked, handleAccepted]);

  /* cancel ride */
  const handleCancel = async () => {
    try {
      const { default: axiosInstance } = await import('../../api/axios');
      await axiosInstance.patch(`/rides/${rideData.rideId}/cancel`);
    } catch {}
    navigate('/home', { replace: true });
  };

  const vIcon = VEHICLE_ICONS[rideData.vehicle] || '🏍️';

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div
      style={{ background: '#070b14', minHeight: '100dvh' }}
      className="flex flex-col overflow-hidden"
    >
      {/* ── SUCCESS POPUP OVERLAY ─────────────────────────────────────── */}
      {rideBooked && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(12px)' }}>
          <div className="text-center max-w-xs w-full"
            style={{ animation: 'driverSlide .5s cubic-bezier(.22,.61,.36,1) both' }}>

            <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-5 text-6xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 80px rgba(34,197,94,.6)' }}>
              ✓
            </div>

            <h2 className="text-white font-black text-3xl mb-2">Ride Booked!</h2>
            <p style={{ color: 'rgba(255,255,255,.9)' }} className="text-lg mb-1 font-bold">
              You are successfully booked the ride
            </p>
            <p style={{ color: 'rgba(255,255,255,.5)' }} className="text-sm mb-6">
              {driver?.name || 'Your driver'} is on the way
            </p>

            {/* Driver info pill */}
            {driver && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{VEHICLE_ICONS[driver.vehicleType] || '🏍️'}</span>
                  <div className="text-left">
                    <p className="text-white font-bold text-base">{driver.name}</p>
                    <p style={{ color: 'rgba(255,255,255,.4)' }} className="text-xs font-mono">{driver.vehicleNumber}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2"
              style={{ color: 'rgba(255,255,255,.3)' }}>
              <svg style={{ animation: 'spin .8s linear infinite', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <p className="text-xs">Taking you to live tracking…</p>
            </div>
          </div>
        </div>
      )}

      {/* ── keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: .55; }
          100% { transform: scale(2.6); opacity: 0;   }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 28px 6px rgba(251,191,36,.25); }
          50%       { box-shadow: 0 0 52px 14px rgba(251,191,36,.48); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes blink {
          0%, 100% { opacity: 1;   }
          50%       { opacity: .3; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes driverSlide {
          from { opacity: 0; transform: translateY(32px) scale(.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }

        .ripple-ring   { animation: ripple    2.4s ease-out infinite; }
        .pulse-glow    { animation: pulseGlow 2.2s ease-in-out infinite; }
        .fade-up       { animation: fadeUp    .45s cubic-bezier(.22,.61,.36,1) both; }
        .driver-slide  { animation: driverSlide .5s cubic-bezier(.22,.61,.36,1) both; }
        .blink-slow    { animation: blink     1.8s ease-in-out infinite; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <header
        style={{
          background: 'rgba(7,11,20,.92)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          backdropFilter: 'blur(14px)',
        }}
        className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0"
      >
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div
            style={{ background: 'linear-gradient(135deg,#F5A623,#FF6B35)' }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg"
          >
            🏍️
          </div>
          <div>
            <p className="text-white font-extrabold text-base leading-tight tracking-tight">
              {driver ? '🎉 Driver Found!' : 'Finding Driver'}
            </p>
            <p style={{ color: 'rgba(255,255,255,.3)' }} className="text-xs font-semibold flex items-center gap-1.5">
              Rapido
              {/* Socket status dot */}
              <span className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: isConnected ? '#4ade80' : '#f87171', boxShadow: isConnected ? '0 0 6px #4ade80' : 'none' }} />
            </p>
          </div>
        </div>

        {/* Cancel — only while searching */}
        {!driver && !rideBooked && (
          <button
            onClick={handleCancel}
            style={{
              background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.28)',
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-red-400 text-sm font-semibold transition-all hover:bg-red-500/20 active:scale-95 min-h-[44px]"
          >
            <X size={15} strokeWidth={2.5} />
            Cancel
          </button>
        )}
      </header>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-sm sm:max-w-md">

          {/* ════════════════ SEARCHING STATE ════════════════ */}
          {!driver && (
            <div className="flex flex-col items-center">

              {/* Ripple + emoji circle */}
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mx-auto mb-10">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="ripple-ring absolute inset-0 rounded-full"
                    style={{
                      border: '2px solid rgba(251,191,36,.5)',
                      animationDelay: `${i * 0.75}s`,
                    }}
                  />
                ))}

                <div
                  className="pulse-glow relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-5xl sm:text-6xl select-none"
                  style={{
                    background: 'radial-gradient(circle at 38% 36%, rgba(251,191,36,.18) 0%, rgba(251,191,36,.06) 70%)',
                    border: '2px solid rgba(251,191,36,.35)',
                  }}
                >
                  {vIcon}
                </div>
              </div>

              {/* Searching headline */}
              <h2 className="text-white font-black text-3xl sm:text-4xl text-center mb-3 tracking-tight">
                Searching
                <span style={{ color: '#FBBF24' }}>
                  {'•'.repeat(dots)}
                  <span style={{ opacity: 0 }}>{'•'.repeat(3 - dots)}</span>
                </span>
              </h2>
              <p
                style={{ color: 'rgba(255,255,255,.38)' }}
                className="text-sm text-center mb-10 leading-relaxed max-w-[260px]"
              >
                Looking for the best driver near your pickup location
              </p>

              {/* ── Ride Summary Card ── */}
              <div
                className="fade-up w-full rounded-3xl p-5"
                style={{
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                  animationDelay: '.1s',
                }}
              >
                <div
                  className="flex items-center justify-between mb-5 pb-5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}
                >
                  <div>
                    <p
                      style={{ color: 'rgba(255,255,255,.3)', letterSpacing: '.1em' }}
                      className="text-[10px] font-bold uppercase mb-1"
                    >
                      Estimated Fare
                    </p>
                    <p
                      style={{ color: '#FBBF24', lineHeight: 1 }}
                      className="font-black text-[38px]"
                    >
                      ₹{rideData.fare}
                    </p>
                  </div>

                  <div
                    className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1"
                    style={{
                      background: 'rgba(255,255,255,.05)',
                      border: '1px solid rgba(255,255,255,.08)',
                    }}
                  >
                    <span className="text-2xl">{vIcon}</span>
                    <p
                      style={{ color: 'rgba(255,255,255,.45)' }}
                      className="text-[10px] font-semibold capitalize"
                    >
                      {rideData.vehicle}
                    </p>
                  </div>
                </div>

                {/* Pickup / Drop addresses */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,.6)' }}
                    />
                    <p
                      style={{ color: 'rgba(255,255,255,.5)' }}
                      className="text-xs leading-snug line-clamp-2"
                    >
                      {rideData.pickupAddress || 'Pickup location'}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: '#f87171', boxShadow: '0 0 6px rgba(248,113,113,.6)' }}
                    />
                    <p
                      style={{ color: 'rgba(255,255,255,.5)' }}
                      className="text-xs leading-snug line-clamp-2"
                    >
                      {rideData.dropoffAddress || 'Destination'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ DRIVER FOUND STATE (brief, before redirect) ════════════════ */}
          {driver && !rideBooked && (
            <div className="driver-slide space-y-4">
              <div
                className="rounded-3xl p-6 text-center"
                style={{
                  background: 'linear-gradient(145deg, rgba(251,191,36,.1) 0%, rgba(255,107,53,.06) 100%)',
                  border: '2px solid rgba(251,191,36,.35)',
                }}
              >
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-5xl sm:text-6xl mx-auto mb-5"
                  style={{
                    background: 'linear-gradient(135deg,#F5A623,#FF6B35)',
                    boxShadow: '0 10px 36px rgba(255,107,0,.45)',
                  }}
                >
                  {VEHICLE_ICONS[driver.vehicleType] || '🏍️'}
                </div>
                <h3 className="text-white font-extrabold text-xl sm:text-2xl mb-1 tracking-tight">
                  {driver.name}
                </h3>
                <div className="flex items-center justify-center gap-3 text-sm mb-2">
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: '#FBBF24' }}>
                    <Star size={14} fill="#FBBF24" strokeWidth={0} />
                    {driver.rating}
                  </span>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.2)' }} />
                  <span style={{ color: 'rgba(255,255,255,.5)' }} className="capitalize">{driver.vehicleType}</span>
                </div>
                <p className="text-sm font-mono tracking-[.25em] mb-6" style={{ color: 'rgba(255,255,255,.3)' }}>
                  {driver.vehicleNumber}
                </p>
                {driver.phone && (
                  <div className="flex gap-3">
                    <a href={`tel:${driver.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95 min-h-[44px]"
                      style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', color: '#4ade80' }}>
                      <Phone size={16} strokeWidth={2} /> Call
                    </a>
                    <a href={`sms:${driver.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95 min-h-[44px]"
                      style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', color: '#818cf8' }}>
                      <MessageCircle size={16} strokeWidth={2} /> SMS
                    </a>
                  </div>
                )}
              </div>

              {rideData.otp && (
                <div className="rounded-3xl p-5 text-center"
                  style={{ background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.28)' }}>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Shield size={15} className="text-indigo-400" />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(165,180,252,.7)' }}>
                      Your Ride OTP
                    </p>
                  </div>
                  <p className="text-white font-black text-5xl sm:text-6xl tracking-[.45em] mb-3"
                    style={{ textShadow: '0 0 24px rgba(99,102,241,.6)' }}>
                    {rideData.otp}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(165,180,252,.4)' }}>
                    Share with driver when they arrive
                  </p>
                </div>
              )}

              <p className="blink-slow text-xs text-center font-medium" style={{ color: 'rgba(255,255,255,.28)' }}>
                Taking you to tracking screen…
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LookingForDriver;
