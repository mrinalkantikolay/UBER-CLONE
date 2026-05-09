import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// San Francisco Coordinates
const ROUTE_POSITIONS: [number, number][] = [
  [37.774938,-122.419449],[37.775026,-122.41934],[37.775098,-122.419253],[37.775175,-122.41916],[37.775254,-122.419061],[37.775448,-122.418811],[37.775474,-122.418776],[37.775495,-122.418747],[37.77555,-122.418675],[37.775604,-122.4186],[37.77572,-122.418445],[37.776185,-122.417856],[37.776207,-122.417828],[37.776227,-122.417802],[37.776364,-122.417629],[37.776509,-122.417447],[37.776455,-122.417378],[37.776083,-122.416923],[37.775764,-122.416527],[37.7757,-122.416447],[37.775357,-122.416022],[37.775278,-122.415923],[37.77535,-122.415833],[37.775438,-122.415721],[37.775604,-122.415511],[37.775893,-122.415147],[37.776056,-122.41494],[37.776151,-122.414821],[37.776233,-122.414717],[37.776303,-122.414628],[37.776427,-122.414472],[37.776469,-122.41442],[37.776578,-122.414282],[37.776706,-122.414121],[37.77726,-122.413421],[37.777388,-122.41326],[37.777455,-122.413175],[37.777388,-122.413091],[37.777324,-122.41301],[37.777266,-122.412937],[37.777255,-122.412924],[37.777018,-122.412627],[37.776702,-122.412229],[37.776653,-122.412168],[37.776728,-122.412074],[37.778347,-122.410036],[37.77842,-122.409945],[37.77847,-122.409881],[37.778488,-122.409858],[37.779053,-122.409146],[37.779234,-122.408918],[37.779305,-122.408829],[37.780111,-122.407809],[37.780125,-122.407791],[37.78018,-122.407721],[37.780243,-122.40764],[37.780739,-122.407002],[37.781193,-122.406418],[37.781282,-122.406304],[37.781292,-122.406291],[37.781314,-122.406262],[37.781334,-122.406238],[37.781507,-122.406019],[37.781842,-122.405595],[37.781862,-122.40557],[37.781934,-122.405479],[37.78204,-122.405611],[37.782064,-122.40564],[37.782109,-122.405702],[37.782133,-122.405742],[37.782307,-122.405958],[37.782385,-122.406045],[37.782518,-122.406193],[37.782684,-122.406404],[37.782737,-122.406487],[37.782811,-122.406597],[37.782853,-122.406648],[37.782896,-122.406701],[37.783178,-122.407048],[37.783295,-122.40719],[37.783532,-122.407481],[37.783661,-122.407638],[37.783868,-122.407893],[37.783912,-122.407947],[37.784001,-122.408057],[37.784013,-122.408071],[37.784025,-122.408087],[37.784101,-122.408189],[37.784175,-122.408283],[37.784252,-122.408378],[37.784293,-122.40843],[37.784339,-122.408486],[37.784364,-122.408509],[37.78439,-122.408523],[37.784422,-122.408529],[37.784462,-122.408532],[37.784538,-122.408538],[37.784621,-122.408548],[37.784705,-122.40856],[37.784789,-122.408576],[37.78508,-122.408634],[37.785325,-122.408681],[37.785394,-122.408696],[37.785301,-122.409431],[37.78529,-122.409513],[37.78522,-122.409499],[37.784896,-122.409434]
];

// Calculate position based on 0-100 progress
function getInterpolatedPosition(progress: number): [number, number] {
  if (progress >= 100) return ROUTE_POSITIONS[ROUTE_POSITIONS.length - 1];
  
  const segmentCount = ROUTE_POSITIONS.length - 1;
  const progressPerSegment = 100 / segmentCount;
  const currentSegmentIndex = Math.floor(progress / progressPerSegment);
  const segmentProgress = (progress % progressPerSegment) / progressPerSegment;
  
  const start = ROUTE_POSITIONS[currentSegmentIndex];
  const end = ROUTE_POSITIONS[currentSegmentIndex + 1];
  
  return [
    start[0] + (end[0] - start[0]) * segmentProgress,
    start[1] + (end[1] - start[1]) * segmentProgress
  ];
}

