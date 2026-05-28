import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, Check, Star } from 'lucide-react';
import axiosInstance from '../../api/axios';

/* ─── Vehicle emoji map ─── */
const VEHICLE_ICONS = { auto: '🛺', car: '🚗', bike: '🏍️' };

/* ─── Keyframe & utility styles injected once ─── */
const STYLES = `
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes zoomIn   { from { opacity:0; transform:scale(.6);        } to { opacity:1; transform:scale(1);   } }
  @keyframes ringPop  { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.12);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes glowPulse{ 0%,100%{box-shadow:0 0 40px 10px rgba(74,222,128,.30)} 50%{box-shadow:0 0 70px 20px rgba(74,222,128,.55)} }
  @keyframes starPop  { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 100%{transform:scale(1)} }
  @keyframes confetti { 0%{opacity:.7;transform:translateY(0) rotate(0deg)  scale(1)  } 100%{opacity:0;transform:translateY(-120px) rotate(360deg) scale(.4)} }
  @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }

  .fade-up-1 { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) .10s both; }
  .fade-up-2 { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) .22s both; }
  .fade-up-3 { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) .34s both; }
  .fade-up-4 { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) .46s both; }
  .fade-up-5 { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) .60s both; }
  .fade-up-6 { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) .74s both; }

  .ring-pop   { animation: ringPop   .60s cubic-bezier(.22,1,.36,1) .05s both; }
  .glow-pulse { animation: glowPulse 2.4s ease-in-out infinite; }

  .star-pop   { animation: starPop .28s ease-out; }

  .fare-shimmer {
    background: linear-gradient(90deg, #F5A623 0%, #FFD700 40%, #FF8C00 60%, #F5A623 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 2.8s linear infinite;
  }

  .btn-amber {
    background: linear-gradient(135deg, #F5A623, #FF6B35);
    box-shadow: 0 4px 24px rgba(245,166,35,.40);
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .btn-amber:hover  { transform:translateY(-2px); box-shadow:0 8px 32px rgba(245,166,35,.55); }
  .btn-amber:active { transform:translateY(0);    box-shadow:0 4px 16px rgba(245,166,35,.35); }

  .btn-ghost {
    background: rgba(255,255,255,.05);
    border: 1.5px solid rgba(255,255,255,.10);
    transition: background .18s ease, border-color .18s ease;
  }
  .btn-ghost:hover  { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.18); }
  .btn-ghost:active { background:rgba(255,255,255,.04); }

  .card {
    background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 22px;
  }

  .no-scrollbar::-webkit-scrollbar { display:none; }
  .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
`;

/* ─── Floating confetti dots ─── */
const DOTS = [
  { top:'8%',  left:'12%', size:8,  color:'#F5A623', delay:'0s',   dur:'3.2s' },
  { top:'14%', left:'78%', size:6,  color:'#6366f1', delay:'.4s',  dur:'2.8s' },
  { top:'6%',  left:'50%', size:10, color:'#4ade80', delay:'.8s',  dur:'3.6s' },
  { top:'20%', left:'88%', size:5,  color:'#22d3ee', delay:'1.2s', dur:'2.5s' },
  { top:'22%', left:'6%',  size:7,  color:'#f87171', delay:'.2s',  dur:'3.0s' },
  { top:'10%', left:'30%', size:5,  color:'#FFD700', delay:'1.6s', dur:'2.9s' },
  { top:'18%', left:'60%', size:9,  color:'#FF6B35', delay:'.6s',  dur:'3.4s' },
];

const ConfettiDot = ({ top, left, size, color, delay, dur }) => (
  <div
    style={{
      position:'absolute', top, left, width:size, height:size,
      borderRadius:'50%', background:color, opacity:0,
      animation:`confetti ${dur} ease-out ${delay} infinite`,
      pointerEvents:'none',
    }}
  />
);

