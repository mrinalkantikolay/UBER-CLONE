import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/store/use-auth-store';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ROUTE_POSITIONS: [number, number][] = [
  [37.774938,-122.419449],[37.775026,-122.41934],[37.775098,-122.419253],[37.775175,-122.41916],[37.775254,-122.419061],[37.775448,-122.418811],[37.775474,-122.418776],[37.775495,-122.418747],[37.77555,-122.418675],[37.775604,-122.4186],[37.77572,-122.418445],[37.776185,-122.417856],[37.776207,-122.417828],[37.776227,-122.417802],[37.776364,-122.417629],[37.776509,-122.417447],[37.776455,-122.417378],[37.776083,-122.416923],[37.775764,-122.416527],[37.7757,-122.416447],[37.775357,-122.416022],[37.775278,-122.415923],[37.77535,-122.415833],[37.775438,-122.415721],[37.775604,-122.415511],[37.775893,-122.415147],[37.776056,-122.41494],[37.776151,-122.414821],[37.776233,-122.414717],[37.776303,-122.414628],[37.776427,-122.414472],[37.776469,-122.41442],[37.776578,-122.414282],[37.776706,-122.414121],[37.77726,-122.413421],[37.777388,-122.41326],[37.777455,-122.413175],[37.777388,-122.413091],[37.777324,-122.41301],[37.777266,-122.412937],[37.777255,-122.412924],[37.777018,-122.412627],[37.776702,-122.412229],[37.776653,-122.412168],[37.776728,-122.412074],[37.778347,-122.410036],[37.77842,-122.409945],[37.77847,-122.409881],[37.778488,-122.409858],[37.779053,-122.409146],[37.779234,-122.408918],[37.779305,-122.408829],[37.780111,-122.407809],[37.780125,-122.407791],[37.78018,-122.407721],[37.780243,-122.40764],[37.780739,-122.407002],[37.781193,-122.406418],[37.781282,-122.406304],[37.781292,-122.406291],[37.781314,-122.406262],[37.781334,-122.406238],[37.781507,-122.406019],[37.781842,-122.405595],[37.781862,-122.40557],[37.781934,-122.405479],[37.78204,-122.405611],[37.782064,-122.40564],[37.782109,-122.405702],[37.782133,-122.405742],[37.782307,-122.405958],[37.782385,-122.406045],[37.782518,-122.406193],[37.782684,-122.406404],[37.782737,-122.406487],[37.782811,-122.406597],[37.782853,-122.406648],[37.782896,-122.406701],[37.783178,-122.407048],[37.783295,-122.40719],[37.783532,-122.407481],[37.783661,-122.407638],[37.783868,-122.407893],[37.783912,-122.407947],[37.784001,-122.408057],[37.784013,-122.408071],[37.784025,-122.408087],[37.784101,-122.408189],[37.784175,-122.408283],[37.784252,-122.408378],[37.784293,-122.40843],[37.784339,-122.408486],[37.784364,-122.408509],[37.78439,-122.408523],[37.784422,-122.408529],[37.784462,-122.408532],[37.784538,-122.408538],[37.784621,-122.408548],[37.784705,-122.40856],[37.784789,-122.408576],[37.78508,-122.408634],[37.785325,-122.408681],[37.785394,-122.408696],[37.785301,-122.409431],[37.78529,-122.409513],[37.78522,-122.409499],[37.784896,-122.409434]
];

