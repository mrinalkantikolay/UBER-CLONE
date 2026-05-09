import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import api from '../../../lib/api';

const DashboardOverview: React.FC = () => {
  const [chartView, setChartView] = React.useState<'Week' | 'Month'>('Week');
  const navigate = useNavigate();
  const [health, setHealth] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    api.get('/admin/health').then(res => {
      if (!mounted) return;
      const s = res.data?.status || (res.data?.ok ? 'ok' : null);
      setHealth(s);
    }).catch(() => setHealth(null));
    return () => { mounted = false };
  }, []);

  const weekData = [
    { label: 'Mon', value: 60 },
    { label: 'Tue', value: 40 },
    { label: 'Wed', value: 80 },
    { label: 'Thu', value: 55 },
    { label: 'Fri', value: 90 },
    { label: 'Sat', value: 70 },
    { label: 'Sun', value: 100 },
  ];

  const monthData = [
    { label: 'Week 1', value: 75 },
    { label: 'Week 2', value: 85 },
    { label: 'Week 3', value: 65 },
    { label: 'Week 4', value: 95 },
  ];

  const currentData = chartView === 'Week' ? weekData : monthData;

  return (
    <AdminLayout title="Dashboard Overview" subtitle={`System Status: ${health ? health.toUpperCase() : 'Unknown'} • Last Updated: Just Now`}>
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { label: 'Total Rides', value: '12,345', trend: '+5.2%', up: true, icon: 'directions_car' },
          { label: 'Revenue', value: '$45,678', trend: '+12.4%', up: true, icon: 'payments' },
          { label: 'Active Drivers', value: '1,234', trend: '-2.1%', up: false, icon: 'person_check' },
          { label: 'Active Users', value: '5,678', trend: '+8.7%', up: true, icon: 'groups' },
        ].map((kpi, idx) => (
          <div key={idx} className="panel-3d moving-left-shadow rounded-[2.5rem] p-8 border border-white/5 overflow-visible flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl accent-glow flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl">{kpi.icon}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.up ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Lower Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Panel */}
        <div className="lg:col-span-2 panel-3d moving-left-shadow rounded-[3rem] p-10 border border-white/5 overflow-visible">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-white tracking-tight">Daily Performance</h2>
            <div className="flex gap-2">
              {['Week', 'Month'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setChartView(t as 'Week' | 'Month')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartView === t ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_5px_15px_rgba(99,102,241,0.4)]' : 'text-slate-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] flex items-end justify-between gap-4 pt-10 px-4">
            {currentData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                <div className="w-full flex-1 flex flex-col justify-end relative">
                   <div 
                     className={`w-full rounded-2xl transition-all duration-700 group-hover:scale-x-105 ${i === currentData.length - 1 ? 'bg-gradient-to-t from-indigo-600 via-purple-600 to-pink-500 shadow-[0_0_30px_rgba(99,102,241,0.6)]' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`} 
                     style={{ height: `${d.value}%` }}
                   ></div>
                   {i === currentData.length - 1 && <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-lg shadow-xl uppercase tracking-tighter animate-bounce">Live</div>}
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="panel-3d moving-left-shadow rounded-[3rem] p-10 border border-white/5 overflow-visible">
          <h2 className="text-2xl font-black text-white tracking-tight mb-10">Live Feed</h2>
          <div className="space-y-8">
            {[
              { user: 'Sarah J.', action: 'New Driver Registration', time: '15m ago', color: 'text-emerald-400', icon: 'person_add' },
              { user: 'Ride #4829', action: 'Completed Successfully', time: '2m ago', color: 'text-indigo-400', icon: 'check_circle' },
              { user: 'Ride #4815', action: 'Payment Verification Failed', time: '1h ago', color: 'text-rose-400', icon: 'warning' },
              { user: 'Mike T.', action: 'Left 5-star review', time: '3h ago', color: 'text-amber-400', icon: 'star' },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 group cursor-pointer">
                <div className={`w-12 h-12 rounded-xl input-inset flex items-center justify-center ${item.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">{item.user}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-tighter truncate">{item.action}</p>
                  <p className="text-[9px] font-bold text-slate-700 uppercase mt-1 tracking-widest">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/admin/analytics')}
            className="mt-12 w-full py-5 rounded-2xl input-inset text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] hover:text-white transition-all hover:border-indigo-500/30"
          >
            Audit All Records
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardOverview;
