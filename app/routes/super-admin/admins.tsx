// @ts-nocheck
import { useState } from 'react';
import { Users, Plus, ShieldCheck, Phone, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAdmins, useCreateAdmin, useToggleAdminStatus, useAdminBuildingsByAdminId } from '~/queries/admins.query';
import { useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent } from '~/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { getStatusColor } from '~/lib/utils';
import { Badge } from '~/components/ui/badge';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number required").max(15, "Phone number is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function AdminsPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const { data: admins = [], isLoading: loading } = useAdmins();
  const { data: adminBuildings = [], isLoading: loadingBuildings } = useAdminBuildingsByAdminId({
    variables: { adminId: selectedAdminId || '' },
    enabled: !!selectedAdminId,
  });

  const createAdminProps = useCreateAdmin();
  const toggleAdminProps = useToggleAdminStatus();

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' }
  });

  const onSubmit = async (values: AdminFormValues) => {
    try {
      await createAdminProps.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone
      });
      toast.success('Admin created successfully');
      setOpen(false);
      form.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create admin';
      toast.error(msg);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    try {
      await toggleAdminProps.mutateAsync({ userId, currentStatus });
      toast.success("Admin status updated");
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  const loadAdminDetails = (userId: string) => {
    setSelectedAdminId(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center glass-card p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            PG Administrators
          </h1>
          <p className="text-slate-500 mt-1">Manage property managers and their platform access</p>
        </div>

        <Dialog open={open} onOpenChange={(val: boolean | ((prevState: boolean) => boolean)) => { setOpen(val); if (!val) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New PG Admin</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@pg.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" className="pr-10" {...field} />
                        </FormControl>
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={form.formState.isSubmitting}>
                  Create Administrator
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map(admin => (
          <Card key={admin.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl uppercase border-2 border-slate-200">
                  {admin.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{admin.name}</h3>
                  <Badge className={`mt-1 ${getStatusColor(admin.status)}`}>{admin.status}</Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> {admin.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Admin Role ID: {admin.id.split('-')[0]}
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border-0"
                      onClick={() => loadAdminDetails(admin.user_id)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-xl">{admin.name}'s Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">System ID</span>
                          <span className="font-mono text-slate-900">{admin.user_id.split('-')[0]}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Email Address</span>
                          <span className="font-medium text-slate-900">{admin.email || 'Not Provided'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Contact Number</span>
                          <span className="font-medium text-slate-900">{admin.phone || 'Not Provided'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Current Status</span>
                          <Badge className={getStatusColor(admin.status)}>{admin.status}</Badge>
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" /> Managed Properties
                      </h4>
                      {loadingBuildings ? (
                        <div className="text-sm text-slate-500 animate-pulse">Loading assigned properties...</div>
                      ) : adminBuildings.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {adminBuildings.map((b, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-900">{b.name}</p>
                                <p className="text-xs text-slate-500">{b.location || 'No location set'}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">{b.status}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 p-4 border border-dashed border-slate-200 rounded-lg text-center">
                          No properties assigned to this admin yet.
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="flex-1 text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border-0"
                  onClick={() => navigate(`/super-admin/admins-assign/${admin.user_id}`)}
                >
                  <Building2 className="w-4 h-4 mr-2" /> Assign
                </Button>

                <Button
                  variant={admin.status === 'ACTIVE' ? 'outline' : 'default'}
                  className={`flex-1 ${admin.status === 'INACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-slate-600'}`}
                  onClick={() => toggleStatus(admin.user_id, admin.status)}
                >
                  {admin.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {admins.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>No administrators found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
