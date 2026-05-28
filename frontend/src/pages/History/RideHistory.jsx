import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock3,
  Star,
  ChevronRight,
  MapPin,
  Filter,
} from 'lucide-react';
import axiosInstance from '../../api/axios';

/* ─── design tokens ─────────────────────────────────────────── */
const STATUS_CFG = {
  requested: {
    label: 'Requested',
    dot: '#facc15',
    color: '#facc15',
    bg: 'rgba(250,204,21,0.10)',
    border: 'rgba(250,204,21,0.22)',
    glow: 'rgba(250,204,21,0.18)',
  },
  accepted: {
    label: 'Accepted',
    dot: '#60a5fa',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.22)',
    glow: 'rgba(96,165,250,0.18)',
  },
  started: {
    label: 'Ongoing',
    dot: '#a78bfa',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.22)',
    glow: 'rgba(167,139,250,0.18)',
  },
  completed: {
    label: 'Completed',
    dot: '#4ade80',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.22)',
    glow: 'rgba(74,222,128,0.18)',
  },
  cancelled: {
    label: 'Cancelled',
    dot: '#f87171',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.22)',
    glow: 'rgba(248,113,113,0.18)',
  },
};

const VEHICLE_MAP = {
  auto: { icon: '🛺', label: 'Auto' },
  car:  { icon: '🚗', label: 'Car' },
  bike: { icon: '🏍️', label: 'Bike' },
};

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'started',   label: 'Ongoing' },
  { key: 'cancelled', label: 'Cancelled' },
];

/* ─── helpers ───────────────────────────────────────────────── */
const fmt = (iso, opts) =>
  new Date(iso).toLocaleString('en-IN', opts);

/* ─── shimmer skeleton card ─────────────────────────────────── */
const SkeletonCard = ({ delay = 0 }) => (
  <div
    className="skeleton-card"
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 24,
      padding: 20,
      animationDelay: `${delay}ms`,
    }}
  >
    {/* top row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <div className="shimmer" style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="shimmer" style={{ width: '55%', height: 14, borderRadius: 8, marginBottom: 10 }} />
        <div className="shimmer" style={{ width: '75%', height: 10, borderRadius: 8 }} />
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="shimmer" style={{ width: 60, height: 22, borderRadius: 8, marginBottom: 8, marginLeft: 'auto' }} />
        <div className="shimmer" style={{ width: 70, height: 18, borderRadius: 10, marginLeft: 'auto' }} />
      </div>
    </div>
    {/* route block */}
    <div className="shimmer" style={{ width: '100%', height: 80, borderRadius: 16, marginBottom: 18 }} />
    {/* footer */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="shimmer" style={{ width: 90, height: 28, borderRadius: 10 }} />
      <div className="shimmer" style={{ width: 38, height: 38, borderRadius: 12 }} />
    </div>
  </div>
);

/* ─── single ride card ──────────────────────────────────────── */
const RideCard = ({ ride, idx, navigate }) => {
  const sc    = STATUS_CFG[ride.status] ?? STATUS_CFG.completed;
  const veh   = VEHICLE_MAP[ride.vehicleType] ?? { icon: '🚗', label: ride.vehicleType ?? 'Vehicle' };
  const date  = fmt(ride.createdAt, { day: 'numeric', month: 'short', year: 'numeric' });
  const time  = fmt(ride.createdAt, { hour: '2-digit', minute: '2-digit' });
  const driver = ride.driver?.fullname?.firstname
    ? `${ride.driver.fullname.firstname} ${ride.driver.fullname.lastname ?? ''}`.trim()
    : null;

  return (
    <div
      className="ride-card"
      onClick={() => navigate('/ride-details', { state: { ride } })}
      style={{ animationDelay: `${idx * 70}ms` }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate('/ride-details', { state: { ride } })}
    >
      {/* subtle top glow bar */}
      <div
        className="card-glow-bar"
        style={{ background: `linear-gradient(90deg, ${sc.glow}, transparent)` }}
      />

      {/* hover shimmer overlay */}
      <div className="card-hover-overlay" />

      {/* ── TOP ROW ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>

        {/* vehicle icon + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className="vehicle-icon-wrap"
            style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
          >
            <span style={{ fontSize: 24 }}>{veh.icon}</span>
          </div>

          <div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2 }}>
              {veh.label}
            </h3>

            {/* driver */}
            {driver && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontWeight: 600 }}>
                👤 {driver}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span className="meta-chip">
                <Calendar size={10} />
                {date}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>•</span>
              <span className="meta-chip">
                <Clock3 size={10} />
                {time}
              </span>
            </div>
          </div>
        </div>

        {/* fare + status */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{
            fontSize: 26,
            fontWeight: 900,
            color: '#F5A623',
            margin: 0,
            lineHeight: 1,
            textShadow: '0 0 20px rgba(245,166,35,0.5)',
          }}>
            ₹{ride.fare ?? '--'}
          </p>

          <span
            style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '3px 10px',
              borderRadius: 10,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: sc.color,
              background: sc.bg,
              border: `1px solid ${sc.border}`,
            }}
          >
            {sc.label}
          </span>
        </div>
      </div>

      {/* ── ROUTE BLOCK ── */}
      <div className="route-block">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3, flexShrink: 0 }}>
          {/* green pickup dot */}
          <div style={{
            width: 11, height: 11, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 10px rgba(74,222,128,0.9)',
          }} />
          <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', margin: '5px 0', minHeight: 30 }} />
          {/* red drop square */}
          <div style={{
            width: 11, height: 11, borderRadius: 3,
            background: '#f87171',
            boxShadow: '0 0 10px rgba(248,113,113,0.9)',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
              Pickup
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {ride.pickupLocation?.address ?? 'Pickup location'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
              Drop
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {ride.dropoffLocation?.address ?? 'Drop location'}
            </p>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {ride.driverRating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 10,
              background: 'rgba(245,166,35,0.10)', border: '1px solid rgba(245,166,35,0.22)',
            }}>
              <Star size={12} style={{ fill: '#F5A623', color: '#F5A623' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#F5A623' }}>
                {ride.driverRating}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              Your rating
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
            Tap to view details
          </span>
        )}

        <div className="arrow-btn">
          <ChevronRight size={17} />
        </div>
      </div>
    </div>
  );
};