export function RiderDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pickup, setPickup] = useState('128 Tech Plaza, San Francisco');
  const [destination, setDestination] = useState('');
  
  const [homeAddress, setHomeAddress] = useState('72 Oakwood St, San Francisco');
  const [workAddress, setWorkAddress] = useState('Nova HQ Tower 4, San Francisco');
  const [favPlace, setFavPlace] = useState({ name: 'The Coffee House', address: '123 Market St, San Francisco' });
  const [isEditingLocation, setIsEditingLocation] = useState<{type: 'Home' | 'Work' | 'Favorite', name?: string, address: string} | null>(null);

  const [mounted, setMounted] = useState(false);
  const [map, setMap] = useState<any>(null);
  
  const [activeRide, setActiveRide] = useState<any>(null);
  const [isLoadingRide, setIsLoadingRide] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchActiveRide = async () => {
      try {
        const response = await api.get('/rides/active');
        if (response.data.data) {
          setActiveRide(response.data.data);
        }
      } catch (error) {
        // No active ride
      }
    };
    fetchActiveRide();
  }, []);

  let driverStatusText = 'Ongoing Ride';
  if (activeRide?.status === 'ACCEPTED') driverStatusText = 'Driver En Route';
  else if (activeRide?.status === 'ARRIVED') driverStatusText = 'Driver Arrived';
  else if (activeRide?.status === 'IN_PROGRESS') driverStatusText = 'Ride in Progress';


  const destIcon = useMemo(() => {
    return divIcon({
      className: 'custom-dest-icon',
      html: `
        <div class="flex flex-col items-center" style="transform: translate(-50%, -100%);">
          <div class="px-3 py-1 bg-black rounded-full mb-1 text-[10px] font-black text-white uppercase tracking-widest border border-white/20 whitespace-nowrap">Destination</div>
          <span class="material-symbols-outlined text-rose-500 text-4xl" style="font-variation-settings: 'FILL' 1">location_on</span>
        </div>
      `,
      iconSize: [100, 60],
      iconAnchor: [50, 60]
    });
  }, []);

  const pickupIcon = useMemo(() => {
    return divIcon({
      className: 'custom-pickup-icon',
      html: `
        <div class="flex flex-col items-center" style="transform: translate(-50%, -100%);">
          <div class="px-3 py-1 bg-black rounded-full mb-1 text-[10px] font-black text-white uppercase tracking-widest border border-white/20 whitespace-nowrap">Pickup Point</div>
          <span class="material-symbols-outlined text-[#6366f1] text-4xl" style="font-variation-settings: 'FILL' 1">trip_origin</span>
        </div>
      `,
      iconSize: [100, 60],
      iconAnchor: [50, 60]
    });
  }, []);

  const handleSwap = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  const handleSaveLocation = () => {
    if (isEditingLocation) {
      if (isEditingLocation.type === 'Home') setHomeAddress(isEditingLocation.address);
      else if (isEditingLocation.type === 'Work') setWorkAddress(isEditingLocation.address);
      else if (isEditingLocation.type === 'Favorite') setFavPlace({ name: isEditingLocation.name || favPlace.name, address: isEditingLocation.address });
      setIsEditingLocation(null);
    }
  };

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
        .moving-left-shadow {
            position: relative;
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
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/dashboard')}>
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
                <img alt={user?.name || 'Rider'} className="w-full h-full object-cover" src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAEi2hWgxtHxNtFSZn4702AbTI2v41XH7xZbpQmRalgfjWGWdswATZaGL3ZAKPlHCvTzC3mekZrh0IvnD2xlS1w-TEn6hn0N__GiRkljB-8eIAkBEjoaa1QCTE9dzL9YnToWzrqp5f-tfKGf0uwlMivUx3hEvjCnMiDbMmMbLQfatFSQGkjFeQHN0c8LbX1YLAegSySy0lfS1xwnMcyUd12_4BDN2YNwXi_GJvBrduO1XRB4YD4mkwEhP9q2FB2ucvCCSXU8qw4ZPc"} />
              </div>
            </div>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="w-10 h-10 rounded-xl panel-3d flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shrink-0"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

          {/* Left Column: Booking & Saved */}
          <div className="lg:col-span-5 space-y-8 z-10">
            {/* Where to Panel */}
            <section className="panel-3d moving-left-shadow rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <span className="text-[#6366f1] material-symbols-outlined">near_me</span>
                  Where to?
                </h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 input-inset rounded-full">New Trip</span>
              </div>
              <div className="space-y-4 relative">
                {/* Connector Line */}
                <div className="absolute left-[2.25rem] top-10 bottom-10 w-0.5 bg-gradient-to-b from-[#6366f1] via-purple-500/50 to-red-500/50 opacity-50 z-0 animate-gradient-y" style={{ backgroundSize: '100% 200%' }}></div>

                <div className="input-inset rounded-2xl p-5 flex items-center gap-4 relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mb-1">Pickup Location</p>
                    <input 
                      className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-200 w-full p-0 outline-none" 
                      placeholder="Current Location" 
                      type="text" 
                      value={pickup} 
                      onChange={(e) => setPickup(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end -my-5 px-8 relative z-20">
                  <button 
                    onClick={handleSwap}
                    className="w-10 h-10 rounded-full panel-3d border border-white/5 flex items-center justify-center hover:scale-110 transition-transform active:rotate-180 duration-500"
                  >
                    <span className="material-symbols-outlined text-[#6366f1] text-lg">swap_vert</span>
                  </button>
                </div>

                <div className="input-inset rounded-2xl p-5 flex items-center gap-4 relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mb-1">Destination</p>
                    <input 
                      className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-200 w-full p-0 outline-none" 
                      placeholder="Enter destination..." 
                      type="text" 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <button
                  disabled={isLoadingRide}
                  onClick={async () => {
                    if (!pickup.trim()) {
                      toast.error('Please enter a pickup location.');
                    } else if (!destination.trim()) {
                      toast.error('Please enter a destination.');
                    } else {
                      setIsLoadingRide(true);
                      try {
                        await api.post('/rides', {
                          originLat: 37.7790,
                          originLng: -122.4180,
                          destLat: 37.7840,
                          destLng: -122.4080,
                          idempotencyKey: Math.random().toString(36).substring(7)
                        });
                        toast.success('Ride requested successfully!');
                        navigate('/tracking');
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || 'Failed to request ride');
                      } finally {
                        setIsLoadingRide(false);
                      }
                    }
                  }}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#ec4899] to-[#6366f1] text-white font-extrabold text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-wide relative overflow-hidden animate-gradient-x disabled:opacity-50"
                >
                  <span className="relative z-10">{isLoadingRide ? 'Requesting...' : 'Find Rides'}</span>
                </button>
              </div>
            </section>

            {/* Saved Locations Bento */}
            <section className="grid grid-cols-2 gap-6">
              <div 
                onClick={() => setDestination(homeAddress)}
                className="panel-3d moving-left-shadow rounded-3xl p-6 group cursor-pointer hover:bg-[#1c1e29] transition-all border border-transparent hover:border-[#6366f1]/20 relative overflow-visible"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditingLocation({type: 'Home', address: homeAddress}); }}
                    className="w-8 h-8 rounded-full bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center hover:bg-[#6366f1] hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
                <div className="w-12 h-12 rounded-2xl input-inset flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#6366f1]">home</span>
                </div>
                <p className="font-bold text-slate-100">Home</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{homeAddress}</p>
              </div>

              <div 
                onClick={() => setDestination(workAddress)}
                className="panel-3d moving-left-shadow rounded-3xl p-6 group cursor-pointer hover:bg-[#1c1e29] transition-all border border-transparent hover:border-[#6366f1]/20 relative overflow-visible"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditingLocation({type: 'Work', address: workAddress}); }}
                    className="w-8 h-8 rounded-full bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center hover:bg-[#6366f1] hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
                <div className="w-12 h-12 rounded-2xl input-inset flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#6366f1]">work</span>
                </div>
                <p className="font-bold text-slate-100">Work</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{workAddress}</p>
              </div>
              <div 
                onClick={() => setDestination(favPlace.address)}
                className="col-span-2 panel-3d moving-left-shadow rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:bg-[#1c1e29] transition-all border border-transparent hover:border-[#6366f1]/20 relative overflow-visible"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl input-inset flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-rose-500 transition-colors">favorite</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">{favPlace.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{favPlace.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditingLocation({type: 'Favorite', name: favPlace.name, address: favPlace.address}); }}
                    className="w-10 h-10 rounded-full bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#6366f1] hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 group-hover:text-[#6366f1] transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Active Ride Section */}
            {activeRide && (
              <section 
                onClick={() => navigate('/tracking')}
                className="panel-3d moving-left-shadow rounded-[2.5rem] p-8 group cursor-pointer hover:bg-[#1c1e29] transition-all border border-transparent hover:border-[#6366f1]/20 relative"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
                    {driverStatusText}
                  </h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/tracking'); }}
                    className="text-[10px] text-[#6366f1] font-bold uppercase tracking-widest bg-[#6366f1]/10 px-4 py-1.5 rounded-full hover:bg-[#6366f1] hover:text-white transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  >
                    Track Live
                  </button>
                </div>

                <div className="input-inset p-4 rounded-2xl flex flex-col gap-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#6366f1] text-lg">trip_origin</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 leading-none mb-1 uppercase tracking-widest font-black">Pickup</span>
                      <span className="text-sm font-bold text-slate-200">Current Location</span>
                    </div>
                  </div>
                  <div className="w-px h-3 bg-white/10 ml-2.5"></div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-rose-500 text-lg">location_on</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 leading-none mb-1 uppercase tracking-widest font-black">Dropoff</span>
                      <span className="text-sm font-bold text-slate-200">Destination</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0b10] shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                        <img alt="Driver" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEi2hWgxtHxNtFSZn4702AbTI2v41XH7xZbpQmRalgfjWGWdswATZaGL3ZAKPlHCvTzC3mekZrh0IvnD2xlS1w-TEn6hn0N__GiRkljB-8eIAkBEjoaa1QCTE9dzL9YnToWzrqp5f-tfKGf0uwlMivUx3hEvjCnMiDbMmMbLQfatFSQGkjFeQHN0c8LbX1YLAegSySy0lfS1xwnMcyUd12_4BDN2YNwXi_GJvBrduO1XRB4YD4mkwEhP9q2FB2ucvCCSXU8qw4ZPc" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-[#0a0b10] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-white text-lg">{activeRide.driver?.name || 'Assigning...'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{activeRide.status}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Map & Active Stats */}
          <div className="lg:col-span-7 flex flex-col space-y-8 z-10 pb-8">
            {/* High Contrast Map Panel */}
            <div className="panel-3d moving-left-shadow rounded-[2.5rem] flex-grow min-h-[450px] relative group border border-white/5 overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-[#000]">
                {mounted && (
                  <MapContainer 
                    center={[37.7790, -122.4180]} 
                    zoom={14} 
                    zoomControl={false}
                    scrollWheelZoom={false}
                    ref={setMap}
                    className="w-full h-full"
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; CARTO'
                    />
                    <Polyline 
                      positions={ROUTE_POSITIONS} 
                      color="#0d9488" 
                      weight={12} 
                      opacity={0.4}
                    />
                    <Polyline 
                      positions={ROUTE_POSITIONS} 
                      color="#6366f1" 
                      weight={5} 
                    />
                    <Marker position={ROUTE_POSITIONS[0]} icon={pickupIcon} />
                    <Marker position={ROUTE_POSITIONS[ROUTE_POSITIONS.length - 1]} icon={destIcon} />
                  </MapContainer>
                )}
              </div>

              {/* Map Overlays */}
              <div className="absolute top-8 right-8 flex flex-col gap-4 z-[400]">
                <button 
                  onClick={() => map?.zoomIn()}
                  className="w-12 h-12 rounded-2xl bg-[#161821]/90 backdrop-blur-xl flex items-center justify-center shadow-2xl text-slate-200 border border-white/10 hover:bg-[#6366f1] hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
                <button 
                  onClick={() => map?.zoomOut()}
                  className="w-12 h-12 rounded-2xl bg-[#161821]/90 backdrop-blur-xl flex items-center justify-center shadow-2xl text-slate-200 border border-white/10 hover:bg-[#6366f1] hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-xl">remove</span>
                </button>
                <button 
                  onClick={() => map?.setView([37.7790, -122.4180], 14)}
                  className="w-12 h-12 rounded-2xl bg-[#161821]/90 backdrop-blur-xl flex items-center justify-center shadow-2xl text-slate-200 border border-white/10 hover:text-[#6366f1] transition-all"
                >
                  <span className="material-symbols-outlined text-xl">my_location</span>
                </button>
              </div>

              {/* Driver Status Floating Card */}
              {activeRide && (
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-[#0d0e14]/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-[0_0_30px_rgba(99,102,241,0.15)] cursor-pointer hover:shadow-[0_0_40px_rgba(236,72,153,0.2)] transition-shadow duration-500" onClick={() => navigate('/tracking')}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0d0e14] shadow-[0_0_20px_rgba(99,102,241,0.6)]">
                          <img alt="Driver" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEi2hWgxtHxNtFSZn4702AbTI2v41XH7xZbpQmRalgfjWGWdswATZaGL3ZAKPlHCvTzC3mekZrh0IvnD2xlS1w-TEn6hn0N__GiRkljB-8eIAkBEjoaa1QCTE9dzL9YnToWzrqp5f-tfKGf0uwlMivUx3hEvjCnMiDbMmMbLQfatFSQGkjFeQHN0c8LbX1YLAegSySy0lfS1xwnMcyUd12_4BDN2YNwXi_GJvBrduO1XRB4YD4mkwEhP9q2FB2ucvCCSXU8qw4ZPc" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#0d0e14] shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.3)] border border-indigo-500/30">{driverStatusText}</span>
                        </div>
                        <p className="font-extrabold text-white text-lg leading-none">{activeRide.driver?.name || 'Assigning...'}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {activeRide.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="panel-3d moving-left-shadow rounded-3xl p-6 text-center border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Wallet</p>
                <p className="text-3xl font-black text-white">$428.50</p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-emerald-500 font-bold">+12.5%</span>
                </div>
              </div>
              <div className="panel-3d moving-left-shadow rounded-3xl p-6 text-center border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Total Rides</p>
                <p className="text-3xl font-black text-white">124</p>
                <div className="mt-3">
                  <span className="text-[10px] text-[#6366f1] font-black uppercase tracking-widest border border-[#6366f1]/30 px-3 py-1 rounded-full">Elite Member</span>
                </div>
              </div>
              <div className="panel-3d moving-left-shadow rounded-3xl p-6 text-center border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">CO2 Offset</p>
                <p className="text-3xl font-black text-white">42kg</p>
                <div className="w-full bg-[#0d0e14] h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full w-2/3 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAB (Bottom Right) */}
        <button className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-16 h-16 bg-[#6366f1] rounded-2xl flex items-center justify-center text-white shadow-[0_12px_32px_rgba(99,102,241,0.6)] z-40 transition-all hover:scale-110 active:scale-95 group">
          <span className="material-symbols-outlined text-3xl transition-transform group-hover:rotate-90">add</span>
        </button>
      </main>

      {/* Edit Location Modal */}
      {isEditingLocation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10 p-8 relative">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white" onClick={() => setIsEditingLocation(null)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-6">Edit {isEditingLocation.type} Address</h3>
            
            <div className="space-y-4 mb-8">
              {isEditingLocation.type === 'Favorite' && (
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Place Name</label>
                  <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                    <input 
                      type="text" 
                      value={isEditingLocation.name}
                      onChange={(e) => setIsEditingLocation({ ...isEditingLocation, name: e.target.value })}
                      placeholder="e.g., Gym, My Cafe..."
                      className="bg-transparent border-none outline-none text-white font-bold w-full" 
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Address</label>
                <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <input 
                    type="text" 
                    value={isEditingLocation.address}
                    onChange={(e) => setIsEditingLocation({ ...isEditingLocation, address: e.target.value })}
                    placeholder="Enter full address..."
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveLocation}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-4 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
            >
              Update Address
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
