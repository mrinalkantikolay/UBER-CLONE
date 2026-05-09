import React from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from './AdminLayout';
import api from '../../../lib/api';


const DriversManagement: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'Grid' | 'List'>('Grid');
  const [statusFilter, setStatusFilter] = React.useState('All Status');
  const [selectedDriver, setSelectedDriver] = React.useState<any>(null);
  const [previewDoc, setPreviewDoc] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [drivers, setDrivers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await api.get('/admin/drivers');
        // backend returns { drivers, nextCursor, hasMore }
        setDrivers(res.data.data.drivers || res.data.data || []);
      } catch (err) {
        console.error('Failed to load drivers', err);
      }
    };
    fetchDrivers();
  }, []);

  const updateDriverStatus = (id: string, newStatus: string) => {
    // call backend suspend/unsuspend based on newStatus
    (async () => {
      try {
        if (newStatus === 'Deactivated' || newStatus === 'Locked') {
          await api.patch(`/admin/drivers/${id}/suspend`);
        } else {
          await api.patch(`/admin/drivers/${id}/unsuspend`);
        }
        setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: newStatus, color: newStatus === 'Online' ? 'bg-emerald-500' : newStatus === 'Offline' ? 'bg-slate-500' : 'bg-amber-500' } : d));
      } catch (err) {
        console.error('Failed to update driver status', err);
      }
    })();
    setSelectedDriver(null);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         d.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const searchBar = (
    <div className="relative input-inset rounded-2xl overflow-hidden group border border-white/5 focus-within:border-indigo-500/30 transition-all">
      <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform">search</span>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent py-4 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-600" 
        placeholder="Search driver name or ID..." 
        type="text" 
      />
    </div>
  );

  return (
    <AdminLayout 
      title="Drivers Management" 
      subtitle="Monitor and manage the global driver fleet."
      searchSlot={searchBar}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl p-1.5 h-14 moving-left-shadow">
                <button 
                  onClick={() => setViewMode('Grid')}
                  className={`px-10 h-full rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${viewMode === 'Grid' ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 animate-gradient-x' : 'text-slate-500 hover:text-white'}`}
                >
                  Grid
                </button>
                <button 
                  onClick={() => setViewMode('List')}
                  className={`px-10 h-full rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${viewMode === 'List' ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 animate-gradient-x' : 'text-slate-500 hover:text-white'}`}
                >
                  List
                </button>
            </div>
            <div className="relative h-14 group moving-left-shadow rounded-2xl overflow-hidden">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform text-xl">filter_list</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-12 text-white font-black text-[10px] uppercase tracking-[0.2em] outline-none focus:border-indigo-500/30 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                >
                    <option value="All Status" className="bg-[#0a0b10]">All Status</option>
                    <option value="Online" className="bg-[#0a0b10]">Online</option>
                    <option value="Offline" className="bg-[#0a0b10]">Offline</option>
                    <option value="Pending" className="bg-[#0a0b10]">Pending</option>
                    <option value="Deactivated" className="bg-[#0a0b10]">Deactivated</option>
                    <option value="Locked" className="bg-[#0a0b10]">Locked</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">expand_more</span>
            </div>
        </div>
      </div>

      {viewMode === 'Grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredDrivers.map((driver, i) => (
            <div key={i} className="panel-3d moving-left-shadow rounded-[3rem] p-8 border border-white/5 overflow-visible flex flex-col group hover:scale-[1.05] transition-all duration-500">
              <div className="flex justify-between items-start mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[2.5rem] accent-glow p-1 group-hover:rotate-6 transition-transform duration-500">
                    {driver.img ? (
                      <img alt={driver.name} className="w-full h-full rounded-[2.3rem] object-cover" src={driver.img} />
                    ) : (
                      <div className="w-full h-full rounded-[2.3rem] bg-white/5 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl">person</span>
                      </div>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${driver.color} border-4 border-[#0a0b10] rounded-full shadow-[0_0_15px_currentColor] animate-pulse`}></div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl input-inset text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[12px] font-black">{driver.rating}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-colors">{driver.name}</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5">{driver.id}</p>
              </div>

              <div className="space-y-5 mb-10 flex-1">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl input-inset flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">directions_car</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-widest">{driver.tier}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{driver.vehicle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl input-inset flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">schedule</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-widest">{driver.status}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{driver.duration}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedDriver(driver)}
                  className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-indigo-500/30 transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel-3d moving-left-shadow rounded-[3rem] overflow-visible border border-white/5 p-2">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Driver</th>
                  <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">ID</th>
                  <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Tier</th>
                  <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Vehicle</th>
                  <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-center">Rating</th>
                  <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-center">Status</th>
                  <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredDrivers.map((driver, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group border-b border-white/[0.02]">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl input-inset p-0.5 group-hover:scale-110 transition-transform">
                          {driver.img ? (
                            <img alt={driver.name} className="w-full h-full rounded-lg object-cover opacity-80" src={driver.img} />
                          ) : (
                            <div className="w-full h-full rounded-lg bg-white/5 flex items-center justify-center text-slate-600">
                              <span className="material-symbols-outlined text-lg">person</span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">{driver.name}</span>
                      </div>
                    </td>
                    <td className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">{driver.id}</td>
                    <td className="p-8 text-[10px] font-black text-indigo-400 uppercase tracking-widest">{driver.tier}</td>
                    <td className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{driver.vehicle}</td>
                    <td className="p-8 text-center text-amber-400 font-black tracking-widest">
                       <span className="flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {driver.rating}
                       </span>
                    </td>
                    <td className="p-8 text-center">
                       <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl input-inset text-[10px] font-black uppercase tracking-widest ${driver.status === 'Online' ? 'text-emerald-400' : driver.status === 'Offline' ? 'text-slate-400' : 'text-amber-400'}`}>
                          <div className={`w-2 h-2 rounded-full ${driver.color} shadow-[0_0_8px_currentColor]`}></div>
                          {driver.status}
                       </span>
                    </td>
                    <td className="p-8 text-right">
                      <button 
                        onClick={() => setSelectedDriver(driver)}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {selectedDriver && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedDriver(null)}></div>
          <div className="panel-3d w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[2.5rem] accent-glow p-1">
                  {selectedDriver.img ? (
                    <img alt={selectedDriver.name} className="w-full h-full rounded-[2.3rem] object-cover" src={selectedDriver.img} />
                  ) : (
                    <div className="w-full h-full rounded-[2.3rem] bg-white/5 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">{selectedDriver.name}</h2>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mt-1">{selectedDriver.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDriver(null)}
                className="w-12 h-12 rounded-2xl input-inset flex items-center justify-center text-slate-500 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-10">
              {[
                { label: 'Status', value: selectedDriver.status, icon: 'info', color: 'text-indigo-400' },
                { label: 'Rating', value: `${selectedDriver.rating} Stars`, icon: 'star', color: 'text-amber-400' },
                { label: 'Total Rides', value: selectedDriver.rides, icon: 'route', color: 'text-emerald-400' },
                { label: 'Member Since', value: selectedDriver.joined, icon: 'calendar_today', color: 'text-purple-400' },
                { label: 'Email Address', value: selectedDriver.email, icon: 'mail', color: 'text-slate-400', full: true },
                { label: 'Phone Number', value: selectedDriver.phone, icon: 'phone', color: 'text-slate-400' },
                { label: 'Vehicle Info', value: selectedDriver.vehicle, icon: 'directions_car', color: 'text-slate-400' },
              ].map((item, i) => (
                <div key={i} className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] input-inset ${item.full ? 'md:col-span-2' : ''}`}>
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`material-symbols-outlined text-lg ${item.color}`}>{item.icon}</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                  </div>
                  <p className="text-sm font-black text-white tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Pending Driver Documents Section */}
            {selectedDriver.status === 'Pending' && (
              <div className="mb-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Verification Documents</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Driver License', status: 'Pending Review', icon: 'badge', img: 'https://images.unsplash.com/photo-1594411133594-28c37604443e?auto=format&fit=crop&q=80&w=800', id: '' },
                    { name: 'Vehicle Insurance', status: 'Pending Review', icon: 'description', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800', id: '' },
                  ].map((doc, i) => (
                    <div 
                      key={i} 
                      onClick={() => setPreviewDoc(doc)}
                      className="p-5 rounded-2xl input-inset flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <span className="material-symbols-outlined">{doc.icon}</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-widest">{doc.name}</p>
                          <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">{doc.status}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-600 group-hover:text-white transition-colors">visibility</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Preview Overlay */}
            {previewDoc && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setPreviewDoc(null)}></div>
                <div className="relative w-full max-w-3xl aspect-[1.4/1] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                   <img src={previewDoc.img} alt={previewDoc.name} className="w-full h-full object-cover" />
                   <div className="absolute top-6 right-6 flex gap-3">
                      <button 
                        onClick={() => setPreviewDoc(null)}
                        className="w-12 h-12 rounded-2xl bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500 transition-all"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                   </div>
                   <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white font-black text-xl tracking-tight">{previewDoc.name}</p>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Verification Image • 2.4MB</p>
                   </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
               {selectedDriver.status === 'Pending' ? (
                 <>
                   <button 
                     onClick={() => updateDriverStatus(selectedDriver.id, 'Offline')}
                     className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all"
                   >
                     Approve Driver
                   </button>
                   <button 
                     onClick={async () => {
                       // try to approve documents via admin API if document IDs available
                       try {
                         if (selectedDriver.documents && selectedDriver.documents.length > 0) {
                           for (const doc of selectedDriver.documents) {
                             if (doc.id) await api.patch(`/admin/documents/${doc.id}/approve`, { approved: true });
                           }
                           // refresh drivers list
                           const res = await api.get('/admin/drivers');
                           setDrivers(res.data.data.drivers || res.data.data || []);
                         } else {
                           // fallback: mark driver offline via suspend endpoint
                           await api.patch(`/admin/drivers/${selectedDriver.id}/unsuspend`);
                         }
                       } catch (err) {
                         console.error('Approve driver failed', err);
                       }
                       setSelectedDriver(null);
                     }}
                     className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all"
                   >
                     Approve Driver
                   </button>
                   <button 
                     onClick={() => setSelectedDriver(null)}
                     className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-rose-500 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-500/10 transition-all"
                   >
                     Reject Driver
                   </button>
                 </>
               ) : selectedDriver.status === 'Deactivated' ? (
                 <button 
                   onClick={() => updateDriverStatus(selectedDriver.id, 'Offline')}
                   className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl animate-gradient-x"
                 >
                   Re-activate Driver
                 </button>
               ) : selectedDriver.status === 'Locked' ? (
                 <button 
                   onClick={() => updateDriverStatus(selectedDriver.id, 'Offline')}
                   className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl animate-gradient-x"
                 >
                   Unlock Account
                 </button>
               ) : (
                 <>
                   <button 
                     onClick={() => updateDriverStatus(selectedDriver.id, 'Deactivated')}
                     className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all"
                   >
                     Deactivate Driver
                   </button>
                   <button 
                     onClick={() => updateDriverStatus(selectedDriver.id, 'Locked')}
                     className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all"
                   >
                     Lock Account
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
};

export default DriversManagement;
