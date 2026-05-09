import React from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from './AdminLayout';
import api from '../../../lib/api';

const PaymentsTransactions: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('All');
  const [transactions] = React.useState([
    { id: '#TRX-8942-A1', date: 'Oct 24, 2023', time: '14:32 PM', party: 'Marcus Johnson', role: 'Driver', type: 'Payout', amount: '-$450.00', status: 'Completed', color: 'text-emerald-400' },
    { id: '#TRX-8941-C9', date: 'Oct 24, 2023', time: '13:15 PM', party: 'Sarah Connor', role: 'Rider', type: 'Charge', amount: '+$24.50', status: 'Completed', color: 'text-emerald-400' },
    { id: '#TRX-8940-B2', date: 'Oct 24, 2023', time: '11:05 AM', party: 'David Thompson', role: 'Driver', type: 'Payout', amount: '-$820.00', status: 'Processing', color: 'text-amber-400' },
    { id: '#TRX-8939-E4', date: 'Oct 23, 2023', time: '19:45 PM', party: 'Alex Lee', role: 'Rider', type: 'Refund', amount: '-$15.00', status: 'Completed', color: 'text-rose-400' },
  ]);

  const [showAuditLogs, setShowAuditLogs] = React.useState(false);
  const auditLogs = [
    { event: 'Refund Approved', user: 'Admin (Sarah)', target: '#TRX-8939-E4', date: 'Oct 24, 15:20', icon: 'undo', color: 'text-rose-400' },
    { event: 'Batch Payout Initialized', user: 'System (Auto)', target: '42 Drivers', date: 'Oct 24, 12:00', icon: 'payments', color: 'text-emerald-400' },
    { event: 'Security Lock Applied', user: 'Admin (Marcus)', target: 'James Wilson', date: 'Oct 23, 19:12', icon: 'lock', color: 'text-amber-400' },
    { event: 'Fee Structure Updated', user: 'Super Admin', target: 'Nova XL Tier', date: 'Oct 22, 11:30', icon: 'settings', color: 'text-indigo-400' },
  ];

  const [showReportModal, setShowReportModal] = React.useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);

  const [selectedTrx, setSelectedTrx] = React.useState<any>(null);

  const dispatchRefund = async (paymentId: string, amount: number) => {
    try {
      await api.post('/admin/payments/refund', { paymentId, amount });
      alert('Refund dispatched');
    } catch (err) {
      console.error('Refund failed', err);
      alert('Refund failed');
    }
  };

  const filteredTransactions = transactions.filter(trx => {
    const matchesSearch = trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trx.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trx.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'All' || 
                       (typeFilter === 'Payouts' && trx.type === 'Payout') ||
                       (typeFilter === 'Charges' && trx.type === 'Charge');

    return matchesSearch && matchesType;
  });

  const searchBar = (
    <div className="relative input-inset rounded-2xl overflow-hidden group border border-white/5 focus-within:border-indigo-500/30 transition-all">
      <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform">search</span>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent py-4 pl-14 pr-4 text-white font-bold text-sm outline-none placeholder:text-slate-600" 
        placeholder="Search transaction ID or name..." 
        type="text" 
      />
    </div>
  );

  return (
    <AdminLayout 
      title="Financial Overview" 
      subtitle="Manage platform revenue, payouts, and driver balances."
      searchSlot={searchBar}
    >
      <div className="flex justify-between items-center mb-12">
        <div className="flex gap-4">
             <div className="relative h-14 group moving-left-shadow rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setShowAuditLogs(true)}
                  className="h-full px-10 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3"
                >
                    <span className="material-symbols-outlined text-xl text-indigo-400 group-hover:rotate-180 transition-transform duration-700">history</span>
                    Audit Logs
                </button>
            </div>
        </div>
        <button 
          onClick={() => setShowReportModal(true)}
          className="bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white font-black h-14 px-10 rounded-2xl shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-xl">download</span>
          Generate Report
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          { label: 'Total Earnings', value: '$845,230.00', trend: '+12.5%', icon: 'account_balance', color: 'text-indigo-400', sub: 'Net revenue this month' },
          { label: 'Pending Payouts', value: '$124,500.50', trend: '45% Processed', icon: 'schedule', color: 'text-amber-400', sub: 'Awaiting verification' },
          { label: 'Issued Refunds', value: '$3,420.00', trend: '2.1% rate', icon: 'assignment_return', color: 'text-rose-400', sub: 'Across 142 disputes' },
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
            <p className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase mt-4 tracking-[0.2em]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="panel-3d moving-left-shadow rounded-[3rem] overflow-visible border border-white/5 p-2">
        <div className="px-12 py-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight">Recent Transactions</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-[0.3em]">Live monitoring of financial events across the network</p>
          </div>
          <div className="flex gap-4">
             <div className="flex bg-white/5 border border-white/5 rounded-2xl p-2 moving-left-shadow">
                {['All', 'Payouts', 'Charges'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setTypeFilter(cat)}
                    className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${typeFilter === cat ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Transaction ID</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Timestamp</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Entity / Role</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest">Type</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-right">Amount</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-center">Status</th>
                <th className="p-8 font-black text-slate-500 text-[10px] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTransactions.map((trx, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/[0.02]">
                  <td className="p-8 font-black text-slate-500 text-[10px] tracking-widest group-hover:text-indigo-400 transition-colors">{trx.id}</td>
                  <td className="p-8">
                    <p className="font-black text-white text-xs tracking-tight">{trx.date}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5 tracking-widest">{trx.time}</p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl input-inset flex items-center justify-center text-indigo-400 text-[10px] font-black group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        {trx.party.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-300 tracking-tight group-hover:text-white transition-colors">{trx.party}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{trx.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 py-2 bg-white/5 rounded-xl border border-white/5">{trx.type}</span>
                  </td>
                  <td className="p-8 text-right font-black text-white text-sm tracking-tight">{trx.amount}</td>
                  <td className="p-8 text-center">
                    <span className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl input-inset text-[10px] font-black uppercase tracking-widest ${trx.color}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${trx.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor] animate-pulse`}></span>
                      {trx.status}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => setSelectedTrx(trx)}
                      className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all group/more"
                    >
                      <span className="material-symbols-outlined group-hover/more:rotate-90 transition-transform">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal (Receipt View) */}
      {selectedTrx && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedTrx(null)}></div>
          <div className="panel-3d w-full max-w-xl rounded-[3rem] p-10 relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <div className="flex justify-between items-start mb-10">
                <div>
                   <h2 className="text-3xl font-black text-white tracking-tight">Transaction Details</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-[0.3em]">Full verified transaction receipt</p>
                </div>
                <button 
                  onClick={() => setSelectedTrx(null)}
                  className="w-14 h-14 rounded-[1.5rem] input-inset flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <div className="space-y-6">
                <div className="flex justify-between items-center p-8 rounded-3xl bg-white/[0.02] border border-white/5 relative group overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-4xl font-black text-white tracking-tight">{selectedTrx.amount}</p>
                   </div>
                   <div className={`px-6 py-2 rounded-xl input-inset text-[10px] font-black uppercase tracking-widest ${selectedTrx.color}`}>
                      {selectedTrx.status}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 rounded-2xl input-inset">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Transaction ID</p>
                      <p className="text-sm font-black text-white tracking-tight">{selectedTrx.id}</p>
                   </div>
                   <div className="p-6 rounded-2xl input-inset">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Timestamp</p>
                      <p className="text-sm font-black text-white tracking-tight">{selectedTrx.date} • {selectedTrx.time}</p>
                   </div>
                   <div className="p-6 rounded-2xl input-inset">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Entity Name</p>
                      <p className="text-sm font-black text-white tracking-tight">{selectedTrx.party}</p>
                   </div>
                   <div className="p-6 rounded-2xl input-inset">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Method</p>
                      <p className="text-sm font-black text-white tracking-tight">System Wallet</p>
                   </div>
                </div>
             </div>

             <div className="mt-10 flex gap-4">
                <button className="flex-1 py-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-3">
                   <span className="material-symbols-outlined text-xl">print</span>
                   Print Receipt
                </button>
                <button className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                   Flag Transaction
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Dispatch Refund CTA inside Transaction Modal */}
      {selectedTrx && (
        <div className="fixed bottom-8 right-8 z-50">
          <button onClick={() => {
            const amt = parseFloat(prompt('Refund amount (numbers only)', '0') || '0');
            if (!isNaN(amt) && amt > 0) dispatchRefund(selectedTrx.id, amt);
          }} className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-black">Dispatch Refund</button>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAuditLogs(false)}></div>
          <div className="panel-3d w-full max-w-4xl rounded-[3rem] p-10 relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <div className="flex justify-between items-start mb-12">
                <div>
                   <h2 className="text-4xl font-black text-white tracking-tight">Financial Audit Logs</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-[0.3em]">Historical record of all critical financial operations</p>
                </div>
                <button 
                  onClick={() => setShowAuditLogs(false)}
                  className="w-14 h-14 rounded-[1.5rem] input-inset flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-500/10 transition-all"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-4">
                {auditLogs.map((log, i) => (
                  <div key={i} className="p-6 rounded-3xl input-inset flex items-center justify-between group hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5">
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${log.color} border border-white/5 group-hover:scale-110 transition-transform`}>
                           <span className="material-symbols-outlined text-2xl">{log.icon}</span>
                        </div>
                        <div>
                           <p className="text-sm font-black text-white tracking-tight">{log.event}</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Performed by {log.user}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-black text-indigo-400 tracking-widest">{log.target}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase mt-1 tracking-widest">{log.date}</p>
                     </div>
                  </div>
                ))}
             </div>

             <div className="mt-12 flex justify-end">
                <button className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Download Audit Trail (.CSV)</button>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Report Generation Modal */}
      {showReportModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowReportModal(false)}></div>
          <div className="panel-3d w-full max-w-2xl rounded-[3rem] p-10 relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <div className="flex justify-between items-start mb-10">
                <div>
                   <h2 className="text-4xl font-black text-white tracking-tight">Generate Report</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-[0.3em]">Configure and export your financial data</p>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="w-14 h-14 rounded-[1.5rem] input-inset flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <div className="space-y-8">
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Date Range</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl input-inset">
                         <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Start Date</p>
                         <p className="text-sm font-black text-white">2023-10-01</p>
                      </div>
                      <div className="p-5 rounded-2xl input-inset">
                         <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">End Date</p>
                         <p className="text-sm font-black text-white">2023-10-24</p>
                      </div>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Export Format</p>
                   <div className="flex gap-4">
                      <button className="flex-1 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-white flex flex-col items-center gap-3 hover:bg-indigo-500/20 transition-all group">
                         <span className="material-symbols-outlined text-3xl text-indigo-400 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                         <span className="text-[10px] font-black uppercase tracking-widest">PDF Document</span>
                      </button>
                      <button className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                         <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">table_chart</span>
                         <span className="text-[10px] font-black uppercase tracking-widest">CSV Spreadsheet</span>
                      </button>
                   </div>
                </div>
             </div>

              <div className="mt-12">
                 <button 
                   onClick={() => {
                     setIsGeneratingReport(true);
                     setTimeout(() => {
                       setIsGeneratingReport(false);
                       setShowReportModal(false);
                     }, 2500);
                   }}
                   disabled={isGeneratingReport}
                   className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-gradient-x text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isGeneratingReport ? (
                     <>
                       <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                       Generating Report...
                     </>
                   ) : (
                     <>
                       <span className="material-symbols-outlined text-xl">download</span>
                       Generate & Download Report
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

export default PaymentsTransactions;
