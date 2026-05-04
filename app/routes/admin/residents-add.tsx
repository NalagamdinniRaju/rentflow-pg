// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, UserPlus, Building2 } from 'lucide-react';
import { useAdminBuildingsBasic } from '~/queries/buildings.query';
import { useFloors, useRooms, useAvailableSeats } from '~/queries/layout.query';
import { useRoomTypes } from '~/queries/room-types.query';
import { useAddResident } from '~/queries/residents.query';
import { useAuthStore } from '~/store/auth.store';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from '~/components/ui/badge';
import { supabase, supabaseUrl } from '~/lib/supabase';
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
  email: z.string().email("Valid email is required for registration"),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: "Gender is required" }),
  age: z.coerce.number().min(1, "Age is required").max(120, "Please enter a valid age"),
  stay_type: z.enum(['MONTHLY', 'DAILY']),
  monthly_rent: z.coerce.number().optional(),
  daily_rent: z.coerce.number().optional(),
  deposit_amount: z.coerce.number().optional(),
  building_id: z.string().min(1, "Building is required"),
  floor_id: z.string().min(1, "Floor is required"),
  room_type_id: z.string().optional(),
  sharing_type_id: z.string().optional(),
  room_id: z.string().min(1, "Flat is required"),
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
  const { isImpersonating, currentBuildingId } = useManagementContext();

  // Identification image upload states
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      gender: undefined,
      age: undefined,
      stay_type: 'MONTHLY',
      monthly_rent: 0,
      daily_rent: 0,
      deposit_amount: 0,
      building_id: '',
      floor_id: '',
      room_type_id: '',
      sharing_type_id: '',
      room_id: '',
      seat_id: ''
    }
  });

  const buildingId = useWatch({ control: form.control, name: 'building_id' });
  const floorId = useWatch({ control: form.control, name: 'floor_id' });
  const roomTypeId = useWatch({ control: form.control, name: 'room_type_id' });
  const sharingTypeId = useWatch({ control: form.control, name: 'sharing_type_id' });
  const roomId = useWatch({ control: form.control, name: 'room_id' });
  const stayType = useWatch({ control: form.control, name: 'stay_type' });
  const monthlyRent = useWatch({ control: form.control, name: 'monthly_rent' });
  const dailyRent = useWatch({ control: form.control, name: 'daily_rent' });
  const depositAmount = useWatch({ control: form.control, name: 'deposit_amount' });

  // If impersonating, fetch only the current building, else fetch all admin buildings
  const { data: buildings = [] } = isImpersonating && currentBuildingId
    ? { data: [useBuildingById({ variables: { buildingId: currentBuildingId }, enabled: !!currentBuildingId }).data].filter(Boolean) }
    : useAdminBuildingsBasic({ variables: { adminId: user?.id || '' }, enabled: !!user?.id });
  const { data: floors = [] } = useFloors({ 
    variables: { buildingId: buildingId || '' }, 
    enabled: !!buildingId 
  });
  const { data: rooms = [] } = useRooms({ 
    variables: { 
      floorId: floorId || '',
      roomTypeId: roomTypeId || undefined,
      sharingTypeId: sharingTypeId || undefined
    }, 
    enabled: !!floorId 
  });
  const { data: roomTypes = [] } = useRoomTypes();
  const { data: seats = [] } = useAvailableSeats({ 
    variables: { roomId: roomId || '' }, 
    enabled: !!roomId 
  });

  // Fetch room details for rent inheritance
  const { data: roomDetails } = useRoomDetails({
    variables: { roomId: roomId || '' },
    enabled: !!roomId,
  });

  const addResidentMutation = useAddResident();

  // Rent inheritance logic: Flat custom rent → Building default
  useEffect(() => {
    if (!buildingId) return;
    const building = buildings.find(x => x.id === buildingId);
    if (!building) return;

    // Get effective rents (flat-level overrides building-level)
    const effectiveMonthly = roomDetails?.custom_monthly_rent != null 
      ? Number(roomDetails.custom_monthly_rent) 
      : (Number(building.monthly_rent) || 6000);
    const effectiveDaily = roomDetails?.custom_daily_rent != null 
      ? Number(roomDetails.custom_daily_rent) 
      : (Number(building.daily_rent) || 300);
    const effectiveDeposit = roomDetails?.custom_deposit_amount != null
      ? Number(roomDetails.custom_deposit_amount)
      : (Number(building.deposit_amount) || 5000);

    form.setValue('monthly_rent', effectiveMonthly);
    form.setValue('daily_rent', effectiveDaily);
    form.setValue('deposit_amount', effectiveDeposit);
  }, [buildingId, roomId, roomDetails, buildings, form]);

  // Compute rent source label
  const rentSource = roomDetails?.custom_monthly_rent != null || roomDetails?.custom_daily_rent != null || roomDetails?.custom_deposit_amount != null
    ? 'flat-custom'
    : 'building-default';

  const onSubmit = async (values: ResidentFormValues) => {
    try {
      let identificationImageUrl: string | null = null;

      // Upload ID image if provided
      if (idFile) {
        const fileExt = idFile.name.split('.').pop();
        const fileName = `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `identification/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resident-documents')
          .upload(filePath, idFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload identification image');
          return;
        }

        identificationImageUrl = `${supabaseUrl}/storage/v1/object/public/resident-documents/${filePath}`;
      }

      await addResidentMutation.mutateAsync({
        ...values,
        identification_image: identificationImageUrl,
      } as any);
      toast.success("Resident added successfully!");
      navigate('/admin/residents');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add resident');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/residents')} type="button">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Button>
        <div>
           <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Add New Resident
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Directly onboard a tenant to a property</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Personal Info */}
            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">1. Personal Information</h3>
               <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gender */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Age */}
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

               {/* Identification Document Upload */}
               <div className="mt-6 pt-4 border-t border-slate-200">
                 <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                   <Upload className="w-4 h-4 text-slate-500" />
                   Identification Document (Optional)
                 </h4>
                 <label 
                   htmlFor="id-upload"
                   className={`relative block w-full max-w-md border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden
                     ${idPreview ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'}`}
                 >
                   {idPreview ? (
                     <div className="relative aspect-[1.6/1]">
                       <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                         <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white text-xs font-semibold">
                           Change Document
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-8 gap-3">
                       <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                         <Upload className="w-6 h-6" />
                       </div>
                       <div className="text-center">
                         <p className="text-sm font-semibold text-slate-700">Click to upload Aadhar / ID</p>
                         <p className="text-xs text-slate-500 mt-1">JPG, PNG (max. 5MB)</p>
                       </div>
                     </div>
                   )}
                   <input 
                     id="id-upload" 
                     type="file" 
                     className="hidden" 
                     accept="image/*,.pdf" 
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         setIdFile(file);
                         setIdPreview(URL.createObjectURL(file));
                       }
                     }}
                   />
                 </label>
               </div>
            </div>

            {/* Section 2: Rental Terms */}
            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                 <IndianRupee className="w-5 h-5 text-slate-500" /> 2. Rental Terms
               </h3>
               <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
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
               </div>
            </div>

            {/* Section 3: Flat Allocation */}
            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-slate-500" /> 3. Flat Allocation
               </h3>
               <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
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
                    name="room_type_id"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Flat Type (Filter)</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('room_id', '');
                            form.setValue('seat_id', '');
                          }}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Any Type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">Any Type</SelectItem>
                            {roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="room_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flat *</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('seat_id', '');
                          }} 
                          disabled={!floorId}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select Flat" /></SelectTrigger>
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

            {/* Section 4: Rent Summary */}
            <div className="bg-emerald-50/50 p-4 sm:p-6 rounded-xl border border-emerald-100">
               <h3 className="text-lg font-bold text-emerald-900 mb-2 border-b border-emerald-200/50 pb-2 flex items-center gap-2">
                 <IndianRupee className="w-5 h-5 text-emerald-600" /> 4. Rent Summary
               </h3>

               {/* Rent source indicator */}
               {roomId && (
                 <div className="mb-4 mt-2">
                   {rentSource === 'flat-custom' ? (
                     <div className="flex items-center gap-2 text-xs">
                       <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                         Custom Flat Rent
                       </Badge>
                       <span className="text-emerald-700/80">Rent auto-filled from flat-specific configuration</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-xs">
                       <Badge className="bg-slate-200 text-slate-700 border-slate-300 text-[10px]">
                         Building Default
                       </Badge>
                       <span className="text-slate-600">Rent auto-filled from building defaults</span>
                     </div>
                   )}
                 </div>
               )}

               <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                  <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">
                      {stayType === 'MONTHLY' ? 'Monthly Rent' : 'Daily Rent'}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      ₹{stayType === 'MONTHLY' ? (monthlyRent || 0) : (dailyRent || 0)}
                      <span className="text-sm font-normal text-slate-400 ml-1">/{stayType === 'MONTHLY' ? 'mo' : 'day'}</span>
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">Security Deposit</p>
                    <p className="text-2xl font-bold text-slate-800">₹{depositAmount || 0}</p>
                  </div>
               </div>

               {/* Hidden inputs to preserve form submission values natively */}
               <div className="hidden">
                 <FormField control={form.control} name="monthly_rent" render={({ field }) => <Input type="hidden" {...field} />} />
                 <FormField control={form.control} name="daily_rent" render={({ field }) => <Input type="hidden" {...field} />} />
                 <FormField control={form.control} name="deposit_amount" render={({ field }) => <Input type="hidden" {...field} />} />
               </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/residents')} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
                Save & Allocate Bed
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
