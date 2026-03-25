import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '~/lib/supabase';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

interface State { id: string; name: string; }
interface City { id: string; name: string; state_id: string; }
interface Building { id: string; name: string; }

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    building_id: '', floor_id: '', room_id: '', seat_id: '',
    line_one: '', line_two: '', state_id: '', city_id: '', pincode: '',
    password: '', confirm_password: '',
  });

  useEffect(() => {
    supabase.from('states').select('id,name').order('name').then(({ data }) => setStates(data || []));
    supabase.from('buildings').select('id,name').eq('status', 'ACTIVE').order('name').then(({ data }) => setBuildings(data || []));
  }, []);

  useEffect(() => {
    if (form.state_id) {
      supabase.from('cities').select('id,name,state_id').eq('state_id', form.state_id).order('name').then(({ data }) => setCities(data || []));
    }
  }, [form.state_id]);

  useEffect(() => {
    if (form.building_id) {
      supabase.from('floors').select('id, floor_number').eq('building_id', form.building_id).then(({ data }) => setFloors(data || []));
    }
  }, [form.building_id]);

  useEffect(() => {
    if (form.floor_id) {
      supabase.from('rooms').select('id, room_number').eq('floor_id', form.floor_id).then(({ data }) => setRooms(data || []));
    }
  }, [form.floor_id]);

  useEffect(() => {
    if (form.room_id) {
      supabase.from('seats').select('id, seat_number').eq('room_id', form.room_id).eq('status', 'AVAILABLE').then(({ data }) => setSeats(data || []));
    }
  }, [form.room_id]);

  const update = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const userId = authData.user.id;

      // Create address
      const { data: addrData, error: addrError } = await supabase
        .from('addresses')
        .insert({ line_one: form.line_one, line_two: form.line_two || null, pincode: form.pincode, city_id: form.city_id })
        .select('id')
        .maybeSingle();
      if (addrError) throw addrError;
      if (!addrData) throw new Error("Failed connecting to address layout");

      // Create user_role
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'RESIDENT',
        name: form.name,
        phone: form.phone,
        email: form.email,
      });

      // Create resident (PENDING approval)
      await supabase.from('residents').insert({
        user_id: userId,
        building_id: form.building_id,
        floor_id: form.floor_id,
        room_id: form.room_id,
        seat_id: form.seat_id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        status: 'PENDING',
        address_id: addrData.id,
      });

      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Lucky Luxury PG</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Register for a PG Account</h1>
          <p className="text-slate-500 mt-2">Fill in your details to apply for a room</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${s <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-16 transition-all ${s < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
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
                    <Label>Room *</Label>
                    <Select value={form.room_id} onValueChange={v => { update('room_id', v); update('seat_id', ''); }} disabled={!form.floor_id}>
                      <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                      <SelectContent>
                        {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seat/Bed *</Label>
                    <Select value={form.seat_id} onValueChange={v => update('seat_id', v)} disabled={!form.room_id}>
                      <SelectTrigger><SelectValue placeholder={seats.length ? "Select Bed" : "No beds available"} /></SelectTrigger>
                      <SelectContent>
                        {seats.map(s => <SelectItem key={s.id} value={s.id}>{s.seat_number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" className="w-full" size="lg" disabled={!form.name || !form.phone || !form.email || !form.seat_id} onClick={() => setStep(2)}>
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

            {/* Step 3: Password */}
            {step === 3 && (
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
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>← Back</Button>
                  <Button type="submit" className="flex-1" size="lg" loading={loading}>Register</Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
