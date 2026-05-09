import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/use-auth-store';
import api from '../../../lib/api';
import { toast } from 'sonner';

export function LoginOTP() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const response = await api.post('/auth/signup', {
          name,
          email,
          phone,
          password
        });
        
        const { accessToken, user } = response.data.data;
        setAuth(user, accessToken);
        toast.success('Account created successfully');
        navigate('/dashboard');
      } else {
        const response = await api.post('/auth/login', {
          email,
          password
        });
        
        const { accessToken, user } = response.data.data;
        setAuth(user, accessToken);
        toast.success('Logged in successfully');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0b10] text-[#e2e8f0] min-h-screen flex flex-col font-body">
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

      {/* TopNavBar */}
      <header className="w-full top-0 sticky flex justify-between items-center px-8 py-4 max-w-full mx-auto z-50 bg-[#0a0b10]/95 backdrop-blur-lg border-b border-white/5">
        <div className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent cursor-pointer animate-gradient-x" onClick={() => navigate('/')}>
          RIDENOVA
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <span className="text-sm font-medium text-slate-400 hover:text-white cursor-pointer transition-colors">Help</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Vibrant Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#6366f1]/40 rounded-full blur-[120px] pointer-events-none animate-blob mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/30 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-fuchsia-600/30 rounded-full blur-[150px] pointer-events-none animate-blob animation-delay-4000 mix-blend-screen"></div>

        <div className="max-w-md w-full panel-glass rounded-[2.5rem] p-10 relative z-10">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-gradient-x">
              <span className="material-symbols-outlined text-white text-3xl">
                {isSignUp ? 'person_add' : 'login'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {isSignUp ? 'Join RideNova and start riding today.' : 'Enter your email and password to continue.'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Full Name</label>
                  <div className="relative input-glass rounded-xl overflow-hidden">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] material-symbols-outlined">person</span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder:text-slate-500 text-sm font-bold transition-all outline-none" 
                      placeholder="John Doe" 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                  <div className="relative input-glass rounded-xl overflow-hidden">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] material-symbols-outlined">smartphone</span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder:text-slate-500 text-sm font-bold transition-all outline-none" 
                      placeholder="+1 (555) 000-0000" 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <div className="relative input-glass rounded-xl overflow-hidden">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] material-symbols-outlined">mail</span>
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder:text-slate-500 text-sm font-bold transition-all outline-none" 
                  placeholder="john@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Password</label>
              <div className="relative input-glass rounded-xl overflow-hidden">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] material-symbols-outlined">lock</span>
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder:text-slate-500 text-sm font-bold transition-all outline-none" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x rounded-xl text-white font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_25px_rgba(139,92,246,0.5)] flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
              {!isLoading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-slate-400 text-sm font-medium">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#6366f1] font-bold hover:text-white transition-colors ml-2"
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#0a0b10] flex flex-col md:flex-row justify-between items-center px-8 py-6 mt-auto">
        <div className="text-sm font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent animate-gradient-x mb-4 md:mb-0">
          RIDENOVA
        </div>
        <div className="flex gap-8 mb-4 md:mb-0">
          <a className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-colors cursor-pointer">Privacy Policy</a>
          <a className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-colors cursor-pointer">Terms of Service</a>
          <a className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-colors cursor-pointer">Safety</a>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">© 2024 RideNova Inc.</div>
      </footer>
    </div>
  );
}
