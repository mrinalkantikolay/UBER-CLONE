import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/store/use-auth-store';

export default function DriverRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Dummy form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleMake: '',
    vehicleModel: '',
    licensePlate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const authState = useAuthStore.getState();
        // If not authenticated, create a lightweight account using provided email/name
        if (!authState.isAuthenticated) {
          const randomPwd = Math.random().toString(36).slice(-10);
          const name = `${formData.firstName} ${formData.lastName}`.trim() || 'Driver';
          const signupRes = await api.post('/auth/signup', { name, email: formData.email, password: randomPwd });
          const user = signupRes.data.data.user;
          const accessToken = signupRes.data.data.accessToken;
          authState.setAuth(user, accessToken);
          toast.success('Account created and signed in');
        }

        // Call driver register endpoint (requires auth)
        await api.post('/drivers/register', {
          vehicleNumber: formData.licensePlate || `${formData.vehicleMake} ${formData.vehicleModel}`,
          licenseNumber: formData.licensePlate || 'UNKNOWN'
        });

        toast.success('Driver registration submitted');
        navigate('/driver/dashboard');
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Registration failed');
      }
    })();
  };

  return (
    <div className="bg-[#0a0b10] text-[#e2e8f0] min-h-screen flex items-center justify-center p-4 md:p-8 font-body relative overflow-hidden">
      <style>{`
        .panel-glass {
            background: rgba(22, 24, 33, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 1px 1px 0px 0px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .input-glass {
            background: rgba(13, 14, 20, 0.5);
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.8), inset -1px -1px 4px rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.03);
            transition: all 0.3s ease;
        }
        .input-glass:focus-within {
            border-color: rgba(99, 102, 241, 0.6);
            background: rgba(13, 14, 20, 0.7);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), inset 4px 4px 8px rgba(0, 0, 0, 0.8);
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
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
        
        @keyframes gradient-x {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
        }
        .animate-gradient-x {
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
        }
      `}</style>

      {/* Vibrant Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#6366f1]/40 rounded-full blur-[120px] pointer-events-none animate-blob mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/30 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000 mix-blend-screen"></div>
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-fuchsia-600/30 rounded-full blur-[150px] pointer-events-none animate-blob animation-delay-4000 mix-blend-screen"></div>

      <main className="w-full max-w-2xl relative z-10">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center mx-auto mb-6 text-white animate-gradient-x">
            <span className="material-symbols-outlined text-[40px]">person_add</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-gradient-x">RIDENOVA</h1>
          <p className="text-[#6366f1] font-black mt-2 text-xs tracking-[0.4em] uppercase">Join the Elite Fleet</p>
        </div>
        
        <div className="panel-glass rounded-[40px] p-8 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
             <div 
               className="h-full bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 transition-all duration-700 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-gradient-x"
               style={{ width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%' }}
             ></div>
          </div>

          {/* Progress Tracker Icons */}
          <div className="flex items-center justify-between mb-12 px-2">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step >= 1 ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-gradient-x' : 'input-glass text-slate-500'}`}>
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-white' : 'text-slate-600'}`}>Profile</span>
            </div>
            <div className="w-full h-px bg-white/5 mx-4 mt-[-15px]"></div>
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step >= 2 ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-gradient-x' : 'input-glass text-slate-500'}`}>
                <span className="material-symbols-outlined text-xl">directions_car</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-white' : 'text-slate-600'}`}>Vehicle</span>
            </div>
            <div className="w-full h-px bg-white/5 mx-4 mt-[-15px]"></div>
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step >= 3 ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-gradient-x' : 'input-glass text-slate-500'}`}>
                <span className="material-symbols-outlined text-xl">description</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-white' : 'text-slate-600'}`}>Verify</span>
            </div>
          </div>

          <form className="space-y-8" onSubmit={step === 3 ? handleRegister : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black mb-6 text-white tracking-tight">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2" htmlFor="firstName">First Name</label>
                    <div className="input-glass rounded-2xl overflow-hidden">
                      <input 
                        className="w-full bg-transparent p-5 text-white font-bold text-sm outline-none placeholder:text-slate-700" 
                        id="firstName" name="firstName" placeholder="John" type="text" value={formData.firstName} onChange={handleChange} required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2" htmlFor="lastName">Last Name</label>
                    <div className="input-glass rounded-2xl overflow-hidden">
                      <input 
                        className="w-full bg-transparent p-5 text-white font-bold text-sm outline-none placeholder:text-slate-700" 
                        id="lastName" name="lastName" placeholder="Doe" type="text" value={formData.lastName} onChange={handleChange} required
                      />
                    </div>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2" htmlFor="email">Email Address</label>
                    <div className="relative input-glass rounded-2xl overflow-hidden">
                      <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#6366f1]">
                        <span className="material-symbols-outlined">mail</span>
                      </span>
                      <input 
                        className="w-full bg-transparent py-5 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-700" 
                        id="email" name="email" placeholder="john.doe@ridenova.com" type="email" value={formData.email} onChange={handleChange} required
                      />
                    </div>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2" htmlFor="phone">Phone Number</label>
                    <div className="relative input-glass rounded-2xl overflow-hidden">
                      <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#6366f1]">
                        <span className="material-symbols-outlined">call</span>
                      </span>
                      <input 
                        className="w-full bg-transparent py-5 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-700" 
                        id="phone" name="phone" placeholder="+1 (555) 123-4567" type="tel" value={formData.phone} onChange={handleChange} required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Information */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-black mb-6 text-white tracking-tight">Vehicle Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2" htmlFor="vehicleMake">Make</label>
                    <div className="input-glass rounded-2xl overflow-hidden">
                      <input 
                        className="w-full bg-transparent p-5 text-white font-bold text-sm outline-none placeholder:text-slate-700" 
                        id="vehicleMake" name="vehicleMake" placeholder="Toyota" type="text" value={formData.vehicleMake} onChange={handleChange} required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2" htmlFor="vehicleModel">Model</label>
                    <div className="input-glass rounded-2xl overflow-hidden">
                      <input 
                        className="w-full bg-transparent p-5 text-white font-bold text-sm outline-none placeholder:text-slate-700" 
                        id="vehicleModel" name="vehicleModel" placeholder="Camry" type="text" value={formData.vehicleModel} onChange={handleChange} required
                      />
                    </div>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2" htmlFor="licensePlate">License Plate</label>
                    <div className="relative input-glass rounded-2xl overflow-hidden">
                      <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#6366f1]">
                        <span className="material-symbols-outlined">123</span>
                      </span>
                      <input 
                        className="w-full bg-transparent py-5 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-700" 
                        id="licensePlate" name="licensePlate" placeholder="ABC-1234" type="text" value={formData.licensePlate} onChange={handleChange} required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-black mb-2 text-white tracking-tight">Identity & Documents</h2>
                <p className="text-sm text-slate-500 mb-8 font-medium">Please upload clear photos for automatic AI verification.</p>
                <div className="space-y-5">
                  {['Driving License', 'Vehicle Insurance', 'Identity Verification'].map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-5 input-glass rounded-2xl group transition-all hover:bg-white/5">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          <span className="material-symbols-outlined">upload_file</span>
                        </div>
                        <div>
                          <span className="font-black text-xs uppercase tracking-widest text-white">{doc}</span>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Required</p>
                        </div>
                      </div>
                      <label className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white text-[10px] font-black py-3 px-6 rounded-xl hover:scale-105 transition-all cursor-pointer shadow-[0_5px_15px_rgba(99,102,241,0.3)] uppercase tracking-widest">
                        Upload
                        <input type="file" className="hidden" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-10 mt-10 border-t border-white/5">
              <div className="flex justify-between items-center">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="text-slate-500 font-black py-4 px-8 rounded-2xl hover:text-white flex items-center gap-2 transition-all uppercase tracking-widest text-xs" type="button">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back
                  </button>
                ) : <div></div>}
                <button className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white font-black py-5 px-10 rounded-2xl shadow-[0_10px_25px_rgba(139,92,246,0.5)] flex items-center gap-3 transition-all hover:scale-[1.05] active:scale-95 uppercase tracking-widest text-xs" type="submit">
                  {step === 3 ? 'Launch My Career' : 'Next Step'}
                  {step !== 3 && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
               <button type="button" onClick={() => navigate('/driver/login')} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
                 Already registered? <span className="text-[#6366f1]">Login to Dashboard</span>
               </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
