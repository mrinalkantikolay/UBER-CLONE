import React, { type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  searchSlot?: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, searchSlot }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-[#0a0b10] text-[#e2e8f0] min-h-screen flex font-body relative overflow-hidden">
      <style>{`
        .panel-3d {
            background: rgba(22, 24, 33, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 1px 1px 0px 0px rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .moving-left-shadow {
            position: relative;
        }
        .moving-left-shadow::before {
            content: "";
            position: absolute;
            inset: 0;
            padding: 2px;
            border-radius: inherit;
            background: linear-gradient(135deg, transparent 40%, rgba(129, 140, 248, 0.6), transparent 60%);
            background-size: 200% 200%;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: move-beam 4s linear infinite;
            pointer-events: none;
        }
        @keyframes move-beam {
            0% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
        }
        .input-inset {
            background: rgba(13, 14, 20, 0.5);
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.8), inset -1px -1px 4px rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.03);
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
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
        
        /* Premium Moving Gradient Text/Buttons */
        @keyframes gradient-x {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
        }
        .animate-gradient-x {
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
        }
        
        /* Active Nav Item - Parity with Rider/Driver */
        .nav-item-active {
            background: linear-gradient(145deg, rgba(99,102,241,0.15), rgba(236,72,153,0.1), rgba(99,102,241,0.15));
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
            box-shadow: inset 2px 2px 8px rgba(0, 0, 0, 0.4), inset -1px -1px 4px rgba(255, 255, 255, 0.05);
            color: #d8b4fe !important;
            border: 1px solid rgba(168,85,247,0.3) !important;
        }

        /* Pulsing Accent Glow for Icons */
        .accent-glow {
            background: linear-gradient(135deg, #6366f1, #ec4899);
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(99, 102, 241, 0.3);
            animation: pulse-glow 3s infinite alternate;
        }
        @keyframes pulse-glow {
            0% { box-shadow: 0 0 15px rgba(236, 72, 153, 0.4), 0 0 25px rgba(99, 102, 241, 0.2); }
            100% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.8), 0 0 50px rgba(99, 102, 241, 0.6); }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
      `}</style>

      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-blob mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000 mix-blend-screen"></div>
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none animate-blob animation-delay-4000 mix-blend-screen"></div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 flex-shrink-0 h-screen p-6 fixed md:relative z-50 md:z-20 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="panel-3d rounded-[2.5rem] h-full flex flex-col p-6 overflow-hidden">
          {/* Branding */}
          <div className="flex items-center gap-4 mb-12 px-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-12 h-12 rounded-2xl accent-glow flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tighter animate-gradient-x drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">RIDENOVA</h1>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Admin Console</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3">
            {[
              { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
              { to: '/admin/rides', icon: 'route', label: 'Rides' },
              { to: '/admin/drivers', icon: 'directions_car', label: 'Drivers' },
              { to: '/admin/users', icon: 'group', label: 'Users' },
              { to: '/admin/payments', icon: 'payments', label: 'Payments' },
              { to: '/admin/analytics', icon: 'monitoring', label: 'Analytics' },
            ].map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                  isActive(link.to) 
                    ? 'nav-item-active' 
                    : 'border border-transparent hover:border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${isActive(link.to) ? 'text-indigo-300' : ''}`} style={isActive(link.to) ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {link.icon}
                </span>
                <span className="text-sm font-black uppercase tracking-widest">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile Summary */}
          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-4 p-4 rounded-3xl input-inset bg-white/5">
              <div className="w-10 h-10 rounded-xl bg-center bg-cover border border-white/10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwXvyfeh1ZgBNfXKXzLlZ49lUH7DZe794d07pMXj_d1KB4A8XsO13FeqtrwMtv_zmFqk6QW78jxs8iBamrebMQyqEcAgNMrUlu4xxBTpQWfD11rdw05KqUF1mj7unBTz_3HRtqsDjaZeGaN62ruMqhjkrs6m0WDNqIitTAqEGJzhEWCVpmj_zhKGJIL4hhmcO3XD4MUxuZ0U2lFdeLU7voEg4113jkQVQ3hBZ7TqOblHJQIwqaxRRTmpW64KZcrXNxzYrhETHbBWc')" }}></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">Super Admin</p>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    Online
                </p>
              </div>
              <button onClick={() => navigate('/')} className="text-slate-500 hover:text-rose-400 transition-colors">
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 py-6 pr-6 pl-6 md:pl-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 px-4 gap-4">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            {/* Hamburger Menu - Only on Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-12 h-12 panel-3d rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all border border-white/5 shrink-0"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex-1">
              {searchSlot ? searchSlot : (
                <div className="relative input-inset rounded-2xl overflow-hidden group border border-white/5 focus-within:border-indigo-500/30 transition-all">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform">search</span>
                  <input 
                    className="w-full bg-transparent py-4 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-600" 
                    placeholder="Search resources, users, or logs..." 
                    type="text" 
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
             <button className="hidden sm:flex w-12 h-12 rounded-2xl panel-3d items-center justify-center text-slate-400 hover:text-indigo-400 transition-all border border-white/5 relative group">
               <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">notifications</span>
               <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border border-[#0a0b10] shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
             </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-12">
          {/* Page Title Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x tracking-tight mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] pb-2 inline-block">
              {title}
            </h1>
            {subtitle && <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{subtitle}</p>}
          </div>

          {/* Children Content */}
          {children}
        </div>
      </main>

      {/* Admin Floating Action Button (FAB) - Signature Element */}
      <button className="fixed bottom-12 right-12 w-16 h-16 accent-glow rounded-2xl flex items-center justify-center text-white shadow-[0_12px_32px_rgba(99,102,241,0.6)] z-50 transition-all hover:scale-110 active:scale-95 group">
        <span className="material-symbols-outlined text-3xl transition-transform group-hover:rotate-180 duration-500">terminal</span>
      </button>
    </div>
  );
};

export default AdminLayout;
