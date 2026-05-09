import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { useAuthStore } from '../../auth/store/use-auth-store';
import { toast } from 'sonner';

export default function DriverLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Call backend login API
    (async () => {
      try {
        const response = await api.post('/auth/login', { email, password });
        const user = response.data.data.user;
        const accessToken = response.data.data.accessToken;
        useAuthStore.getState().setAuth(user, accessToken);
        toast.success('Logged in successfully');
        navigate('/driver/dashboard');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    })();
  };

  return (
    <div className="bg-[#0a0b10] text-[#e2e8f0] min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-body relative overflow-hidden">
      <style>{`
        .panel-glass {
            background: rgba(22, 24, 33, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 1px 1px 0px 0px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .input-glass {
            background: rgba(13, 14, 20, 0.5);
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.8), inset -1px -1px 4px rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.03);
            transition: all 0.3s ease;
        }
        .input-glass:focus-within {
            border-color: rgba(99, 102, 241, 0.6);
            background: rgba(13, 14, 20, 0.7);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), inset 4px 4px 8px rgba(0, 0, 0, 0.8);
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animation-delay-2000 {
          animation-delay: -2s;
        }
        .animation-delay-4000 {
          animation-delay: -4s;
        }
        
        @keyframes gradient-x {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
        }
        .animate-gradient-x {
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
        }
      `}</style>

      {/* Vibrant Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#6366f1]/40 rounded-full blur-[120px] pointer-events-none animate-blob mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/30 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000 mix-blend-screen"></div>
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-fuchsia-600/30 rounded-full blur-[150px] pointer-events-none animate-blob animation-delay-4000 mix-blend-screen"></div>

      <main className="w-full max-w-[440px] panel-glass rounded-[40px] p-8 sm:p-12 flex flex-col items-center relative z-10">
        {/* Brand / Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center mb-6 text-white animate-gradient-x">
            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-gradient-x">RIDENOVA</h1>
          <p className="text-[#6366f1] font-black mt-2 text-xs tracking-[0.3em] uppercase">Driver Portal</p>
        </div>
        
        {/* Login Form */}
        <form className="w-full flex flex-col gap-6" onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
            <div className="relative input-glass rounded-2xl overflow-hidden">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#6366f1]">mail</span>
              <input 
                className="w-full bg-transparent text-white placeholder:text-slate-600 py-5 pl-14 pr-4 border-none font-bold text-sm outline-none" 
                placeholder="driver@ridenova.com" 
                required 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Password</label>
            <div className="relative input-glass rounded-2xl overflow-hidden">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#6366f1]">lock</span>
              <input 
                className="w-full bg-transparent text-white placeholder:text-slate-600 py-5 pl-14 pr-12 border-none font-bold text-sm tracking-widest outline-none" 
                placeholder="••••••••" 
                required 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none" 
                type="button"
                onClick={() => alert('View password toggled')}
              >
                <span className="material-symbols-outlined text-[20px]">visibility</span>
              </button>
            </div>
          </div>
          
          {/* Options Row */}
          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="w-5 h-5 rounded-md input-glass flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px] text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity">check</span>
              </div>
              <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Remember me</span>
            </label>
            <a className="text-xs font-black text-[#6366f1] hover:text-[#ec4899] transition-colors uppercase tracking-widest" href="#">Forgot?</a>
          </div>
          
          {/* Submit Button */}
          <button 
            className="mt-6 w-full py-5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x rounded-2xl text-white font-black text-sm tracking-widest shadow-[0_10px_25px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group uppercase" 
            type="submit"
          >
            <span>Login to Portal</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </form>
        
        {/* Registration Link */}
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-400">
            Want to drive with us? 
            <button onClick={() => navigate('/driver/registration')} className="text-[#6366f1] font-black hover:text-white transition-colors ml-2 uppercase tracking-widest text-xs">Register Now</button>
          </p>
        </div>
      </main>
    </div>
  );
}
