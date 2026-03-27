// @ts-nocheck
import { useState } from 'react';
import { Building2, Plus, MapPin, UserSquare2, ChevronRight, Hash, Layers, Pencil } from 'lucide-react';
import { useAllBuildings, useCities, useAddBuilding, useUpdateBuilding } from '~/queries/buildings.query';
import { useAdmins } from '~/queries/admins.query';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { getStatusColor } from '~/lib/utils';
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

const buildingSchema = z.object({
  name: z.string().min(2, "Building name is too short"),
  admin_id: z.string().optional(),
  city_id: z.string().min(1, "City is required"),
  line_one: z.string().min(5, "Address must be at least 5 characters"),
  pincode: z.string().optional(),
  floors: z.coerce.number().min(1, "Must have at least 1 floor"),
  seats_per_floor: z.coerce.number().min(1, "Must have at least 1 seat per floor")
});

type BuildingFormValues = z.infer<typeof buildingSchema>;

export default function BuildingsPage() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

  const { data: buildings = [], isLoading: loadingBuildings } = useAllBuildings();
  const { data: admins = [] } = useAdmins();
  const { data: cities = [] } = useCities();
  
  const loading = loadingBuildings;

  const addBuildingProps = useAddBuilding();
  const updateBuildingProps = useUpdateBuilding();

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: '',
      admin_id: 'none',
      city_id: '',
      line_one: '',
      pincode: '',
      floors: 1,
      seats_per_floor: 10
    }
  });

  const editForm = useForm({
    defaultValues: {
      name: '',
      admin_id: 'none',
      status: 'ACTIVE'
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
        floors: values.floors,
        seats_per_floor: values.seats_per_floor,
      });

      toast.success("Building created and layout generated!");
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
      status: building.status || 'ACTIVE'
    });
    setEditOpen(true);
  };

  const onEditSubmit = async (values: any) => {
    try {
      await updateBuildingProps.mutateAsync({
        buildingId: selectedBuilding.id,
        name: values.name,
        admin_id: values.admin_id === 'none' ? null : values.admin_id,
        status: values.status
      });

      toast.success('Building updated successfully');
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update building');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Buildings Overview
          </h1>
          <p className="text-slate-500 mt-1">Manage physical properties and their layouts</p>
        </div>
        
        <Dialog open={open} onOpenChange={(val: boolean) => { setOpen(val); if(!val) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-blue-500/20"><Plus className="w-4 h-4 mr-2" /> Add Building</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl text-left">
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="floors"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Floors *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="4" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="seats_per_floor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seats / Floor *</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 border-b pb-2">Address</h3>
                      
                      <FormField
                        control={form.control}
                        name="city_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.state?.name})</SelectItem>)}
                              </SelectContent>
                            </Select>
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

                    <div className="col-span-2 mt-4">
                      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting} size="lg">Auto-Generate Floors & Rooms</Button>
                      <p className="text-xs text-center text-slate-500 mt-2">This will automatically structure the building layout.</p>
                    </div>
                 </form>
               </Form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
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

                <Button type="submit" className="w-full" disabled={editForm.formState.isSubmitting}>
                  Save Changes
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map(b => (
          <Card key={b.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900 border-b-2 border-transparent hover:border-blue-600 inline-block cursor-pointer transition-colors pb-1">{b.name}</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => openEditModal(b)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center text-slate-500 text-xs">
                     <MapPin className="w-3 h-3 mr-1" />
                     {b.address?.line_one || '-'}, {b.address?.city?.name || '-'}
                  </div>
                </div>
                <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 mt-6 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                  <UserSquare2 className="w-4 h-4 text-blue-500" />
                  Admin
                </div>
                <span className="font-bold text-slate-900">{b.admin?.name || 'Unassigned'}</span>
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
