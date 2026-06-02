import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, Eye, EyeOff, Car, ArrowRight, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axios';

const Signup = () => {
  const navigate = useNavigate();
  const [step,       setStep]      = useState('form');
  const [form,       setForm]      = useState({ name:'', phone:'', email:'', password:'', role:'customer', vehicleType:'', vehicleNumber:'' });
  const [otp,        setOtp]       = useState('');
  const [otpCode,    setOtpCode]   = useState('');
  const [useOtp,     setUseOtp]    = useState(true);
  const [showPass,   setShowPass]  = useState(false);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const sendOTP = async () => {
    if (!form.name.trim())       return setError('Full name is required');
    if (form.phone.length < 10)  return setError('Enter a valid 10-digit phone number');
    setError(''); setLoading(true);
    try {
      const r = await axiosInstance.post('/auth/otp/send', { phone: form.phone });
      setOtpCode(r.data.otp || '');
      setStep('otp');
    } catch (e) { setError(e.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length < 4) return setError('Enter the OTP');
    setError(''); setLoading(true);
    try {
      const r = await axiosInstance.post('/auth/otp/verify', { phone: form.phone, otp, name: form.name, role: form.role });
      localStorage.setItem('authToken', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      navigate(form.role === 'driver' ? '/driver' : '/home');
    } catch (e) { setError(e.response?.data?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const register = async () => {
    if (!form.name || !form.phone || !form.password) return setError('Name, phone and password are required');
    setError(''); setLoading(true);
    try {
      const r = await axiosInstance.post('/auth/register', form);
      localStorage.setItem('authToken', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      navigate(form.role === 'driver' ? '/driver' : '/home');
    } catch (e) { setError(e.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative" style={{ background:'linear-gradient(145deg,#070b14 0%,#0d1425 50%,#070b14 100%)' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .card { animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        .logo-fl { animation:float 4s ease-in-out infinite; }
        .input-s {
          width:100%; background:rgba(255,255,255,.05); border:1.5px solid rgba(255,255,255,.1);
          border-radius:14px; padding:13px 16px; color:#fff; font-size:14px; outline:none;
          transition:all .2s; font-family:inherit;
        }
        .input-s::placeholder{color:rgba(255,255,255,.3)}
        .input-s:focus{border-color:rgba(245,166,35,.5);background:rgba(255,255,255,.08);box-shadow:0 0 0 3px rgba(245,166,35,.1)}
        .btn-amber {
          width:100%; padding:14px; background:linear-gradient(135deg,#F5A623,#FF6B35);
          border:none; border-radius:14px; color:#111; font-weight:800; font-size:14px;
          cursor:pointer; font-family:inherit;
          box-shadow:0 6px 24px rgba(245,166,35,.35),inset 0 1px 0 rgba(255,255,255,.15);
          transition:all .2s cubic-bezier(.16,1,.3,1); display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .btn-amber:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 32px rgba(245,166,35,.5)}
        .btn-amber:active:not(:disabled){transform:translateY(0)}
        .btn-amber:disabled{opacity:.5;cursor:not-allowed}
        .role-btn { flex:1; padding:11px; border-radius:12px; font-size:13px; font-weight:700; border:1.5px solid transparent; cursor:pointer; transition:all .2s; font-family:inherit; }
        .role-on  { background:linear-gradient(135deg,rgba(245,166,35,.15),rgba(255,107,53,.1)); border-color:rgba(245,166,35,.4); color:#F5A623; }
        .role-off { background:rgba(255,255,255,.04); border-color:rgba(255,255,255,.08); color:rgba(255,255,255,.45); }
        .label-s { color:rgba(255,255,255,.55); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; display:block; margin-bottom:7px; }
        .select-s { width:100%; background:#0e1525; border:1.5px solid rgba(255,255,255,.1); border-radius:14px; padding:13px 16px; color:#fff; font-size:14px; outline:none; font-family:inherit; transition:all .2s; }
        .select-s:focus{border-color:rgba(245,166,35,.5);box-shadow:0 0 0 3px rgba(245,166,35,.1)}
        .select-s option{background:#0e1525}
      `}</style>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(245,166,35,.07)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', bottom:'-100px', left:'-80px', width:'280px', height:'280px', borderRadius:'50%', background:'rgba(99,102,241,.08)', filter:'blur(80px)' }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="logo-fl inline-flex w-18 h-18 sm:w-20 sm:h-20 rounded-3xl items-center justify-center text-4xl mb-4 shadow-2xl"
            style={{ background:'linear-gradient(135deg,#F5A623,#FF6B35)', boxShadow:'0 8px 40px rgba(245,166,35,.45)', width:72, height:72 }}>
            🏍️
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">jydo</h1>
          <p className="text-white/35 mt-1.5 text-sm font-light">Join millions of happy riders</p>
        </div>

        {/* Card */}
        <div className="card w-full max-w-sm sm:max-w-md" style={{ background:'rgba(255,255,255,.04)', backdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,.09)', borderRadius:'28px', padding:'26px', boxShadow:'0 30px 80px rgba(0,0,0,.5)' }}>
          <h2 style={{ color:'#fff', fontWeight:800, fontSize:20, textAlign:'center', marginBottom:22 }}>Create Account 🚀</h2>

          {/* Error */}
          {error && (
            <div style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.25)', borderRadius:12, padding:'11px 14px', marginBottom:16 }}>
              <p style={{ color:'#fca5a5', fontSize:13, textAlign:'center', fontWeight:600 }}>⚠️ {error}</p>
            </div>
          )}

          {step === 'form' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Role selector */}
              <div>
                <label className="label-s">I am a</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[['customer','👤 Customer'],['driver','🏍️ Driver']].map(([r,l]) => (
                    <button key={r} className={`role-btn ${form.role===r?'role-on':'role-off'}`} onClick={() => set('role',r)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="label-s">Full Name</label>
                <div style={{ position:'relative' }}>
                  <User size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.3)' }} />
                  <input className="input-s" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Your full name" style={{ paddingLeft:42 }} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="label-s">Phone Number</label>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ display:'flex', alignItems:'center', padding:'0 12px', background:'rgba(255,255,255,.06)', border:'1.5px solid rgba(255,255,255,.1)', borderRadius:14, color:'rgba(255,255,255,.7)', fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>🇮🇳 +91</span>
                  <input className="input-s" style={{ flex:1, letterSpacing:'.08em', fontWeight:700 }}
                    type="tel" value={form.phone}
                    onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="10-digit number" maxLength={10} inputMode="numeric" />
                </div>
              </div>

              {/* OTP toggle */}
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                <div onClick={() => setUseOtp(!useOtp)} style={{ position:'relative', width:40, height:22 }}>
                  <div style={{ width:40, height:22, borderRadius:11, background:useOtp?'#F5A623':'rgba(255,255,255,.15)', transition:'background .2s' }} />
                  <div style={{ position:'absolute', top:3, left:useOtp?21:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)' }} />
                </div>
                <span style={{ color:'rgba(255,255,255,.55)', fontSize:13, fontWeight:500 }}>
                  {useOtp ? '✅ Register via OTP (recommended)' : '🔐 Register with password'}
                </span>
              </label>

              {/* Password fields (non-OTP) */}
              {!useOtp && (
                <>
                  <div>
                    <label className="label-s">Email (optional)</label>
                    <div style={{ position:'relative' }}>
                      <Mail size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.3)' }} />
                      <input className="input-s" type="email" value={form.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="email@example.com" style={{ paddingLeft:42 }} />
                    </div>
                  </div>
                  <div>
                    <label className="label-s">Password</label>
                    <div style={{ position:'relative' }}>
                      <Lock size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.3)' }} />
                      <input className="input-s" type={showPass?'text':'password'} value={form.password}
                        onChange={e => set('password', e.target.value)}
                        placeholder="Min. 6 characters" style={{ paddingLeft:42, paddingRight:44 }} />
                      <button onClick={() => setShowPass(!showPass)}
                        style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,.35)', cursor:'pointer', padding:2 }}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Driver fields */}
              {form.role === 'driver' && (
                <div style={{ background:'rgba(245,166,35,.06)', border:'1px solid rgba(245,166,35,.2)', borderRadius:16, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                  <p style={{ color:'rgba(245,166,35,.9)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', margin:0 }}>🚘 Vehicle Information</p>
                  <div>
                    <label className="label-s">Vehicle Type</label>
                    <select className="select-s" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                      <option value="">Select vehicle type</option>
                      <option value="auto">🛺 Auto Rickshaw</option>
                      <option value="bike">🏍️ Bike</option>
                      <option value="car">🚗 Car / Cab</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-s">Vehicle Number</label>
                    <input className="input-s" value={form.vehicleNumber}
                      onChange={e => set('vehicleNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. MH01AB1234" style={{ textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700 }} />
                  </div>
                </div>
              )}

              <button className="btn-amber" onClick={useOtp ? sendOTP : register} disabled={loading}>
                {loading
                  ? <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', border:'2px solid rgba(0,0,0,.2)', borderTopColor:'#111', animation:'spin .8s linear infinite' }} />
                  : useOtp ? <><span>Send OTP</span><ArrowRight size={16} /></> : <><span>Create Account</span><ArrowRight size={16} /></>}
              </button>
            </div>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {otpCode && (
                <div style={{ background:'rgba(74,222,128,.08)', border:'1px solid rgba(74,222,128,.2)', borderRadius:16, padding:16, textAlign:'center' }}>
                  <p style={{ color:'rgba(74,222,128,.7)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Demo OTP (for testing)</p>
                  <p style={{ color:'#4ade80', fontSize:32, fontWeight:900, letterSpacing:'.4em', margin:0 }}>{otpCode}</p>
                </div>
              )}
              <div>
                <label className="label-s">OTP sent to +91 {form.phone}</label>
                <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="••••" maxLength={6} inputMode="numeric" autoFocus
                  style={{ width:'100%', background:'rgba(255,255,255,.06)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:16, padding:16, color:'#fff', fontSize:36, fontWeight:900, letterSpacing:'.4em', textAlign:'center', outline:'none', fontFamily:'inherit', transition:'all .2s' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', borderRadius:12, padding:'10px 14px' }}>
                <CheckCircle size={14} style={{ color:'#818cf8', flexShrink:0 }} />
                <p style={{ color:'rgba(129,140,248,.8)', fontSize:12, margin:0 }}>OTP is valid for 5 minutes</p>
              </div>
              <button className="btn-amber" onClick={verifyOTP} disabled={loading || otp.length < 4}>
                {loading
                  ? <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', border:'2px solid rgba(0,0,0,.2)', borderTopColor:'#111', animation:'spin .8s linear infinite' }} />
                  : 'Verify & Register →'}
              </button>
              <button onClick={() => { setStep('form'); setOtp(''); setError(''); }}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:13, cursor:'pointer', padding:4, fontFamily:'inherit' }}>
                ← Change phone
              </button>
            </div>
          )}

          <p style={{ textAlign:'center', marginTop:20, color:'rgba(255,255,255,.4)', fontSize:13 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#F5A623', fontWeight:700, textDecoration:'none' }}>Login →</Link>
          </p>
        </div>

        {/* Features */}
        <div style={{ display:'flex', gap:20, marginTop:20, color:'rgba(255,255,255,.2)', fontSize:11, fontWeight:600, flexWrap:'wrap', justifyContent:'center' }}>
          <span>🔒 Secure & Private</span>
          <span>📍 Real-time Tracking</span>
          <span>⚡ Instant Booking</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;

