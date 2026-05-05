import { useState, useMemo } from 'react';
import { Users, Building2, MapPin, IndianRupee, Bed, Phone, FileText, CheckCircle, AlertTriangle, ArrowRight, XCircle, Download, FileSpreadsheet, Pencil, Filter, Calendar, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { useAuthStore } from '~/store/auth.store';
import { getStatusColor, formatCurrency, cn } from '~/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useManagementContext } from '~/hooks/use-management-context';
import { useAdminResidents, useUpdateResidentStatus } from '~/queries/residents.query';

export default function ResidentsPage() {
  const { user } = useAuthStore();
  const { buildingIds, isImpersonating } = useManagementContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Export States
  const [exportOpen, setExportOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Queries
  const { data: residents = [], isLoading: loadingResidents } = useAdminResidents({
    variables: { buildingIds },
    enabled: buildingIds.length > 0,
  });

  const loading = buildingIds.length > 0 && loadingResidents;

  // Mutations
  const { mutateAsync: updateStatus } = useUpdateResidentStatus();

  // Derived state for filtering
  const filtered = useMemo(() => {
    let result = residents;
    if (filterStatus !== 'ALL') {
      result = result.filter(r => r.status === filterStatus);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r => 
        r.name?.toLowerCase().includes(s) || 
        r.phone?.toLowerCase().includes(s) ||
        r.room?.room_number?.toLowerCase().includes(s) ||
        r.room?.room_types?.name?.toLowerCase().includes(s) ||
        r.room?.sharing_types?.name?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [search, filterStatus, residents]);

  const handleApprove = async (id: string) => {
    try {
      await updateStatus({ residentId: id, status: 'ACTIVE' });
      toast.success("Approved!");
    } catch (e) {
      toast.error("Action failed");
    }
  }

  const handleReject = async (id: string) => {
    try {
      await updateStatus({ residentId: id, status: 'REJECTED' });
      toast.info("Rejected");
    } catch (e) {
      toast.error("Action failed");
    }
  }

  const getExportData = () => {
     let data = residents;
     if (dateRange.from) data = data.filter(r => new Date(r.created_at) >= new Date(dateRange.from));
     if (dateRange.to) data = data.filter(r => new Date(r.created_at) <= new Date(dateRange.to));
     return data;
  }

  const exportCSV = () => {
    const data = getExportData();
    const headers = ["Name", "Age", "Gender", "Phone", "Email", "Status", "Building", "Flat", "Flat Type", "Sharing", "Bed", "Stay Type", "Rent", "Join Date"];
    const rows = data.map(r => [
      r.name, r.age || '-', r.gender || '-', r.phone, r.email || '-', r.status, r.building?.name || '-', 
      r.room?.room_number || '-', r.room?.room_types?.name || '-', 
      r.room?.sharing_types?.name || '-', r.seat?.seat_number || '-', r.stay_type,
      r.stay_type === 'DAILY' ? r.daily_rent : r.monthly_rent,
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => `"${e.join('","')}"`).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `residents_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("CSV Downloaded!");
  }

  const exportPDF = () => {
     const data = getExportData();
     const doc = new jsPDF();
     
     doc.setFontSize(20);
     doc.text("Residents Report", 14, 22);
     doc.setFontSize(10);
     doc.setTextColor(100);
     doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
     
     const tableData = data.map(r => [
       r.name, `${r.age || '-'}/${r.gender?.charAt(0) || '-'}`, r.phone, r.status, r.building?.name || '-', 
       `${r.room?.room_number || '-'}/${r.seat?.seat_number || '-'}`,
       r.room?.room_types?.name || '-',
       r.room?.sharing_types?.name || '-',
       r.stay_type === 'DAILY' ? `Rs.${r.daily_rent || 0}` : `Rs.${r.monthly_rent || 0}`,
       new Date(r.created_at).toLocaleDateString()
     ]);

     autoTable(doc, {
       startY: 35,
       head: [['Name', 'A/G', 'Phone', 'Status', 'Building', 'Flat/Bed', 'Type', 'Sharing', 'Rent', 'Join Date']],
       body: tableData,
       theme: 'grid',
       headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
       styles: { fontSize: 7 }
     });

     doc.save(`residents_report_${new Date().toISOString().split('T')[0]}.pdf`);
     toast.success("PDF Downloaded!");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass-card p-6 rounded-2xl gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Residents
          </h1>
          <p className="text-slate-500 mt-1">Manage tenants across your PG properties</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                 <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 shadow-sm">
                    <Download className="w-4 h-4 mr-2 text-slate-500" /> Export
                 </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                 <DialogHeader>
                    <DialogTitle>Export Residents Data</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 py-4 text-left">
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                       <Filter className="w-4 h-4"/> Filter by registration period (Optional)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>From Date</Label>
                          <Input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <Label>To Date</Label>
                          <Input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} />
                       </div>
                    </div>
                    <div className="pt-4 grid grid-cols-2 gap-3">
                       <Button onClick={exportCSV} className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
                       </Button>
                       <Button onClick={exportPDF} className="w-full bg-rose-600 hover:bg-rose-700">
                          <FileText className="w-4 h-4 mr-2" /> PDF
                       </Button>
                    </div>
                 </div>
                 <DialogFooter>
                    <Button variant="ghost" className="w-full" onClick={() => { setDateRange({from: '', to: ''}); setExportOpen(false); }}>Reset & Close</Button>
                 </DialogFooter>
              </DialogContent>
           </Dialog>
           <Link to="/admin/residents/add" className="flex-1 sm:flex-none">
             <Button size="lg" className="w-full shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
               <Plus className="w-4 h-4 mr-2" /> Add New
             </Button>
           </Link>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-white/30 p-4 bg-white/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex glass rounded-lg p-1 border border-white/50">
            {['ACTIVE', 'PENDING', 'VACATED', 'ALL'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                {tab === 'PENDING' ? 'Waiting' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-64">
             <Input 
               placeholder="Search name, phone..." 
               className="pl-9 h-9"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
             <Users className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/20 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-white/20">
                <th className="px-4 md:px-6 py-4">Resident</th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Age / Sex</th>
                <th className="px-4 md:px-6 py-4">Status</th>
                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">Building / Flat</th>
                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <>
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        {r.photo ? <img src={r.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 uppercase font-bold text-sm">{r.name.charAt(0)}</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-sm">{r.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium italic"><Phone className="w-3 h-3"/> {r.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-700">{r.age || '-'} Yrs</span>
                       <span className="text-[10px] text-slate-400 uppercase font-black">{r.gender || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <Badge variant={r.status === 'ACTIVE' ? 'success' : r.status === 'PENDING' ? 'secondary' : r.status === 'VACATED' ? 'info' : r.status === 'REJECTED' ? 'danger' : 'default'}>
                       {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400"/> {r.building?.name || 'N/A'}
                       </span>
                       <div className="flex items-center gap-1.5 flex-wrap">
                         <span className="text-xs text-slate-500 font-medium whitespace-nowrap">F: {r.room?.room_number || '-'} / B: {r.seat?.seat_number || '-'}</span>
                         {r.room?.room_types?.name && (
                           <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight", r.room.room_types.name.toLowerCase().includes('ac') ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-orange-50 text-orange-700 border border-orange-100')}>
                             {r.room.room_types.name}
                           </span>
                         )}
                       </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      {/* Mobile expand toggle */}
                      <button
                        className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                        aria-label="Toggle details"
                      >
                        {expandedRow === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {r.status === 'PENDING' ? (
                         <div className="flex gap-1.5">
                           <Link to={`/admin/residents/${r.id}`}>
                             <Button size="sm" variant="outline" className="h-8 text-xs text-blue-600 border-blue-100 hover:bg-blue-50 hidden sm:flex">Review</Button>
                           </Link>
                           <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(r.id)}>Approve</Button>
                         </div>
                       ) : (
                         <div className="flex gap-1">
                           <Link to={`/admin/residents/${r.id}/edit`}>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                               <Pencil className="w-4 h-4" />
                             </Button>
                           </Link>
                           <Link to={`/admin/residents/${r.id}`}>
                             <Button variant="ghost" size="sm" className="h-8 text-blue-600 font-bold hover:bg-blue-50 text-xs">View</Button>
                           </Link>
                         </div>
                       )}
                    </div>
                  </td>
                </tr>
                {/* Mobile expanded detail row */}
                {expandedRow === r.id && (
                  <tr key={`${r.id}-expanded`} className="bg-blue-50/60 md:hidden border-b border-blue-100">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Age / Gender</span>
                          <p className="font-bold text-slate-900 mt-0.5">{r.age || '-'} yrs / {r.gender || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Building</span>
                          <p className="font-bold text-slate-900 mt-0.5 truncate">{r.building?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Flat / Bed</span>
                          <p className="font-bold text-slate-900 mt-0.5">F:{r.room?.room_number || '-'} / B:{r.seat?.seat_number || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-black tracking-widest text-[9px]">Flat Type</span>
                          <p className="font-bold text-slate-900 mt-0.5">{r.room?.room_types?.name || 'Standard'}</p>
                        </div>
                        {r.status === 'PENDING' && (
                          <div className="col-span-2 pt-1">
                            <Link to={`/admin/residents/${r.id}`}>
                              <Button size="sm" variant="outline" className="w-full h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50">Review Full Application</Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p className="font-medium italic">No residents match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
