// @ts-nocheck
import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useStates, useLocationCities, useCreateState, useCreateCity } from '~/queries/locations.query';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
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

interface State { id: string; name: string; }
interface City { id: string; name: string; state_id: string; state?: State; }

const stateSchema = z.object({
  name: z.string().min(2, "State name must be at least 2 characters")
});

const citySchema = z.object({
  name: z.string().min(2, "City name must be at least 2 characters"),
  state_id: z.string().min(1, "Please select a state")
});

type StateFormValues = z.infer<typeof stateSchema>;
type CityFormValues = z.infer<typeof citySchema>;

export default function LocationsPage() {
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);

  const { data: states = [], isLoading: loadingStates } = useStates();
  const { data: cities = [], isLoading: loadingCities } = useLocationCities();
  const loading = loadingStates || loadingCities;

  const createStateProps = useCreateState();
  const createCityProps = useCreateCity();

  const stateForm = useForm<StateFormValues>({
    resolver: zodResolver(stateSchema),
    defaultValues: { name: '' }
  });

  const cityForm = useForm<CityFormValues>({
    resolver: zodResolver(citySchema),
    defaultValues: { name: '', state_id: '' }
  });

  const onStateSubmit = async (values: StateFormValues) => {
    try {
      await createStateProps.mutateAsync({ name: values.name });
      toast.success("State added successfully");
      setStateDialogOpen(false);
      stateForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add state';
      toast.error(msg);
    }
  };

  const onCitySubmit = async (values: CityFormValues) => {
    try {
      await createCityProps.mutateAsync({ 
        name: values.name, state_id: values.state_id 
      });
      toast.success("City added successfully");
      setCityDialogOpen(false);
      cityForm.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add city';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center glass-card p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Location Management
          </h1>
          <p className="text-slate-500 mt-1">Add and manage states and cities for your properties</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* States List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle>States</CardTitle>
              <CardDescription>Manage operating states</CardDescription>
            </div>
            <Dialog open={stateDialogOpen} onOpenChange={(val) => { setStateDialogOpen(val); if(!val) stateForm.reset()}}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add State</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New State</DialogTitle>
                </DialogHeader>
                <Form {...stateForm}>
                  <form onSubmit={stateForm.handleSubmit(onStateSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={stateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Karnataka" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={stateForm.formState.isSubmitting}>Save State</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-center text-slate-500">Loading...</p>
            ) : states.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No states found.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
                {states.map(state => (
                  <div key={state.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <span className="font-medium text-slate-900">{state.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                      {cities.filter(c => c.state_id === state.id).length} Cities
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cities List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle>Cities</CardTitle>
              <CardDescription>Manage operating cities</CardDescription>
            </div>
            <Dialog open={cityDialogOpen} onOpenChange={(val) => { setCityDialogOpen(val); if(!val) cityForm.reset()}}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={states.length === 0}><Plus className="w-4 h-4 mr-2" /> Add City</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New City</DialogTitle>
                </DialogHeader>
                <Form {...cityForm}>
                  <form onSubmit={cityForm.handleSubmit(onCitySubmit)} className="space-y-4 py-4">
                    <FormField
                      control={cityForm.control}
                      name="state_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select State</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={cityForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Bengaluru" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={cityForm.formState.isSubmitting}>Save City</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-center text-slate-500">Loading...</p>
            ) : cities.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No cities found.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
                {cities.map(city => (
                  <div key={city.id} className="p-4 flex flex-col hover:bg-slate-50">
                    <span className="font-medium text-slate-900">{city.name}</span>
                    <span className="text-xs text-slate-500">{city.state?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
