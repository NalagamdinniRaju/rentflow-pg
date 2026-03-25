import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ChevronLeft, IndianRupee, Calendar, 
  ArrowUpRight, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { supabase } from '~/lib/supabase';
import { useAuthStore } from '~/store/auth.store';
import { formatCurrency, formatDate } from '~/lib/utils';

export default function ResidentPaymentsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPayments();
  }, [user]);

  async function loadPayments() {
    try {
      setLoading(true);
      // 1. Get resident ID
      const { data: resData } = await supabase
        .from('residents')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (resData) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('resident_id', resData.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false });
        
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Failed to load payments', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] pb-10">
      {/* Header */}
      <div className="bg-[#0F172A] px-5 pt-4 pb-6 flex items-center gap-4 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-white text-xl font-semibold">Payment History</h1>
          <span className="text-white/40 text-[10px] uppercase tracking-widest">{payments.length} Records Found</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm grid grid-cols-2 gap-4">
           <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Total Paid</span>
              <span className="text-emerald-600 text-lg font-bold">
                {formatCurrency(payments.filter(p => p.status === 'PAID').reduce((acc, c) => acc + Number(c.amount), 0))}
              </span>
           </div>
           <div className="flex flex-col border-l border-slate-100 pl-4">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Outstanding</span>
              <span className="text-red-500 text-lg font-bold">
                {formatCurrency(payments.filter(p => p.status !== 'PAID').reduce((acc, c) => acc + Number(c.amount), 0))}
              </span>
           </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-6 space-y-3">
        {payments.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
             <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
             <p>No payments recorded yet.</p>
          </div>
        ) : (
          payments.map((p) => {
            const isPaid = p.status === 'PAID';
            return (
              <div key={p.id} className="bg-white rounded-[22px] border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {isPaid ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-slate-900 truncate">
                      {new Date(p.year, p.month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })} Rent
                    </h3>
                    <span className={`text-sm font-black ${isPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {isPaid ? formatDate(p.paid_date) : 'Pending'}
                    </span>
                    {isPaid && p.payment_mode && (
                      <>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="flex items-center gap-1 uppercase tracking-wider">{p.payment_mode}</span>
                      </>
                    )}
                  </div>
                </div>

                {!isPaid && (
                   <div className="shrink-0">
                      <button className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                         <ArrowUpRight className="w-4 h-4" />
                      </button>
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
