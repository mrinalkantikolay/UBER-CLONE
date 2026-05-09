import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { toast } from 'sonner';

export default function DriverDocuments() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<number | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/drivers/documents');
        setDocuments(res.data.data || []);
      } catch (err: any) {
        // ignore silently
      }
    })();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || editingDoc == null) {
      toast.error('Please select a file');
      return;
    }

    try {
      const docMeta = documents.find(d => d.id === editingDoc) || { name: 'document' };
      const form = new FormData();
      form.append('document', selectedFile);
      form.append('type', docMeta.name || 'document');
      await api.post('/drivers/documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded');
      setEditingDoc(null);
      setSelectedFile(null);
      // refresh
      const list = await api.get('/drivers/documents');
      setDocuments(list.data.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/drivers/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
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
      `}</style>

      {/* Ambient Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-600/15 blur-[120px] pointer-events-none z-0"></div>

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
          <a className="flex items-center space-x-3 nav-item-active rounded-2xl p-4 transition-all duration-200 cursor-pointer">
            <span className="material-symbols-outlined">folder</span>
            <span className="font-bold">Documents</span>
          </a>
          <a className="flex items-center space-x-3 text-slate-500 p-4 hover:text-slate-200 transition-all cursor-pointer" onClick={() => navigate('/driver/profile')}>
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
                <p className="text-sm font-bold text-white">Marcus</p>
                <p className="text-[10px] text-slate-500">Gold Driver</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#6366f1]/30 shrink-0">
                <img src="https://lh3.googleusercontent.com/aida-public/AOUrY4izGk43cT7eNINzJvE7-G5uW-m8J816Xm8fRy9x" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-28 md:pt-32 px-4 sm:px-6 max-w-7xl mx-auto pb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">My Documents</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Manage your verification files</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="panel-3d rounded-[2rem] p-6 flex flex-col justify-between border border-white/5 hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                      <span className="material-symbols-outlined text-3xl">{doc.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{doc.name}</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${doc.color}`}>{doc.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingDoc(doc.id)}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(String(doc.id))} className="w-10 h-10 rounded-full bg-white/5 hover:bg-rose-500/10 text-rose-400 hover:text-white flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <div className="input-inset rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Expiration Date</p>
                    <p className="text-sm font-bold text-white mt-1">{doc.expiry}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'Action Required' && (
                      <button 
                        onClick={() => setEditingDoc(doc.id)}
                        className="bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        Update Now
                      </button>
                    )}
                    {doc.id && (
                      <button onClick={() => handleDelete(String(doc.id))} className="bg-white/5 hover:bg-rose-500/10 text-rose-400 hover:text-white transition-all rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
          <button className="flex flex-col items-center justify-center text-indigo-400 gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Docs</span>
          </button>
          <button onClick={() => navigate('/driver/profile')} className="flex flex-col items-center justify-center text-slate-500 gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </nav>
      </main>

      {/* Edit Document Modal */}
      {editingDoc !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="panel-3d w-full max-w-lg rounded-[2.5rem] overflow-hidden border border-white/10 p-6 sm:p-10 relative animate-fade-in-up">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400 hover:text-white z-20" onClick={() => setEditingDoc(null)}>
              <span className="material-symbols-outlined text-[24px]">close</span>
            </div>
            
            <div className="flex items-center gap-4 text-indigo-400 mb-8">
              <div className="p-3 panel-3d rounded-2xl border border-white/10 shrink-0">
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Update Document</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Upload a clear photo or PDF</p>
              </div>
            </div>
            
            <div className="space-y-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] ml-2">Document Type</label>
                <div className="input-inset rounded-2xl p-4 sm:p-5 text-slate-300 font-black tracking-tight text-sm sm:text-base cursor-not-allowed">
                  {documents.find(d => d.id === editingDoc)?.name}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] ml-2">Upload File</label>
                <div className="input-inset rounded-2xl p-8 border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Click to browse or drag file here</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Max size: 10MB (JPG, PNG, PDF)</p>
                  </div>
                  <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-white/5">
              <button 
                onClick={handleUpload}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all rounded-xl px-8 py-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] w-full"
              >
                <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                Submit Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
