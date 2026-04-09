import { useState } from 'react';
import { Building2, Plus, MapPin, Layers, Settings2, Pencil } from 'lucide-react';
import { Link } from 'react-router';
import { useAuthStore } from '~/store/auth.store';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '~/components/ui/dialog';
import { toast } from 'sonner';
import { Label } from '~/components/ui/label';

// Query hooks
import { 
  useAdminBuildings, 
  useAllBuildings,
  useCities, 
  useAddBuilding, 
  useUpdateBuildingSettings,
  useUpdateAddress
} from '~/queries/buildings.query';
import { useManagementContext } from '~/hooks/use-management-context';

export default function BuildingsPage() {
  const { user } = useAuthStore();
  
  const { buildingIds, isImpersonating } = useManagementContext();
  
  // Queries
  const { data: adminData = [], isLoading: loadingAdmin } = useAdminBuildings({
    variables: { adminId: user?.id || '' },
    enabled: !!user?.id && !isImpersonating,
  });

  const { data: allBuildingsData = [], isLoading: loadingAll } = useAllBuildings();

  const buildings = isImpersonating 
    ? allBuildingsData.filter(b => buildingIds.includes(b.id)) 
    : adminData;

  const loadingBuildings = isImpersonating ? loadingAll : loadingAdmin;
  
  const { data: cities = [] } = useCities();

  // Mutations
  const { mutateAsync: addBuilding, isPending: addingBuilding } = useAddBuilding();
  const { mutateAsync: updateSettings, isPending: updatingSettings } = useUpdateBuildingSettings();
  const { mutateAsync: updateAddress, isPending: updatingAddress } = useUpdateAddress();

  const [openAdd, setOpenAdd] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openEditAddress, setOpenEditAddress] = useState(false);
  const [selectedBldg, setSelectedBldg] = useState<any>(null);

  // Add Building States
  const [newBldg, setNewBldg] = useState({ name: '', line_one: '', city_id: '', floors: '1', seats_per_floor: '4' });
  const [setts, setSetts] = useState({ monthly_rent: '', daily_rent: '', deposit_amount: '' });
  const [editAddr, setEditAddr] = useState({ line_one: '', city_id: '', pincode: '' });

  const onAddBuilding = async () => {
    try {
      if (!newBldg.city_id || !newBldg.name) return toast.error("Please fill required fields");
      
      await addBuilding({
        name: newBldg.name,
        line_one: newBldg.line_one,
        city_id: newBldg.city_id,
        admin_id: user!.id,
        floors: Number(newBldg.floors),
        seats_per_floor: Number(newBldg.seats_per_floor),
      });

      toast.success("Building created!");
      setOpenAdd(false);
      setNewBldg({ name: '', line_one: '', city_id: '', floors: '1', seats_per_floor: '4' });
    } catch (e: any) {
      toast.error(e.message || "Failed to create building");
    }
  };

  const handleOpenSettings = (b: any) => {
    setSelectedBldg(b);
    setSetts({
      monthly_rent: (b.monthly_rent || 0).toString(),
      daily_rent: (b.daily_rent || 0).toString(),
      deposit_amount: (b.deposit_amount || 0).toString()
    });
    setOpenSettings(true);
  };

  const handleOpenEditAddress = (b: any) => {
    setSelectedBldg(b);
    setEditAddr({
      line_one: b.address?.line_one || '',
      city_id: b.address?.city_id || '',
      pincode: b.address?.pincode || '',
    });
    setOpenEditAddress(true);
  };

  const onSettingsSubmit = async () => {
    if (!selectedBldg) return;
    try {
      await updateSettings({
        buildingId: selectedBldg.id,
        monthly_rent: Number(setts.monthly_rent),
        daily_rent: Number(setts.daily_rent),
        deposit_amount: Number(setts.deposit_amount)
      });
      toast.success("Settings updated!");
      setOpenSettings(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update settings");
    }
  };

  const onEditAddressSubmit = async () => {
    if (!selectedBldg?.address?.id) return toast.error("No address found for this building");
    try {
      await updateAddress({
        addressId: selectedBldg.address.id,
        line_one: editAddr.line_one,
        city_id: editAddr.city_id,
        pincode: editAddr.pincode,
      });
      toast.success("Address updated successfully!");
      setOpenEditAddress(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update address");
    }
  };

  if (loadingBuildings) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading properties...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
           <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Your Properties
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage buildings, rooms and rental preferences</p>
        </div>
        {!isImpersonating && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
             <DialogTrigger asChild>
               <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-500/20">
                 <Plus className="w-4 h-4 mr-2" /> Add Building
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New Building</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4 text-left">
                   <div className="space-y-2">
                     <Label>Building Name *</Label>
                     <Input value={newBldg.name} onChange={e => setNewBldg({...newBldg, name: e.target.value})} placeholder="e.g. Royal PG" />
                   </div>
                   <div className="space-y-2">
                     <Label>City *</Label>
                     <select className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" value={newBldg.city_id} onChange={e => setNewBldg({...newBldg, city_id: e.target.value})}>
                       <option value="">Select City</option>
                       {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label>Full Address</Label>
                     <Input value={newBldg.line_one} onChange={e => setNewBldg({...newBldg, line_one: e.target.value})} placeholder="Area, Landmark" />
                   </div>
                   <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label>Floors</Label>
                        <Input type="number" value={newBldg.floors} onChange={e => setNewBldg({...newBldg, floors: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Seats / Floor</Label>
                        <Input type="number" value={newBldg.seats_per_floor} onChange={e => setNewBldg({...newBldg, seats_per_floor: e.target.value})} />
                      </div>
                   </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setOpenAdd(false)} disabled={addingBuilding} className="w-full sm:w-auto">Cancel</Button>
                  <Button onClick={onAddBuilding} disabled={addingBuilding} className="w-full sm:w-auto">{addingBuilding ? 'Creating...' : 'Create Property'}</Button>
                </DialogFooter>
             </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {buildings.map(b => (
          <Card key={b.id} className="border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full">
             <div className="h-2 bg-blue-600 shrink-0" />
             <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant={b.status === 'ACTIVE' ? 'success' : 'secondary'}>{b.status}</Badge>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600 transition-colors shrink-0">{b.name}</h3>
                <div className="flex items-start gap-2 mb-4 shrink-0">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                  <p className="text-xs text-slate-500 flex-1 leading-relaxed line-clamp-2">
                     {b.address?.line_one}, {b.address?.city?.name}
                  </p>
                  {!isImpersonating && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 shrink-0 text-slate-400 hover:text-blue-600 -mt-1" 
                      onClick={() => handleOpenEditAddress(b)}
                      title="Edit Address"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                  <Link to={`/admin/buildings/${b.id}/layout`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                      <Layers className="w-3.5 h-3.5 mr-1.5" /> Layout
                    </Button>
                  </Link>
                  {!isImpersonating && (
                    <Button variant="outline" size="sm" className="flex-1 text-xs font-semibold" onClick={() => handleOpenSettings(b)}>
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Settings
                    </Button>
                  )}
                </div>
             </CardContent>
          </Card>
        ))}
        {buildings.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>No buildings found.</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
          <DialogHeader><DialogTitle>Property Settings: {selectedBldg?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-left font-medium">
             <div className="space-y-2">
               <Label>Monthly Rent (₹)</Label>
               <Input value={setts.monthly_rent} onChange={e => setSetts({...setts, monthly_rent: e.target.value})} type="number" />
             </div>
             <div className="space-y-2">
               <Label>Daily Rent (₹)</Label>
               <Input value={setts.daily_rent} onChange={e => setSetts({...setts, daily_rent: e.target.value})} type="number" />
             </div>
             <div className="space-y-2">
               <Label>Security Deposit (₹)</Label>
               <Input value={setts.deposit_amount} onChange={e => setSetts({...setts, deposit_amount: e.target.value})} type="number" />
             </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
             <Button variant="outline" onClick={() => setOpenSettings(false)} disabled={updatingSettings} className="w-full sm:w-auto">Cancel</Button>
             <Button onClick={onSettingsSubmit} disabled={updatingSettings} className="w-full sm:w-auto">{updatingSettings ? 'Saving...' : 'Save Settings'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Modal */}
      <Dialog open={openEditAddress} onOpenChange={setOpenEditAddress}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Edit Address: {selectedBldg?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input 
                value={editAddr.line_one} 
                onChange={e => setEditAddr({...editAddr, line_one: e.target.value})} 
                placeholder="Door No, Street, Area" 
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <select 
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                value={editAddr.city_id} 
                onChange={e => setEditAddr({...editAddr, city_id: e.target.value})}
              >
                <option value="">Select City</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input 
                value={editAddr.pincode} 
                onChange={e => setEditAddr({...editAddr, pincode: e.target.value})} 
                placeholder="560001" 
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpenEditAddress(false)} disabled={updatingAddress} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={onEditAddressSubmit} disabled={updatingAddress} className="w-full sm:w-auto">
              {updatingAddress ? 'Updating...' : 'Update Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
