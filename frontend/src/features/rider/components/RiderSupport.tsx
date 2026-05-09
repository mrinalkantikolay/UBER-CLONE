import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function RiderSupport() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<{ title: string, content: string, icon: string, color: string, textClass: string } | null>(null);

  const supportOptions = [
    {
      id: 'help', title: 'Help Center', desc: 'Get support, report issues, or read FAQs.', icon: 'help_center', color: '#6366f1', textClass: 'text-[#6366f1]',
      content: 'Welcome to the RideNova Help Center. Here you can find articles on how to use the app, report issues with recent rides, and contact our 24/7 support team.'
    },
    {
      id: 'safety', title: 'Safety', desc: 'Manage trusted contacts and safety tools.', icon: 'gpp_good', color: '#10b981', textClass: 'text-emerald-500',
      content: 'Your safety is our priority. Set up trusted contacts, share your trip status in real-time, and access emergency services directly through the app.'
    },
    {
      id: 'refer', title: 'Refer & Earn', desc: 'Get $10 for every friend who rides.', icon: 'redeem', color: '#f43f5e', textClass: 'text-rose-500',
      content: 'Share your personal invite code (NOVA-ALEX24) with friends. When they take their first ride, you both get $10 added to your RideNova wallet!'
    },
    {
      id: 'settings', title: 'Settings', desc: 'Account details, privacy, and preferences.', icon: 'settings', color: '#3b82f6', textClass: 'text-blue-500',
      content: 'Manage your personal information, update communication preferences, review privacy settings, and customize your app experience.'
    }
  ];

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
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/promos')}>
            <span className="material-symbols-outlined">local_offer</span>
            <span className="font-medium">Promos</span>
          </a>
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/support')}>
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

        {/* Dynamic Content Area for Support & Settings */}
        <div className="pt-28 px-6 lg:px-12 max-w-[1600px] mx-auto w-full h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white">Support & Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {supportOptions.map(option => (
              <div 
                key={option.id}
                onClick={() => setActiveModal(option)}
                className="panel-3d moving-left-shadow rounded-[2rem] p-8 flex items-center gap-8 group hover:border-[#6366f1]/50 border border-white/5 transition-all cursor-pointer hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-visible"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-[#6366f1]/10 transition-all"></div>
                <div className="w-16 h-16 rounded-2xl input-inset flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                  <span className={`material-symbols-outlined ${option.textClass} text-3xl group-hover:drop-shadow-[0_0_10px_currentColor] transition-all`} style={{ fontVariationSettings: "'FILL' 1" }}>{option.icon}</span>
                </div>
                <div className="flex-1 relative z-10">
                  <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">{option.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{option.desc}</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-[#6366f1] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>
            ))}

          </div>
        </div>

      </main>

      {/* Dynamic Support Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-lg rounded-[2.5rem] overflow-hidden border border-white/10 p-8 relative transform transition-all">
            <div className="absolute top-4 right-4 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-500/10 transition-all text-slate-400 hover:text-rose-500" onClick={() => setActiveModal(null)}>
              <span className="material-symbols-outlined">close</span>
            </div>
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 rounded-2xl input-inset flex items-center justify-center mb-6">
                <span className={`material-symbols-outlined ${activeModal.textClass} text-4xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{activeModal.icon}</span>
              </div>
              <h3 className="text-3xl font-black text-white">{activeModal.title}</h3>
            </div>

            <div className="input-inset rounded-2xl p-6 text-slate-300 text-sm leading-relaxed mb-8 border border-white/5">
              {activeModal.content}
            </div>

            <button 
              onClick={() => setActiveModal(null)}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-4 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all animate-gradient-x"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