/* ─── Main component ─── */
const RideCompleted = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const rideData  = location.state || {};

  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [popStar,   setPopStar]   = useState(0);

  /* Inject styles once */
  useEffect(() => {
    if (document.getElementById('rc-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'rc-styles';
    tag.textContent = STYLES;
    document.head.appendChild(tag);
    return () => { /* leave style for smooth HMR */ };
  }, []);

  /* Submit rating */
  const handleRating = async (stars) => {
    if (submitted || loading) return;
    setRating(stars);
    setPopStar(stars);
    setTimeout(() => setPopStar(0), 320);

    if (!rideData.rideId) { setSubmitted(true); return; }
    setLoading(true);
    try {
      await axiosInstance.patch(`/rides/${rideData.rideId}/rate`, { rating: stars });
    } catch { /* swallow — still show thanks */ }
    finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  const vIcon       = VEHICLE_ICONS[rideData.vehicle || rideData.driver?.vehicleType] || '🚗';
  const vehicleType = (rideData.vehicle || rideData.driver?.vehicleType || 'Vehicle');
  const activeStars = hovered || rating;

  /* Row helper for summary card */
  const Row = ({ label, value }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
      <span style={{ color:'rgba(255,255,255,.42)', fontSize:13, fontWeight:500 }}>{label}</span>
      <span style={{ color:'#fff', fontSize:13, fontWeight:700, textTransform:'capitalize', letterSpacing:'.01em' }}>{value}</span>
    </div>
  );

  return (
    <div
      className="no-scrollbar"
      style={{
        minHeight:'100dvh', background:'#070b14', display:'flex',
        flexDirection:'column', alignItems:'center', justifyContent:'flex-start',
        overflowY:'auto', position:'relative',
      }}
    >
      {/* ── Ambient glow layers ── */}
      <div style={{
        position:'fixed', top:0, left:'50%', transform:'translateX(-50%)',
        width:'min(600px,100%)', height:320, pointerEvents:'none',
        background:'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(74,222,128,.14) 0%, transparent 72%)',
      }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'min(500px,100%)', height:220, pointerEvents:'none',
        background:'radial-gradient(ellipse 60% 55% at 50% 100%, rgba(245,166,35,.10) 0%, transparent 72%)',
      }} />

      {/* ── Confetti dots ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        {DOTS.map((d, i) => <ConfettiDot key={i} {...d} />)}
      </div>

      {/* ── Content container ── */}
      <div style={{
        width:'100%', maxWidth:448, padding:'48px 20px 36px', position:'relative', zIndex:10,
        display:'flex', flexDirection:'column', alignItems:'center',
      }}>

        {/* ── Success Checkmark ── */}
        <div className="ring-pop glow-pulse" style={{
          width:112, height:112, borderRadius:'50%',
          background:'rgba(74,222,128,.10)',
          border:'3px solid rgba(74,222,128,.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:24, flexShrink:0,
        }}>
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 0 0 rgba(74,222,128,.5)',
            color:'#000',
          }}>
            <Check size={42} strokeWidth={3.2} />
          </div>
        </div>

        {/* ── Heading ── */}
        <h1 className="fade-up-1" style={{
          color:'#fff', fontWeight:900, fontSize:30, lineHeight:1.15,
          textAlign:'center', margin:'0 0 6px', letterSpacing:'-.02em',
        }}>
          Ride Complete! 🎉
        </h1>
        <p className="fade-up-2" style={{
          color:'rgba(255,255,255,.42)', fontSize:14, textAlign:'center',
          marginBottom:28, paddingInline:12,
        }}>
          {rideData.driver?.name
            ? `Great ride with ${rideData.driver.name} — hope you enjoyed!`
            : 'Hope you had a smooth and comfortable ride!'}
        </p>

        {/* ── Fare Summary Card ── */}
        <div className="card fade-up-3" style={{ width:'100%', padding:'22px 20px', marginBottom:14 }}>
          {/* Fare hero */}
          <div style={{ textAlign:'center', paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,.07)', marginBottom:14 }}>
            <p style={{ color:'rgba(255,255,255,.30)', fontSize:10, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', marginBottom:8 }}>
              Total Fare
            </p>
            <p className="fare-shimmer" style={{ fontSize:52, fontWeight:900, lineHeight:1, marginBottom:2 }}>
              ₹{rideData.fare ?? '--'}
            </p>
          </div>

          {/* Details */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            <Row label="Vehicle"        value={`${vIcon} ${vehicleType}`} />
            <Row label="Payment"        value={rideData.paymentMethod || 'Cash'} />
            {rideData.driver?.name && (
              <Row label="Driver"       value={rideData.driver.name} />
            )}
            {rideData.distance != null && (
              <Row label="Distance"     value={`${rideData.distance} km`} />
            )}
          </div>
        </div>

        {/* ── Rating Card ── */}
        <div className="card fade-up-4" style={{ width:'100%', padding:'22px 20px', textAlign:'center', marginBottom:18 }}>
          {!submitted ? (
            <>
              <p style={{ color:'#fff', fontWeight:800, fontSize:15, marginBottom:4 }}>
                Rate Your Driver
              </p>
              <p style={{ color:'rgba(255,255,255,.38)', fontSize:12, marginBottom:18 }}>
                {rideData.driver?.name
                  ? `How was your ride with ${rideData.driver.name}?`
                  : 'How was your experience?'}
              </p>

              {/* Stars */}
              <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:14 }}>
                {[1, 2, 3, 4, 5].map(star => {
                  const filled = star <= activeStars;
                  return (
                    <button
                      key={star}
                      disabled={loading}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className={star === popStar ? 'star-pop' : ''}
                      style={{
                        background:'none', border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                        padding:4, lineHeight:1, transition:'transform .12s ease',
                        filter: filled
                          ? 'drop-shadow(0 0 8px rgba(255,214,0,.65))'
                          : 'none',
                        opacity: loading ? .5 : 1,
                      }}
                    >
                      <Star
                        size={36}
                        strokeWidth={1.6}
                        fill={filled ? '#FFD700' : 'none'}
                        color={filled ? '#FFD700' : 'rgba(255,255,255,.22)'}
                        style={{ display:'block', transition:'fill .15s ease, color .15s ease' }}
                      />
                    </button>
                  );
                })}
              </div>

              {loading && (
                <p style={{ color:'rgba(255,255,255,.30)', fontSize:12, fontWeight:600, letterSpacing:'.04em' }}>
                  Submitting…
                </p>
              )}
              {!loading && rating === 0 && (
                <p style={{ color:'rgba(255,255,255,.22)', fontSize:11 }}>
                  Tap a star to rate
                </p>
              )}
            </>
          ) : (
            /* Thanks state */
            <div style={{ padding:'8px 0', animation:'zoomIn .35s cubic-bezier(.22,1,.36,1) both' }}>
              <div style={{ fontSize:38, marginBottom:10, filter:'drop-shadow(0 0 12px rgba(255,214,0,.55))' }}>
                🎉
              </div>
              <p style={{ color:'#4ade80', fontWeight:800, fontSize:15, marginBottom:6 }}>
                Thanks for rating!
              </p>
              <p style={{ color:'rgba(255,255,255,.40)', fontSize:13 }}>
                Your feedback helps improve the service
              </p>
              {rating > 0 && (
                <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:12 }}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={20} fill="#FFD700" color="#FFD700"
                      style={{ filter:'drop-shadow(0 0 5px rgba(255,214,0,.6))' }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="fade-up-5" style={{ width:'100%', display:'flex', gap:12 }}>
          {/* Book Another — amber gradient */}
          <button
            onClick={() => navigate('/home')}
            className="btn-amber"
            style={{
              flex:1, border:'none', cursor:'pointer', borderRadius:14,
              padding:'14px 10px', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:5,
              color:'#000', fontWeight:800, fontSize:13, minHeight:64,
            }}
          >
            <Home size={20} strokeWidth={2.4} />
            <span>Book Another</span>
          </button>

          {/* View History — ghost */}
          <button
            onClick={() => navigate('/rides/history')}
            className="btn-ghost"
            style={{
              flex:1, cursor:'pointer', borderRadius:14,
              padding:'14px 10px', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:5,
              color:'rgba(255,255,255,.70)', fontWeight:700, fontSize:13, minHeight:64,
            }}
          >
            <History size={20} strokeWidth={2} />
            <span>View History</span>
          </button>
        </div>

        {/* ── Footer note ── */}
        <p className="fade-up-6" style={{
          color:'rgba(255,255,255,.18)', fontSize:11, textAlign:'center',
          marginTop:24, letterSpacing:'.03em',
        }}>
          Thank you for riding with us ✨
        </p>
      </div>
    </div>
  );
};

export default RideCompleted;
