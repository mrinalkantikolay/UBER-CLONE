import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';


export default function DriverActivity() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/rides/history?limit=20');
        setRides(res.data.data.rides || []);
      } catch (err: any) {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="font-body min-h-screen flex flex-col md:flex-row overflow-x-hidden bg-[#0a0b10] text-[#e2e8f0] relative">
      <style>{`
        .panel-3d {
            background: rgba(22, 24, 33, 0.7);
            backdrop-filter: blur(20px);
            box-shadow: -4px -4px 12px rgba(255, 255, 255, 0.05), 10px 10px 24px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255,255,255,0.05);
        }
        .input-inset {
            background: rgba(13, 14, 20, 0.8);
            box-shadow: inset 4px 4px 12px rgba(0, 0, 0, 0.8), inset -2px -2px 6px rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255,255,255,0.02);
        }
        .nav-sidebar {
            background: rgba(22, 24, 33, 0.85);
            backdrop-filter: blur(24px);
            box-shadow: 10px 0px 30px rgba(0, 0, 0, 0.6);
            border-right: 1px solid rgba(255,255,255,0.05);
        }
        .nav-item-active {
            background: linear-gradient(145deg, rgba(99,102,241,0.15), rgba(236,72,153,0.1), rgba(99,102,241,0.15));
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
            box-shadow: inset 2px 2px 8px rgba(0, 0, 0, 0.4), inset -1px -1px 4px rgba(255, 255, 255, 0.05);
            color: #d8b4fe;
            border: 1px solid rgba(168,85,247,0.3);
        }
        .accent-glow {
            background: linear-gradient(135deg, #6366f1, #ec4899);
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(99, 102, 241, 0.3);
            animation: pulse-glow 3s infinite alternate;
        }
        @keyframes pulse-glow {
            0% { box-shadow: 0 0 15px rgba(236, 72, 153, 0.4), 0 0 25px rgba(99, 102, 241, 0.2); }
            100% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.8), 0 0 50px rgba(99, 102, 241, 0.6); }
        }
        .animate-gradient-x {
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
        }
        @keyframes gradient-x {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
        }
        @keyframes move-beam {
            0% { background-position: 0% 100%; }
            100% { background-position: 100% 0%; }
        }
        .moving-left-shadow {
            position: relative;
        }
        .moving-left-shadow::before {
            content: '';
            position: absolute;
            inset: -3px 0 0 -3px;
            border-radius: inherit;
            padding: 3px 0 0 3px;
            background: linear-gradient(to top right, 
                rgba(46,139,87,0) 0%, 
                rgba(32,178,170,0.9) 25%, 
                rgba(46,139,87,0) 50%, 
                rgba(32,178,170,0.9) 75%, 
                rgba(46,139,87,0) 100%);
            background-size: 200% 200%;
            animation: move-beam 4s linear infinite;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            filter: blur(1.5px);
            z-index: -1;
            pointer-events: none;
        }
      `}</style>

      {/* Ambient Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-600/15 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none animate-pulse z-0 delay-1000"></div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* SideNavBar */}
      <aside className={`flex flex-col fixed left-0 top-0 h-full w-64 nav-sidebar p-4 z-50 rounded-r-3xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center accent-glow">
            <span className="material-symbols-outlined text-white text-2xl">local_taxi</span>
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight uppercase">Driver Portal</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-black">Online</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/dashboard')}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-bold">Dashboard</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/earnings')}>
            <span className="material-symbols-outlined">payments</span>
            <span className="font-bold">Earnings</span>
          </a>
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/driver/activity')}>
            <span className="material-symbols-outlined">history</span>
            <span className="font-bold">Activity</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/documents')}>
            <span className="material-symbols-outlined">folder</span>
            <span className="font-bold">Documents</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/profile')}>
            <span className="material-symbols-outlined">person</span>
            <span className="font-bold">Profile</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-rose-400 transition-all cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">logout</span>
            <span className="font-bold">Logout</span>
          </a>
        </nav>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 md:ml-64 relative overflow-hidden bg-[#0a0b10] pb-24 md:pb-0">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-4 md:px-6 py-4 h-20 fixed top-0 left-0 right-0 md:left-64 bg-[#0a0b10]/95 backdrop-blur-lg z-30 border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div 
              className="md:hidden w-10 h-10 panel-3d rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-slate-300">menu</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tighter cursor-pointer drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-gradient-x" onClick={() => navigate('/')}>RIDENOVA</h1>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-emerald-400 font-black px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Driver</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`}></div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300">{isOnline ? 'On' : 'Off'}</span>
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className="text-white hover:text-emerald-400 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl sm:text-3xl leading-none">
                  {isOnline ? 'toggle_on' : 'toggle_off'}
                </span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group px-1 sm:px-2 py-1 rounded-2xl hover:bg-white/5 transition-all" onClick={() => navigate('/driver/profile')}>
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-white">Marcus</p>
                <p className="text-[10px] text-slate-500">Gold Driver</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#6366f1]/30 shrink-0">
                <img src="https://lh3.googleusercontent.com/aida-public/AOUrY4izGk43cT7eNINzJvE7-G5uW-m8J816Xm8fRy9x" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-28 md:pt-32 px-4 sm:px-6 max-w-7xl mx-auto">
          <header className="mb-8 md:mb-10 text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Activity Log</h1>
            <p className="text-slate-400 mt-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Full Mission History & Ledger</p>
          </header>

          <section className="panel-3d moving-left-shadow rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 border border-white/5 overflow-visible mb-10">
            <div className="space-y-4">
              {rides.map((r, i) => (
                <div key={r.id || i} className="input-inset rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex justify-between items-center group hover:border-indigo-500/30 transition-all cursor-pointer gap-4">
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl panel-3d flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-xl sm:text-2xl">directions_car</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-white text-base sm:text-lg tracking-tight truncate">{r.driver ? 'Drive: ' + (r.driver.name || r.driverId) : 'Ride'}</p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-indigo-400 text-lg sm:text-xl tracking-tighter">${(r.fare || 0).toFixed(2)}</p>
                    <span className="hidden sm:inline-block text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* BottomNavBar (Mobile Only) */}
        <nav className="md:hidden bg-[#0a0b10]/95 backdrop-blur-xl border-t border-white/5 fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate('/driver/dashboard')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">dashboard</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Dash</span>
          </button>
          <button onClick={() => navigate('/driver/earnings')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">payments</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Money</span>
          </button>
          <button className="flex flex-col items-center justify-center text-indigo-400 gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Logs</span>
          </button>
          <button onClick={() => navigate('/driver/documents')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Docs</span>
          </button>
          <button onClick={() => navigate('/driver/profile')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">person</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
