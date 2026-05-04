// @ts-nocheck
import { useState } from 'react';
import { Building2, Plus, MapPin, UserSquare2, ChevronRight, Hash, Layers, Pencil, LayoutDashboard } from 'lucide-react';
import { useAllBuildings, useCities, useAddBuilding, useUpdateBuilding, useUpdateAddress } from '~/queries/buildings.query';
import { useAdmins } from '~/queries/admins.query';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { CityCombobox } from '~/components/ui/city-combobox';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { getStatusColor } from '~/lib/utils';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuperAdminStore } from '~/store/super-admin.store';
import { useNavigate } from 'react-router';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";

const buildingSchema = z.object({
  name: z.string().min(2, "Building name is too short"),
  admin_id: z.string().optional(),
  city_id: z.string().min(1, "City is required"),
  line_one: z.string().min(5, "Address must be at least 5 characters"),
  pincode: z.string().optional(),
  monthly_rent: z.string().optional(),
  daily_rent: z.string().optional(),
  deposit_amount: z.string().optional(),
});

type BuildingFormValues = z.infer<typeof buildingSchema>;

export default function BuildingsPage() {
  const navigate = useNavigate();
  const { setSelectedBuildingId, setImpersonating } = useSuperAdminStore();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

  const { data: buildings = [], isLoading: loadingBuildings } = useAllBuildings();
  const { data: admins = [] } = useAdmins();
  const { data: cities = [] } = useCities();
  
  const loading = loadingBuildings;

  const handleManageBuilding = (building: any) => {
    setSelectedBuildingId(building.id);
    setImpersonating(true);
    toast.success(`Entering Management Mode for ${building.name}`);
    navigate('/admin');
  };

  const addBuildingProps = useAddBuilding();
  const updateBuildingProps = useUpdateBuilding();
  const { mutateAsync: updateAddressMutation, isPending: updatingAddr } = useUpdateAddress();

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: '',
      admin_id: 'none',
      city_id: '',
      line_one: '',
      pincode: '',
      monthly_rent: '',
      daily_rent: '',
      deposit_amount: '',
    }
  });

  const editForm = useForm({
    defaultValues: {
      name: '',
      admin_id: 'none',
      status: 'ACTIVE',
      line_one: '',
      city_id: '',
      pincode: '',
      monthly_rent: '',
      daily_rent: '',
      deposit_amount: '',
    }
  });

  const onSubmit = async (values: BuildingFormValues) => {
    try {
      await addBuildingProps.mutateAsync({
        name: values.name,
        admin_id: values.admin_id === 'none' ? null : values.admin_id,
        city_id: values.city_id,
        line_one: values.line_one,
        pincode: values.pincode,
        monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : undefined,
        daily_rent: values.daily_rent ? Number(values.daily_rent) : undefined,
        deposit_amount: values.deposit_amount ? Number(values.deposit_amount) : undefined,
      } as any); // Ignoring type since we will update the query next

      toast.success("Building created successfully!");
      setOpen(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create building');
    }
  };

  const openEditModal = (building: any) => {
    setSelectedBuilding(building);
    editForm.reset({
      name: building.name,
      admin_id: building.admin_id || 'none',
      status: building.status || 'ACTIVE',
      line_one: building.address?.line_one || '',
      city_id: building.address?.city_id || '',
      pincode: building.address?.pincode || '',
      monthly_rent: building.monthly_rent ? String(building.monthly_rent) : '',
      daily_rent: building.daily_rent ? String(building.daily_rent) : '',
      deposit_amount: building.deposit_amount ? String(building.deposit_amount) : ''
    });
    setEditOpen(true);
  };

  const onEditSubmit = async (values: any) => {
    try {
      if (selectedBuilding?.address?.id) {
        await updateAddressMutation({
          addressId: selectedBuilding.address.id,
          line_one: values.line_one,
          city_id: values.city_id,
          pincode: values.pincode,
        });
      }

      await updateBuildingProps.mutateAsync({
        buildingId: selectedBuilding.id,
        name: values.name,
        admin_id: values.admin_id === 'none' ? null : values.admin_id,
        status: values.status,
        monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : null,
        daily_rent: values.daily_rent ? Number(values.daily_rent) : null,
        deposit_amount: values.deposit_amount ? Number(values.deposit_amount) : null,
      } as any); // Ignoring type since we will update the query next

      toast.success('Building and address updated successfully');
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update building');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass-card p-4 sm:p-6 rounded-2xl gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Buildings Overview
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage physical properties and their layouts</p>
        </div>
        
        <Dialog open={open} onOpenChange={(val: boolean) => { setOpen(val); if(!val) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shadow-lg shadow-blue-500/20"><Plus className="w-4 h-4 mr-2" /> Add Building</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto text-left">
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 border-b pb-2">Basic Info</h3>
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. SR Elite PG" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="admin_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign PG Admin (Optional)</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select Admin" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">-- Unassigned --</SelectItem>
                                {admins.map(a => <SelectItem key={a.id} value={a.user_id}>{a.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                        <FormField
                          control={form.control}
                          name="monthly_rent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Monthly Rent (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="6000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="daily_rent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Daily Rent (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="300" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="deposit_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Deposit (₹)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="5000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 border-b pb-2">Address</h3>
                      
                      <FormField
                        control={form.control}
                        name="city_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <CityCombobox
                                initialCities={cities}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Search and select city…"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="line_one"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="Door No, Street" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input placeholder="560001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-4">
                      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting} size="lg">Submit</Button>
                    </div>
                 </form>
               </Form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Building Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Building</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SR Elite PG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="admin_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign PG Admin</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Admin" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Unassigned --</SelectItem>
                          {admins.map(a => <SelectItem key={a.id} value={a.user_id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="monthly_rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Monthly Rent (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="6000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="daily_rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Daily Rent (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="300" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="deposit_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Deposit (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-slate-900">Address Details</h3>
                  <FormField
                    control={editForm.control}
                    name="line_one"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Door No, Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="city_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <CityCombobox
                            initialCities={cities}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Search and select city…"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input placeholder="560001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full mt-4" disabled={editForm.formState.isSubmitting || updatingAddr}>
                  {editForm.formState.isSubmitting || updatingAddr ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {buildings.map(b => (
          <Card key={b.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700" />
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900 border-b-2 border-transparent hover:border-blue-600 inline-block cursor-pointer transition-colors pb-1">{b.name}</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => openEditModal(b)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center text-slate-500 text-xs flex-1 min-w-0">
                       <MapPin className="w-3 h-3 mr-1 shrink-0" />
                       <span className="truncate">{b.address?.line_one || '-'}, {b.address?.city?.name || '-'}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3 sm:p-4 mt-6 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                  <UserSquare2 className="w-4 h-4 text-blue-500" />
                  Admin
                </div>
                <span className="font-bold text-slate-900 text-sm truncate ml-2">{b.admin?.name || 'Unassigned'}</span>
              </div>

              <div className="mt-4 sm:mt-6 flex gap-2">
                <Button 
                  variant="outline" 
                   className="flex-1 text-xs font-bold border-slate-200 hover:bg-slate-50"
                   onClick={() => handleManageBuilding(b)}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Manage
                </Button>
                <Button variant="ghost" size="icon" className="border border-slate-100">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {buildings.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>No buildings added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
