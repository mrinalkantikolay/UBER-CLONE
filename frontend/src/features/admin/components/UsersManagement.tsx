import React from 'react';
import AdminLayout from './AdminLayout';
import api from '../../../lib/api';


const UsersManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [users, setUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.data.users || res.data.data.users || res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch admin users', err);
      }
    };
    fetchUsers();
  }, []);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 2;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const searchBar = (
    <div className="relative input-inset rounded-2xl overflow-hidden group border border-white/5 focus-within:border-indigo-500/30 transition-all">
      <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform">search</span>
      <input 
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full bg-transparent py-4 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-600" 
        placeholder="Search users, emails, or roles..." 
        type="text" 
      />
    </div>
  );

  const blockUser = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/block`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
    } catch (err) {
      console.error('Failed to block user', err);
    }
  };

  const unblockUser = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/unblock`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u));
    } catch (err) {
      console.error('Failed to unblock user', err);
    }
  };

  return (
    <AdminLayout 
      title="Users Management" 
      subtitle="Manage your platform's passenger base and corporate accounts."
      searchSlot={searchBar}
    >
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          { label: 'Total Users', value: '12,450', trend: '+12%', icon: 'group', color: 'text-indigo-400' },
          { label: 'Active Riders', value: '8,210', trend: '+5%', icon: 'directions_run', color: 'text-emerald-400' },
          { label: 'Pending Verification', value: '142', trend: 'Manual Review', icon: 'verified_user', color: 'text-amber-400' },
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
            <p className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:text-indigo-400 transition-colors">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="panel-3d moving-left-shadow rounded-[3rem] overflow-visible border border-white/5 p-2">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Identity</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Email Contact</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-center">Status</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginatedUsers.map((user, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/[0.02]">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        {user.img ? (
                          <img alt={user.name} className="w-full h-full rounded-lg object-cover opacity-80" src={user.img} />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-tight group-hover:text-indigo-400 transition-colors">{user.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-slate-400 font-bold text-xs uppercase tracking-widest">{user.email}</td>
                  <td className="p-8 text-center">
                    <span className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl input-inset text-[10px] font-black uppercase tracking-widest ${user.color}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${user.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor] animate-pulse`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    {user.isActive ? (
                      <button onClick={() => blockUser(user.id)} className="px-4 py-2 rounded-2xl bg-rose-500/10 text-rose-400 font-black text-xs uppercase tracking-widest">Block</button>
                    ) : (
                      <button onClick={() => unblockUser(user.id)} className="px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-400 font-black text-xs uppercase tracking-widest">Unblock</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between p-10 border-t border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            Displaying {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} records
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`w-14 h-14 flex items-center justify-center rounded-2xl input-inset text-slate-500 hover:text-white transition-all group ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-sm transition-all ${currentPage === i + 1 ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 animate-gradient-x' : 'input-inset text-slate-500 hover:text-white'}`}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`w-14 h-14 flex items-center justify-center rounded-2xl input-inset text-slate-500 hover:text-white transition-all group ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersManagement;
