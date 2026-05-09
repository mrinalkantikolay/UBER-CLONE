import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { useAuthStore } from '../../auth/store/use-auth-store';

export function RiderHistory() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [selectedRide, setSelectedRide] = useState<any>(null);

  const { user, logout } = useAuthStore();
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/rides/history');
        if (response.data.data && response.data.data.rides) {
          const formattedRides = response.data.data.rides.map((r: any) => {
            let statusStr = r.status;
            let icon = 'directions_car';
            let color = '#6366f1';
            
            if (r.status === 'COMPLETED') {
              statusStr = 'Completed';
              color = '#10b981';
            } else if (r.status === 'CANCELLED') {
              statusStr = 'Cancelled';
              color = '#f43f5e';
              icon = 'cancel';
            }

            return {
              id: r.id,
              destination: r.destinationAddress || 'Unknown Destination',
              date: new Date(r.createdAt).toLocaleString(),
              price: `$${(r.fareAmount || 0).toFixed(2)}`,
              status: statusStr,
              icon,
              color,
              type: r.category || 'RideNovaX',
              driver: r.driver
            };
          });
          setRides(formattedRides);
        }
      } catch (error) {
        console.error('Error fetching ride history:', error);
      }
    };
    fetchHistory();
  }, []);

  const filteredRides = filterType === 'All' ? rides : rides.filter(r => r.status === filterType);

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
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/history')}>
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
                <p className="text-sm font-bold text-white">{user?.name || 'Rider'}</p>
                <p className="text-[10px] text-slate-500">Premium Member</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#6366f1]/30 shrink-0">
                <img alt={user?.name || 'Rider'} className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEi2hWgxtHxNtFSZn4702AbTI2v41XH7xZbpQmRalgfjWGWdswATZaGL3ZAKPlHCvTzC3mekZrh0IvnD2xlS1w-TEn6hn0N__GiRkljB-8eIAkBEjoaa1QCTE9dzL9YnToWzrqp5f-tfKGf0uwlMivUx3hEvjCnMiDbMmMbLQfatFSQGkjFeQHN0c8LbX1YLAegSySy0lfS1xwnMcyUd12_4BDN2YNwXi_GJvBrduO1XRB4YD4mkwEhP9q2FB2ucvCCSXU8qw4ZPc" />
              </div>
            </div>
            <button 
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-10 h-10 rounded-xl panel-3d flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shrink-0"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area for History */}
        <div className="pt-28 px-6 lg:px-12 max-w-[1600px] mx-auto w-full h-full pb-10">
          <div className="flex justify-between items-center mb-8 relative">
            <h2 className="text-3xl font-black tracking-tight text-white">Ride History</h2>
            
            <div>
              <button 
                className="panel-3d moving-left-shadow px-4 py-2 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 hover:text-white transition-all"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                {filterType === 'All' ? 'Filter' : filterType}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-12 w-48 panel-3d rounded-xl overflow-hidden z-20 border border-[#6366f1]/20">
                  {['All', 'Completed', 'Cancelled'].map(type => (
                    <div 
                      key={type}
                      className={`px-4 py-3 text-sm font-bold cursor-pointer transition-all ${filterType === type ? 'bg-[#6366f1]/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                      onClick={() => {
                        setFilterType(type);
                        setIsFilterOpen(false);
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel-3d moving-left-shadow rounded-[2rem] p-6 lg:p-8 border border-white/5 space-y-6">
            
            {filteredRides.map((ride) => (
              <div 
                key={ride.id}
                className={`input-inset rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-[#6366f1]/30 border border-transparent transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] ${ride.status === 'Cancelled' ? 'opacity-70' : ''}`}
                onClick={() => setSelectedRide(ride)}
              >
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl panel-3d flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl" style={{ color: ride.color, fontVariationSettings: "'FILL' 1" }}>{ride.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">{ride.destination}</p>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span> {ride.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-left md:text-right">
                    <p className={`font-black text-xl tabular-nums ${ride.status === 'Cancelled' ? 'text-slate-400' : 'text-white'}`}>{ride.price}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block shadow-[0_0_10px_rgba(0,0,0,0.5)] ${ride.status === 'Completed' ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' : 'text-rose-400 bg-rose-500/20 border border-rose-500/30'}`}>
                      {ride.status}
                    </p>
                  </div>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-[#6366f1] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredRides.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-medium">
                No rides found for the selected filter.
              </div>
            )}

          </div>
        </div>

      </main>

      {/* Ride Details Modal */}
      {selectedRide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-lg rounded-[2.5rem] overflow-hidden border border-white/10 relative transform transition-all">
            {/* Modal Header Map Placeholder */}
            <div className="h-48 bg-slate-800 relative w-full overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-black/80 transition-all text-white z-10" onClick={() => setSelectedRide(null)}>
                <span className="material-symbols-outlined">close</span>
              </div>
              
              {/* Path simulation */}
              <svg className="absolute inset-0 w-full h-full text-[#6366f1] stroke-current stroke-2 fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 20 80 Q 50 20 80 50" strokeDasharray="5,5" />
                <circle cx="20" cy="80" r="3" fill="#10b981" />
                <circle cx="80" cy="50" r="3" fill="#f43f5e" />
              </svg>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedRide.destination}</h3>
                  <p className="text-sm text-slate-400 mt-1">{selectedRide.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#6366f1] tabular-nums">{selectedRide.price}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{selectedRide.type}</p>
                </div>
              </div>

              <div className="input-inset rounded-2xl p-4 flex items-center gap-4 mb-6 border border-[#6366f1]/20">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0">
                  <img src="https://i.pravatar.cc/150?img=11" alt="Driver" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{selectedRide?.driver?.name || 'Unknown Driver'}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    4.9 <span className="material-symbols-outlined text-[12px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white text-sm tracking-widest">{selectedRide?.driver?.vehicle || 'ABC-1234'}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Vehicle</p>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 animate-gradient-x">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span> Download Receipt
                </button>
                {selectedRide.status === 'Completed' && (
                  <button className="w-full bg-white/5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 py-3 rounded-xl text-sm font-bold transition-all border border-transparent hover:border-rose-500/30">
                    Report an Issue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
