import { useState } from 'react';
import { Tags, Plus, Trash2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '~/components/ui/dialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useRoomTypes, 
  useSharingTypes, 
  useCreateRoomType, 
  useDeleteRoomType,
  useCreateSharingType,
  useDeleteSharingType,
  roomTypeKeys
} from '~/queries/room-types.query';

export default function AdminRoomTypes() {
  const queryClient = useQueryClient();
  const { data: roomTypes = [], isLoading: loadingRT } = useRoomTypes();
  const { data: sharingTypes = [], isLoading: loadingST } = useSharingTypes();

  const { mutateAsync: createRT } = useCreateRoomType({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomTypeKeys.all })
  });
  const { mutateAsync: deleteRT } = useDeleteRoomType({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomTypeKeys.all })
  });
  const { mutateAsync: createST } = useCreateSharingType({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomTypeKeys.sharingTypes })
  });
  const { mutateAsync: deleteST } = useDeleteSharingType({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomTypeKeys.sharingTypes })
  });

  // State
  const [openRTCreation, setOpenRTCreation] = useState(false);
  const [openSTCreation, setOpenSTCreation] = useState(false);

  // Form Fields
  const [rtName, setRtName] = useState('');
  const [stName, setStName] = useState('');
  const [stCapacity, setStCapacity] = useState('1');

  const handleCreateRoomType = async () => {
    if (!rtName) return;
    try {
      await createRT({ name: rtName });
      toast.success("Flat type created!");
      setRtName('');
      setOpenRTCreation(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to create flat type");
    }
  };

  const handleDeleteRoomType = async (id: string) => {
    try {
      await deleteRT({ id });
      toast.success("Flat type deleted!");
    } catch (e: any) {
      toast.error(e.message || "Cannot delete type in use");
    }
  };

  const handleCreateSharingType = async () => {
    if (!stName || Number(stCapacity) < 1) return;
    try {
      await createST({ name: stName, capacity: Number(stCapacity) });
      toast.success("Sharing type created!");
      setStName('');
      setStCapacity('1');
      setOpenSTCreation(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to create sharing type");
    }
  };

  const handleDeleteSharingType = async (id: string) => {
    try {
      await deleteST({ id });
      toast.success("Sharing type deleted!");
    } catch (e: any) {
      toast.error(e.message || "Cannot delete type in use");
    }
  };

  if (loadingRT || loadingST) return <div className="p-20 text-center text-slate-400">Loading Configuration...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tags className="w-6 h-6 text-indigo-600" />
            Flat Configurations
          </h1>
          <p className="text-slate-500 mt-1">Manage flat and sharing classifications used across buildings</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Flat Types */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
             <div className="space-y-1">
               <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" /> Flat Types</CardTitle>
               <CardDescription>e.g. AC, Non-AC, Premium</CardDescription>
             </div>
             
             <Dialog open={openRTCreation} onOpenChange={setOpenRTCreation}>
               <DialogTrigger asChild>
                 <Button size="sm"><Plus className="w-4 h-4 mr-1"/> Add</Button>
               </DialogTrigger>
               <DialogContent className="max-w-sm">
                 <DialogHeader><DialogTitle>New Flat Type</DialogTitle></DialogHeader>
                 <div className="space-y-4 py-4">
                   <div className="space-y-2">
                     <Label>Name</Label>
                     <Input placeholder="e.g. Balcony AC" value={rtName} onChange={e => setRtName(e.target.value)} />
                   </div>
                 </div>
                 <DialogFooter>
                   <Button variant="outline" onClick={() => setOpenRTCreation(false)}>Cancel</Button>
                   <Button onClick={handleCreateRoomType}>Save</Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
          </CardHeader>
          <CardContent>
             <div className="mt-4 space-y-3">
               {roomTypes.map(rt => (
                 <div key={rt.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                   <span className="font-semibold text-slate-700">{rt.name}</span>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteRoomType(rt.id)}>
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
               ))}
               {roomTypes.length === 0 && (
                 <p className="text-sm text-center text-slate-400 py-4">No flat types configured.</p>
               )}
             </div>
          </CardContent>
        </Card>

        {/* Sharing Types */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
             <div className="space-y-1">
               <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-teal-500" /> Sharing Types</CardTitle>
               <CardDescription>e.g. Single, Double, Quad</CardDescription>
             </div>
             
             <Dialog open={openSTCreation} onOpenChange={setOpenSTCreation}>
               <DialogTrigger asChild>
                 <Button size="sm" variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100"><Plus className="w-4 h-4 mr-1"/> Add</Button>
               </DialogTrigger>
               <DialogContent className="max-w-sm">
                 <DialogHeader><DialogTitle>New Sharing Type</DialogTitle></DialogHeader>
                 <div className="space-y-4 py-4">
                   <div className="space-y-2">
                     <Label>Name</Label>
                     <Input placeholder="e.g. Double Sharing" value={stName} onChange={e => setStName(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <Label>Seat Capacity</Label>
                     <Input type="number" min="1" value={stCapacity} onChange={e => setStCapacity(e.target.value)} />
                   </div>
                 </div>
                 <DialogFooter>
                   <Button variant="outline" onClick={() => setOpenSTCreation(false)}>Cancel</Button>
                   <Button onClick={handleCreateSharingType}>Save</Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
          </CardHeader>
          <CardContent>
             <div className="mt-4 space-y-3">
               {sharingTypes.map(st => (
                 <div key={st.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                   <div>
                     <span className="font-semibold text-slate-700 block">{st.name}</span>
                     <span className="text-xs text-slate-400">Capacity: {st.capacity}</span>
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteSharingType(st.id)}>
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
               ))}
               {sharingTypes.length === 0 && (
                 <p className="text-sm text-center text-slate-400 py-4">No sharing types configured.</p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
