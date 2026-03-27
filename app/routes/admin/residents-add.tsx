// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, UserPlus, Building2 } from 'lucide-react';
import { useAdminBuildingsBasic } from '~/queries/buildings.query';
import { useFloors, useRooms, useAvailableSeats } from '~/queries/layout.query';
import { useAddResident } from '~/queries/residents.query';
import { useAuthStore } from '~/store/auth.store';
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
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number required").max(15, "Phone number is too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  stay_type: z.enum(['MONTHLY', 'DAILY']),
  monthly_rent: z.coerce.number().optional(),
  daily_rent: z.coerce.number().optional(),
  deposit_amount: z.coerce.number().optional(),
  building_id: z.string().min(1, "Building is required"),
  floor_id: z.string().min(1, "Floor is required"),
  room_id: z.string().min(1, "Room is required"),
  seat_id: z.string().min(1, "Seat/Bed is required"),
}).superRefine((data, ctx) => {
  if (data.stay_type === 'MONTHLY' && (!data.monthly_rent || data.monthly_rent <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Monthly rent is required when stay type is monthly",
      path: ["monthly_rent"],
    });
  }
  if (data.stay_type === 'DAILY' && (!data.daily_rent || data.daily_rent <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Daily rent is required when stay type is daily",
      path: ["daily_rent"],
    });
  }
});

type ResidentFormValues = z.infer<typeof residentSchema>;

export default function AddResidentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      stay_type: 'MONTHLY',
      monthly_rent: 0,
      daily_rent: 0,
      deposit_amount: 0,
      building_id: '',
      floor_id: '',
      room_id: '',
      seat_id: ''
    }
  });

  const buildingId = useWatch({ control: form.control, name: 'building_id' });
  const floorId = useWatch({ control: form.control, name: 'floor_id' });
  const roomId = useWatch({ control: form.control, name: 'room_id' });
  const stayType = useWatch({ control: form.control, name: 'stay_type' });

  const { data: buildings = [] } = useAdminBuildingsBasic({ 
    variables: { adminId: user?.id || '' }, 
    enabled: !!user?.id 
  });
  const { data: floors = [] } = useFloors({ 
    variables: { buildingId: buildingId || '' }, 
    enabled: !!buildingId 
  });
  const { data: rooms = [] } = useRooms({ 
    variables: { floorId: floorId || '' }, 
    enabled: !!floorId 
  });
  const { data: seats = [] } = useAvailableSeats({ 
    variables: { roomId: roomId || '' }, 
    enabled: !!roomId 
  });

  const addResidentMutation = useAddResident();

  useEffect(() => {
    if (buildingId) {
       const b = buildings.find(x => x.id === buildingId);
       if (b) {
         form.setValue('monthly_rent', Number(b.monthly_rent) || 6000);
         form.setValue('daily_rent', Number(b.daily_rent) || 300);
         form.setValue('deposit_amount', Number(b.deposit_amount) || 5000);
       }
    }
  }, [buildingId, buildings, form]);

  const onSubmit = async (values: ResidentFormValues) => {
    try {
      await addResidentMutation.mutateAsync(values as any);
      toast.success("Resident added successfully!");
      navigate('/admin/residents');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add resident');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/residents')} type="button">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Button>
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Add New Resident
          </h1>
          <p className="text-slate-500 mt-1">Directly onboard a tenant to a property</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1 */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">1. Personal Information</h3>
               <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
            </div>

            {/* Section 2 */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-slate-500" /> 2. Room Allocation
               </h3>
               <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="building_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building *</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('floor_id', '');
                            form.setValue('room_id', '');
                            form.setValue('seat_id', '');
                          }}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select Building" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor *</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('room_id', '');
                            form.setValue('seat_id', '');
                          }} 
                          disabled={!buildingId}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select Floor" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {floors.map(f => <SelectItem key={f.id} value={f.id}>{f.floor_number}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="room_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room *</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('seat_id', '');
                          }} 
                          disabled={!floorId}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seat_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bed / Seat *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={!roomId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={seats.length ? "Select Bed" : "No Available Beds"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {seats.map(s => <SelectItem key={s.id} value={s.id}>{s.seat_number}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
            </div>

            {/* Section 3 */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">3. Rental Terms</h3>
               <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="stay_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stay Type *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Monthly Basis</SelectItem>
                            <SelectItem value="DAILY">Daily Basis (Short Stay)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {stayType === 'MONTHLY' ? (
                    <FormField
                      control={form.control}
                      name="monthly_rent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Rent (₹) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="6000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="daily_rent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Rent (₹) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="400" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="deposit_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/residents')}>Cancel</Button>
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                Save & Allocate Bed
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
