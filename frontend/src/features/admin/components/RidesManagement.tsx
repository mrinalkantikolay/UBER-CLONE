import React from 'react';
import AdminLayout from './AdminLayout';

const RidesManagement: React.FC = () => {
  const [filter, setFilter] = React.useState('All Status');
  const [dateRange, setDateRange] = React.useState('Last 7 Days');
  const [customDate, setCustomDate] = React.useState('');
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const allRides = [
    { id: '#RN-8492', time: 'Today, 2:15 PM', driver: 'Marcus T.', passenger: 'Sarah Jenkins', from: '101 Tech Hub Blvd', to: 'SFO Terminal 2', fare: '$42.50', status: 'Ongoing', color: 'text-indigo-400', icon: 'cached', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSDZlEypPSyI5T8ZhgqdvfqTMEvRGMypEYeqyxqrOvq9owlHuT368C9DbB5BkKy8qtLRVnF2dBBCUf7UHVKzcJdm1QaG3FtisCqVcePiKmq1ufi3MwOyFDrWxctdvzdKpiDkNroP4_SA0DUyQiAp93NptpvrWP4koKA_ggcfKLyFBRcBKJLmalWEFZzjNCdZ6yNIYi9Cxm7Ad5fHIOnOFJ6v0_7pxwheAKZaJx_20E7vmQsEezF7BcYs4W8BpJShCk3sGbuo2-bYM' },
    { id: '#RN-8491', time: 'Today, 1:30 PM', driver: 'Elena R.', passenger: 'David Chen', from: 'Central Station', to: 'Market District', fare: '$18.00', status: 'Completed', color: 'text-emerald-400', icon: 'check_circle', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz7xOEgmeCR6xNpU1K5zS64olSuyFtR2JWkTquhxHikk7E6-E-U0ALwrtyS4_Q3-YQTDPXJuD9GuEZfxoRpZNgjEd49vh3CYpcLNnlfd5CsO6fenyP_e6asFQcvqWTxWRRJ1kep9HJ4jCFsEdcmlq02Qz3PAd5kwgqxPjyk5ME1kZKnVizY-l6GvxtMXOAIdwSxieQNrjE3tCbEYFhgFk-XCns6hjhtzlc0ZEaJ1VMuODI3JbXZoQ5A2yVU8QqA8CNzjk77DTi-0w' },
    { id: '#RN-8488', time: 'Today, 11:45 AM', driver: 'Unassigned', passenger: 'Anita W.', from: '400 Pine Street', to: 'Westside Plaza', fare: '$12.50', status: 'Canceled', color: 'text-rose-400', icon: 'cancel', img: '' },
  ];

  const filteredRides = filter === 'All Status' 
    ? allRides 
    : allRides.filter(ride => ride.status === filter);

  return (
    <AdminLayout title="Rides Management" subtitle="Monitor and manage active, completed, and canceled ride requests.">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex gap-4">
            <div className="relative h-14 group moving-left-shadow rounded-2xl overflow-hidden">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform text-xl">filter_list</span>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-12 text-white font-black text-[10px] uppercase tracking-[0.2em] outline-none focus:border-indigo-500/30 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                >
                    <option value="All Status" className="bg-[#0a0b10]">All Status</option>
                    <option value="Ongoing" className="bg-[#0a0b10]">Ongoing</option>
                    <option value="Completed" className="bg-[#0a0b10]">Completed</option>
                    <option value="Canceled" className="bg-[#0a0b10]">Canceled</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">expand_more</span>
            </div>
            <div className="relative h-14 group moving-left-shadow rounded-2xl overflow-hidden">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform text-xl">calendar_today</span>
                <select 
                  value={dateRange === 'Custom' ? 'Custom' : dateRange}
                  onChange={(e) => {
                    if (e.target.value === 'Custom') {
                      dateInputRef.current?.showPicker();
                    } else {
                      setDateRange(e.target.value);
                    }
                  }}
                  className="h-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-12 text-white font-black text-[10px] uppercase tracking-[0.2em] outline-none focus:border-indigo-500/30 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                >
                    <option value="Today" className="bg-[#0a0b10]">Today</option>
                    <option value="Yesterday" className="bg-[#0a0b10]">Yesterday</option>
                    <option value="Last 7 Days" className="bg-[#0a0b10]">Last 7 Days</option>
                    <option value="Last 30 Days" className="bg-[#0a0b10]">Last 30 Days</option>
                    <option value="Custom" className="bg-[#0a0b10]">Custom Date...</option>
                </select>
                <input 
                  ref={dateInputRef}
                  type="date" 
                  className="absolute inset-0 opacity-0 pointer-events-none" 
                  onChange={(e) => {
                    if (e.target.value) {
                      setDateRange('Custom');
                      setCustomDate(e.target.value);
                    }
                  }}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">expand_more</span>
                {dateRange === 'Custom' && customDate && (
                  <div className="absolute top-[calc(100%+8px)] left-0 bg-indigo-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-widest whitespace-nowrap z-10 animate-in fade-in slide-in-from-top-1">
                    Selected: {customDate}
                  </div>
                )}
            </div>
        </div>
        <button 
          onClick={() => {
            const headers = ['Ride ID', 'Time', 'Driver', 'Passenger', 'From', 'To', 'Fare', 'Status'];
            const csvContent = [
              headers.join(','),
              ...filteredRides.map(r => [
                r.id,
                `"${r.time}"`,
                `"${r.driver}"`,
                `"${r.passenger}"`,
                `"${r.from}"`,
                `"${r.to}"`,
                r.fare,
                r.status
              ].join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `ridenova-audit-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white font-black h-14 px-10 rounded-2xl shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-xl">download</span>
          Export Audit Log
        </button>
      </div>

      {/* Rides Table */}
      <div className="panel-3d moving-left-shadow rounded-[3rem] overflow-visible border border-white/5 p-2">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Ride Details</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Driver</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Passenger</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Route</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-right">Fare</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-center">Status</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredRides.map((ride, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group border-b border-white/[0.02]">
                  <td className="p-8">
                    <p className="font-black text-sm tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">{ride.id}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5 tracking-widest">{ride.time}</p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl input-inset p-0.5 group-hover:scale-110 transition-transform">
                        {ride.img ? (
                          <img alt={ride.driver} className="w-full h-full rounded-lg object-cover opacity-80" src={ride.img} />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-white/5 flex items-center justify-center text-slate-600">
                            <span className="material-symbols-outlined text-lg">person</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-300 tracking-tight">{ride.driver}</span>
                    </div>
                  </td>
                  <td className="p-8 text-slate-400 font-bold text-xs uppercase tracking-widest">{ride.passenger}</td>
                  <td className="p-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-300 truncate max-w-[150px] uppercase tracking-tighter">{ride.from}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-500 truncate max-w-[150px] uppercase tracking-tighter">{ride.to}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-right font-black text-white text-sm tracking-tight">{ride.fare}</td>
                  <td className="p-8 text-center">
                    <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl input-inset text-[10px] font-black uppercase tracking-widest ${ride.color}`}>
                      <span className={`material-symbols-outlined text-[16px] ${ride.status === 'Ongoing' ? 'animate-spin' : ''}`}>{ride.icon}</span>
                      {ride.status}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RidesManagement;
