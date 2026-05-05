// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, UserCircle, Save, Trash2, OctagonAlert } from 'lucide-react';
import { useResidentById, useUpdateResident } from '~/queries/residents.query';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
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

const residentSchema = z.object({
  name: z.string().min(2, "Name too short"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'PENDING', 'VACATED', 'REJECTED']),
  stay_type: z.enum(['MONTHLY', 'DAILY']),
  monthly_rent: z.coerce.number().optional(),
  daily_rent: z.coerce.number().optional(),
  deposit_amount: z.coerce.number().optional(),
  age: z.coerce.number().min(1, "Valid age required").optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other']).optional().or(z.literal('')),
});

export default function EditResidentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: resident, isLoading: loading } = useResidentById({
    variables: { residentId: id || '' },
    enabled: !!id,
  });

  const updateResidentMutation = useUpdateResident();

  const form = useForm({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: '', phone: '', email: '', status: 'ACTIVE',
      stay_type: 'MONTHLY', monthly_rent: 0, daily_rent: 0, deposit_amount: 0,
      age: '', gender: ''
    }
  });

  const stayType = useWatch({ control: form.control, name: 'stay_type' });

  useEffect(() => {
    if (resident) {
      form.reset({
        name: resident.name,
        phone: resident.phone,
        email: resident.email || '',
        status: resident.status,
        stay_type: resident.stay_type,
        monthly_rent: resident.monthly_rent || 0,
        daily_rent: resident.daily_rent || 0,
        deposit_amount: resident.deposit_amount || 0,
        age: resident.age || '',
        gender: resident.gender || '',
      });
    }
  }, [resident, form]);

  const onSubmit = async (values: any) => {
    try {
      await updateResidentMutation.mutateAsync({
        residentId: id as string,
        data: {
          name: values.name,
          phone: values.phone,
          email: values.email as string,
          status: values.status,
          stay_type: values.stay_type,
          monthly_rent: values.monthly_rent,
          daily_rent: values.daily_rent,
          deposit_amount: values.deposit_amount,
          age: values.age ? parseInt(values.age) : null,
          gender: values.gender || null,
        },
        seatId: resident?.seat_id || undefined,
      });

      toast.success("Resident updated successfully!");
      navigate('/admin/residents');
    } catch (err: any) {
      toast.error(err.message || "Failed to update resident");
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/residents')}>
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-blue-600" />
              Edit Resident
            </h1>
            <p className="text-slate-500 mt-1">{resident?.name} • {resident?.building?.name || 'No building'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Profile Details</h3>
               <div className="grid sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="name" render={({field}) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="phone" render={({field}) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="email" render={({field}) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field}/></FormControl><FormMessage/></FormItem>
                  )}/>
                  <FormField control={form.control} name="status" render={({field}) => (
                    <FormItem>
                      <FormLabel>Occupancy Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active (Staying)</SelectItem>
                          <SelectItem value="PENDING">Pending Approval</SelectItem>
                          <SelectItem value="VACATED">Vacated (Left PG)</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage/>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="gender" render={({field}) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Gender"/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage/>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="age" render={({field}) => (
                    <FormItem><FormLabel>Age (Years)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>
                  )}/>
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Allocation & Rent</h3>
                <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                   <div className="flex items-center gap-2 font-bold mb-1">
                     <OctagonAlert className="w-4 h-4 text-blue-600"/> Current Allocation
                   </div>
                   <div className="flex flex-wrap gap-x-4 gap-y-1 text-blue-700">
                     <span>Building: <span className="font-semibold">{resident?.building?.name}</span></span>
                     <span>Flat: <span className="font-semibold">{resident?.room?.room_number}</span></span>
                     <span>Flat Type: <span className="font-semibold">{resident?.room?.room_types?.name || 'N/A'}</span></span>
                     <span>Sharing: <span className="font-semibold">{resident?.room?.sharing_types?.name || 'N/A'}</span></span>
                     <span>Bed: <span className="font-semibold">{resident?.seat?.seat_number}</span></span>
                   </div>
                </div>
               <div className="grid sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="stay_type" render={({field}) => (
                    <FormItem>
                      <FormLabel>Stay Basis</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly Basis</SelectItem>
                          <SelectItem value="DAILY">Daily Basis</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="monthly_rent" render={({field}) => (
                    <FormItem className={stayType === 'MONTHLY' ? '' : 'hidden'}>
                      <FormLabel>Monthly Rent (₹)</FormLabel>
                      <FormControl><Input type="number" {...field}/></FormControl>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="daily_rent" render={({field}) => (
                    <FormItem className={stayType === 'DAILY' ? '' : 'hidden'}>
                      <FormLabel>Daily Rent (₹)</FormLabel>
                      <FormControl><Input type="number" {...field}/></FormControl>
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="deposit_amount" render={({field}) => (
                    <FormItem>
                      <FormLabel>Security Deposit (₹)</FormLabel>
                      <FormControl><Input type="number" {...field}/></FormControl>
                    </FormItem>
                  )}/>
               </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/residents')}>Cancel</Button>
              <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> Update Resident
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
