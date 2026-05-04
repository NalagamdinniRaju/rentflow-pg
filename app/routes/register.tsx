import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Eye, EyeOff, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import {
  useRegistrationBuildings,
  useRegistrationFloors,
  useRegistrationRooms,
  useRegistrationSeats,
  useRegistrationStates,
  useRegistrationCities,
  useRegistrationRoomTypes,
  useRegistrationSharingTypes,
  useRegisterUser
} from '~/queries/register.query';

import { useAuthStore } from '~/store/auth.store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const s = sessionStorage.getItem('register_step');
    return s ? parseInt(s, 10) : 1;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('register_agreed') === 'true';
  });

  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);

  const [form, setForm] = useState(() => {
    const defaultForm = {
      name: '', phone: '', email: '',
      building_id: '', floor_id: '', room_type_id: '', sharing_type_id: '', room_id: '', seat_id: '',
      line_one: '', line_two: '', state_id: '', city_id: '', pincode: '',
      password: '', confirm_password: '',
      age: '', gender: '', stay_type: 'MONTHLY'
    };
    if (typeof window === 'undefined') return defaultForm;
    try {
      const saved = sessionStorage.getItem('register_form');
      return saved ? { ...defaultForm, ...JSON.parse(saved) } : defaultForm;
    } catch {
      return defaultForm;
    }
  });

  useEffect(() => { sessionStorage.setItem('register_step', step.toString()); }, [step]);
  useEffect(() => { sessionStorage.setItem('register_agreed', agreed.toString()); }, [agreed]);
  useEffect(() => { sessionStorage.setItem('register_form', JSON.stringify(form)); }, [form]);

  const { data: states = [] } = useRegistrationStates();
  const { data: buildings = [] } = useRegistrationBuildings();
  const { data: roomTypes = [] } = useRegistrationRoomTypes();
  const { data: sharingTypes = [] } = useRegistrationSharingTypes();

  const { data: cities = [] } = useRegistrationCities({
    variables: { stateId: form.state_id },
    enabled: !!form.state_id,
  });

  const { data: floors = [] } = useRegistrationFloors({
    variables: { buildingId: form.building_id },
    enabled: !!form.building_id,
  });

  const { data: rooms = [] } = useRegistrationRooms({
    variables: {
      floorId: form.floor_id,
      roomTypeId: form.room_type_id,
      sharingTypeId: form.sharing_type_id
    },
    enabled: !!form.floor_id,
  });

  const { data: seats = [] } = useRegistrationSeats({
    variables: { roomId: form.room_id },
    enabled: !!form.room_id,
  });

  const update = useCallback((field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const selectedBuilding = buildings.find(b => b.id === form.building_id);
  const selectedRoom = rooms.find(r => r.id === form.room_id);

  const effectiveMonthly = selectedRoom?.custom_monthly_rent != null
    ? Number(selectedRoom.custom_monthly_rent)
    : (Number(selectedBuilding?.monthly_rent) || 6000);

  const effectiveDaily = selectedRoom?.custom_daily_rent != null
    ? Number(selectedRoom.custom_daily_rent)
    : (Number(selectedBuilding?.daily_rent) || 300);

  const effectiveDeposit = selectedRoom?.custom_deposit_amount != null
    ? Number(selectedRoom.custom_deposit_amount)
    : (Number(selectedBuilding?.deposit_amount) || 5000);

  const rentSource = selectedRoom?.custom_monthly_rent != null || selectedRoom?.custom_daily_rent != null || selectedRoom?.custom_deposit_amount != null
    ? 'flat-custom'
    : 'building-default';

  const { mutateAsync: registerUser } = useRegisterUser();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) return setError("Passwords do not match");

    setLoading(true);
    try {
      await registerUser({
        ...form,
        aadhar_file: aadharFile,
        deposit_amount: effectiveDeposit,
        monthly_rent: effectiveMonthly,
        daily_rent: effectiveDaily
      } as any);
      sessionStorage.removeItem('register_step');
      sessionStorage.removeItem('register_form');
      sessionStorage.removeItem('register_agreed');
      // Initialize auth store to capture the new session/role
      await authStore.initialize();
      toast.success("Registration successful!");
      navigate('/resident');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, aadharFile, navigate, registerUser, authStore]);

  return (
    <div
      className="min-h-screen relative py-10 px-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #041a5c 0%, #072b7e 45%, #1a3fa0 75%, #2d5be3 100%)' }}
    >
      {/* Decorative glass orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 w-[28rem] h-[28rem] rounded-full bg-blue-300/15 blur-3xl" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-3 mb-6">
            <img alt="Lucky Luxury Logo" className="h-14 md:h-16 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
            <span className="text-xl md:text-2xl font-extrabold text-[#072b7e] tracking-tight mt-0.5">Lucky Luxury PG Services</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Register for a PG Account</h1>
          <p className="text-blue-100 mt-2">Fill in your details to apply for a flat</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${s <= step ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-white/20 text-white/70'}`}>
                {s}
              </div>
              {s < 4 && <div className={`h-0.5 w-12 transition-all ${s < step ? 'bg-blue-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/60 shadow-2xl shadow-black/25 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="9876543210" value={form.phone} onChange={e => update('phone', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select value={form.gender} onValueChange={v => update('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input id="age" type="number" placeholder="24" value={form.age} onChange={e => update('age', e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Building *</Label>
                    <Select value={form.building_id} onValueChange={v => { update('building_id', v); update('floor_id', ''); update('room_id', ''); update('seat_id', ''); }}>
                      <SelectTrigger><SelectValue placeholder="— Select PG —" /></SelectTrigger>
                      <SelectContent>
                        {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Floor *</Label>
                    <Select value={form.floor_id} onValueChange={v => { update('floor_id', v); update('room_id', ''); update('seat_id', ''); }} disabled={!form.building_id}>
                      <SelectTrigger><SelectValue placeholder="Select Floor" /></SelectTrigger>
                      <SelectContent>
                        {floors.map(f => <SelectItem key={f.id} value={f.id}>{f.floor_number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Flat Type (Optional)</Label>
                    <Select value={form.room_type_id} onValueChange={v => { update('room_type_id', v); update('room_id', ''); update('seat_id', ''); }}>
                      <SelectTrigger><SelectValue placeholder="Any Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any Type</SelectItem>
                        {roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sharing (Optional)</Label>
                    <Select value={form.sharing_type_id} onValueChange={v => { update('sharing_type_id', v); update('room_id', ''); update('seat_id', ''); }}>
                      <SelectTrigger><SelectValue placeholder="Any Sharing" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any Sharing</SelectItem>
                        {sharingTypes.map(st => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Flat *</Label>
                    <Select value={form.room_id} onValueChange={v => { update('room_id', v); update('seat_id', ''); }} disabled={!form.floor_id || rooms.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !form.floor_id
                            ? "Select Floor First"
                            : rooms.length === 0
                              ? `No ${roomTypes.find(rt => rt.id === form.room_type_id)?.name || ''} ${sharingTypes.find(st => st.id === form.sharing_type_id)?.name || ''} flats available`
                              : "Select Flat"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.floor_id && rooms.length === 0 && (
                      <p className="text-[10px] text-red-500 font-medium">
                        No flats available for {roomTypes.find(rt => rt.id === form.room_type_id)?.name || 'any'} and {sharingTypes.find(st => st.id === form.sharing_type_id)?.name || 'any'} configuration on this floor.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Seat/Bed *</Label>
                    <Select value={form.seat_id} onValueChange={v => update('seat_id', v)} disabled={!form.room_id || seats.length === 0}>
                      <SelectTrigger><SelectValue placeholder={!form.room_id ? "Select Flat First" : seats.length ? "Select Bed" : "No beds available"} /></SelectTrigger>
                      <SelectContent>
                        {seats.map(s => <SelectItem key={s.id} value={s.id}>{s.seat_number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Stay Type *</Label>
                  <Select value={form.stay_type} onValueChange={v => update('stay_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Stay Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly Basis</SelectItem>
                      <SelectItem value="DAILY">Daily Basis (Short Stay)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rent Summary Card */}
                {form.room_id && (
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mt-2">
                    <h3 className="text-sm font-bold text-emerald-900 mb-2 border-b border-emerald-200/50 pb-2 flex items-center gap-2">
                      Rent Summary
                    </h3>

                    <div className="mb-3 mt-1">
                      {rentSource === 'flat-custom' ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            Custom Flat Rent
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-slate-200 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            Building Default
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <p className="text-[10px] text-emerald-600 font-semibold mb-1 uppercase tracking-wider">
                          {form.stay_type === 'MONTHLY' ? 'Monthly Rent' : 'Daily Rent'}
                        </p>
                        <p className="text-lg lg:text-xl font-bold text-slate-800">
                          ₹{form.stay_type === 'MONTHLY' ? effectiveMonthly : effectiveDaily}
                          <span className="text-[10px] font-normal text-slate-400 ml-1">/{form.stay_type === 'MONTHLY' ? 'mo' : 'day'}</span>
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <p className="text-[10px] text-emerald-600 font-semibold mb-1 uppercase tracking-wider">Security Deposit</p>
                        <p className="text-lg lg:text-xl font-bold text-slate-800">₹{effectiveDeposit}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button type="button" className="w-full mt-4" size="lg" disabled={!form.name || !form.phone || !form.email || !form.seat_id || !form.age || !form.gender || !form.stay_type} onClick={() => setStep(2)}>
                  Next Step (Address) →
                </Button>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Permanent Address</h2>
                <div className="space-y-2">
                  <Label htmlFor="line_one">Address Line 1 *</Label>
                  <Input id="line_one" placeholder="Door No, Street" value={form.line_one} onChange={e => update('line_one', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="line_two">Address Line 2 (Optional)</Label>
                  <Input id="line_two" placeholder="Landmark, Area, etc." value={form.line_two} onChange={e => update('line_two', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={form.state_id} onValueChange={v => { update('state_id', v); update('city_id', ''); }}>
                      <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>
                        {states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Select value={form.city_id} onValueChange={v => update('city_id', v)} disabled={!form.state_id}>
                      <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                      <SelectContent>
                        {cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input id="pincode" placeholder="e.g. 560001" value={form.pincode} onChange={e => update('pincode', e.target.value)} required />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>← Back</Button>
                  <Button type="button" className="flex-1" size="lg" disabled={!form.line_one || !form.city_id || !form.pincode} onClick={() => setStep(3)}>Next →</Button>
                </div>
              </div>
            )}

            {/* Step 3: Aadhar Upload */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Upload Aadhar Card</h2>
                  <p className="text-sm text-slate-500">Please upload a clear photo of your Aadhar card for verification.</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <label
                    htmlFor="aadhar-upload"
                    className={`relative w-full aspect-[1.6/1] max-w-md border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all overflow-hidden
                      ${aadharPreview ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}
                  >
                    {aadharPreview ? (
                      <>
                        <img src={aadharPreview} alt="Aadhar Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white text-xs font-semibold">
                            Change Document
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-900">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-500 mt-1">JPG, PNG or PDF (max. 5MB)</p>
                        </div>
                      </>
                    )}
                    <input
                      id="aadhar-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAadharFile(file);
                          const url = URL.createObjectURL(file);
                          setAadharPreview(url);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">!</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Important:</strong> Ensure all details like Name, Date of Birth, and Aadhar Number are clearly visible. Registration may be rejected if the document is blurry.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>← Back</Button>
                  <Button type="button" className="flex-1" size="lg" disabled={!aadharFile} onClick={() => setStep(4)}>Continue →</Button>
                </div>
              </div>
            )}

            {/* Step 4: Password */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Password</h2>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input id="password" type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" value={form.password} onChange={e => update('password', e.target.value)} className="pr-10" required />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input id="confirm_password" type="password" placeholder="Min 8 chars" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} required />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                  <strong>Note:</strong> Your application will be reviewed by the PG Admin. You'll receive access once approved.
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <Label htmlFor="terms" className="text-sm text-slate-600 leading-tight pt-0.5 cursor-pointer">
                    I agree to the <Link to="/terms-and-conditions" className="text-[#072b7e] font-bold hover:underline">Terms & Conditions</Link> and <Link to="/privacy-policy" className="text-[#072b7e] font-bold hover:underline">Privacy Policy</Link>.
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(3)}>← Back</Button>
                  <Button type="submit" className="flex-1" size="lg" loading={loading} disabled={!agreed || !form.password || !form.confirm_password}>Register</Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-blue-100 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-semibold hover:text-blue-200 underline underline-offset-2">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