export function RideTracking() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'searching' | 'matched'>('searching');
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Prevent map from mounting until React is fully ready in the browser
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize the icons so they don't recreate on every single progress frame
  const carIcon = useMemo(() => {
    return divIcon({
      className: 'custom-car-icon',
      html: `
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xl border border-slate-200" style="transform: translate(-50%, -50%);">
          <span class="material-symbols-outlined text-slate-900 text-2xl" style="font-variation-settings: 'FILL' 1">directions_car</span>
        </div>
        <div class="w-6 h-6 bg-black/40 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2 blur-md z-[-1]"></div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }, []);

  const destIcon = useMemo(() => {
    return divIcon({
      className: 'custom-dest-icon',
      html: `
        <div class="flex flex-col items-center" style="transform: translate(-50%, -100%);">
          <div class="px-3 py-1 bg-black rounded-full mb-1 text-[10px] font-black text-white uppercase tracking-widest border border-white/20 whitespace-nowrap">Pickup Point</div>
          <span class="material-symbols-outlined text-rose-500 text-4xl" style="font-variation-settings: 'FILL' 1">location_on</span>
        </div>
      `,
      iconSize: [100, 60],
      iconAnchor: [50, 60]
    });
  }, []);

  useEffect(() => {
    let timeoutId: any;
    
    const pollActiveRide = async () => {
      try {
        const response = await api.get('/rides/active');
        if (response.data.data) {
          const ride = response.data.data;
          setActiveRide(ride);
          if (ride.status === 'PENDING') {
            setStatus('searching');
          } else {
            setStatus('matched');
            // If ride completed or cancelled, navigate away after a bit
            if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
              toast.success(`Ride ${ride.status.toLowerCase()}`);
              setTimeout(() => navigate('/dashboard'), 2000);
              return;
            }
          }
        } else {
          // No active ride, maybe go back to dashboard
          if (activeRide && status === 'matched') {
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching active ride:', error);
      }
      
      timeoutId = setTimeout(pollActiveRide, 3000);
    };

    pollActiveRide();
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  useEffect(() => {
    if (status === 'matched') {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 100 ? prev + 0.5 : 100));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      setIsCancelling(true);
      await api.patch(`/rides/${activeRide.id}/cancel`);
      toast.success('Ride cancelled successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setIsCancelling(false);
    }
  };

  const carPosition = getInterpolatedPosition(progress);

  const etaMins = Math.ceil((100 - progress) * (12 / 100));
  const etaText = etaMins > 0 ? `Dropoff in ${etaMins} min${etaMins > 1 ? 's' : ''}` : 'Destination Reached';
  
  let driverStatusText = 'Waiting for Driver';
  if (activeRide?.status === 'ACCEPTED') driverStatusText = 'Driver En Route';
  else if (activeRide?.status === 'ARRIVED') driverStatusText = 'Driver Arrived';
  else if (activeRide?.status === 'IN_PROGRESS') driverStatusText = 'Ride in Progress';
  else if (activeRide?.status === 'COMPLETED') driverStatusText = 'Ride Completed';

  return (
    <div className="bg-[#0a0b10] text-[#e1e4ff] min-h-screen overflow-hidden flex flex-col font-body">
      <style>{`
        .three-d-grey-layered {
            background-color: #161821;
            box-shadow: inset 1px 1px 0px 0px rgba(255, 255, 255, 0.05), 10px 10px 20px rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .inset-layered {
            background-color: #0d0e14;
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }
        .radar-ping {
            animation: radar-pulse 2s infinite;
        }
        @keyframes radar-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(4); opacity: 0; }
        }
        .leaflet-container {
            width: 100%;
            height: 100%;
            background: #000;
        }
        @keyframes slide-in-left {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
            animation: slide-in-left 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in-up {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
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

      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-[#161821] border-b border-white/5 shadow-2xl flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tighter cursor-pointer animate-gradient-x" onClick={() => navigate('/dashboard')}>RIDENOVA</span>
        </div>
      </header>

      {/* Main Content: Full Screen Map Wrapper */}
      <main className="flex-1 relative w-full overflow-hidden bg-slate-950">
        
        {/* Real Leaflet Map */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#000]">
          
          {mounted && (
            <div className="absolute inset-0 w-full h-full">
              <MapContainer 
                center={[37.7790, -122.4180]} 
                zoom={14} 
                ref={setMap}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={true}
                className="w-full h-full"
              >
                {/* Standard Dark Basemap */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />

                {/* Cyberpunk Road Path */}
                {status === 'matched' && (
                  <>
                    {/* Sea-green/Cyan outer glow for the path to make it pop in 3D */}
                    <Polyline 
                      positions={ROUTE_POSITIONS} 
                      color="#0d9488" 
                      weight={16} 
                      opacity={0.4}
                      lineCap="round"
                      lineJoin="round"
                    />
                    <Polyline 
                      positions={ROUTE_POSITIONS} 
                      color="#000000" 
                      weight={6} 
                      opacity={1}
                      lineCap="round"
                      lineJoin="round"
                    />
                    
                    {/* Moving Car */}
                    <Marker 
                      position={carPosition} 
                      icon={carIcon} 
                    />

                    {/* Destination Pin */}
                    <Marker 
                      position={ROUTE_POSITIONS[ROUTE_POSITIONS.length - 1]} 
                      icon={destIcon} 
                    />
                  </>
                )}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Radar Animation when searching */}
        {status === 'searching' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="relative">
              <div className="w-4 h-4 bg-[#6366f1] rounded-full relative z-20 shadow-[0_0_20px_#6366f1]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#6366f1]/30 rounded-full radar-ping"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#6366f1]/30 rounded-full radar-ping [animation-delay:0.5s]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#6366f1]/30 rounded-full radar-ping [animation-delay:1s]"></div>
            </div>
          </div>
        )}

        {/* Status Text Overlay */}
        <div className="absolute top-24 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <div className="bg-[#161821]/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl transition-all duration-500">
            {status === 'searching' ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse"></div>
                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Searching for drivers...</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-fade-in-up">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">{driverStatusText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Floating Panel - Dispatch Control Center */}
        {status === 'matched' && (
          <div className="absolute top-24 left-8 w-80 z-40 pointer-events-none animate-slide-in">
            <div className="flex flex-col gap-4 pointer-events-auto">
              
              {/* Trip Summary Card */}
              <div className="three-d-grey-layered p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl moving-left-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse"></div>
                  <span className="text-sm font-black tracking-widest text-white uppercase">{etaText}</span>
                </div>
                
                <div className="inset-layered p-4 rounded-2xl flex flex-col gap-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#6366f1] text-lg">trip_origin</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 leading-none mb-1 uppercase tracking-widest font-black">Pickup</span>
                      <span className="text-sm font-bold text-slate-200">101 Market St, SF</span>
                    </div>
                  </div>
                  <div className="w-px h-3 bg-white/10 ml-2.5"></div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-rose-500 text-lg">location_on</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 leading-none mb-1 uppercase tracking-widest font-black">Dropoff</span>
                      <span className="text-sm font-bold text-slate-200">Salesforce Tower, SF</span>
                    </div>
                  </div>
                </div>

                {/* Driver Profile Section Integrated */}
                <div className="pt-6 border-t border-white/5 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img alt="Driver" className="w-14 h-14 rounded-xl object-cover border border-[#6366f1]/50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEon8QnqZwTG9gjvqFI7MQtJ7GtJFp0Yzc-f-BESzkxzu-45BsDSMi0xx4C1Iu8Z2WvJanDV3IghMftB6Isp6l1xFg1Gk_ZzcvKJWMLn0y-BjSK_oyk0daJIjyEGaWDyvY1smaUlBpOhXDexu5ggdCA6ZbG6rjlLV2mEBOWCKCbmI6QioTTiw-_mWA9a5a3V--qbbw7Gu4YD7BfqMLW57Okqd4aPd3Q2HONpOK5Q8Eb3MhKEno-TpLNmU7-JReCMJkk-OZ88zqE8k" />
                      <div className="absolute -bottom-1 -right-1 bg-[#6366f1] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        4.9 <span className="material-symbols-outlined text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-base font-black text-white leading-tight">{activeRide?.driver?.name || 'Driver'}</h2>
                      <span className="text-xs text-slate-400 font-bold">{activeRide?.driver?.vehicle || 'Toyota Prius • CAL-72X9'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert(`Initiating secure call to ${activeRide?.driver?.name}...`)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 font-black text-[8px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95 border border-emerald-500/20"
                    >
                      <span className="material-symbols-outlined text-base">call</span>
                      Call
                    </button>
                    <button
                      onClick={() => alert('Opening secure chat with driver...')}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-[#6366f1]/10 text-[#6366f1] font-black text-[8px] uppercase tracking-widest hover:bg-[#6366f1] hover:text-white transition-all active:scale-95 border border-[#6366f1]/20"
                    >
                      <span className="material-symbols-outlined text-base">chat_bubble</span>
                      Chat
                    </button>
                    <button 
                      onClick={handleCancelRide}
                      disabled={isCancelling}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-rose-500/10 text-rose-500 font-black text-[8px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-500/20 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                      {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Map Controls - Only show when matched */}
        {status === 'matched' && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20 pointer-events-auto">
            <button 
              onClick={() => map?.zoomIn()}
              className="w-12 h-12 rounded-full three-d-grey-layered flex items-center justify-center text-slate-400 active:scale-90 transition-transform hover:text-white"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <button 
              onClick={() => map?.zoomOut()}
              className="w-12 h-12 rounded-full three-d-grey-layered flex items-center justify-center text-slate-400 active:scale-90 transition-transform hover:text-white"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button 
              onClick={() => map?.setView([37.7790, -122.4180], 15)}
              className="w-12 h-12 rounded-full three-d-grey-layered flex items-center justify-center text-[#6366f1] active:scale-90 transition-transform hover:text-indigo-400"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#0a0b10] flex flex-col md:flex-row justify-between items-center px-12 py-4 z-50">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent animate-gradient-x">RIDENOVA</span>
          <span className="font-plus-jakarta text-xs text-slate-500">© 2024 RideNova Inc.</span>
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="font-plus-jakarta text-xs text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => navigate('/')}>Privacy Policy</a>
          <a className="font-plus-jakarta text-xs text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => navigate('/')}>Terms of Service</a>
          <a className="font-plus-jakarta text-xs text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => navigate('/')}>Safety</a>
          <a className="font-plus-jakarta text-xs text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => navigate('/')}>Cities</a>
        </div>
      </footer>
    </div>
  );
}
