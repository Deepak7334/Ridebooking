import React, { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, Car, Activity,
  DollarSign, CheckCircle, Clock, AlertTriangle,
  ChevronRight, RefreshCw, Zap, Shield, Star, ArrowUpRight
} from 'lucide-react';

export default function AdminOverview({ stats: propStats, statsLoading, onNavigate, onRefresh }) {
  const stats = propStats || {};
  const loading = statsLoading ?? false;

  const successRate = stats.totalRides
    ? Math.round((stats.completedRides / stats.totalRides) * 100)
    : 0;
  const avgFare = stats.completedRides
    ? Math.round((stats.totalRevenue || 0) / stats.completedRides)
    : 0;
  const cancelRate = stats.totalRides
    ? Math.round(((stats.cancelledRides || 0) / stats.totalRides) * 100)
    : 0;

  const fmt = n => n?.toLocaleString('en-IN') ?? '—';

  return (
    <div id="ov-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap');

        #ov-root {
          width: 100%;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── number font ── */
        .num { font-family: 'Bebas Neue', monospace; }

        /* ── shimmer ── */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .skel {
          display: inline-block;
          height: 1em; border-radius: 6px;
          background: linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.05) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        /* ── fade-up ── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fu  { animation: fadeUp .38s cubic-bezier(.16,1,.3,1) both; }
        .fu1 { animation-delay:  40ms; }
        .fu2 { animation-delay:  80ms; }
        .fu3 { animation-delay: 120ms; }
        .fu4 { animation-delay: 160ms; }
        .fu5 { animation-delay: 200ms; }
        .fu6 { animation-delay: 240ms; }
        .fu7 { animation-delay: 280ms; }
        .fu8 { animation-delay: 320ms; }

        /* ── section title ── */
        .sec {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .12em;
          color: rgba(255,255,255,.25); margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .sec::after {
          content:''; flex:1; height:1px;
          background: linear-gradient(to right, rgba(255,255,255,.08), transparent);
        }

        /* ══════════════ HERO STATS ══════════════ */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media(min-width:600px)  { .hero-grid { grid-template-columns:repeat(3,1fr); gap:14px; } }
        @media(min-width:900px)  { .hero-grid { grid-template-columns:repeat(4,1fr); } }
        @media(min-width:1200px) { .hero-grid { grid-template-columns:repeat(4,1fr); gap:18px; } }

        .hero-card {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px;
          padding: 18px 18px 16px;
          cursor: default;
          transition: border-color .2s, transform .2s, background .2s;
        }
        .hero-card:hover {
          border-color: rgba(255,255,255,.14);
          background: rgba(255,255,255,.05);
          transform: translateY(-2px);
        }
        .hero-card .glow {
          position: absolute; top:-40px; right:-40px;
          width: 120px; height: 120px; border-radius: 50%;
          filter: blur(40px); opacity: .15; pointer-events: none;
        }
        .hero-card .top-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
        }
        .hero-card .ico {
          width: 40px; height: 40px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .hero-card .trend {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 20px;
        }
        .hero-card .value {
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          line-height: 1; margin-bottom: 5px;
        }
        .hero-card .label {
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,.35);
        }
        .hero-card .bar-track {
          height: 3px; border-radius: 3px;
          background: rgba(255,255,255,.07); margin-top: 12px; overflow: hidden;
        }
        .hero-card .bar-fill {
          height: 100%; border-radius: 3px;
          transition: width .8s cubic-bezier(.16,1,.3,1);
        }

        /* ══════════════ KPI ROW ══════════════ */
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 12px;
        }
        @media(min-width:640px)  { .kpi-row { grid-template-columns:repeat(4,1fr); gap:14px; } }
        @media(min-width:1024px) { .kpi-row { gap:18px; } }

        .kpi-card {
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 16px; padding: 16px;
          display: flex; flex-direction: column; gap: 10px;
          transition: border-color .2s, background .2s;
        }
        .kpi-card:hover { border-color:rgba(255,255,255,.12); background:rgba(255,255,255,.04); }

        /* ══════════════ ALERTS ══════════════ */
        .alert-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media(min-width:768px) { .alert-row { grid-template-columns:1fr 1fr; } }

        .alert-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; border-radius: 18px;
          cursor: pointer; border: none; font-family: inherit;
          text-align: left; width: 100%;
          transition: transform .18s, background .18s;
        }
        .alert-card:hover { transform: translateX(4px); }
        .alert-card .al-ico {
          width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .alert-card .al-arrow {
          margin-left: auto; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,.06);
          transition: background .15s;
        }
        .alert-card:hover .al-arrow { background: rgba(255,255,255,.12); }

        /* ══════════════ SUMMARY STRIP ══════════════ */
        .summary-strip {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 10px;
        }
        @media(min-width:480px)  { .summary-strip { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:768px)  { .summary-strip { grid-template-columns:repeat(6,1fr); gap:12px; } }

        .strip-cell {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px; padding: 14px 12px;
          text-align: center;
          transition: border-color .15s, background .15s;
        }
        .strip-cell:hover { background:rgba(255,255,255,.055); border-color:rgba(255,255,255,.1); }

        /* ══════════════ LIVE PULSE ══════════════ */
        @keyframes pulseRing {
          0%  { box-shadow: 0 0 0 0 rgba(167,139,250,.5); }
          70% { box-shadow: 0 0 0 10px rgba(167,139,250,0); }
          100%{ box-shadow: 0 0 0 0 rgba(167,139,250,0); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        .live-dot { animation: pulseRing 2s infinite; }
        .blink    { animation: blink 1.5s infinite; }

        /* ══════════════ REVENUE HIGHLIGHT ══════════════ */
        .rev-card {
          background: linear-gradient(135deg, rgba(52,211,153,.08) 0%, rgba(16,185,129,.04) 100%);
          border: 1px solid rgba(52,211,153,.2);
          border-radius: 20px; padding: 22px 24px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          position: relative; overflow: hidden;
        }
        .rev-card::before {
          content:''; position:absolute; top:-60px; right:-60px;
          width:200px; height:200px; border-radius:50%;
          background: radial-gradient(circle, rgba(52,211,153,.15) 0%, transparent 70%);
          pointer-events: none;
        }

        /* tooltip-style mini badge */
        .mini-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px;
          text-transform: uppercase; letter-spacing: .06em;
        }
      `}</style>

      {/* ══════════════════════════════════════════
          1. HERO STATS
      ══════════════════════════════════════════ */}
      <div>
        <p className="sec">Key Metrics</p>
        <div className="hero-grid">

          {/* Total Users */}
          <div className="hero-card fu fu1">
            <div className="glow" style={{ background:'#60a5fa' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(96,165,250,.12)' }}>👥</div>
              <div className="trend" style={{ background:'rgba(74,222,128,.1)', color:'#4ade80' }}>
                <TrendingUp size={11}/> +8%
              </div>
            </div>
            <p className="num value" style={{ color:'#60a5fa' }}>
              {loading ? <span className="skel" style={{width:64}}/> : fmt(stats.totalCustomers)}
            </p>
            <p className="label">Total Users</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ background:'linear-gradient(90deg,#3b82f6,#60a5fa)', width: loading?'0%':'78%' }}/>
            </div>
          </div>

          {/* Total Drivers */}
          <div className="hero-card fu fu2">
            <div className="glow" style={{ background:'#fbbf24' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(251,191,36,.12)' }}>🏍️</div>
              <div className="trend" style={{ background:'rgba(251,191,36,.1)', color:'#fbbf24' }}>
                <TrendingUp size={11}/> +3%
              </div>
            </div>
            <p className="num value" style={{ color:'#fbbf24' }}>
              {loading ? <span className="skel" style={{width:48}}/> : fmt(stats.totalDrivers)}
            </p>
            <p className="label">Total Drivers</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ background:'linear-gradient(90deg,#d97706,#fbbf24)', width: loading?'0%':'55%' }}/>
            </div>
          </div>

          {/* Total Rides */}
          <div className="hero-card fu fu3">
            <div className="glow" style={{ background:'#a78bfa' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(167,139,250,.12)' }}>🚀</div>
              <div className="trend" style={{ background:'rgba(167,139,250,.1)', color:'#a78bfa' }}>
                <TrendingUp size={11}/> +12%
              </div>
            </div>
            <p className="num value" style={{ color:'#a78bfa' }}>
              {loading ? <span className="skel" style={{width:64}}/> : fmt(stats.totalRides)}
            </p>
            <p className="label">Total Rides</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ background:'linear-gradient(90deg,#7c3aed,#a78bfa)', width: loading?'0%':'90%' }}/>
            </div>
          </div>

          {/* Revenue */}
          <div className="hero-card fu fu4">
            <div className="glow" style={{ background:'#34d399' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(52,211,153,.12)' }}>💰</div>
              <div className="trend" style={{ background:'rgba(52,211,153,.1)', color:'#34d399' }}>
                <TrendingUp size={11}/> +18%
              </div>
            </div>
            <p className="num value" style={{ color:'#34d399' }}>
              {loading ? <span className="skel" style={{width:72}}/> : `₹${fmt(stats.totalRevenue)}`}
            </p>
            <p className="label">Total Revenue</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ background:'linear-gradient(90deg,#059669,#34d399)', width: loading?'0%':'85%' }}/>
            </div>
          </div>

          {/* Completed */}
          <div className="hero-card fu fu5">
            <div className="glow" style={{ background:'#4ade80' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(74,222,128,.12)' }}>✅</div>
              <div className="mini-badge" style={{ background:'rgba(74,222,128,.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,.2)' }}>
                {successRate}% rate
              </div>
            </div>
            <p className="num value" style={{ color:'#4ade80' }}>
              {loading ? <span className="skel" style={{width:56}}/> : fmt(stats.completedRides)}
            </p>
            <p className="label">Completed Rides</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ background:'linear-gradient(90deg,#16a34a,#4ade80)', width: loading?'0%':`${successRate}%` }}/>
            </div>
          </div>

          {/* Live Rides */}
          <div className="hero-card fu fu6" style={{ borderColor:(stats.activeRides||0)>0?'rgba(167,139,250,.25)':'rgba(255,255,255,.07)' }}>
            <div className="glow" style={{ background:'#f472b6' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(244,114,182,.12)' }}>⚡</div>
              {(stats.activeRides||0) > 0 && (
                <div style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 9px',borderRadius:20,
                  background:'rgba(167,139,250,.15)',border:'1px solid rgba(167,139,250,.3)' }}>
                  <div className="blink live-dot" style={{ width:6,height:6,borderRadius:'50%',background:'#a78bfa' }}/>
                  <span style={{ fontSize:10,fontWeight:700,color:'#a78bfa' }}>LIVE</span>
                </div>
              )}
            </div>
            <p className="num value" style={{ color:'#f472b6' }}>
              {loading ? <span className="skel" style={{width:32}}/> : fmt(stats.activeRides)}
            </p>
            <p className="label">Active Right Now</p>
            <div className="bar-track">
              <div className="bar-fill blink" style={{ background:'linear-gradient(90deg,#db2777,#f472b6)',
                width: loading?'0%': stats.totalRides?`${Math.min(100,Math.round(((stats.activeRides||0)/stats.totalRides)*100*10))}%`:'0%' }}/>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="hero-card fu fu7" style={{ borderColor:(stats.pendingDriverApprovals||0)>0?'rgba(251,146,60,.3)':'rgba(255,255,255,.07)' }}>
            <div className="glow" style={{ background:'#fb923c' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(251,146,60,.12)' }}>⏳</div>
              {(stats.pendingDriverApprovals||0)>0 && (
                <div style={{ minWidth:22,height:22,borderRadius:11,background:'#fb923c',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:11,fontWeight:900,color:'#07080e',padding:'0 5px' }}>
                  {stats.pendingDriverApprovals}
                </div>
              )}
            </div>
            <p className="num value" style={{ color:'#fb923c' }}>
              {loading ? <span className="skel" style={{width:32}}/> : fmt(stats.pendingDriverApprovals)}
            </p>
            <p className="label">Pending Approvals</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ background:'linear-gradient(90deg,#c2410c,#fb923c)',
                width: loading?'0%': stats.totalDrivers?`${Math.round(((stats.pendingDriverApprovals||0)/stats.totalDrivers)*100)}%`:'0%' }}/>
            </div>
          </div>

          {/* Success Rate */}
          <div className="hero-card fu fu8">
            <div className="glow" style={{ background:'#38bdf8' }}/>
            <div className="top-row">
              <div className="ico" style={{ background:'rgba(56,189,248,.12)' }}>📈</div>
              <div className="trend" style={{ background: successRate>=80?'rgba(74,222,128,.1)':'rgba(248,113,113,.1)', color: successRate>=80?'#4ade80':'#f87171' }}>
                {successRate>=80?<TrendingUp size={11}/>:<TrendingDown size={11}/>} {successRate}%
              </div>
            </div>
            <p className="num value" style={{ color:'#38bdf8' }}>
              {loading ? <span className="skel" style={{width:48}}/> : `${successRate}%`}
            </p>
            <p className="label">Success Rate</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ background:'linear-gradient(90deg,#0284c7,#38bdf8)', width: loading?'0%':`${successRate}%` }}/>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. REVENUE HIGHLIGHT
      ══════════════════════════════════════════ */}
      <div className="rev-card fu">
        <div>
          <p style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(52,211,153,.6)',marginBottom:6 }}>
            Platform Revenue
          </p>
          <p className="num" style={{ fontSize:'clamp(2rem,6vw,3rem)', color:'#34d399', lineHeight:1 }}>
            {loading ? <span className="skel" style={{width:120,height:'1em'}}/> : `₹${fmt(stats.totalRevenue)}`}
          </p>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.4)',marginTop:6 }}>
            Across {fmt(stats.completedRides)} completed rides
          </p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:180 }}>
          {[
            { label:'Avg Fare per Ride', value:`₹${fmt(avgFare)}`, color:'#fbbf24' },
            { label:'Platform Cut (est.)', value:`₹${fmt(Math.round((stats.totalRevenue||0)*0.2))}`, color:'#34d399' },
            { label:'Cancel Rate', value:`${cancelRate}%`, color:'#f87171' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:16 }}>
              <span style={{ fontSize:12,color:'rgba(255,255,255,.38)',fontWeight:500 }}>{r.label}</span>
              <span className="num" style={{ fontSize:'1.1rem',color:r.color,lineHeight:1 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. KPI STRIP
      ══════════════════════════════════════════ */}
      <div>
        <p className="sec">Quick KPIs</p>
        <div className="kpi-row">
          {[
            { ico:<Shield size={16}/>, label:'Safety Score',   value:'99.2%',          color:'#4ade80',  acc:'rgba(74,222,128,.1)'   },
            { ico:<Star size={16}/>,   label:'Avg Driver Rating',value:'4.7 ★',         color:'#fbbf24',  acc:'rgba(251,191,36,.1)'   },
            { ico:<Clock size={16}/>,  label:'Avg Trip Time',  value:'18 min',          color:'#60a5fa',  acc:'rgba(96,165,250,.1)'   },
            { ico:<Zap size={16}/>,    label:'Acceptance Rate',value:'96%',             color:'#a78bfa',  acc:'rgba(167,139,250,.1)'  },
          ].map((k,i) => (
            <div key={k.label} className={`kpi-card fu fu${i+1}`}>
              <div style={{ width:36,height:36,borderRadius:11,background:k.acc,
                display:'flex',alignItems:'center',justifyContent:'center',color:k.color }}>
                {k.ico}
              </div>
              <div>
                <p className="num" style={{ fontSize:'1.5rem',color:k.color,lineHeight:1,marginBottom:4 }}>{k.value}</p>
                <p style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,.3)',letterSpacing:'.02em' }}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          4. ALERT BANNERS
      ══════════════════════════════════════════ */}
      {((stats.pendingDriverApprovals||0)>0 || (stats.activeRides||0)>0) && (
        <div>
          <p className="sec">Requires Attention</p>
          <div className="alert-row">
            {(stats.pendingDriverApprovals||0)>0 && (
              <button className="alert-card fu"
                style={{ background:'rgba(251,146,60,.07)', border:'1px solid rgba(251,146,60,.2)' }}
                onClick={() => onNavigate?.('drivers')}>
                <div className="al-ico" style={{ background:'rgba(251,146,60,.15)' }}>
                  <AlertTriangle size={20} style={{ color:'#fb923c' }}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ color:'#fdba74',fontWeight:700,fontSize:14,marginBottom:3 }}>
                    {stats.pendingDriverApprovals} driver{stats.pendingDriverApprovals>1?'s':''} pending verification
                  </p>
                  <p style={{ color:'rgba(251,146,60,.45)',fontSize:12 }}>
                    Review documents in Drivers tab
                  </p>
                </div>
                <div className="al-arrow"><ChevronRight size={15} style={{ color:'rgba(251,146,60,.6)' }}/></div>
              </button>
            )}
            {(stats.activeRides||0)>0 && (
              <button className="alert-card fu"
                style={{ background:'rgba(167,139,250,.07)', border:'1px solid rgba(167,139,250,.2)' }}
                onClick={() => onNavigate?.('rides')}>
                <div className="al-ico" style={{ background:'rgba(167,139,250,.14)' }}>
                  <Activity size={20} style={{ color:'#a78bfa' }} className="blink"/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ color:'#c4b5fd',fontWeight:700,fontSize:14,marginBottom:3 }}>
                    {stats.activeRides} ride{stats.activeRides>1?'s':''} currently in progress
                  </p>
                  <p style={{ color:'rgba(167,139,250,.45)',fontSize:12 }}>
                    Monitor and manage live rides
                  </p>
                </div>
                <div className="al-arrow"><ChevronRight size={15} style={{ color:'rgba(167,139,250,.6)' }}/></div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          5. SUMMARY STRIP
      ══════════════════════════════════════════ */}
      <div>
        <p className="sec">Platform Summary</p>
        <div className="summary-strip">
          {[
            { label:'Avg Fare',      value:`₹${fmt(avgFare)}`,                       color:'#fbbf24' },
            { label:'Passengers',    value:fmt(stats.totalCustomers),                 color:'#60a5fa' },
            { label:'Drivers',       value:fmt(stats.totalDrivers),                   color:'#fb923c' },
            { label:'Completed',     value:fmt(stats.completedRides),                 color:'#4ade80' },
            { label:'Success Rate',  value:`${successRate}%`,                         color:'#38bdf8' },
            { label:'Cancel Rate',   value:`${cancelRate}%`,                          color:'#f87171' },
          ].map(s => (
            <div key={s.label} className="strip-cell">
              <p className="num" style={{ fontSize:'clamp(1.3rem,2.5vw,1.7rem)', color:s.color, lineHeight:1, marginBottom:5 }}>
                {loading ? <span className="skel" style={{width:48,height:'1em'}}/> : s.value}
              </p>
              <p style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,.3)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}