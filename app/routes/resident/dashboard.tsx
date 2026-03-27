// @ts-nocheck
import { useState, useRef } from 'react';
import { Link } from 'react-router';
import {
  Home, IndianRupee, AlertTriangle, Calendar, Building2,
  MapPin, Phone, FileText, CheckCircle2, Clock, ArrowRight,
  ShieldCheck, LogOut, ChevronRight, Plus, User, Camera
} from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { useMyResident, useUploadResidentDocument } from '~/queries/residents.query';
import { useMyPayments } from '~/queries/payments.query';
import { formatCurrency, formatDate } from '~/lib/utils';
import { toast } from 'sonner';

export default function ResidentDashboard() {
  const { user, signOut } = useAuthStore();
  const [uploading, setUploading] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadharInputRef = useRef<HTMLInputElement>(null);

  const { data: resident, isLoading: loadingResident, refetch } = useMyResident({
    variables: { userId: user?.id || '' },
    enabled: !!user?.id,
  });

  const { data: payments = [], isLoading: loadingPayments } = useMyPayments({
    variables: { userId: user?.id || '' },
    enabled: !!user?.id && !!resident,
  });

  const uploadDocMutation = useUploadResidentDocument();

  const loading = loadingResident || loadingPayments;
  
  const building = resident?.building;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'photo' | 'aadhar_photo'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !resident) return;
    try {
      setUploading(type);
      
      await uploadDocMutation.mutateAsync({
        residentId: resident.id,
        field: type,
        file: file,
      });

      toast.success(`${type === 'photo' ? 'Profile picture' : 'ID Document'} uploaded!`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-9 h-9 border-[3px] border-slate-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Loading your dashboard…</p>
    </div>
  );

  /* ── No profile ── */
  if (!resident) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Home className="w-7 h-7 text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">No active profile</h2>
      <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
        Your account isn't linked to any property yet. Please contact PG management.
      </p>
      <button onClick={() => signOut()} className="flex items-center gap-2 text-sm text-red-500 font-medium">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );

  /* ── Pending ── */
  if (resident.status === 'PENDING') return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-5 text-center">
      <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 border border-amber-100">
        <Clock className="w-10 h-10 text-amber-500" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-3">Application pending</h2>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 w-full mb-6 text-left space-y-4">
        <p className="text-sm text-slate-500 leading-relaxed">
          Hey {resident.name.split(' ')[0]}, your application is being reviewed by the admin.
        </p>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Progress</span><span>65%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 w-[65%] rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Estimated approval: today</span>
        </div>
      </div>
      <button onClick={() => refetch()} className="w-full h-12 bg-slate-900 text-white rounded-2xl text-sm font-medium">
        Check status
      </button>
    </div>
  );

  /* ── Computed ── */
  /* ── Computed ── */
  const profileSteps = [
    { label: 'Profile Photo', done: !!resident.photo },
    { label: 'Govt ID (Aadhar)', done: !!resident.aadhar_photo },
    { label: 'Emergency Name', done: !!resident.emergency_contact_name },
    { label: 'Emergency Phone', done: !!resident.emergency_contact_phone },
  ];
  const completedSteps = profileSteps.filter(s => s.done).length;
  const progressPercent = Math.round((completedSteps / profileSteps.length) * 100);
  const pendingTasks = profileSteps.filter(s => !s.done);
  const isProfileComplete = progressPercent === 100;

  const incompleteProfile = !isProfileComplete;
  const pendingPayments = payments.filter(p => ['PENDING', 'PARTIAL'].includes(p.status));
  const totalDue = pendingPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const firstName = resident.name.split(' ')[0];
  const initials = resident.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('');

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9]">

      {/* ── Dark header ── */}
      <div className="bg-[#0F172A] px-5 pt-4 pb-5 flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-white/40 text-[10px] uppercase tracking-widest">Good morning</span>
          <h1 className="text-white text-[22px] font-semibold leading-tight">Hey, {firstName} 👋</h1>
        </div>
        <div>
          <Link
            to="/resident/profile"
            className="relative block"
          >
            <div className="w-11 h-11 rounded-[14px] bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
              {resident.photo
                ? <img src={resident.photo} className="w-full h-full object-cover" alt="avatar" />
                : <span className="text-white text-sm font-semibold">{initials}</span>
              }
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0F172A]" />
          </Link>
          <input type="file" ref={photoInputRef} className="hidden" accept="image/*"
            onChange={(e) => handleFileUpload(e, 'photo')} />
          <input type="file" ref={aadharInputRef} className="hidden" accept="image/*,.pdf"
            onChange={(e) => handleFileUpload(e, 'aadhar_photo')} />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto px-3.5 py-3.5 md:px-0 md:py-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        <div className="flex flex-col md:grid md:grid-cols-12 gap-4 lg:gap-6">
          
          {/* Left/Main Column - Dues & Essential Actions */}
          <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-4">
            
            {/* Outstanding dues - Exact Screenshot Design */}
            <div className="bg-[#0F172A] rounded-[32px] px-7 py-6.5 relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
              {/* Background decorative circles */}
              <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-colors" />
              <div className="absolute bottom-[-30%] left-[30%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-white/40 text-[10px] uppercase tracking-[0.1em] font-bold">Outstanding Dues</span>
                    <span className="text-white text-[42px] font-bold leading-none tracking-tight">
                      {formatCurrency(totalDue).replace('₹', '₹')}
                    </span>
                  </div>
                  
                  {/* Top-right indicator - Only shown if dues > 0 */}
                  {totalDue > 0 && (
                    <div className="w-12 h-12 rounded-[14px] bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>

                {totalDue > 0 ? (
                  <button className="w-full h-[52px] px-6 bg-[#FEF2F2]/5 border border-red-500/30 rounded-[16px] flex items-center justify-between text-rose-300 font-semibold group/btn hover:bg-red-500/10 transition-all">
                    <span className="text-[15px]">Settle now</span>
                    <ArrowRight className="w-4 h-4 text-rose-400 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="w-full h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-[16px] flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-bold">Everything Paid</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
               {[
                 { icon: Building2, color: 'blue', label: 'Room', value: `R${resident.room?.room_number ?? '–'}`, sub: `Bed ${resident.seat?.seat_number ?? '–'}` },
                 { icon: Calendar, color: 'orange', label: 'Joined', value: resident.join_date ? new Date(resident.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A', sub: new Date(resident.join_date).getFullYear() },
                 { icon: ShieldCheck, color: 'emerald', label: 'Status', value: resident.status, sub: 'Verified Stay' },
                 { icon: Clock, color: 'purple', label: 'Cycle', value: 'Monthly', sub: 'Rent due on 1st' }
               ].map((item, idx) => {
                 const Icon = item.icon;
                 const colors = {
                    blue: 'bg-blue-50 text-blue-500',
                    orange: 'bg-orange-50 text-orange-500',
                    emerald: 'bg-emerald-50 text-emerald-500',
                    purple: 'bg-indigo-50 text-indigo-500'
                 };
                 return (
                   <div key={idx} className="bg-white rounded-[22px] border border-slate-100 p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className={`w-9 h-9 ${colors[item.color as keyof typeof colors]} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-0.5">{item.label}</span>
                        <span className="text-slate-900 text-[15px] font-bold truncate leading-tight">{item.value}</span>
                        <span className="text-slate-400 text-[10px] font-medium mt-0.5">{item.sub}</span>
                      </div>
                   </div>
                 )
               })}
            </div>

            {/* Profile Progress Card */}
            <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm overflow-hidden relative">
               {/* Small background indicator for progress */}
               <div className="absolute top-0 right-0 p-4">
                  <div className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${isProfileComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {progressPercent}% {isProfileComplete ? 'Done' : 'Setup'}
                  </div>
               </div>

               <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isProfileComplete ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                    {isProfileComplete ? <CheckCircle2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0 pr-12 text-slate-900">
                    <h3 className="text-[15px] font-bold leading-tight">
                      {isProfileComplete ? 'All details set!' : 'Complete your profile'}
                    </h3>
                    {isProfileComplete ? (
                       <p className="text-slate-500 text-xs mt-0.5">View your full details on the profile page.</p>
                    ) : (
                       <p className="text-slate-500 text-xs mt-0.5">Only {pendingTasks.length} task{pendingTasks.length > 1 ? 's' : ''} left to reach 100%.</p>
                    )}
                  </div>
               </div>

               {!isProfileComplete ? (
                 <div className="flex flex-col gap-2.5">
                   {/* Missing tasks list */}
                   <div className="flex flex-wrap gap-2 mb-2">
                     {pendingTasks.map((task, i) => (
                       <div key={i} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                         • {task.label}
                       </div>
                     ))}
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {!resident.photo && (
                         <button 
                           onClick={() => photoInputRef.current?.click()}
                           disabled={uploading === 'photo'}
                           className="h-12 bg-white border border-slate-200 rounded-[14px] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                         >
                            <Camera className="w-4 h-4 text-slate-400" />
                            {uploading === 'photo' ? 'Processing...' : 'Upload Photo'}
                         </button>
                      )}
                      {!resident.aadhar_photo && (
                         <button 
                           onClick={() => aadharInputRef.current?.click()}
                           disabled={uploading === 'aadhar_photo'}
                           className="h-12 bg-slate-900 rounded-[14px] text-xs font-bold text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                         >
                            <FileText className="w-4 h-4 text-white/50" />
                            {uploading === 'aadhar_photo' ? 'Processing...' : 'Upload Aadhar'}
                         </button>
                      )}
                      {(completedSteps >= 2 && (!resident.emergency_contact_name || !resident.emergency_contact_phone)) && (
                         <Link 
                           to="/resident/profile"
                           className="h-12 bg-blue-600 rounded-[14px] text-xs font-bold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 sm:col-span-2"
                         >
                            Add Emergency Contact <ChevronRight className="w-4 h-4 text-white/50" />
                         </Link>
                      )}
                   </div>
                 </div>
               ) : (
                 <Link 
                   to="/resident/profile"
                   className="w-full h-12 bg-emerald-50 hover:bg-emerald-100/50 text-emerald-600 rounded-[16px] text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                 >
                   View My Full Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
               )}
            </div>
          </div>

          {/* Right/Side Column - Property & History */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-4">
            
            {/* Property details - Slimmer for sidebar */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
               <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-[14px] font-bold text-slate-900">Your PG Details</span>
                  </div>
                  <button className="text-[10px] text-blue-600 font-bold uppercase hover:bg-blue-50 px-2 py-1 rounded-md">Map View</button>
               </div>
               
               <div className="p-5 flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-slate-900 leading-tight mb-1">{building?.name}</p>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {building?.address?.line_one},<br/>{building?.address?.city?.name}
                      </p>
                    </div>
                  </div>
                  
                  <button className="w-full h-11 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100/50 rounded-[14px] text-xs font-bold text-blue-600 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Call Manager
                  </button>
               </div>
            </div>

            {/* Recent Payments Section */}
            <div className="flex flex-col gap-3 flex-1 min-h-[300px]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[16px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Payments
                </span>
                <Link to="/resident/payments" className="text-[11px] text-blue-600 font-black uppercase tracking-wider flex items-center gap-0.5 hover:translate-x-0.5 transition-transform">
                  Full Ledger <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-col gap-2.5">
          {payments.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[20px] p-8 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No payment history yet</p>
            </div>
          ) : (
            payments.map(p => {
              const isPaid = p.status === 'PAID';
              return (
                <div key={p.id} className="bg-white border border-slate-100 rounded-[20px] p-3.5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <IndianRupee className={`w-[15px] h-[15px] ${isPaid ? 'text-emerald-500' : 'text-red-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-slate-900">
                      {new Date(p.year, p.month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })} rent
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                      {isPaid ? `Paid on ${formatDate(p.paid_date)}` : `Due since ${formatDate(p.created_at)}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-sm font-semibold ${isPaid ? 'text-emerald-600' : 'text-red-500'}`}>
                      {formatCurrency(p.amount)}
                    </span>
                    <div className={`rounded-md px-1.5 py-0.5 ${isPaid ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <span className={`text-[10px] font-medium uppercase tracking-wide ${isPaid ? 'text-emerald-700' : 'text-red-600'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  </div>
</div>
</div>
  );
}