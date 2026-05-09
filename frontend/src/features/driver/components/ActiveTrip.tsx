import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ActiveTrip() {
  const navigate = useNavigate();
  // State to simulate progressing from "En Route to Pickup" to "In Transit" to "Completed"
  const [tripState, setTripState] = useState<'EN_ROUTE' | 'IN_TRANSIT' | 'DROPOFF'>('EN_ROUTE');

  const handleAction = () => {
    if (tripState === 'EN_ROUTE') setTripState('IN_TRANSIT');
    else if (tripState === 'IN_TRANSIT') setTripState('DROPOFF');
    else {
      // Completed, go back to dashboard
      navigate('/driver/dashboard');
    }
  };

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden relative font-body">
      {/* Top Navigation Area (Floating) */}
      <div className="absolute top-0 left-0 w-full z-20 flex justify-between items-center px-6 py-4 mt-4">
        <button className="bg-surface text-on-surface w-12 h-12 rounded-full flex items-center justify-center shadow-neo-raised active:shadow-neo-pressed transition-all">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="bg-surface text-on-surface px-6 py-3 rounded-full shadow-neo-raised font-semibold text-sm flex items-center gap-2">
          {tripState !== 'DROPOFF' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
          {tripState === 'EN_ROUTE' && 'En Route to Pickup'}
          {tripState === 'IN_TRANSIT' && 'In Transit to Destination'}
          {tripState === 'DROPOFF' && 'Arrived. End Trip.'}
        </div>
        <button 
          onClick={() => navigate('/driver/dashboard')} 
          className="bg-surface text-error w-12 h-12 rounded-full flex items-center justify-center shadow-neo-raised active:shadow-neo-pressed transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
        </button>
      </div>

      {/* Full Screen Map Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-surface-variant flex items-center justify-center">
        {/* Placeholder for Map */}
        <img alt="City map placeholder" className="w-full h-full object-cover opacity-60 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFzWqQrSGJ3aK5td3VXdqntyTURg1Jjd5-ZFHyJpvK8H0eofX-EbVdozgHT7k5OId_Gs_-DoFVMdZYb8kZKJ2y3zDjJmpNkGaGeUf0Qdyl-4i2A-HIyfGPoBFuolNWDyeTMUkaprtcYjjr-mFkPmcVpywLtIvU4NcNt0nXsZ4B4oZZd3xWiT5MDDFSlbk4_uu8I8hnuMLSAlLmrWNZWDq3PVJctUbMcbrfyAwv1ms5Uj4hJTY1CSO3vKSN2E0cz_jkwd0GZLz2spHC"/>
        
        {/* Simulated Navigation UI Elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="bg-surface p-3 rounded-full shadow-neo-raised mb-4 border-4 border-primary">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          </div>
        </div>
      </div>

      {/* Bottom Trip Details Overlay */}
      <div className="absolute bottom-0 w-full z-20 bg-surface rounded-t-[32px] shadow-neo-raised p-6 flex flex-col gap-6 transform translate-y-0 transition-transform pb-8">
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-2 shadow-neo-pressed"></div>
        
        {/* Passenger Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img alt="Passenger Profile" className="w-16 h-16 rounded-full object-cover shadow-neo-raised p-1 bg-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6lwXyL1C2U30XO1foBiBQhoOdis7vkhWpf6Gt3VUKB-zpW8AfpjkGN64ZZOSOQdH6kyQo4t10cIEiJu9CRBCP8l7BKJ5lDTbP2WANjXkVXDxFOHW_gxRVT4e4tYuVCw1WqaVUVQamBGwAyuISxmbifaBxSQZ_vxEKari2zSWuioBGpZBsd3kHRQNUdNBlL-z6TZXUCIxlMj0t1G8voBpg_ajbw3RGtJu7ecmiBRppf0vE5niAV_Yk5zB9Vzx0OQAYfgC4pUiZ8303"/>
              <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1 shadow-neo-raised flex items-center justify-center w-6 h-6">
                <span className="material-symbols-outlined text-[12px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-headline text-on-surface">Elena R.</h2>
              <p className="text-sm text-on-surface-variant flex items-center gap-1 font-medium">
                4.9 <span className="material-symbols-outlined text-[14px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-neo-raised active:shadow-neo-pressed text-primary transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </button>
            <button className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-neo-raised active:shadow-neo-pressed text-primary transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            </button>
          </div>
        </div>

        {/* Address Info */}
        <div className="bg-surface rounded-2xl p-4 shadow-neo-pressed flex flex-col gap-4">
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center mt-1">
              <div className={`w-3 h-3 rounded-full ${tripState === 'EN_ROUTE' ? 'bg-primary shadow-neo-raised' : 'bg-outline-variant'} shrink-0`}></div>
              <div className="w-0.5 h-8 bg-outline-variant my-1"></div>
              <div className={`w-3 h-3 rounded-full border-2 ${tripState !== 'EN_ROUTE' ? 'border-tertiary bg-surface shadow-neo-raised' : 'border-outline-variant'} shrink-0`}></div>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${tripState === 'EN_ROUTE' ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {tripState === 'EN_ROUTE' ? 'Pickup • 2 min (0.8 mi)' : 'Picked Up'}
                </p>
                <p className="text-sm font-medium text-on-surface">1428 Elm Street, Downtown</p>
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${tripState !== 'EN_ROUTE' ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                  {tripState === 'IN_TRANSIT' ? 'Dropoff • 10 min left' : 'Dropoff Destination'}
                </p>
                <p className="text-sm font-medium text-on-surface">Central Terminal, Gate 4</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleAction}
          className={`w-full font-bold text-lg py-4 rounded-2xl shadow-neo-raised active:shadow-neo-pressed transition-all flex items-center justify-center gap-2 ${tripState === 'DROPOFF' ? 'bg-primary text-on-primary' : 'bg-surface text-primary'}`}
        >
          {tripState === 'EN_ROUTE' && 'Start Trip'}
          {tripState === 'IN_TRANSIT' && 'Complete Ride'}
          {tripState === 'DROPOFF' && 'End Shift / Return to Dashboard'}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
