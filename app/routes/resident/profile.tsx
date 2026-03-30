// @ts-nocheck
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Building2, 
  Calendar, ShieldCheck, FileText, Camera, Edit2, AlertTriangle, LogOut, Upload, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { useMyResident, useUpdateEmergencyContact, useUploadResidentDocument } from '~/queries/residents.query';
import { formatCurrency, formatDate } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { toast } from 'sonner';

export default function ResidentProfilePage() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const aadharInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: resident, isLoading: loadingResident, refetch } = useMyResident({
    variables: { userId: user?.id || '' },
    enabled: !!user?.id,
  });

  const updateEmergencyContact = useUpdateEmergencyContact();
  const uploadDoc = useUploadResidentDocument();

  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({ 
    name: resident?.emergency_contact_name || '', 
    phone: resident?.emergency_contact_phone || '' 
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingAadhar, setUploadingAadhar] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const building = resident?.building;
  const loading = loadingResident;

  const handleUpdateEmergency = async () => {
    if (!resident) return;
    try {
      setUpdating(true);
      
      await updateEmergencyContact.mutateAsync({
        residentId: resident.id,
        emergency_contact_name: emergencyForm.name,
        emergency_contact_phone: emergencyForm.phone,
      });

      toast.success('Emergency contact updated!');
      setIsEditingEmergency(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadAadhar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !resident) return;

    try {
      setUploadingAadhar(true);
      await uploadDoc.mutateAsync({
        residentId: resident.id,
        field: 'aadhar_photo',
        file: file,
      });
      toast.success('Aadhar updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAadhar(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !resident) return;

    try {
      setUploadingPhoto(true);
      await uploadDoc.mutateAsync({
        residentId: resident.id,
        field: 'photo',
        file: file,
      });
      toast.success('Profile photo updated!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Loading profile…</p>
    </div>
  );

  const initials = resident?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'R';

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9]">
      {/* ── Dark Header (Same as Dashboard) ── */}
      <div className="bg-[#0F172A] px-5 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/resident" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40 text-[10px] uppercase tracking-widest">Profile Details</span>
            <h1 className="text-white text-[18px] font-semibold leading-tight">{resident?.name}</h1>
          </div>
        </div>
      </div>

      {/* ── Scrollable content area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 pb-10">
        
        {/* Personal Info Card */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-5 flex flex-col gap-4 shadow-sm">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Personal Info</span>
              </div>
           </div>
           
           <div className="flex items-start justify-between gap-4 pt-1">
              <div className="space-y-4 flex-1">
                <div className="flex flex-col gap-1 px-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Email</span>
                  <span className="text-sm font-medium text-slate-900">{resident?.email}</span>
                </div>
                <div className="flex flex-col gap-1 px-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Phone</span>
                  <span className="text-sm font-medium text-slate-900">+91 {resident?.phone}</span>
                </div>
                <div className="flex flex-col gap-1 px-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Age / Gender</span>
                  <span className="text-sm font-medium text-slate-900">{resident?.age || '-'} Yrs • {resident?.gender || '-'}</span>
                </div>
                <div className="flex flex-col gap-1 px-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Joined On</span>
                  <span className="text-sm font-medium text-slate-900">{formatDate(resident?.join_date)}</span>
                </div>
              </div>

              <div className="relative shrink-0">
                 <div className={`w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center transition-all ${uploadingPhoto ? 'animate-pulse opacity-50' : ''}`}>
                    {resident?.photo ? (
                       <img src={resident.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-slate-300 text-2xl font-bold">{initials}</span>
                    )}
                 </div>
                 <button 
                   disabled={uploadingPhoto}
                   onClick={() => photoInputRef.current?.click()}
                   className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                 >
                    <Camera className="w-4 h-4" />
                 </button>
                 <input 
                   type="file" 
                   ref={photoInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   onChange={handleUploadPhoto} 
                 />
              </div>
           </div>
        </div>

        {/* Home/PG Info Card */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-5 flex flex-col gap-4 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
               <Building2 className="w-4 h-4" />
             </div>
             <span className="text-sm font-semibold text-slate-900">PG & Stay</span>
           </div>
           
           <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-1">
              <div className="flex flex-col gap-1 px-1 overflow-hidden">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Building</span>
                <span className="text-sm font-medium text-slate-900 truncate">{building?.name}</span>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Room No.</span>
                <span className="text-sm font-medium text-slate-900">Room {resident?.room?.room_number}</span>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Floor</span>
                <span className="text-sm font-medium text-slate-900">Floor {resident?.floor?.floor_number}</span>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Bed/Seat</span>
                <span className="text-sm font-medium text-slate-900">Bed {resident?.seat?.seat_number}</span>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Room Type</span>
                <span className="text-sm font-medium text-slate-900">{resident?.room?.room_types?.name || 'Standard'}</span>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Sharing</span>
                <span className="text-sm font-medium text-slate-900">{resident?.room?.sharing_types?.name || 'N/A'}</span>
              </div>
           </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-5 flex flex-col gap-4 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
               <FileText className="w-4 h-4" />
             </div>
             <span className="text-sm font-semibold text-slate-900">Stored Documents</span>
           </div>
           
           <div className="space-y-4 pt-1">
              {resident?.aadhar_photo ? (
                 <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                       <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Aadhar Card</span>
                          <div className="flex items-center gap-1.5">
                             <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                             <span className="text-xs text-slate-600 font-medium">Verified Document</span>
                          </div>
                       </div>
                       <button 
                         disabled={uploadingAadhar}
                         onClick={() => aadharInputRef.current?.click()}
                         className="text-xs text-blue-500 font-medium"
                       >
                         {uploadingAadhar ? '...' : 'Update'}
                       </button>
                    </div>
                    
                    <div className="relative group overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                       <img 
                         src={resident.aadhar_photo} 
                         alt="Aadhar" 
                         className="w-full h-auto object-contain bg-slate-50 min-h-[120px]" 
                       />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                    </div>
                 </div>
              ) : (
                 <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                       <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-xs font-semibold text-slate-900">No Documents Uploaded</span>
                       <span className="text-[10px] text-slate-400">Government ID is required for verification</span>
                    </div>
                    <button 
                      disabled={uploadingAadhar}
                      onClick={() => aadharInputRef.current?.click()}
                      className="h-10 px-6 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                       <Upload className="w-3.5 h-3.5" />
                       {uploadingAadhar ? 'Processing...' : 'Upload Aadhar Now'}
                    </button>
                 </div>
              )}

              <input 
                type="file" 
                ref={aadharInputRef} 
                className="hidden" 
                accept="image/*,.pdf" 
                onChange={handleUploadAadhar}
              />
           </div>
        </div>

        {/* Emergency Card */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-5 flex flex-col gap-4 shadow-sm">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Emergency Contact</span>
              </div>
              {!isEditingEmergency && (
                <button 
                  onClick={() => setIsEditingEmergency(true)}
                  className="text-xs text-blue-500 font-medium"
                >
                  {resident?.emergency_contact_name ? 'Edit' : 'Add'}
                </button>
              )}
           </div>
           
           {isEditingEmergency ? (
             <div className="flex flex-col gap-4 pt-1">
                <div className="flex flex-col gap-1.5 px-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest">Person Name</label>
                  <input 
                    className="h-10 px-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                    placeholder="e.g. Papa / Brother"
                    value={emergencyForm.name}
                    onChange={e => setEmergencyForm({...emergencyForm, name: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1.5 px-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    className="h-10 px-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                    placeholder="e.g. 9876543210"
                    value={emergencyForm.phone}
                    onChange={e => setEmergencyForm({...emergencyForm, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1 px-1">
                  <button 
                    disabled={updating}
                    onClick={() => setIsEditingEmergency(false)}
                    className="h-10 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={updating}
                    onClick={handleUpdateEmergency}
                    className="h-10 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                  >
                    {updating ? 'Saving...' : 'Save Contact'}
                  </button>
                </div>
             </div>
           ) : (
             <div className="space-y-4 pt-1">
               <div className="flex flex-col gap-1 px-1">
                 <span className="text-[10px] text-slate-400 uppercase tracking-widest">Contact Person</span>
                 <span className={`text-sm font-medium ${resident?.emergency_contact_name ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                   {resident?.emergency_contact_name || 'Not provided'}
                 </span>
               </div>
               <div className="flex flex-col gap-1 px-1">
                 <span className="text-[10px] text-slate-400 uppercase tracking-widest">Contact Phone</span>
                 <span className={`text-sm font-medium ${resident?.emergency_contact_phone ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                   {resident?.emergency_contact_phone || 'Not provided'}
                 </span>
               </div>
             </div>
           )}
        </div>

        {/* Logout Button */}
        <button 
          onClick={() => signOut()}
          className="w-full mt-2 h-14 bg-red-50 hover:bg-red-100/50 text-red-600 rounded-[20px] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

      </div>
    </div>
  );
}
