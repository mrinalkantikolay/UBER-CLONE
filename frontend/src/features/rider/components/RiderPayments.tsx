import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { useAuthStore } from '../../auth/store/use-auth-store';

export function RiderPayments() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { user, logout } = useAuthStore();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [defaultMethodId, setDefaultMethodId] = useState<any>(null);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const response = await api.get('/users/me/payment-methods');
        if (response.data.data) {
          const methods = response.data.data.map((m: any, i: number) => ({
            id: m.id || i + 1,
            name: m.type === 'CARD' ? `Visa •••• ${m.last4 || '4242'}` : m.type,
            type: m.type,
            desc: m.isDefault ? 'Default' : 'Active',
            icon: m.type === 'CARD' ? 'credit_card' : 'account_balance_wallet',
            color: m.isDefault ? 'text-blue-500' : 'text-slate-300',
            bg: m.isDefault ? 'bg-blue-500/10' : 'panel-3d'
          }));
          setPaymentMethods(methods);
          
          const defaultMethod = methods.find((m: any) => m.desc === 'Default');
          if (defaultMethod) {
            setDefaultMethodId(defaultMethod.id);
          } else if (methods.length > 0) {
            setDefaultMethodId(methods[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };
    fetchMethods();
  }, []);

  const handleDeleteCard = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
  };

  const handleDownload = () => {
    setIsDownloading(true);
    
    // Simulate processing time
    setTimeout(() => {
      // Create dummy content for the statement
      const content = "RideNova Transaction Statement\nDate, Description, Amount, Payment Method\n2023-10-20, Ride to JFK, -$55.30, Apple Pay\n2023-10-19, Added Funds, +$100.00, Visa 4242";
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `RideNova_Statement_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsDownloading(false);
      alert('Statement file generated! Your browser will now prompt you to save the file if "Ask where to save" is enabled in settings.');
    }, 1500);
  };

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSaveCard = () => {
    if (!cardNumber || !expiry || !cvc) {
      alert('Please fill all card details');
      return;
    }
    const newId = paymentMethods.length + 1;
    const lastFour = cardNumber.slice(-4);
    setPaymentMethods([...paymentMethods, {
      id: newId,
      name: `Visa •••• ${lastFour}`,
      type: 'card',
      desc: `Expires ${expiry}`,
      icon: 'credit_card',
      color: 'text-slate-300',
      bg: 'panel-3d'
    }]);
    setIsAddCardOpen(false);
    setCardNumber('');
    setExpiry('');
    setCvc('');
  };

  const [fundsAmount, setFundsAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState(defaultMethodId);

  const handleConfirmFunds = () => {
    if (!fundsAmount) {
      alert('Please select or enter an amount');
      return;
    }
    alert(`Successfully added $${fundsAmount} to your wallet using ${paymentMethods.find(m => m.id === selectedMethodId)?.name}`);
    setIsAddFundsOpen(false);
    setFundsAmount('');
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
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/payments')}>
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

        {/* Dynamic Content Area for Payments */}
        <div className="pt-28 px-6 lg:px-12 max-w-[1600px] mx-auto w-full h-full">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: Wallet & Methods */}
            <div className="lg:col-span-5 w-full lg:w-1/3 flex flex-col gap-8">
              <div className="panel-3d moving-left-shadow rounded-[2.5rem] p-8 border border-white/5 relative overflow-visible group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366f1]/10 rounded-bl-[100px] blur-xl"></div>
                <h2 className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">RideNova Cash</h2>
                <p className="text-5xl font-black text-white tabular-nums tracking-tighter">$428<span className="text-2xl text-slate-500">.50</span></p>
                <div className="mt-8 flex gap-4 relative z-10">
                  <button 
                    onClick={() => setIsAddFundsOpen(true)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-4 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center gap-2 animate-gradient-x"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span> Add Funds
                  </button>
                </div>
              </div>

              <div className="panel-3d moving-left-shadow rounded-[2rem] p-6 border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Payment Methods</h3>
                  <button 
                    onClick={() => setIsAddCardOpen(true)}
                    className="text-[#6366f1] hover:text-[#4f46e5] transition-all flex items-center gap-1 group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Add Card Option</span>
                    <span className="material-symbols-outlined">add_circle</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {paymentMethods.map(method => (
                    <div 
                      key={method.id} 
                      onClick={() => setDefaultMethodId(method.id)}
                      className={`input-inset rounded-2xl p-4 flex items-center justify-between group cursor-pointer border transition-all ${defaultMethodId === method.id ? 'border-[#6366f1]/30' : 'border-transparent hover:border-white/10'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${method.bg} ${method.color} flex items-center justify-center`}>
                          <span className="material-symbols-outlined">{method.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-white">{method.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{method.id === defaultMethodId ? 'Default' : method.desc}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {defaultMethodId === method.id ? (
                          <span className="material-symbols-outlined text-[#6366f1] text-[18px]">check_circle</span>
                        ) : (
                          <button 
                            onClick={(e) => handleDeleteCard(e, method.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-500/10 text-transparent group-hover:text-rose-500 transition-all"
                            title="Delete Payment Method"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {paymentMethods.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">No payment methods found. Add one!</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Transaction History */}
            <div className="lg:col-span-7 w-full lg:w-2/3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black tracking-tight text-white">Transaction History</h2>
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="panel-3d px-4 py-2 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 hover:text-white transition-all disabled:opacity-50 group border border-[#6366f1]/20 hover:border-[#6366f1]/50 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  <span className={`material-symbols-outlined text-sm ${isDownloading ? 'animate-spin' : ''}`}>
                    {isDownloading ? 'sync' : 'download'}
                  </span>
                  {isDownloading ? 'Downloading...' : 'Statement'}
                </button>
              </div>

              <div className="panel-3d moving-left-shadow rounded-[2rem] p-6 border border-white/5 space-y-4">
                
                {/* Transaction 1 */}
                <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl input-inset flex items-center justify-center text-indigo-400 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">Ride to JFK Airport</p>
                      <p className="text-xs text-slate-500 mt-1">Today, 10:45 AM • Apple Pay</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white text-lg tabular-nums">- $55.30</p>
                  </div>
                </div>

                {/* Transaction 2 */}
                <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl input-inset flex items-center justify-center text-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">Added Funds</p>
                      <p className="text-xs text-slate-500 mt-1">Yesterday, 9:00 AM • Visa 4242</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400 text-lg tabular-nums">+ $100.00</p>
                  </div>
                </div>

                {/* Transaction 3 */}
                <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl input-inset flex items-center justify-center text-indigo-400 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">Ride to Central Park</p>
                      <p className="text-xs text-slate-500 mt-1">Yesterday, 2:15 PM • RideNova Cash</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white text-lg tabular-nums">- $18.50</p>
                  </div>
                </div>

                {/* Transaction 4 */}
                <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl input-inset flex items-center justify-center text-indigo-400 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fastfood</span>
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">RideNova Eats Order</p>
                      <p className="text-xs text-slate-500 mt-1">Oct 15, 8:30 PM • Apple Pay</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white text-lg tabular-nums">- $32.40</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </main>


      {/* Add Funds Modal */}
      {isAddFundsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10 p-8 relative">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white" onClick={() => setIsAddFundsOpen(false)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2">Add Funds</h3>
            <p className="text-sm text-slate-400 mb-6">Select an amount and payment method to add to your wallet.</p>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['10', '25', '50'].map(amount => (
                <button 
                  key={amount} 
                  onClick={() => setFundsAmount(amount)}
                  className={`py-3 rounded-xl input-inset font-black transition-all border ${fundsAmount === amount ? 'border-[#6366f1] text-[#6366f1]' : 'border-transparent text-white hover:bg-white/5'}`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Custom Amount</label>
              <div className="input-inset rounded-xl p-4 flex items-center gap-2 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                <span className="text-slate-400 font-bold">$</span>
                <input 
                  type="number" 
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                  placeholder="0.00" 
                  className="bg-transparent border-none outline-none text-white font-bold w-full" 
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Select Payment Method</label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {paymentMethods.map(method => (
                  <div 
                    key={method.id}
                    onClick={() => setSelectedMethodId(method.id)}
                    className={`flex items-center justify-between p-3 rounded-xl input-inset cursor-pointer border transition-all ${selectedMethodId === method.id ? 'border-[#6366f1]/50' : 'border-transparent opacity-60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-sm ${method.color}`}>{method.icon}</span>
                      <span className="text-xs font-bold text-white">{method.name}</span>
                    </div>
                    {selectedMethodId === method.id && <span className="material-symbols-outlined text-[#6366f1] text-xs">check_circle</span>}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleConfirmFunds}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-4 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all animate-gradient-x"
            >
              Confirm & Add Funds
            </button>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddCardOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10 p-8 relative">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white" onClick={() => setIsAddCardOpen(false)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-6">Add Card Option</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Card Number</label>
                <div className="input-inset rounded-xl p-4 flex items-center gap-2 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">credit_card</span>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000" 
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Expiry</label>
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY" 
                    className="input-inset rounded-xl p-4 w-full bg-transparent border border-transparent outline-none text-white font-bold focus:border-[#6366f1]/50 transition-all" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">CVC</label>
                  <input 
                    type="text" 
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123" 
                    className="input-inset rounded-xl p-4 w-full bg-transparent border border-transparent outline-none text-white font-bold focus:border-[#6366f1]/50 transition-all" 
                  />
                </div>
              </div>

            </div>

            <button 
              onClick={handleSaveCard}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-4 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
            >
              Save Card Option
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
