import { useNavigate } from 'react-router-dom';

export default function IncomingRide() {
  const navigate = useNavigate();

  const handleAccept = () => {
    // Dummy navigation to Active Trip
    navigate('/driver/active-trip');
  };

  const handleDecline = () => {
    // Dummy navigation back to Dashboard
    navigate('/driver/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#e8eaf0] dark:bg-background font-body text-on-surface">
      {/* Blurred Dashboard Background Context */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center mix-blend-multiply" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAomcWUQEo-Xoql1dHZC5eOJuCjYt03R-F2Ep4EQffKCGboLZCF1gQLVEHRkdnbxMO4nT2rkE6dvLMcZOrauBWAQluqo22am7_YZ3zM7bRFwAVNl7Yb7uCksosB7df2J2_IEIwY0WyX1XFve40nADYgtGQC0OLqy5j9xZq8s9G5u76If3y5l_oFPlMy0LXYESvqmbe1ZALfyPWsjwXYPY-Shx9uJSO--HGWkF4ZllanK7SETzRw4x_kZCPPc0LZX0tUSFrUsrPNA5gH')" }}
      ></div>
      <div className="absolute inset-0 z-0 bg-background/60 backdrop-blur-sm"></div>
      
      {/* Main Neomorphic Modal */}
      <main className="relative z-10 w-full max-w-md bg-surface rounded-[2rem] p-6 shadow-neo-raised flex flex-col gap-8">
        
        {/* Header & Countdown */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface shadow-neo-pressed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
            </div>
            <h1 className="font-headline font-bold text-xl text-primary">New Request</h1>
          </div>
          <div className="relative w-14 h-14 rounded-full bg-surface shadow-neo-raised flex items-center justify-center">
            {/* Simulated progress ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="46" stroke="var(--color-outline-variant)" strokeWidth="4"></circle>
              <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="46" stroke="var(--color-primary)" strokeDasharray="289" strokeDashoffset="100" strokeWidth="4"></circle>
            </svg>
            <span className="font-headline font-extrabold text-lg text-primary relative z-10">14</span>
          </div>
        </header>

        {/* Fare & Passenger Overview */}
        <section className="flex justify-between items-end px-2">
          <div>
            <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Est. Earnings</p>
            <p className="font-headline font-extrabold text-5xl text-on-surface tracking-tight">$18<span className="text-3xl text-on-surface-variant">.50</span></p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-surface shadow-neo-raised p-1.5 mb-3">
              <div className="w-full h-full rounded-full overflow-hidden shadow-neo-pressed">
                <img alt="Passenger Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGVbsFYSufmse_oKprPsk6vt9LZ_VTgwQ7uE8PMgAcR53AH4VuSACflh2e9D4YHHovuIVL41Zpr6slUm8PiBslypHRTHBoJJgJ6QkbF4h754ZOpauJXntTaSUAWDZ54j7wb5oz-AZ92pKYT3siOXFaEOLyvrERhrvz7I4JS_pUNMtdDXfo4lt2jkWnsNM5B3GVdjfTTxahE8n-gi2S9Erp3nL0sclJ9_N7sWBwZs6NeqIySKNZbGn4_tQus6uFPGBWL3FXZr5GtVQr"/>
              </div>
            </div>
            <div className="bg-surface shadow-neo-pressed rounded-full px-3 py-1 flex items-center gap-1.5">
              <span className="font-semibold text-sm text-on-surface">Elena</span>
              <span className="material-symbols-outlined text-tertiary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-sm text-on-surface">4.9</span>
            </div>
          </div>
        </section>

        {/* Route Details Container */}
        <section className="bg-surface rounded-[1.5rem] p-5 shadow-neo-pressed flex flex-col gap-6">
          {/* Map Snippet */}
          <div className="w-full h-32 rounded-xl bg-surface shadow-neo-raised overflow-hidden relative border-4 border-surface">
            <img alt="Route Map" className="w-full h-full object-cover opacity-60 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBi3Py9rv4KVy7ozMpwGLOHRuNBiYhS70Z1ft-7Ben3lTNviM3vzllWBf6SZwKytAJ64tyQckc3K9r9ZzgbKaVAUrTmxUlh_Z-gJ7pwhSJEzrN__fT0roMT2eoNaat_-xHrBtJf2WVMH_YkRdRlajfg39avybfXBJRzSrqpoQOqivJcLDfGMyjZ9HfSsqLkf8FIp_-l2RFlhhONw8tN77IXvcFspQVRaMgPWMZN4LCF0ePYG8lRSYh_hBQiBtEeddEycM32AS-AmkCx"/>
            {/* Map Overlay Elements */}
            <div className="absolute inset-0 flex flex-col justify-center items-center">
              <div className="w-32 h-1 bg-primary/20 rounded-full rotate-45 transform translate-y-2"></div>
              <span className="material-symbols-outlined text-primary text-3xl drop-shadow-md z-10" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            </div>
          </div>
          
          {/* Locations List */}
          <div className="flex flex-col gap-5 relative px-2">
            {/* Vertical connecting line */}
            <div className="absolute left-[17px] top-[24px] bottom-[24px] w-[2px] bg-outline-variant/50 rounded-full z-0"></div>
            
            {/* Pickup */}
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-6 h-6 rounded-full bg-surface shadow-neo-raised flex items-center justify-center shrink-0 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-neo-pressed"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Pickup</span>
                  <span className="text-xs font-semibold text-on-surface-variant bg-surface px-2 py-0.5 rounded-md shadow-[inset_2px_2px_4px_rgba(0,0,0,0.04),inset_-2px_-2px_4px_rgba(255,255,255,0.4)]">2 min away</span>
                </div>
                <p className="font-semibold text-on-surface text-[15px]">1428 Elm Street, Downtown</p>
              </div>
            </div>
            
            {/* Dropoff */}
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-6 h-6 rounded-full bg-surface shadow-neo-raised flex items-center justify-center shrink-0 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-neo-pressed"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Dropoff</span>
                  <span className="text-xs font-semibold text-on-surface-variant bg-surface px-2 py-0.5 rounded-md shadow-neo-pressed">12 min trip</span>
                </div>
                <p className="font-semibold text-on-surface text-[15px]">Central Terminal, Gate 4</p>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex gap-4 pt-2">
          <button onClick={handleDecline} className="flex-1 bg-surface rounded-2xl py-4 font-headline font-bold text-on-surface-variant shadow-neo-raised active:shadow-neo-pressed transition-all duration-200">
            Decline
          </button>
          <button onClick={handleAccept} className="flex-[2] bg-surface rounded-2xl py-4 font-headline font-bold text-xl text-primary shadow-neo-raised active:shadow-neo-pressed transition-all duration-200 flex justify-center items-center gap-3">
            <span>Accept Ride</span>
            <span className="material-symbols-outlined text-2xl font-bold">arrow_forward</span>
          </button>
        </section>

      </main>
    </div>
  );
}
