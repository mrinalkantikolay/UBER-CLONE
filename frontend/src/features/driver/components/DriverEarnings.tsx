import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

export default function DriverEarnings() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  const dailyData = [40, 60, 30, 90, 75, 50, 85];
  const weeklyData = [75, 85, 60, 95];
  const monthlyData = [50, 70, 45, 90, 60, 85, 40, 75, 55, 80, 65, 95];
  const [totalBalance, setTotalBalance] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/rides/history?limit=50');
        const fetchedRides = res.data.data.rides || [];
        const total = fetchedRides.reduce((s: number, r: any) => s + (r.fare || 0), 0);
        setTotalBalance(total);
      } catch (err: any) {
        // silent
      }
    })();
  }, []);
  
  const activeData = view === 'Daily' ? dailyData : view === 'Weekly' ? weeklyData : monthlyData;
  const labels = view === 'Daily' 
    ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    : view === 'Weekly'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/driver/earnings')}>
            <span className="material-symbols-outlined">payments</span>
            <span className="font-bold">Earnings</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/activity')}>
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
          <header className="mb-8 md:mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Earnings</h1>
            <p className="text-slate-400 mt-3 font-bold uppercase tracking-widest text-xs">Performance Hub & Payouts</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
            {/* Main Stats Column */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Cash Out Section */}
              <section className="panel-3d moving-left-shadow rounded-[3rem] p-8 md:p-12 flex flex-col items-center relative overflow-visible group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-bl-[200px] blur-3xl group-hover:bg-indigo-600/20 transition-all duration-700"></div>
                
                <span className="text-slate-500 font-black text-[10px] tracking-[0.2em] uppercase mb-4 z-10">Available Liquidity</span>
                <div className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 md:mb-10 z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  ${totalBalance != null ? totalBalance.toFixed(2) : '845'}<span className="text-2xl md:text-3xl text-slate-500">.20</span>
                </div>
                
                <button className="relative z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] rounded-2xl px-8 sm:px-12 py-4 sm:py-5 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:-translate-y-1 transition-all animate-gradient-x flex items-center gap-3 w-full sm:w-auto justify-center">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  Instant Transfer
                </button>
              </section>

              {/* Chart Section */}
              <section className="panel-3d moving-left-shadow rounded-[3rem] p-6 sm:p-10 border border-white/5 overflow-visible">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                  <h2 className="text-xl font-black text-white tracking-tight">Performance Overview</h2>
                  <div className="flex p-1 rounded-2xl input-inset w-full sm:w-auto">
                    <button 
                      onClick={() => setView('Daily')}
                      className={`flex-1 sm:px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'Daily' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    >
                      Daily
                    </button>
                    <button 
                      onClick={() => setView('Weekly')}
                      className={`flex-1 sm:px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'Weekly' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    >
                      Weekly
                    </button>
                    <button 
                      onClick={() => setView('Monthly')}
                      className={`flex-1 sm:px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'Monthly' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                
                <div className="h-56 w-full flex items-end justify-between px-2 gap-2 sm:gap-4 relative pb-8 pt-4">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 pb-8 pt-4">
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                  </div>
                  
                  {labels.map((day, i) => {
                    const isHighlighted = day === 'THU' || day === 'OCT' || day === 'Week 4';
                    const height = activeData[i];
                    return (
                      <div key={day} className="w-full flex justify-center items-end group relative" style={{ height: '100%' }}>
                        <div 
                          className={`w-full max-w-[24px] sm:max-w-[32px] rounded-t-xl transition-all cursor-pointer ${isHighlighted ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-[0_0_25px_rgba(99,102,241,0.5)] group-hover:scale-x-110' : 'input-inset group-hover:bg-indigo-500/20'}`}
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 panel-3d border border-indigo-500/30 text-white text-[9px] sm:text-[10px] font-black py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl uppercase tracking-widest z-20">
                            ${(height * 15.5).toFixed(2)}
                          </div>
                        </div>
                        <span className={`absolute -bottom-8 text-[7px] sm:text-[9px] font-black tracking-widest ${isHighlighted ? 'text-indigo-400' : 'text-slate-500'}`}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Recent Sessions Column */}
            <div className="lg:col-span-4">
              <section>
                <div className="flex justify-between items-end mb-8 px-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">Recent Sessions</h2>
                </div>
                <div className="panel-3d moving-left-shadow rounded-[2.5rem] p-4 sm:p-6 border border-white/5 flex flex-col gap-4 overflow-visible">
                  {[
                    { loc: 'Downtown', time: '2:45 PM', price: '$24.50', icon: 'directions_car' },
                    { loc: 'Airport', time: '9:15 AM', price: '$45.00', icon: 'directions_car' },
                    { loc: 'City Loop', time: '6:30 PM', price: '$18.75', icon: 'local_taxi' }
                  ].map((session, i) => (
                    <div key={i} className="input-inset rounded-2xl p-4 flex justify-between items-center group hover:border-indigo-500/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl panel-3d flex items-center justify-center text-indigo-400">
                          <span className="material-symbols-outlined text-xl">{session.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{session.loc}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{session.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-400 text-sm">{session.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* BottomNavBar (Mobile Only) */}
        <nav className="md:hidden bg-[#0a0b10]/95 backdrop-blur-xl border-t border-white/5 fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate('/driver/dashboard')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">dashboard</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Dash</span>
          </button>
          <button className="flex flex-col items-center justify-center text-indigo-400 gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Money</span>
          </button>
          <button onClick={() => navigate('/driver/activity')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">history</span>
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
