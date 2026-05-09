import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function RiderPromos() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        .animate-gradient-y {
            background-size: 100% 200%;
            animation: gradient-y 3s linear infinite;
        }
        @keyframes gradient-y {
            0% { background-position: center 0%; }
            100% { background-position: center 200%; }
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
        <div className="mb-10 px-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center accent-glow">
            <span className="material-symbols-outlined text-white text-xl">electric_car</span>
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">Rider Gold</span>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Premium Member</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-semibold">Dashboard</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/history')}>
            <span className="material-symbols-outlined">history</span>
            <span className="font-medium">History</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/payments')}>
            <span className="material-symbols-outlined">payments</span>
            <span className="font-medium">Payments</span>
          </a>
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/promos')}>
            <span className="material-symbols-outlined">local_offer</span>
            <span className="font-medium">Promos</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/support')}>
            <span className="material-symbols-outlined">support_agent</span>
            <span className="font-medium">Support</span>
          </a>
        </nav>

      </aside>

      {/* Main Canvas */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 relative overflow-hidden bg-[#0a0b10]">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-4 md:px-6 py-4 h-20 fixed top-0 left-0 right-0 md:left-64 bg-[#0a0b10]/95 backdrop-blur-lg z-30 border-b border-white/5">
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div 
              className="md:hidden w-10 h-10 panel-3d rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-slate-300">menu</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tighter cursor-pointer drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-gradient-x" onClick={() => navigate('/')}>RIDENOVA</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end ml-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer group px-2 py-1 rounded-2xl hover:bg-white/5 transition-all"
              onClick={() => navigate('/profile')}
            >
              <div className="text-right">
                <p className="text-sm font-bold text-white">Alex Chen</p>
                <p className="text-[10px] text-slate-500">Premium Member</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#6366f1]/30 shrink-0">
                <img alt="Alex Chen" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEi2hWgxtHxNtFSZn4702AbTI2v41XH7xZbpQmRalgfjWGWdswATZaGL3ZAKPlHCvTzC3mekZrh0IvnD2xlS1w-TEn6hn0N__GiRkljB-8eIAkBEjoaa1QCTE9dzL9YnToWzrqp5f-tfKGf0uwlMivUx3hEvjCnMiDbMmMbLQfatFSQGkjFeQHN0c8LbX1YLAegSySy0lfS1xwnMcyUd12_4BDN2YNwXi_GJvBrduO1XRB4YD4mkwEhP9q2FB2ucvCCSXU8qw4ZPc" />
              </div>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl panel-3d flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shrink-0"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area for Promos */}
        <div className="pt-28 px-6 lg:px-12 max-w-[1600px] mx-auto w-full h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white">Promos & Offers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo Card 1 */}
            <div className="panel-3d moving-left-shadow rounded-[2rem] p-8 flex flex-col justify-between group hover:border-[#6366f1]/50 border border-white/5 transition-all relative overflow-visible cursor-pointer hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6366f1]/10 rounded-full blur-3xl group-hover:bg-[#6366f1]/25 transition-all"></div>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl input-inset text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Active</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 group-hover:text-indigo-300 transition-colors">50% Off Next Ride</h3>
                <p className="text-slate-400 leading-relaxed">Valid on all rides up to $15 off.</p>
              </div>
              <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Code</p>
                  <p className="font-mono text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mt-1">WELCOME50</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Expires</p>
                  <p className="text-sm font-bold text-white mt-1">Oct 31, 2026</p>
                </div>
              </div>
            </div>

            {/* Promo Card 2 */}
            <div className="panel-3d moving-left-shadow rounded-[2rem] p-8 flex flex-col justify-between group hover:border-[#6366f1]/50 border border-white/5 transition-all relative overflow-visible cursor-pointer hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/25 transition-all"></div>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl input-inset text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
                  </div>
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">Active</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 group-hover:text-blue-300 transition-colors">$20 Off Airport Trips</h3>
                <p className="text-slate-400 leading-relaxed">Valid for rides to/from JFK, LGA, EWR.</p>
              </div>
              <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Code</p>
                  <p className="font-mono text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mt-1">AIRPORT20</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Expires</p>
                  <p className="text-sm font-bold text-white mt-1">Nov 15, 2026</p>
                </div>
              </div>
            </div>

            {/* Promo Card 3 - Used */}
            <div className="panel-3d moving-left-shadow rounded-[2rem] p-6 flex flex-col justify-between opacity-60 overflow-visible">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <span className="bg-slate-500/20 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Used</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Free Priority Pickup</h3>
                <p className="text-sm text-slate-400">Priority matching with top drivers.</p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Code</p>
                  <p className="font-mono text-lg font-bold text-slate-500 mt-0.5 line-through">VIPRIDE</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Used On</p>
                  <p className="text-sm font-bold text-white mt-1">Oct 10, 2026</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>


    </div>
  );
}