/* ─── main component ─────────────────────────────────────────── */
const RideHistory = () => {
  const navigate = useNavigate();
  const [rides,   setRides]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/rides/user/history');
        setRides(res.data.rides ?? []);
      } catch {
        setRides([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return rides;
    if (tab === 'started') return rides.filter(r => r.status === 'started' || r.status === 'accepted');
    return rides.filter(r => r.status === tab);
  }, [rides, tab]);

  const totalCount     = rides.length;
  const completedCount = rides.filter(r => r.status === 'completed').length;

  return (
    <>
      {/* ── global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body { font-family: 'Inter', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerMove {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        @keyframes tabPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,166,35,0); }
          50%      { box-shadow: 0 0 0 4px rgba(245,166,35,0.15); }
        }
        @keyframes cardSkeleton {
          from { opacity: 0.4; }
          to   { opacity: 1; }
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.10) 40%,
            rgba(255,255,255,0.04) 80%
          );
          background-size: 600px 100%;
          animation: shimmerMove 1.5s linear infinite;
        }

        .skeleton-card {
          animation: cardSkeleton 0.8s ease-in-out infinite alternate;
        }

        .ride-card {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 20px;
          cursor: pointer;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          animation: fadeUp 0.45s ease both;
          outline: none;
        }
        .ride-card:hover {
          transform: translateY(-5px) scale(1.005);
          border-color: rgba(245,166,35,0.25);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 18px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,166,35,0.12);
        }
        .ride-card:focus-visible {
          outline: 2px solid #F5A623;
          outline-offset: 3px;
        }
        .ride-card:hover .card-glow-bar { opacity: 1; }
        .ride-card:hover .card-hover-overlay { opacity: 1; }
        .ride-card:hover .arrow-btn {
          background: #F5A623;
          color: #000;
          border-color: #F5A623;
          transform: translateX(2px);
        }

        .card-glow-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 24px 24px 0 0;
        }
        .card-hover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(245,166,35,0.025), transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .vehicle-icon-wrap {
          width: 54px; height: 54px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.38);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .route-block {
          display: flex;
          gap: 12px;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 14px;
        }

        .arrow-btn {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7);
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
          flex-shrink: 0;
        }

        .filter-tab {
          position: relative;
          padding: 8px 18px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: rgba(255,255,255,0.45);
          transition: all 0.2s ease;
          white-space: nowrap;
          outline: none;
        }
        .filter-tab:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.75);
          border-color: rgba(255,255,255,0.15);
        }
        .filter-tab.active {
          background: linear-gradient(135deg, #F5A623, #FF6B35);
          color: #000;
          border-color: transparent;
          box-shadow: 0 4px 20px rgba(245,166,35,0.35);
          animation: tabPulse 2s ease-in-out infinite;
        }
        .filter-tab:focus-visible {
          outline: 2px solid #F5A623;
          outline-offset: 2px;
        }

        .stat-chip {
          padding: 8px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          text-align: center;
          min-width: 76px;
        }

        .book-btn {
          margin-top: 28px;
          padding: 15px 36px;
          border-radius: 16px;
          background: linear-gradient(135deg, #F5A623, #FF6B35);
          color: #000;
          font-weight: 900;
          font-size: 15px;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 35px rgba(245,166,35,0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
        }
        .book-btn:hover  { transform: scale(1.04); box-shadow: 0 14px 40px rgba(245,166,35,0.5); }
        .book-btn:active { transform: scale(0.97); }

        .back-btn {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.80);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          flex-shrink: 0;
          outline: none;
        }
        .back-btn:hover { background: rgba(255,255,255,0.10); color: #fff; }
        .back-btn:focus-visible { outline: 2px solid #F5A623; outline-offset: 2px; }

        .empty-icon-wrap {
          width: 120px; height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 60px rgba(245,166,35,0.08);
          margin-bottom: 28px;
        }

        .tabs-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .tabs-scroll::-webkit-scrollbar { display: none; }

        .card-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }
        @media (min-width: 1024px) {
          .card-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ minHeight: '100dvh', background: '#070b14', color: '#fff', position: 'relative' }}>

        {/* ── AMBIENT BLOBS ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: -140, left: -100,
            width: 320, height: 320, borderRadius: '50%',
            background: 'rgba(245,166,35,0.07)', filter: 'blur(110px)',
          }} />
          <div style={{
            position: 'absolute', bottom: -160, right: -100,
            width: 360, height: 360, borderRadius: '50%',
            background: 'rgba(99,102,241,0.07)', filter: 'blur(120px)',
          }} />
          <div style={{
            position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 500, height: 300, borderRadius: '50%',
            background: 'rgba(34,211,238,0.03)', filter: 'blur(100px)',
          }} />
        </div>

        {/* ── STICKY HEADER ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(7,11,20,0.82)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <button
              className="back-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
                My Rides
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '3px 0 0', fontWeight: 500 }}>
                Your complete trip history
              </p>
            </div>

            {/* STATS CHIPS – always visible */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <div className="stat-chip">
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total
                </p>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#F5A623', margin: '2px 0 0', lineHeight: 1 }}>
                  {totalCount}
                </p>
              </div>
              <div className="stat-chip">
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Done
                </p>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#4ade80', margin: '2px 0 0', lineHeight: 1 }}>
                  {completedCount}
                </p>
              </div>
            </div>
          </div>

          {/* FILTER TABS */}
          {!loading && rides.length > 0 && (
            <div style={{
              maxWidth: 1100, margin: '0 auto',
              padding: '0 16px 14px',
            }}>
              <div className="tabs-scroll">
                <Filter size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, alignSelf: 'center' }} />
                {TABS.map(t => (
                  <button
                    key={t.key}
                    className={`filter-tab${tab === t.key ? ' active' : ''}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                    {t.key !== 'all' && (
                      <span style={{
                        marginLeft: 6,
                        fontSize: 10,
                        fontWeight: 900,
                        opacity: tab === t.key ? 0.7 : 0.5,
                      }}>
                        {t.key === 'started'
                          ? rides.filter(r => r.status === 'started' || r.status === 'accepted').length
                          : rides.filter(r => r.status === t.key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* ── MAIN BODY ── */}
        <main style={{
          position: 'relative', zIndex: 10,
          maxWidth: 1100, margin: '0 auto',
          padding: '22px 16px 96px',
        }}>

          {/* ── LOADING SKELETONS ── */}
          {loading ? (
            <div className="card-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} delay={i * 80} />
              ))}
            </div>
          ) : rides.length === 0 ? (

            /* ── EMPTY STATE ── */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '70dvh', textAlign: 'center',
              padding: '0 16px',
              animation: 'fadeUp 0.5s ease both',
            }}>
              <div className="empty-icon-wrap">
                <span style={{ fontSize: 54 }}>🏍️</span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 10px' }}>
                No rides yet
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', maxWidth: 300, lineHeight: 1.65, margin: 0 }}>
                Your completed trips will appear here once you book your first ride.
              </p>
              <button className="book-btn" onClick={() => navigate('/home')}>
                Book First Ride
              </button>
            </div>

          ) : filtered.length === 0 ? (

            /* ── FILTERED EMPTY ── */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '50dvh', textAlign: 'center',
              animation: 'fadeUp 0.4s ease both',
            }}>
              <span style={{ fontSize: 44, marginBottom: 16 }}>🔍</span>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
                No {TABS.find(t => t.key === tab)?.label} rides
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
                Try a different filter above
              </p>
            </div>

          ) : (

            /* ── RIDE CARDS GRID ── */
            <div className="card-grid">
              {filtered.map((ride, idx) => (
                <RideCard
                  key={ride._id}
                  ride={ride}
                  idx={idx}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default RideHistory;