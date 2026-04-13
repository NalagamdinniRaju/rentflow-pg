// @ts-nocheck
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { 
  User, Phone, Mail, MapPin, Calendar, Building2, Bed, 
  IndianRupee, CreditCard, Clock, FileText, CheckCircle, 
  XCircle, AlertCircle, ChevronLeft, Download, Send, LifeBuoy, Eye
} from 'lucide-react';
import { useResidentById, useUpdateResidentStatus } from '~/queries/residents.query';
import { useResidentPayments } from '~/queries/payments.query';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '~/components/ui/dialog';
import { getStatusColor, formatCurrency, cn } from '~/lib/utils';
import { toast } from 'sonner';

export default function ResidentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAadharModalOpen, setIsAadharModalOpen] = useState(false);

  const { data: resident, isLoading: loadingResident } = useResidentById({
    variables: { residentId: id || '' },
    enabled: !!id,
  });

  const { data: payments = [], isLoading: loadingPayments } = useResidentPayments({
    variables: { residentId: id || '' },
    enabled: !!id,
  });

  const updateStatusMutation = useUpdateResidentStatus();

  const loading = loadingResident || loadingPayments;

  const handleApprove = async (residentId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ residentId, status: 'ACTIVE' });
      toast.success("Resident Approved Successfully!");
    } catch (e: any) {
      toast.error(e.message || "Approval failed");
    }
  }

  const handleReject = async (residentId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ residentId, status: 'REJECTED' });
      toast.info("Resident Rejected");
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!resident) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Resident Profile</h1>
            <p className="text-sm text-slate-500 font-medium">System ID: {resident.id.split('-')[0]}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
           <Badge className={`text-sm px-4 py-1.5 rounded-full font-bold uppercase tracking-wider ${getStatusColor(resident.status)}`}>
             {resident.status}
           </Badge>
           
           {resident.status === 'PENDING' && (
             <div className="flex gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:ml-4 pt-4 sm:pt-0 mt-2 sm:mt-0">
               <Button 
                 className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20" 
                 onClick={() => handleApprove(resident.id)}
               >
                 <CheckCircle className="w-4 h-4 mr-2" /> Approve Resident
               </Button>
               <Button 
                 variant="outline" 
                 className="flex-1 sm:flex-none text-red-600 border-red-100 hover:bg-red-50" 
                 onClick={() => handleReject(resident.id)}
               >
                 <XCircle className="w-4 h-4 mr-2" /> Reject
               </Button>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Basic Info & Photo */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {resident.photo ? (
                  <img src={resident.photo} alt={resident.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-300" />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{resident.name}</h2>
              <p className="text-sm font-medium text-slate-500 mb-1">{resident.age || '-'} Yrs • {resident.gender || '-'}</p>
              <p className="text-slate-400 text-sm mb-4 italic">{resident.phone}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8">
                  <Phone className="w-3.5 h-3.5 mr-2" /> Call
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <Mail className="w-3.5 h-3.5 mr-2" /> Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">AADHAR (Front)</span>
                </div>
                {resident.aadhar_photo ? (
                  <div className="flex gap-1">
                    <Dialog open={isAadharModalOpen} onOpenChange={setIsAadharModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Aadhar Card - {resident.name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center items-center p-4 bg-slate-50 rounded-xl">
                          <img 
                            src={resident.aadhar_photo} 
                            alt="Aadhar Card" 
                            className="max-w-full h-auto rounded-lg shadow-sm"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                    <a href={resident.aadhar_photo} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                ) : <span className="text-xs text-slate-400">Missing</span>}
              </div>
              <Button className="w-full" variant="outline" size="sm">
                View All Files
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" /> Stay Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Building</label>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5 mt-1">
                    {resident.building?.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Flat Allocation</label>
                  <p className="font-semibold text-slate-900 mt-1 flex flex-wrap items-center gap-2">
                    F: {resident.floor?.floor_number || '-'} / Flat: {resident.room?.room_number || '-'} / B: {resident.seat?.seat_number || '-'}
                    {resident.room?.room_types?.name && (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border", resident.room.room_types.name.toLowerCase().includes('ac') ? 'bg-cyan-50 text-cyan-700 border-cyan-100' : 'bg-orange-50 text-orange-700 border-orange-100')}>
                        {resident.room.room_types.name}
                      </span>
                    )}
                    {resident.room?.sharing_types?.name && (
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap">({resident.room.sharing_types.name})</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Stay Type</label>
                  <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" /> {resident.stay_type}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Joining Date</label>
                  <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-500" /> 
                    {resident.join_date ? new Date(resident.join_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Rent</label>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    {formatCurrency(resident.stay_type === 'DAILY' ? resident.daily_rent : resident.monthly_rent)}
                    <span className="text-xs text-slate-400 font-normal ml-1">/{resident.stay_type === 'DAILY' ? 'day' : 'month'}</span>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Security Deposit</label>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {formatCurrency(resident.deposit_amount)}
                  </p>
                  <Badge variant="info" className="text-[10px] mt-1">{resident.deposit_status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Recent Payments
              </CardTitle>
              <Link to="/admin/payments" className="text-sm text-blue-600 hover:underline">View Ledger</Link>
            </CardHeader>
            <CardContent className="p-0">
               {payments.length > 0 ? (
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                       <th className="p-4 font-semibold">Month/Year</th>
                       <th className="p-4 font-semibold">Amount</th>
                       <th className="p-4 font-semibold">Status</th>
                       <th className="p-4 font-semibold text-right">Date</th>
                     </tr>
                   </thead>
                   <tbody>
                     {payments.slice(0, 5).map((p, idx) => (
                       <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                         <td className="p-4 font-medium">{new Date(0, p.month-1).toLocaleString('en', {month:'short'})} {p.year}</td>
                         <td className="p-4">{formatCurrency(p.amount)}</td>
                         <td className="p-4">
                            <Badge className={p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}>
                              {p.status}
                            </Badge>
                         </td>
                         <td className="p-4 text-right text-slate-500">{p.paid_date ? new Date(p.paid_date).toLocaleDateString() : '-'}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div className="p-8 text-center text-slate-400">
                   <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                   <p>No payment records found.</p>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Emergency Info */}
          <Card>
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-red-500" /> Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] text-red-400 uppercase font-bold">Contact Name</label>
                   <p className="font-semibold text-slate-900">{resident.emergency_contact_name || 'None'}</p>
                </div>
                <div>
                   <label className="text-[10px] text-red-400 uppercase font-bold">Phone</label>
                   <p className="font-semibold text-slate-900">{resident.emergency_contact_phone || 'None'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
