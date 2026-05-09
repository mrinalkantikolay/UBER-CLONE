import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { toast } from 'sonner';


export default function DriverProfile() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('https://lh3.googleusercontent.com/aida-public/AOUrY4izGk43cT7eNINzJvE7-G5uW-m8J816Xm8fRy9x');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/drivers/me');
        setProfile(res.data.data);
        if (res.data.data?.user?.avatar) setProfileImage(res.data.data.user.avatar);
      } catch (err: any) {
        // non-fatal
        // console.error(err?.response?.data || err);
      }
    })();
  }, []);
  const [isViewImageOpen, setIsViewImageOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      alert('Profile picture updated!');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoData = canvas.toDataURL('image/jpeg');
        setProfileImage(photoData);
        stopCamera();
        alert('Photo captured successfully!');
      }
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
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center accent-glow">
            <span className="material-symbols-outlined text-white text-2xl">local_taxi</span>
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight uppercase">Driver Portal</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-black">Online</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/dashboard')}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-bold">Dashboard</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/earnings')}>
            <span className="material-symbols-outlined">payments</span>
            <span className="font-bold">Earnings</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/activity')}>
            <span className="material-symbols-outlined">history</span>
            <span className="font-bold">Activity</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/documents')}>
            <span className="material-symbols-outlined">folder</span>
            <span className="font-bold">Documents</span>
          </a>
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer" onClick={() => navigate('/driver/profile')}>
            <span className="material-symbols-outlined">person</span>
            <span className="font-bold">Profile</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-rose-400 transition-all cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined">logout</span>
            <span className="font-bold">Logout</span>
          </a>
        </nav>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 md:ml-64 relative overflow-x-hidden overflow-y-auto bg-[#0a0b10] pb-24 md:pb-0">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-4 md:px-6 py-4 h-20 fixed top-0 left-0 right-0 md:left-64 bg-[#0a0b10]/95 backdrop-blur-lg z-30 border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div 
              className="md:hidden w-10 h-10 panel-3d rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-slate-300">menu</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tighter cursor-pointer drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-gradient-x" onClick={() => navigate('/')}>RIDENOVA</h1>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-emerald-400 font-black px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Driver</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`}></div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300">{isOnline ? 'On' : 'Off'}</span>
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className="text-white hover:text-emerald-400 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl sm:text-3xl leading-none">
                  {isOnline ? 'toggle_on' : 'toggle_off'}
                </span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group px-1 sm:px-2 py-1 rounded-2xl hover:bg-white/5 transition-all" onClick={() => navigate('/driver/profile')}>
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-white">{profile?.user?.name || 'Marcus'}</p>
                <p className="text-[10px] text-slate-500">Gold Driver</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#6366f1]/30 shrink-0">
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-28 md:pt-32 px-4 sm:px-6 max-w-7xl mx-auto pb-10">
          <section className="panel-3d moving-left-shadow rounded-[2rem] sm:rounded-[3rem] p-6 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 border border-white/5 relative overflow-visible mb-10 min-w-0">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 shrink-0 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full blur-2xl opacity-20"></div>
              <div className="w-full h-full rounded-full overflow-hidden panel-3d border-2 border-white/10 relative z-10">
                <img alt="Driver Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={profileImage}/>
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setIsViewImageOpen(true)}
                    className="text-[8px] sm:text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 rounded-full transition-all flex items-center gap-1 w-20 sm:w-24 justify-center"
                  >
                    <span className="material-symbols-outlined text-[10px] sm:text-[12px]">visibility</span> View
                  </button>
                  
                  <label className="text-[8px] sm:text-[10px] font-bold text-white bg-white/10 hover:bg-indigo-500 px-2 sm:px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1 w-20 sm:w-24 justify-center">
                    <span className="material-symbols-outlined text-[10px] sm:text-[12px]">folder_open</span> Gallery
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>

                  <button 
                    onClick={startCamera}
                    className="text-[8px] sm:text-[10px] font-bold text-white bg-indigo-500 hover:bg-indigo-400 px-2 sm:px-3 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1 w-20 sm:w-24 justify-center"
                  >
                    <span className="material-symbols-outlined text-[10px] sm:text-[12px]">photo_camera</span> Camera
                  </button>
                </div>
              </div>
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-full flex items-center justify-center panel-3d text-white z-20 border border-white/20">
                <span className="material-symbols-outlined text-base sm:text-lg">verified</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-4 sm:space-y-6 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 pr-0 sm:pr-4">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter break-words">{profile?.user?.name || 'Marcus J.'}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
                    <span className="break-words text-center md:text-left">Diamond Tier Pilot • Member Since 2024</span>
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 text-white transition-all rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest shrink-0 mx-auto sm:mx-0 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] mt-2 sm:mt-0"
                >
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">edit</span>
                  Edit Profile
                </button>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 input-inset px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shrink-0">
                  <span className="material-symbols-outlined text-indigo-400 text-lg sm:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-black text-white text-base sm:text-lg">4.96</span>
                  <span className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-1">2.4k Missions</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 input-inset px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shrink-0">
                  <span className="material-symbols-outlined text-emerald-400 text-lg sm:text-xl">thumb_up</span>
                  <span className="font-black text-white text-base sm:text-lg">98%</span>
                  <span className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-1">Success</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <section className="panel-3d moving-left-shadow rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col space-y-6 sm:space-y-8 md:col-span-1 border border-white/5 overflow-visible min-w-0">
              <div className="flex items-center gap-4 text-indigo-400">
                <div className="p-2 sm:p-3 panel-3d rounded-2xl border border-white/10 shrink-0">
                  <span className="material-symbols-outlined text-xl sm:text-2xl">person</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight break-words">Identity</h3>
              </div>
              <div className="space-y-4">
                <div className="input-inset rounded-2xl p-4 sm:p-5 min-w-0">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Comms Channel</p>
                  <p className="text-white font-black tracking-tight text-sm sm:text-base break-words">+1 (555) 123-4567</p>
                </div>
                <div className="input-inset rounded-2xl p-4 sm:p-5 min-w-0">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Digital Signature</p>
                  <p className="text-white font-black tracking-tight text-sm sm:text-base break-all">marcus.j@example.com</p>
                </div>
              </div>
            </section>

            <section className="panel-3d moving-left-shadow rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col space-y-6 sm:space-y-8 md:col-span-2 border border-white/5 overflow-visible min-w-0">
              <div className="flex items-center gap-4 text-indigo-400">
                <div className="p-2 sm:p-3 panel-3d rounded-2xl border border-white/10 shrink-0">
                  <span className="material-symbols-outlined text-xl sm:text-2xl">directions_car</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight break-words">Vessel Specification</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-inset rounded-2xl p-4 sm:p-5 min-w-0">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Classification</p>
                  <p className="text-white font-black tracking-tight text-sm sm:text-base break-words">Toyota Camry 2023</p>
                </div>
                <div className="input-inset rounded-2xl p-4 sm:p-5 min-w-0">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Digital Aura</p>
                  <p className="text-white font-black tracking-tight text-sm sm:text-base break-words">Lunar Silver</p>
                </div>
              </div>
            </section>
          </div>

        </div>

        {/* BottomNavBar (Mobile Only) */}
        <nav className="md:hidden bg-[#0a0b10]/95 backdrop-blur-xl border-t border-white/5 fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate('/driver/dashboard')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">dashboard</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Dash</span>
          </button>
          <button onClick={() => navigate('/driver/earnings')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">payments</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Money</span>
          </button>
          <button onClick={() => navigate('/driver/activity')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl">history</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Logs</span>
          </button>
          <button onClick={() => navigate('/driver/documents')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Docs</span>
          </button>
          <button className="flex flex-col items-center justify-center text-indigo-400 gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </nav>
      </main>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-white/10 p-6 sm:p-10 relative animate-fade-in-up moving-left-shadow">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white z-20" onClick={() => setIsEditing(false)}>
              <span className="material-symbols-outlined text-[24px]">close</span>
            </div>
            
            <div className="flex items-center gap-4 text-indigo-400 mb-8">
              <div className="p-3 panel-3d rounded-2xl border border-white/10 shrink-0">
                <span className="material-symbols-outlined text-2xl">manage_accounts</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Edit Profile Data</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Update your central matrix records</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-h-[60vh] overflow-y-auto pr-2">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] ml-2">Comms Channel</label>
                <input type="text" defaultValue={profile?.user?.phone || '+1 (555) 123-4567'} className="input-inset rounded-2xl p-4 sm:p-5 text-white font-black tracking-tight text-sm sm:text-base outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all placeholder-slate-600" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] ml-2">Digital Signature</label>
                <input type="email" defaultValue={profile?.user?.email || 'email@example.com'} className="input-inset rounded-2xl p-4 sm:p-5 text-white font-black tracking-tight text-sm sm:text-base outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all placeholder-slate-600" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] ml-2">Classification</label>
                <input id="vehicle-classification" type="text" defaultValue={`${profile?.vehicle?.make || 'Toyota'} ${profile?.vehicle?.model || 'Camry'} ${profile?.vehicle?.year || ''}`} className="input-inset rounded-2xl p-4 sm:p-5 text-white font-black tracking-tight text-sm sm:text-base outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all placeholder-slate-600" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] ml-2">Digital Aura</label>
                <input type="text" defaultValue="Lunar Silver" className="input-inset rounded-2xl p-4 sm:p-5 text-white font-black tracking-tight text-sm sm:text-base outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all placeholder-slate-600" />
              </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-white/5">
              <button 
                onClick={async () => {
                  try {
                    const classification = (document.getElementById('vehicle-classification') as HTMLInputElement)?.value || '';
                    // naive parse: "Make Model Year" -> make, model, year
                    const parts = classification.trim().split(/\s+/);
                    const yearPart = parts[parts.length-1];
                    const year = Number(yearPart) || undefined;
                    const make = parts[0] || 'Unknown';
                    const model = parts.length > 1 ? parts.slice(1, parts.length - (year ? 1 : 0)).join(' ') : 'Model';

                    const payload: any = {
                      make,
                      model,
                      year: year || 2020,
                      type: 'SEDAN',
                      licensePlate: profile?.vehicle?.licensePlate || 'UNKNOWN',
                      color: 'Unknown'
                    };

                    if (profile?.vehicle) {
                      await api.patch('/drivers/vehicle', payload);
                      toast.success('Vehicle updated');
                    } else {
                      await api.post('/drivers/vehicle', payload);
                      toast.success('Vehicle added');
                    }

                    // refresh profile
                    const res = await api.get('/drivers/me');
                    setProfile(res.data.data);
                    setIsEditing(false);
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to save');
                  }
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all rounded-xl px-8 py-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] hover:-translate-y-1 w-full"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Image Modal */}
      {isViewImageOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
          <button 
            onClick={() => setIsViewImageOpen(false)}
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="max-w-2xl w-full aspect-square rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl">
            <img src={profileImage} alt="Profile View" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[120] flex flex-col items-center justify-center p-4">
          <div className="panel-3d w-full max-w-lg rounded-[2.5rem] overflow-hidden border border-white/10 relative">
            <button 
              onClick={stopCamera}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-all z-20"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="relative aspect-square bg-black overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover -scale-x-100"
              />
              <div className="absolute inset-0 pointer-events-none border-[30px] border-black/20 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/20 rounded-full border-dashed" />
              </div>
            </div>

            <div className="p-8 flex flex-col items-center gap-4">
              <p className="text-sm text-slate-400 font-medium">Center your face in the circle</p>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white p-1 border-4 border-slate-900 shadow-2xl active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                </div>
              </button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

    </div>
  );
}
