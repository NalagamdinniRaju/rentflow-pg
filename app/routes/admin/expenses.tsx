// @ts-nocheck
import { useState } from 'react';
import { Receipt, Plus, Building2, Calendar as CalIcon, IndianRupee } from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { formatCurrency, formatDate } from '~/lib/utils';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";

import { useAdminBuildingsBasic } from '~/queries/buildings.query';
import { useAdminExpenses, useAddExpense } from '~/queries/expenses.query';

const expenseSchema = z.object({
  building_id: z.string().min(1, "Please select a building"),
  type: z.string().min(1, "Please select expense type"),
  other_type: z.string().optional(),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.type === 'OTHER' && (!data.other_type || data.other_type.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify the custom category name",
      path: ["other_type"],
    });
  }
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      building_id: '',
      type: 'ELECTRICITY',
      other_type: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    }
  });

  const expenseType = form.watch('type');

  // Queries
  const { data: buildings = [] } = useAdminBuildingsBasic({
    variables: { adminId: user!.id },
    enabled: !!user?.id
  });

  const buildingIds = buildings.map(b => b.id);

  const { data: expenses = [], isLoading: loadingExpenses } = useAdminExpenses({
    variables: { buildingIds },
    enabled: buildingIds.length > 0
  });

  const loading = loadingExpenses;

  // Mutations
  const { mutateAsync: addExpense, isPending: addingExpense } = useAddExpense();

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      const finalType = values.type === 'OTHER' ? values.other_type || 'OTHER' : values.type;
      
      await addExpense({
        building_id: values.building_id,
        type: finalType,
        amount: values.amount,
        date: values.date,
        description: values.description || null
      });

      toast.success("Expense logged successfully");
      setDialogOpen(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to log expense");
    }
  };

  const totalExpenses = expenses.reduce((a,c) => a+Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-red-600" />
            Property Expenses
          </h1>
          <p className="text-slate-500 mt-1">Track operational costs like electricity, rent, maintenance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Log Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="building_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Category *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RENT">Building Rent</SelectItem>
                            <SelectItem value="ELECTRICITY">Electricity Bill</SelectItem>
                            <SelectItem value="MAINTENANCE">Maintenance & Repairs</SelectItem>
                            <SelectItem value="OTHER">Other (Custom Category)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {expenseType === 'OTHER' && (
                    <FormField
                      control={form.control}
                      name="other_type"
                      render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-2 duration-200">
                          <FormLabel>Category Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g. Water, Taxes, Salaries..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. Plumber charge for floor 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={form.formState.isSubmitting}>
                  Save Expense
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>


      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-red-50 border-red-200 shadow-none col-span-1 md:col-span-3">
          <CardContent className="p-6 flex items-center gap-6">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-red-200">
               <Receipt className="w-8 h-8" />
             </div>
             <div>
               <p className="text-red-700 font-medium">Total Operational Expenses Logged</p>
               <h2 className="text-4xl font-extrabold text-red-900 mt-1">{formatCurrency(totalExpenses)}</h2>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           {loading ? (
             <p className="p-8 text-center text-slate-500">Loading expenses...</p>
           ) : expenses.length === 0 ? (
             <div className="p-8 text-center text-slate-500">
               <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-3" />
               <p>No expenses recorded yet.</p>
             </div>
           ) : (
             <div className="divide-y divide-slate-100">
               {expenses.map(e => (
                 <div key={e.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors gap-4">
                   <div className="flex items-center gap-4 w-full md:w-auto">
                     <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        {e.type === 'ELECTRICITY' ? <IndianRupee className="w-5 h-5 text-amber-500" /> : 
                         e.type === 'MAINTENANCE' ? <Building2 className="w-5 h-5 text-blue-500" /> : 
                         <Receipt className="w-5 h-5 text-slate-500" />}
                     </div>
                     <div className="min-w-0 flex-1">
                       <h4 className="font-semibold text-slate-900 truncate">
                         {e.type} <span className="text-slate-500 font-normal">for</span> {e.building?.name}
                       </h4>
                       <div className="flex items-center text-sm text-slate-500 gap-3 mt-1">
                         <span className="flex items-center gap-1"><CalIcon className="w-3 h-3" /> {formatDate(e.date)}</span>
                         {e.description && (
                           <>
                             <span className="w-1 h-1 bg-slate-300 rounded-full" />
                             <span className="truncate">{e.description}</span>
                           </>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="text-right w-full md:w-auto font-bold text-lg text-slate-900 border-t md:border-0 border-slate-100 pt-3 md:pt-0">
                     {formatCurrency(e.amount)}
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
