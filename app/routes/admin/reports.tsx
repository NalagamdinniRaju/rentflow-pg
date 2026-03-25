import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, IndianRupee, Receipt } from 'lucide-react';
import { supabase } from '~/lib/supabase';
import { useAuthStore } from '~/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { formatCurrency, MONTH_NAMES } from '~/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, filterYear]);

  async function loadData() {
    setLoading(true);
    try {
      const year = parseInt(filterYear);
      const { data: bldgs } = await supabase.from('buildings').select('id').eq('admin_id', user!.id);
      const bIds = bldgs?.map(b => b.id) || [];
      
      if (bIds.length === 0) {
        setReportData([]);
        return;
      }

      const resBase = await supabase.from('residents').select('id').in('building_id', bIds);
      const resIds = resBase.data?.map(r => r.id) || [];

      // Get all PAID payments for the year
      const { data: payments } = await supabase
        .from('payments')
        .select('month, amount')
        .in('resident_id', resIds)
        .eq('year', year)
        .eq('status', 'PAID');

      // Get all expenses for the year
      const { data: expenses } = await supabase
        .from('expenses')
        .select('date, amount')
        .in('building_id', bIds)
        // PostgreSQL standard date substring trick, simple but works since format is YYYY-MM-DD
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      // Aggregate by month
      const monthlyData = MONTH_NAMES.map((name, index) => {
        const m = index + 1;
        const income = payments?.filter(p => p.month === m).reduce((a,c) => a+Number(c.amount), 0) || 0;
        const out = expenses?.filter(e => new Date(e.date).getMonth() + 1 === m).reduce((a,c) => a+Number(c.amount), 0) || 0;
        return {
          month: name,
          shortMonth: name.slice(0, 3),
          income,
          expense: out,
          profit: income - out
        };
      });

      setReportData(monthlyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const yearlyIncome = reportData.reduce((a,c) => a + c.income, 0);
  const yearlyExpense = reportData.reduce((a,c) => a + c.expense, 0);
  const yearlyProfit = yearlyIncome - yearlyExpense;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Financial Reports
          </h1>
          <p className="text-slate-500 mt-1">Income, Expenses and Profitability Overview</p>
        </div>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
             {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slate-500">Loading financial data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2 text-emerald-700">
                    <IndianRupee className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wide">Total Income</span>
                 </div>
                 <h2 className="text-3xl font-extrabold text-emerald-900">{formatCurrency(yearlyIncome)}</h2>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2 text-red-700">
                    <Receipt className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wide">Total Expense</span>
                 </div>
                 <h2 className="text-3xl font-extrabold text-red-900">{formatCurrency(yearlyExpense)}</h2>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2 text-blue-700">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wide">Net Profit</span>
                 </div>
                 <h2 className={`text-3xl font-extrabold ${yearlyProfit < 0 ? 'text-red-600' : 'text-blue-900'}`}>
                   {formatCurrency(yearlyProfit)}
                 </h2>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Monthly Breakdown ({filterYear})</CardTitle>
            </CardHeader>
            <CardContent className="pb-0 pt-6">
               {/* Very simple visual bar chart representation using CSS */}
               <div className="h-64 flex items-end gap-2 md:gap-4 overflow-x-auto pb-6 hide-scrollbar">
                  {reportData.map(data => {
                    const maxVal = Math.max(...reportData.map(d => Math.max(d.income, d.expense, 1))); // Avoid / 0
                    const incomeHeight = `${(data.income / maxVal) * 100}%`;
                    const expenseHeight = `${(data.expense / maxVal) * 100}%`;
                    
                    return (
                      <div key={data.month} className="flex-1 min-w-[40px] flex flex-col items-center justify-end gap-2 h-full">
                         <div className="w-full flex justify-center gap-1 items-end h-[200px] border-b border-slate-200">
                             <div className="w-3 rounded-t-sm bg-emerald-400 opacity-90 hover:opacity-100" style={{height: incomeHeight}} title={`Income: ₹${data.income}`} />
                             <div className="w-3 rounded-t-sm bg-red-400 opacity-90 hover:opacity-100" style={{height: expenseHeight}} title={`Expense: ₹${data.expense}`} />
                         </div>
                         <span className="text-xs font-medium text-slate-500">{data.shortMonth}</span>
                      </div>
                    )
                  })}
               </div>
            </CardContent>
            
            {/* Table view */}
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Month / Period</th>
                      <th className="px-6 py-3 font-semibold text-right text-emerald-700">Income</th>
                      <th className="px-6 py-3 font-semibold text-right text-red-700">Expense</th>
                      <th className="px-6 py-3 font-semibold text-right text-blue-700">Profit / Margin</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {reportData.filter(d => d.income > 0 || d.expense > 0).map((d) => (
                     <tr key={d.month} className="hover:bg-slate-50/50">
                       <td className="px-6 py-4 font-medium text-slate-900">{d.month}</td>
                       <td className="px-6 py-4 text-right">{formatCurrency(d.income)}</td>
                       <td className="px-6 py-4 text-right">{formatCurrency(d.expense)}</td>
                       <td className={`px-6 py-4 text-right font-bold ${d.profit < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                         {formatCurrency(d.profit)}
                       </td>
                     </tr>
                   ))}
                   {reportData.filter(d => d.income > 0 || d.expense > 0).length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No data generated for this year yet.</td>
                     </tr>
                   )}
                   <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                     <td className="px-6 py-4 text-slate-900">YEAR TO DATE</td>
                     <td className="px-6 py-4 text-right text-emerald-700">{formatCurrency(yearlyIncome)}</td>
                     <td className="px-6 py-4 text-right text-red-700">{formatCurrency(yearlyExpense)}</td>
                     <td className="px-6 py-4 text-right text-blue-700 border-l border-slate-200">{formatCurrency(yearlyProfit)}</td>
                   </tr>
                 </tbody>
               </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
