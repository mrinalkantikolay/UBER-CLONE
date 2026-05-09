import React from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from './AdminLayout';

const AnalyticsReports: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [timeRange, setTimeRange] = React.useState('Monthly');
  const [showDeepAnalytics, setShowDeepAnalytics] = React.useState(false);
  const [showAuditModal, setShowAuditModal] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const monthlyData = {
    revenue: '$1.4M',
    rides: '8,234',
    drivers: '2,150',
    rating: '4.88',
    chartHeights: [45, 60, 30, 85, 50, 70, 95]
  };

  const quarterlyData = {
    revenue: '$4.2M',
    rides: '24,702',
    drivers: '2,310',
    rating: '4.91',
    chartHeights: [70, 85, 60, 95, 80, 88, 92]
  };

  const activeData = timeRange === 'Monthly' ? monthlyData : quarterlyData;

  const [performers] = React.useState([
    { name: 'Marcus T.', rides: '142', rating: '5.0', revenue: '$3,420', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYsZKKZqWhKJvvhqIdSzFgV0HgGg4D8HwGVxWaCMjfFruTapN7GZUBpqTacyRgbgnqrUQu_8P5m1GB1pTYl1dmpO_t1Z23fmbFDxfXuEzeF4xX5mRvRuTf6otO4jJewWTStV5zL3vRP13gVoUsc01tTLqufe9MwyeG8nFAyMhb6S9LVzl1jYq8JE4xuy4ngCetMxMNsDH8GcG2wwjxkj7Y3-cvALL__aQMowpYe7Qj5hPUge6-Hx12Kmj8k8s4eBEz9LfU_NkLpb8' },
    { name: 'Sarah J.', rides: '128', rating: '4.9', revenue: '$2,980', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvJD1t1qrBMw3BiQce-tA1d21v8UsmgxQ6z26zbcWl9ELMxXD1HRphJVfBJYdgL-xTr6qeKwjgzs5TdRJR3rP6WYssL67kmeSY4zYS2auMhzh9ZhOuLs8AFcaYieQG93TaOPO8wY9C4xJgnPTrJmNk7OlbJPix1cyFPVjLxrcBjagP_U-uL8OHUCq7RqYwSsWpf7BpDxX8Zh3y4w3RIKz5WhoAbuVbjJvGVT0uIv068LUVtQ_04fN4guZxK7AE_XBbCg4HNlkTZE4' },
    { name: 'David C.', rides: '115', rating: '4.8', revenue: '$2,650', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIJAja9qPLLlDe-LMM-nZ5neavH1P_iT7ebOj8BWzUg9qrgVvUZ7gr6taIYwrGJeze-qjclA_fzGNJSrbTGK25eVeBG_5GlnWRM1HO2QYQ1QZ0zNcTBcJKWz_TAIYXcFIBkgbncQqla7cNQ0i1I-j4tQHn18XeqC9NoP32wVSwuTlvN_LbYnYQ8jcKQGlcXPYwT1YP2u-KZPal_TrS9K_hlvj5Zm-vwK-uBowNvp0kZNYVOneHBHEvjP5dTWjamXYQn_zG5TJylF4' },
  ]);

  const filteredPerformers = performers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchBar = (
    <div className="relative input-inset rounded-2xl overflow-hidden group border border-white/5 focus-within:border-indigo-500/30 transition-all">
      <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform">search</span>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent py-4 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-600" 
        placeholder="Search performers or reports..." 
        type="text" 
      />
    </div>
  );

  return (
    <AdminLayout 
      title="Analytics & Reports" 
      subtitle="Real-time insights across the RideNova network."
      searchSlot={searchBar}
    >
      <div className="flex justify-between items-center mb-12">
        <div className="flex gap-4">
            <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1.5 moving-left-shadow">
                {['Monthly', 'Quarterly'].map((range) => (
                  <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${timeRange === range ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    {range}
                  </button>
                ))}
            </div>
        </div>
        <button 
          onClick={() => setShowDeepAnalytics(true)}
          className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white font-black h-14 px-10 rounded-2xl shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-xl">insights</span>
          Deep Analytics
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { label: 'Total Revenue', value: activeData.revenue, trend: '+12.5%', icon: 'attach_money', color: 'text-emerald-400' },
          { label: 'Active Rides', value: activeData.rides, trend: '+5.2%', icon: 'directions_car', color: 'text-indigo-400' },
          { label: 'Active Drivers', value: activeData.drivers, trend: 'Steady', icon: 'person_play', color: 'text-slate-400' },
          { label: 'Avg Rating', value: activeData.rating, trend: '+0.02', icon: 'star', color: 'text-amber-400' },
        ].map((stat, idx) => (
          <div key={idx} className="panel-3d moving-left-shadow rounded-[2.5rem] p-8 border border-white/5 overflow-visible flex flex-col group hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl accent-glow flex items-center justify-center text-white group-hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest">
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:text-indigo-400 transition-colors">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-12 gap-8 mb-12">
        {/* Revenue Chart */}
        <div className="col-span-12 lg:col-span-8 panel-3d moving-left-shadow rounded-[3rem] p-10 border border-white/5 overflow-visible flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black text-white tracking-tight">{timeRange} Revenue Growth</h3>
            <div className="w-12 h-12 rounded-xl input-inset flex items-center justify-center text-slate-500 hover:text-white transition-all cursor-pointer group">
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">more_vert</span>
            </div>
          </div>
          <div className="flex-1 input-inset rounded-[2rem] p-8 flex flex-col relative overflow-hidden bg-black/20 group">
             {/* Abstract Visualization */}
             <div className="absolute inset-0 opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d="M0,350 Q100,300 200,320 T400,200 T600,250 T800,100 T1000,50 L1000,400 L0,400 Z" fill="url(#chartGradient)" />
                    <path d="M0,350 Q100,300 200,320 T400,200 T600,250 T800,100 T1000,50" fill="none" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" className="animate-pulse" />
                </svg>
             </div>
             <div className="mt-auto flex justify-between text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] relative z-10 px-4">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
             </div>
          </div>
        </div>

        {/* Ride Volume */}
        <div className="col-span-12 lg:col-span-4 panel-3d moving-left-shadow rounded-[3rem] p-10 border border-white/5 overflow-visible flex flex-col min-h-[400px]">
          <h3 className="text-3xl font-black text-white tracking-tight mb-10">Ride Volume</h3>
          <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 pt-10 px-2 sm:px-6 min-h-[200px]">
            {activeData.chartHeights.slice(0, 5).map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full min-w-[20px]">
                <div className="w-full flex-1 flex flex-col justify-end relative">
                    <div 
                      className={`w-full max-w-[40px] mx-auto rounded-2xl transition-all duration-700 group-hover:scale-x-110 ${i === 3 ? 'bg-gradient-to-t from-indigo-600 via-purple-600 to-indigo-600 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`} 
                      style={{ height: `${h}%` }}
                    ></div>
                </div>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Heat Map */}
        <div className="col-span-12 lg:col-span-7 panel-3d moving-left-shadow rounded-[3rem] p-10 border border-white/5 overflow-visible min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black text-white tracking-tight">Demand Heat Map</h3>
            <span className="material-symbols-outlined text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors hover:rotate-180 duration-500">filter_list</span>
          </div>
          <div className="flex-1 input-inset rounded-[2.5rem] overflow-hidden relative border border-white/5 group">
             <img alt="Heat Map" className="w-full h-full object-cover opacity-60 mix-blend-screen group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRCuVEJ4nO0XCHhvy8QyAWOI1_lBQPGysE50eq5D9mgtKdQgvQx2UWsj1WJQjUMOxy3QZ3sJWOdPb4jAju1Qu4nLZfWufX1Myf9wARlB7vGUctUig-A6xUfX1aDpyUCAnqXjcoURlnA8veJjHsacSuEc9ljDLbX3R-FsgewaTh3V7HtMOrmW7Z6Ar4apdVRnPLXpPTwrCzSU0rHJXlwLHXQNKXV0e1-wnk3phwjlwGinlqAL17nVDhENLto6CzESPZAbYxzJZXNNQ" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b10] to-transparent opacity-40"></div>
             <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                <button className="w-14 h-14 rounded-2xl accent-glow flex items-center justify-center text-white hover:scale-110 transition-all shadow-xl">
                   <span className="material-symbols-outlined text-2xl">add</span>
                </button>
                <button className="w-14 h-14 rounded-2xl panel-3d flex items-center justify-center text-white hover:text-indigo-400 transition-all shadow-xl">
                   <span className="material-symbols-outlined text-2xl">remove</span>
                </button>
             </div>
          </div>
        </div>

        {/* Performers */}
        <div className="col-span-12 lg:col-span-5 panel-3d moving-left-shadow rounded-[3rem] p-10 border border-white/5 overflow-visible flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black text-white tracking-tight">Top Performers</h3>
            <button 
              onClick={() => setShowAuditModal(true)}
              className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors group"
            >
                Audit All 
                <span className="material-symbols-outlined text-xs align-middle ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
          <div className="space-y-6">
            {filteredPerformers.map((p, i) => (
              <div key={i} className="flex items-center gap-6 p-5 rounded-[2.5rem] input-inset group hover:bg-white/5 transition-all">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                   <img alt={p.name} className="w-full h-full object-cover opacity-80" src={p.img} />
                </div>
                <div className="flex-1">
                   <p className="text-sm font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">{p.name}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.rides} Rides • {p.rating} ★</p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{p.revenue}</p>
                </div>
              </div>
            ))}
            {filteredPerformers.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">No performers match your search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Audit Modal */}
      {showAuditModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowAuditModal(false)}></div>
          <div className="panel-3d w-full max-w-2xl rounded-[3rem] p-12 relative overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
             <div className="flex justify-between items-start mb-10">
                <div>
                   <h2 className="text-4xl font-black text-white tracking-tight">Performance Audit</h2>
                   <p className="text-[10px] font-bold text-indigo-400 uppercase mt-2 tracking-[0.3em]">Full algorithmic trace of top performers</p>
                </div>
                <button 
                  onClick={() => setShowAuditModal(false)}
                  className="w-14 h-14 rounded-2xl input-inset flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <div className="space-y-8">
                <div className="p-8 rounded-[2rem] input-inset bg-white/[0.02]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Aggregated Metrics</p>
                   <div className="grid grid-cols-3 gap-6 text-center">
                      {[
                        { label: 'Safety Score', val: '98%', color: 'text-emerald-400' },
                        { label: 'Efficiency', val: '94%', color: 'text-indigo-400' },
                        { label: 'Loyalty', val: '100%', color: 'text-purple-400' }
                      ].map(stat => (
                        <div key={stat.label}>
                           <p className={`text-2xl font-black ${stat.color} mb-1`}>{stat.val}</p>
                           <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</p>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Risk Analysis</p>
                   <div className="p-6 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between group cursor-help">
                      <div className="flex items-center gap-4">
                         <span className="material-symbols-outlined text-emerald-400 animate-pulse">verified_user</span>
                         <p className="text-sm font-black text-white tracking-tight">System Integrity Check</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-lg">Passed</span>
                   </div>
                </div>
             </div>

             <div className="mt-10 flex gap-4">
                <button className="flex-1 py-5 rounded-2xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
                   Reward All Top Drivers
                </button>
                <button className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                   Full Trace Report
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Deep Analytics Modal */}
      {showDeepAnalytics && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowDeepAnalytics(false)}></div>
          <div className="panel-3d w-full max-w-4xl rounded-[4rem] p-12 relative overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
             <div className="flex justify-between items-start mb-12">
                <div>
                   <h2 className="text-5xl font-black text-white tracking-tighter">Deep Intelligence</h2>
                   <p className="text-[10px] font-bold text-indigo-400 uppercase mt-3 tracking-[0.4em]">Predictive Network Analysis & Trends</p>
                </div>
                <button 
                  onClick={() => setShowDeepAnalytics(false)}
                  className="w-16 h-16 rounded-[2rem] input-inset flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Network Health</p>
                      <div className="space-y-6">
                         {[
                           { label: 'User Retention', val: '92.4%', color: 'bg-emerald-500' },
                           { label: 'Driver Satisfaction', val: '88.1%', color: 'bg-indigo-500' },
                           { label: 'Ride Conversion', val: '74.2%', color: 'bg-purple-500' }
                         ].map(item => (
                           <div key={item.label} className="space-y-3">
                              <div className="flex justify-between items-end">
                                 <p className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</p>
                                 <p className="text-sm font-black text-indigo-400">{item.val}</p>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div className={`h-full ${item.color} shadow-[0_0_10px_currentColor]`} style={{ width: item.val }}></div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-8">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Predictive Metrics</p>
                   <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Estimated Monthly Growth', val: '+14.2%', icon: 'trending_up', sub: 'Based on current trajectory' },
                        { label: 'Customer Lifetime Value', val: '$842.00', icon: 'payments', sub: 'Average revenue per active user' },
                        { label: 'Churn Probability', val: '3.1%', icon: 'warning', sub: 'Risk of active user loss' }
                      ].map(metric => (
                        <div key={metric.label} className="p-6 rounded-3xl input-inset flex items-center gap-6 group hover:bg-white/5 transition-all">
                           <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined">{metric.icon}</span>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{metric.label}</p>
                              <div className="flex items-center gap-3">
                                 <p className="text-2xl font-black text-white tracking-tight">{metric.val}</p>
                                 <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{metric.sub}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="mt-12 pt-8 border-t border-white/5 flex justify-end gap-6">
                <button 
                  onClick={() => {
                    setIsExporting(true);
                    setTimeout(() => {
                      setIsExporting(false);
                      setShowDeepAnalytics(false);
                    }, 2000);
                  }}
                  disabled={isExporting}
                  className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                   {isExporting ? (
                     <>
                       <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                       Exporting...
                     </>
                   ) : (
                     <>
                       <span className="material-symbols-outlined text-sm">download</span>
                       Export Data
                     </>
                   )}
                </button>
                <button 
                  onClick={() => {
                    setIsGenerating(true);
                    setTimeout(() => {
                      setIsGenerating(false);
                      setShowDeepAnalytics(false);
                    }, 3000);
                  }}
                  disabled={isGenerating}
                  className="px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 disabled:opacity-50"
                >
                   {isGenerating ? (
                     <>
                       <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                       Generating...
                     </>
                   ) : (
                     <>
                       <span className="material-symbols-outlined text-sm">analytics</span>
                       Generate Strategic Report
                     </>
                   )}
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
};

export default AnalyticsReports;
