import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { useAuthStore } from '../../auth/store/use-auth-store';
import { toast } from 'sonner';

export function RiderProfile() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewImageOpen, setIsViewImageOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);
  
  const [temperature, setTemperature] = useState('Cool (A/C preferred)');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { user, logout } = useAuthStore();

  const [profile, setProfile] = useState({
    name: user?.name || 'Rider',
    phone: user?.phone || '',
    email: user?.email || '',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEi2hWgxtHxNtFSZn4702AbTI2v41XH7xZbpQmRalgfjWGWdswATZaGL3ZAKPlHCvTzC3mekZrh0IvnD2xlS1w-TEn6hn0N__GiRkljB-8eIAkBEjoaa1QCTE9dzL9YnToWzrqp5f-tfKGf0uwlMivUx3hEvjCnMiDbMmMbLQfatFSQGkjFeQHN0c8LbX1YLAegSySy0lfS1xwnMcyUd12_4BDN2YNwXi_GJvBrduO1XRB4YD4mkwEhP9q2FB2ucvCCSXU8qw4ZPc'
  });

  const [tempProfile, setTempProfile] = useState({ ...profile });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');
        if (response.data.data && response.data.data.user) {
          const userData = response.data.data.user;
          setProfile(prev => ({
            ...prev,
            name: userData.name || prev.name,
            phone: userData.phone || prev.phone,
            email: userData.email || prev.email,
          }));
          setTempProfile({
            name: userData.name || profile.name,
            phone: userData.phone || profile.phone,
            email: userData.email || profile.email,
            avatar: profile.avatar
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await api.patch('/users/me', {
        name: tempProfile.name,
        phone: tempProfile.phone,
        email: tempProfile.email
      });
      setProfile({ ...tempProfile });
      setIsEditModalOpen(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, avatar: imageUrl }));
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
        setProfile(prev => ({ ...prev, avatar: photoData }));
        stopCamera();
        alert('Photo captured successfully!');
      }
    }
  };

  const [savedPlaces, setSavedPlaces] = useState([
    { id: 1, name: 'Home', address: '123 Market St, San Francisco', icon: 'home', color: 'bg-blue-500/10', text: 'text-blue-500' },
    { id: 2, name: 'Work', address: '500 3rd St, San Francisco', icon: 'work', color: 'bg-amber-500/10', text: 'text-amber-500' }
  ]);

  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', address: '' });

  const handleAddPlace = () => {
    if (!newPlace.name || !newPlace.address) {
      alert('Please fill in both name and address');
      return;
    }
    const id = savedPlaces.length + 1;
    setSavedPlaces([...savedPlaces, {
      id,
      name: newPlace.name,
      address: newPlace.address,
      icon: 'location_on',
      color: 'bg-emerald-500/10',
      text: 'text-emerald-500'
    }]);
    setIsAddPlaceOpen(false);
    setNewPlace({ name: '', address: '' });
  };

  const handleDeletePlace = (id: number) => {
    setSavedPlaces(savedPlaces.filter(p => p.id !== id));
  };

  return (
    <div className="font-body min-h-screen flex flex-col md:flex-row overflow-x-hidden bg-[#0a0b10] text-[#e2e8f0]">
      <style>{`
        .panel-3d {
            background: #161821;
            box-shadow: -4px -4px 12px rgba(255, 255, 255, 0.05), 10px 10px 24px rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .input-inset {
            background: #0d0e14;
            box-shadow: inset 6px 6px 12px rgba(0, 0, 0, 0.8), inset -2px -2px 6px rgba(255, 255, 255, 0.02);
            border: none;
        }
        .nav-sidebar {
            background: #161821;
            box-shadow: -4px 0px 12px rgba(255, 255, 255, 0.05), 10px 0px 30px rgba(0, 0, 0, 0.6);
        }
        .nav-item-active {
            background: #0d0e14;
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -2px -2px 6px rgba(255, 255, 255, 0.02);
            color: #6366f1;
        }
        .accent-glow {
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }
      `}</style>

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
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-600 to-indigo-400 bg-clip-text text-transparent tracking-tighter cursor-pointer animate-gradient-x" onClick={() => navigate('/')}>RIDENOVA</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end ml-4">
            <div className="flex items-center space-x-3 cursor-pointer group px-2 py-1 rounded-2xl bg-white/5 transition-all">
              <div className="text-right">
                <p className="text-sm font-bold text-white">{profile.name}</p>
                <p className="text-[10px] text-slate-500">Premium Member</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#6366f1]/30 shrink-0">
                <img alt={profile.name} className="w-full h-full object-cover" src={profile.avatar} />
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

        {/* Dynamic Content Area for Profile */}
        <div className="pt-28 px-6 lg:px-12 max-w-[1600px] mx-auto w-full h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-white">My Profile</h2>
            <button 
              onClick={() => {
                setTempProfile({ ...profile });
                setIsEditModalOpen(true);
              }}
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Avatar & Basic Info */}
            <div className="lg:col-span-1 space-y-8">
              <div className="panel-3d rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366f1]/10 rounded-bl-[100px] blur-xl"></div>
                <div 
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#6366f1]/30 mb-6 relative z-10 group"
                >
                  <img alt={profile.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={profile.avatar} />
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setIsViewImageOpen(true)}
                      className="text-[8px] font-bold text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition-all flex items-center gap-1 w-20 justify-center"
                    >
                      <span className="material-symbols-outlined text-[10px]">visibility</span> View
                    </button>
                    
                    <label className="text-[8px] font-bold text-white bg-white/10 hover:bg-[#6366f1] px-2 py-0.5 rounded-full cursor-pointer transition-all flex items-center gap-1 w-20 justify-center">
                      <span className="material-symbols-outlined text-[10px]">folder_open</span> Gallery
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>

                    <button 
                      onClick={startCamera}
                      className="text-[8px] font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] px-2 py-0.5 rounded-full cursor-pointer transition-all flex items-center gap-1 w-20 justify-center"
                    >
                      <span className="material-symbols-outlined text-[10px]">photo_camera</span> Camera
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">{profile.name}</h3>
                <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#6366f1]">verified</span>
                  Premium Member since 2023
                </p>

                <div className="w-full h-px bg-white/5 my-6"></div>

                <div className="w-full flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Rider Rating</span>
                  <div className="flex items-center gap-1 font-bold text-white">
                    4.92 <span className="material-symbols-outlined text-[14px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="panel-3d rounded-[2rem] p-6 border border-white/5">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Contact Info</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl input-inset flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">phone</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Phone Number</p>
                      <p className="font-bold text-white mt-0.5">{profile.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl input-inset flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email Address</p>
                      <p className="font-bold text-white mt-0.5">{profile.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Stats & Preferences */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="panel-3d rounded-[2rem] p-6 border border-white/5 text-center">
                  <span className="material-symbols-outlined text-[#6366f1] text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
                  <p className="text-3xl font-black text-white tabular-nums">142</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Total Rides</p>
                </div>
                <div className="panel-3d rounded-[2rem] p-6 border border-white/5 text-center">
                  <span className="material-symbols-outlined text-emerald-500 text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                  <p className="text-3xl font-black text-white tabular-nums">4</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Active Promos</p>
                </div>
                <div className="panel-3d rounded-[2rem] p-6 border border-white/5 text-center col-span-2 md:col-span-1">
                  <span className="material-symbols-outlined text-rose-500 text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  <p className="text-3xl font-black text-white tabular-nums">3</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Saved Places</p>
                </div>
              </div>

              {/* Saved Places */}
              <div className="panel-3d rounded-[2rem] p-6 border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Saved Places</h4>
                  <button 
                    onClick={() => setIsAddPlaceOpen(true)}
                    className="text-[#6366f1] hover:text-[#4f46e5] transition-colors text-sm font-bold"
                  >
                    Add New
                  </button>
                </div>

                <div className="space-y-3">
                  {savedPlaces.map(place => (
                    <div key={place.id} className="input-inset rounded-2xl p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${place.color} ${place.text} flex items-center justify-center`}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{place.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-white">{place.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{place.address}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeletePlace(place.id)}
                        className="w-8 h-8 rounded-full hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}

                  {savedPlaces.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm italic">No saved places yet.</div>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="panel-3d rounded-[2rem] p-6 border border-white/5">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Ride Preferences</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Quiet Ride</p>
                      <p className="text-xs text-slate-500 mt-0.5">Prefer drivers to keep conversation minimal.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
                    </label>
                  </div>
                  
                  <div className="w-full h-px bg-white/5"></div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Temperature</p>
                      <p className="text-xs text-slate-500 mt-0.5">{temperature}</p>
                    </div>
                    <button 
                      onClick={() => setIsTempModalOpen(true)}
                      className="text-[#6366f1] hover:text-[#4f46e5] text-sm font-bold transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10 p-8 relative">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white" onClick={() => setIsEditModalOpen(false)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-6">Edit Profile</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Full Name</label>
                <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <input 
                    type="text" 
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Phone Number</label>
                <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <input 
                    type="text" 
                    value={tempProfile.phone}
                    onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Email Address</label>
                <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <input 
                    type="email" 
                    value={tempProfile.email}
                    onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Profile Picture URL</label>
                <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <input 
                    type="text" 
                    value={tempProfile.avatar}
                    onChange={(e) => setTempProfile({ ...tempProfile, avatar: e.target.value })}
                    placeholder="Enter image URL..."
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-4 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* View Image Modal */}
      {isViewImageOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <button 
            onClick={() => setIsViewImageOpen(false)}
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-rose-500 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="max-w-2xl w-full aspect-square rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl">
            <img src={profile.avatar} alt="Profile View" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex flex-col items-center justify-center p-4">
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
                  <div className="w-12 h-12 rounded-full bg-[#6366f1] shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                </div>
              </button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Add Saved Place Modal */}
      {isAddPlaceOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10 p-8 relative">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white" onClick={() => setIsAddPlaceOpen(false)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-6">Add Saved Place</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Place Name (e.g., Gym, School)</label>
                <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <input 
                    type="text" 
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                    placeholder="Enter name..."
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Address</label>
                <div className="input-inset rounded-xl p-4 border border-transparent focus-within:border-[#6366f1]/50 transition-all">
                  <input 
                    type="text" 
                    value={newPlace.address}
                    onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                    placeholder="Enter address..."
                    className="bg-transparent border-none outline-none text-white font-bold w-full" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddPlace}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-4 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
            >
              Save Place
            </button>
          </div>
        </div>
      )}

      {/* Temperature Selection Modal */}
      {isTempModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10 p-8 relative">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white" onClick={() => setIsTempModalOpen(false)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-6">Climate Preference</h3>
            
            <div className="space-y-3 mb-8">
              {[
                { label: 'Cool (A/C preferred)', icon: 'ac_unit', color: 'text-blue-400' },
                { label: 'Warm (Heater preferred)', icon: 'thermostat', color: 'text-orange-400' },
                { label: 'No Preference / Off', icon: 'block', color: 'text-slate-400' },
                { label: 'Windows Down', icon: 'air', color: 'text-emerald-400' }
              ].map((opt) => (
                <button 
                  key={opt.label}
                  onClick={() => {
                    setTemperature(opt.label);
                    setIsTempModalOpen(false);
                  }}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 border transition-all ${
                    temperature === opt.label 
                      ? 'bg-[#6366f1]/10 border-[#6366f1] shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : 'input-inset border-transparent hover:border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${opt.color}`}>
                    <span className="material-symbols-outlined">{opt.icon}</span>
                  </div>
                  <span className={`font-bold text-sm ${temperature === opt.label ? 'text-white' : 'text-slate-400'}`}>
                    {opt.label}
                  </span>
                  {temperature === opt.label && (
                    <span className="material-symbols-outlined text-[#6366f1] ml-auto">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
