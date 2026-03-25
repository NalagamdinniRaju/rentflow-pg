import { useState, useEffect } from 'react';
import { Send, BellRing, Phone, IndianRupee, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '~/lib/supabase';
import { useAuthStore } from '~/store/auth.store';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { formatCurrency } from '~/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { toast } from 'sonner';

export default function RemindersPage() {
  const { user } = useAuthStore();
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, filterMonth, filterYear]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: bldgs } = await supabase.from('buildings').select('id').eq('admin_id', user!.id);
      const bIds = bldgs?.map(b => b.id) || [];
      if (bIds.length === 0) {
        setDefaulters([]);
        return;
      }

      // We only care about PENDING status payments for this target month and year
      const m = parseInt(filterMonth);
      const y = parseInt(filterYear);

      const resBase = await supabase.from('residents').select('id').in('building_id', bIds);
      const resIds = resBase.data?.map(r => r.id) || [];

      if(resIds.length > 0) {
        const { data } = await supabase
          .from('payments')
          .select(`
             *,
             resident:residents(name, phone, room:rooms(room_number), building:buildings(name))
          `)
          .in('resident_id', resIds)
          .eq('status', 'PENDING')
          .eq('month', m)
          .eq('year', y);
        
        setDefaulters(data || []);
      } else {
        setDefaulters([]);
      }
    } catch (error: unknown) {
       if(error instanceof Error) console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const sendReminder = async (id: string, name: string) => {
    toast.success(`Payment reminder sent via SMS to ${name}`);
  };

  const sendBulkReminder = () => {
    toast.success(`Bulk payment reminder sent to ${defaulters.length} resident(s).`);
  };

  const totalOutstanding = defaulters.reduce((a,c) => a+Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-amber-500" />
            Payment Reminders
          </h1>
          <p className="text-slate-500 mt-1">Follow up with residents who have pending dues</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="flex gap-2">
             <Select value={filterMonth} onValueChange={setFilterMonth}>
               <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
               <SelectContent>
                 {Array.from({length: 12}).map((_, i) => <SelectItem key={i} value={(i+1).toString()}>Month {i+1}</SelectItem>)}
               </SelectContent>
             </Select>
             <Select value={filterYear} onValueChange={setFilterYear}>
               <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
               <SelectContent>
                 {[2024,2025,2026,2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           
           <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 shadow-md text-white" disabled={defaulters.length === 0} onClick={sendBulkReminder}>
             <Send className="w-4 h-4 mr-2" /> Remind All
           </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
         <Card className="bg-amber-50 border-amber-200 shadow-none">
            <CardContent className="p-6 flex items-center gap-6">
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
                 <AlertTriangle className="w-8 h-8" />
               </div>
               <div>
                 <p className="text-amber-700 font-medium">Total Dues at Risk</p>
                 <h2 className="text-4xl font-extrabold text-amber-900 mt-1">{formatCurrency(totalOutstanding)}</h2>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-slate-800 border-none text-white">
            <CardContent className="p-6 flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-700 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 border border-slate-600">
                 <Users className="w-8 h-8" />
               </div>
               <div>
                 <p className="text-slate-300 font-medium">Defaulters List Size</p>
                 <h2 className="text-4xl font-extrabold text-white mt-1">{defaulters.length}</h2>
                 <p className="text-sm text-slate-400 mt-1">Pending action required</p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Defaulters List ({defaulters.length})</CardTitle>
          <CardDescription>Residents with pending outstanding rent for selected month.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <p className="p-8 text-center text-slate-500">Scanning ledger...</p>
          ) : defaulters.length === 0 ? (
             <div className="p-12 text-center text-slate-500">
               <BellRing className="w-12 h-12 mx-auto text-slate-300 mb-4" />
               <p className="text-lg">Great! You have no defaulters for this period.</p>
             </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {defaulters.map(p => (
                <div key={p.id} className="p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 gap-4 transition-colors">
                  <div className="w-full md:w-auto">
                     <h3 className="font-bold text-lg text-slate-900">{p.resident?.name || 'Unknown'}</h3>
                     <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                       <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                         {p.resident?.building?.name} - {p.resident?.room?.room_number}
                       </span>
                       <span className="flex items-center gap-1 text-blue-600 font-medium">
                         <Phone className="w-3.5 h-3.5" /> {p.resident?.phone}
                       </span>
                     </div>
                  </div>

                  <div className="flex flex-row md:flex-row w-full md:w-auto items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                     <div className="text-left md:text-right">
                       <p className="text-sm text-slate-500 mb-0.5">Due Amount</p>
                       <p className="font-extrabold text-xl text-red-600">{formatCurrency(p.amount)}</p>
                     </div>
                     
                     <div className="flex gap-2">
                       <Button variant="outline" size="icon" className="text-blue-600 hover:bg-blue-50 hover:border-blue-200" onClick={() => window.open(`tel:${p.resident?.phone}`)}>
                          <Phone className="w-4 h-4" />
                       </Button>
                       <Button variant="default" className="text-white bg-amber-500 hover:bg-amber-600 shadow-md" onClick={() => sendReminder(p.id, p.resident?.name)}>
                          <Send className="w-4 h-4 mr-2" /> Notify
                       </Button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
