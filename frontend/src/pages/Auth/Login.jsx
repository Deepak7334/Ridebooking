import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import axiosInstance from '../../api/axios';

const Login = () => {
  const navigate  = useNavigate();
  const [method,   setMethod]   = useState('otp');
  const [step,     setStep]     = useState('phone');
  const [phone,    setPhone]    = useState('');
  const [otpCode,  setOtpCode]  = useState('');
  const [otp,      setOtp]      = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const go = (role) => {
    if (role === 'driver') navigate('/driver');
    else if (role === 'admin') navigate('/admin');
    else navigate('/home');
  };

  const sendOTP = async () => {
    if (phone.length < 10) return setError('Enter a valid 10-digit number');
    setError(''); setLoading(true);
    try {
      const r = await axiosInstance.post('/auth/otp/send', { phone });
      setOtpCode(r.data.otp || '');
      setStep('otp');
    } catch (e) { setError(e.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length < 4) return setError('Enter the OTP');
    setError(''); setLoading(true);
    try {
      const r = await axiosInstance.post('/auth/otp/verify', { phone, otp });
      localStorage.setItem('authToken', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      go(r.data.user.role);
    } catch (e) { setError(e.response?.data?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const emailLogin = async () => {
    if (!email || !password) return setError('All fields required');
    setError(''); setLoading(true);
    try {
      const r = await axiosInstance.post('/auth/login', { email, password });
      localStorage.setItem('authToken', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      go(r.data.user.role);
    } catch (e) { setError(e.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  const handleKey = (e, fn) => { if (e.key === 'Enter') fn(); };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative" style={{ background: 'linear-gradient(145deg, #070b14 0%, #0e1528 50%, #070b14 100%)' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 30px rgba(245,166,35,.2)} 50%{box-shadow:0 0 60px rgba(245,166,35,.4)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .card { animation: fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        .logo-float { animation: float 4s ease-in-out infinite; }
        .input-f {
          width:100%; background:rgba(255,255,255,.05); border:1.5px solid rgba(255,255,255,.1);
          border-radius:14px; padding:14px 16px; color:#fff; font-size:15px; outline:none;
          transition:all .2s; font-family:inherit;
        }
        .input-f::placeholder{color:rgba(255,255,255,.3)}
        .input-f:focus{border-color:rgba(245,166,35,.5);background:rgba(255,255,255,.08)}
        .btn-main {
          width:100%; padding:15px; background:linear-gradient(135deg,#F5A623,#FF6B35);
          border:none; border-radius:14px; color:#111; font-weight:800; font-size:15px;
          cursor:pointer; font-family:inherit;
          box-shadow:0 6px 24px rgba(245,166,35,.35),inset 0 1px 0 rgba(255,255,255,.15);
          transition:all .2s cubic-bezier(.16,1,.3,1);
        }
        .btn-main:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 32px rgba(245,166,35,.5)}
        .btn-main:active:not(:disabled){transform:translateY(0)}
        .btn-main:disabled{opacity:.5;cursor:not-allowed}
        .tab { flex:1; padding:10px; border-radius:10px; font-size:13px; font-weight:700; border:none; cursor:pointer; transition:all .2s; font-family:inherit; }
        .tab-on{background:#fff;color:#1a1a2e}
        .tab-off{background:transparent;color:rgba(255,255,255,.5)}
        .otp-digit {
          width:100%; text-align:center; background:rgba(255,255,255,.06); border:1.5px solid rgba(255,255,255,.12);
          border-radius:16px; padding:16px; color:#fff; font-size:36px; font-weight:900; letter-spacing:.4em;
          outline:none; transition:all .2s; font-family:inherit;
        }
        .otp-digit:focus{border-color:rgba(245,166,35,.5);background:rgba(245,166,35,.05)}
      `}</style>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-80px', left:'-80px', width:'350px', height:'350px', borderRadius:'50%', background:'rgba(245,166,35,.07)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', bottom:'-100px', right:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(99,102,241,.08)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', top:'40%', right:'10%', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(245,100,35,.05)', filter:'blur(60px)' }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="logo-float inline-flex w-20 h-20 sm:w-24 sm:h-24 rounded-3xl items-center justify-center text-4xl sm:text-5xl mb-5 shadow-2xl"
            style={{ background:'linear-gradient(135deg,#F5A623,#FF6B35)', boxShadow:'0 8px 40px rgba(245,166,35,.45),0 0 0 1px rgba(255,255,255,.1) inset' }}>
            🏍️
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight">rapido</h1>
          <p className="text-white/40 mt-1.5 text-sm sm:text-base font-light">Fast · Safe · Affordable</p>
        </div>

        {/* Card */}
        <div className="card w-full max-w-sm sm:max-w-md" style={{ background:'rgba(255,255,255,.04)', backdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,.09)', borderRadius:'28px', padding:'28px', boxShadow:'0 30px 80px rgba(0,0,0,.5)' }}>
          <h2 className="text-white font-extrabold text-xl sm:text-2xl text-center mb-6">Welcome Back 👋</h2>

          {/* Method toggle */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6" style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)' }}>
            {[['otp','📱 Phone OTP'],['email','✉️ Email']].map(([m,l]) => (
              <button key={m} className={`tab ${method===m?'tab-on':'tab-off'}`}
                onClick={() => { setMethod(m); setStep(m==='otp'?'phone':m); setError(''); }}>
                {l}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.25)', borderRadius:'12px', padding:'11px 14px', marginBottom:'16px' }}>
              <p style={{ color:'#fca5a5', fontSize:'13px', textAlign:'center', fontWeight:600 }}>⚠️ {error}</p>
            </div>
          )}

          {/* OTP Flow */}
          {method === 'otp' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {step === 'phone' ? (
                <>
                  <div>
                    <label style={{ color:'rgba(255,255,255,.6)', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:'8px' }}>Phone Number</label>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <span style={{ display:'flex', alignItems:'center', padding:'0 14px', background:'rgba(255,255,255,.06)', border:'1.5px solid rgba(255,255,255,.1)', borderRadius:'14px', color:'rgba(255,255,255,.7)', fontSize:'14px', fontWeight:700, whiteSpace:'nowrap' }}>🇮🇳 +91</span>
                      <input className="input-f" type="tel" value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                        onKeyDown={e => handleKey(e, sendOTP)}
                        placeholder="10-digit number" maxLength={10} inputMode="numeric"
                        style={{ letterSpacing:'.1em', fontSize:'17px', fontWeight:700 }} />
                    </div>
                  </div>
                  <button className="btn-main" onClick={sendOTP} disabled={loading || phone.length < 10}>
                    {loading ? <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', border:'2px solid rgba(0,0,0,.2)', borderTopColor:'#111', animation:'spin .8s linear infinite' }} /> : <>Send OTP <ArrowRight size={16} style={{ display:'inline', marginLeft:4 }} /></>}
                  </button>
                </>
              ) : (
                <>
                  {otpCode && (
                    <div style={{ background:'rgba(74,222,128,.08)', border:'1px solid rgba(74,222,128,.2)', borderRadius:'16px', padding:'14px', textAlign:'center' }}>
                      <p style={{ color:'rgba(74,222,128,.7)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Demo OTP (shown for testing)</p>
                      <p style={{ color:'#4ade80', fontSize:'32px', fontWeight:900, letterSpacing:'.4em' }}>{otpCode}</p>
                    </div>
                  )}
                  <div>
                    <label style={{ color:'rgba(255,255,255,.6)', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:'8px' }}>Enter OTP for +91 {phone}</label>
                    <input className="otp-digit" type="text" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                      onKeyDown={e => handleKey(e, verifyOTP)}
                      placeholder="••••" maxLength={6} inputMode="numeric" autoFocus />
                  </div>
                  <button className="btn-main" onClick={verifyOTP} disabled={loading || otp.length < 4}>
                    {loading ? <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', border:'2px solid rgba(0,0,0,.2)', borderTopColor:'#111', animation:'spin .8s linear infinite' }} /> : 'Verify & Login →'}
                  </button>
                  <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:'13px', cursor:'pointer', padding:'4px', fontFamily:'inherit' }}>
                    ← Change number
                  </button>
                </>
              )}
            </div>
          )}

          {/* Email Flow */}
          {method === 'email' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ color:'rgba(255,255,255,.6)', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:'8px' }}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.3)' }} />
                  <input className="input-f" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => handleKey(e, emailLogin)}
                    placeholder="you@example.com"
                    style={{ paddingLeft:42 }} />
                </div>
              </div>
              <div>
                <label style={{ color:'rgba(255,255,255,.6)', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:'8px' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.3)' }} />
                  <input className="input-f" type={showPass?'text':'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => handleKey(e, emailLogin)}
                    placeholder="••••••••"
                    style={{ paddingLeft:42, paddingRight:46 }} />
                  <button onClick={() => setShowPass(!showPass)}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,.35)', cursor:'pointer', padding:2 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Admin hint */}
              <div style={{ background:'rgba(147,51,234,.08)', border:'1px solid rgba(147,51,234,.2)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                <Shield size={14} style={{ color:'#a78bfa', flexShrink:0 }} />
                <p style={{ color:'rgba(167,139,250,.8)', fontSize:'12px', fontWeight:500, margin:0 }}>Admin login: use email tab with your credentials</p>
              </div>

              <button className="btn-main" onClick={emailLogin} disabled={loading}>
                {loading ? <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', border:'2px solid rgba(0,0,0,.2)', borderTopColor:'#111', animation:'spin .8s linear infinite' }} /> : 'Login →'}
              </button>
            </div>
          )}

          <p style={{ textAlign:'center', marginTop:20, color:'rgba(255,255,255,.4)', fontSize:'13px' }}>
            New here?{' '}
            <Link to="/signup" style={{ color:'#F5A623', fontWeight:700, textDecoration:'none' }}>Create Account →</Link>
          </p>
        </div>

        {/* Trust indicators */}
        <div style={{ display:'flex', gap:20, marginTop:24, color:'rgba(255,255,255,.2)', fontSize:'11px', fontWeight:600 }}>
          <span>🔒 Secure Login</span>
          <span>📍 GPS Tracking</span>
          <span>⭐ Rated Drivers</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
