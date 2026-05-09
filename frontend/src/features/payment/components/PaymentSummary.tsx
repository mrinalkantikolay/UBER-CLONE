import { useNavigate } from 'react-router-dom';

export function PaymentSummary() {
  const navigate = useNavigate();

  return (
    <div 
      className="font-body text-[#e1e4ff] min-h-screen flex flex-col"
      style={{
        backgroundImage: "url('/payment-bg.jpg')", 
        backgroundSize: "100vw 100vh", 
        backgroundPosition: "center", 
        backgroundAttachment: "fixed", 
        backgroundRepeat: "no-repeat",
        backgroundColor: "#05060b"
      }}
    >
      <style>{`
        .raised-neomorphic {
          box-shadow: 6px 6px 12px rgba(0,0,0,0.6), -6px -6px 12px rgba(255,255,255,0.05);
          background-color: #0b0e19;
        }
        .inset-neomorphic {
          box-shadow: inset 4px 4px 8px rgba(0,0,0,0.6), inset -4px -4px 8px rgba(255,255,255,0.05);
          background-color: #0b0e19;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        @keyframes gradient-x {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
        }
        .animate-gradient-x {
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
        }
      `}</style>
      
      <nav 
        className="w-full top-0 sticky z-50 shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] flex justify-between items-center px-8 py-4 max-w-full mx-auto bg-black/20" 
        style={{backdropFilter: "blur(12px)"}}
      >
        <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tighter cursor-pointer animate-gradient-x" onClick={() => navigate('/dashboard')}>
          RIDENOVA
        </div>
        <div className="hidden md:flex items-center gap-8 font-plus-jakarta text-sm font-medium">
          <a className="text-slate-600 dark:text-slate-400 hover:text-[#c0c1ff] transition-colors duration-200" href="#">Find Rides</a>
          <a className="text-slate-600 dark:text-slate-400 hover:text-[#c0c1ff] transition-colors duration-200" href="#">Drive</a>
          <a className="text-slate-600 dark:text-slate-400 hover:text-[#c0c1ff] transition-colors duration-200" href="#">Help</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="raised-neomorphic px-5 py-2 rounded-lg text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-[#c0c1ff] transition-colors duration-200 active:scale-95">Sign In</button>
          <button className="raised-neomorphic px-5 py-2 rounded-lg text-indigo-600 dark:text-[#c0c1ff] text-sm font-medium hover:text-[#c0c1ff] transition-colors duration-200 active:scale-95">Sign Up</button>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-2xl w-full raised-neomorphic rounded-xl p-8 md:p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-full raised-neomorphic flex items-center justify-center mb-4 bg-gradient-to-tr from-indigo-500 to-purple-600 animate-gradient-x">
              <span className="material-symbols-outlined text-white text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#e1e4ff] mb-2">Trip Completed</h1>
            <p className="text-[#a5aac7] text-sm">Thank you for riding with RideNova</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f7490] mb-4">Trip Details</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-[#c0c1ff] text-xl">trip_origin</span>
                      <div className="w-0.5 h-10 bg-[#414760] rounded-full"></div>
                      <span className="material-symbols-outlined text-[#af88ff] text-xl">location_on</span>
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <p className="text-xs text-[#a5aac7]">From</p>
                        <p className="text-sm font-medium">82nd Street, Manhattan, NY</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#a5aac7]">To</p>
                        <p className="text-sm font-medium">JFK International Airport</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl inset-neomorphic">
                <div className="flex items-center gap-3">
                  <img alt="Driver" className="w-12 h-12 rounded-full object-cover raised-neomorphic border border-white/10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGAhzG5ewLaNZRd_akZEvWh3z2GlPl0MecuIOoi4iB-vKCgM157zGCwP0SXD3pL_IaKcynKzGjuGkRLO3DUBPSSNKGxNA5j3TGn5BhrVlKo_1WCcvkYR52re6QaNOOxYhR3umiNxbSfAMjZ66ApQK7kXbIpT1m6-LFiWH2EIztNq4lX_SYxIH3M60hOJU3-jDgLsEalWB9X1IUIslEVMnmScfLAmarMN9wHHTiPPCk506QRx2SEkf3bxsiTiLsSLL-67ku0WA2RY0"/>
                  <div>
                    <p className="text-sm font-semibold">David Mitchell</p>
                    <p className="text-xs text-[#a5aac7]">Tesla Model 3 • ABC-1234</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f7490] mb-4">Fare Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a5aac7]">Base fare</span>
                    <span className="font-medium">$42.50</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a5aac7]">Taxes & Fees</span>
                    <span className="font-medium">$4.80</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a5aac7]">Tip</span>
                    <span className="font-medium">$8.00</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#414760] flex justify-between items-center">
                    <span className="text-base font-semibold">Total Paid</span>
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">$55.30</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-xl inset-neomorphic">
                <span className="material-symbols-outlined text-[#a5aac7]">credit_card</span>
                <div className="flex-1">
                  <p className="text-xs text-[#a5aac7]">Payment Method</p>
                  <p className="text-sm font-medium">Visa ending in •••• 4242</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-[#e1e4ff] mb-6">Rate your experience</h3>
            <div className="flex gap-4">
              <button className="w-12 h-12 flex items-center justify-center rounded-lg raised-neomorphic hover:inset-neomorphic transition-all duration-200">
                <span className="material-symbols-outlined text-[#c0c1ff]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-lg raised-neomorphic hover:inset-neomorphic transition-all duration-200">
                <span className="material-symbols-outlined text-[#c0c1ff]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-lg raised-neomorphic hover:inset-neomorphic transition-all duration-200">
                <span className="material-symbols-outlined text-[#c0c1ff]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-lg raised-neomorphic hover:inset-neomorphic transition-all duration-200">
                <span className="material-symbols-outlined text-[#c0c1ff]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-lg raised-neomorphic hover:inset-neomorphic transition-all duration-200">
                <span className="material-symbols-outlined text-[#414760]">star</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 raised-neomorphic flex items-center justify-center gap-2 py-4 rounded-xl text-[#c0c1ff] font-semibold transition-all duration-200 active:scale-[0.98]">
              <span className="material-symbols-outlined">download</span>
              Download Receipt
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 raised-neomorphic flex items-center justify-center gap-2 py-4 rounded-xl text-[#e1e4ff] font-semibold transition-all duration-200 active:scale-[0.98] border border-indigo-500/20"
            >
              <span className="material-symbols-outlined">dashboard</span>
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-800 flex flex-col md:flex-row justify-between items-center px-12 py-8 mt-auto bg-black/40">
        <div className="text-lg font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent animate-gradient-x mb-4 md:mb-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
          RIDENOVA
        </div>
        <div className="flex gap-8 mb-6 md:mb-0">
          <a className="text-slate-500 hover:text-[#c0c1ff] font-plus-jakarta text-xs hover:underline transition-colors duration-200" href="#">Privacy Policy</a>
          <a className="text-slate-500 hover:text-[#c0c1ff] font-plus-jakarta text-xs hover:underline transition-colors duration-200 cursor-pointer" onClick={() => navigate('/')}>Terms of Service</a>
          <a className="text-slate-500 hover:text-[#c0c1ff] font-plus-jakarta text-xs hover:underline transition-colors duration-200" href="#">Safety</a>
          <a className="text-slate-500 hover:text-[#c0c1ff] font-plus-jakarta text-xs hover:underline transition-colors duration-200" href="#">Cities</a>
        </div>
        <p className="font-plus-jakarta text-xs text-slate-500">© 2024 RideNova Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
