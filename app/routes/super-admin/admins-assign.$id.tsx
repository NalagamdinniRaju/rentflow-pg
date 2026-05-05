import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Building2, ChevronLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { useAvailableBuildings, useUpdateBuildingAssignments, useAdmins } from '~/queries/admins.query';
import { toast } from 'sonner';
import { Checkbox } from '~/components/ui/checkbox';

export default function AdminAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!id) {
    navigate('/super-admin/admins');
    return null;
  }

  // Fetch all admins to find the names/details of this specific admin
  const { data: admins = [] } = useAdmins();
  const currentAdmin = admins.find(a => a.user_id === id);

  // Fetch available buildings (unassigned or assigned to this admin)
  const { data: buildings = [], isLoading } = useAvailableBuildings({ 
    variables: { adminId: id } 
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize selected IDs based on current assignments
  useEffect(() => {
    if (buildings.length > 0) {
      const assigned = buildings
        .filter(b => b.admin_id === id)
        .map(b => b.id);
      setSelectedIds(assigned);
    }
  }, [buildings, id]);

  const { mutateAsync: updateAssignments, isPending: saving } = useUpdateBuildingAssignments();

  const handleToggle = (buildingId: string) => {
    setSelectedIds(prev => 
      prev.includes(buildingId) 
        ? prev.filter(i => i !== buildingId) 
        : [...prev, buildingId]
    );
  };

  const handleSave = async () => {
    try {
      await updateAssignments({ adminId: id, buildingIds: selectedIds });
      toast.success('Building assignments updated successfully');
      navigate('/super-admin/admins');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update assignments');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium italic">Scanning building pool...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/super-admin/admins')}
          className="text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Manage Assignments</h1>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-2 bg-blue-600" />
        <CardHeader>
          <CardTitle>Assigning Buildings to: <span className="text-blue-600">{currentAdmin?.name || 'Loading...'}</span></CardTitle>
          <CardDescription>
            Select the properties this administrator will be responsible for. 
            Buildings that are currently "Unassigned" will appear here.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map((b) => {
          const isSelected = selectedIds.includes(b.id);
          const wasAssigned = b.admin_id === id;

          return (
            <Card 
              key={b.id} 
              className={`transition-all border-2 cursor-pointer relative overflow-hidden ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50/30' 
                  : 'border-transparent hover:border-slate-200 bg-white'
              }`}
              onClick={() => handleToggle(b.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{b.name}</h3>
                      <p className="text-xs text-slate-500 italic">
                        {wasAssigned ? 'Already Assigned' : 'Available for Selection'}
                      </p>
                    </div>
                  </div>
                  <Checkbox 
                    checked={isSelected}
                    className={`h-5 w-5 rounded-md ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}
                  />
                </div>
                
                {isSelected && (
                  <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Assignment Selected
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {buildings.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p className="font-medium italic">No available buildings found in the system.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-8 right-8 flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/super-admin/admins')}
          className="bg-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 px-8 font-bold"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizing...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Confirm Assignments
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
