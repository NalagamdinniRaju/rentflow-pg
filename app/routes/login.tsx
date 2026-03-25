// @ts-nocheck
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, KeyRound, Building2 } from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const { signIn } = useAuthStore();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const role = await signIn(values.email, values.password);
      toast.success("Login successful!");
      
      if (role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/resident');
      }
    } catch (err: unknown) {
      if(err instanceof Error) {
        toast.error(err.message === 'Invalid login credentials' ? 'Incorrect email or password' : err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Or{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
              register as a new resident
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                           <Input type={showPwd ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...field} />
                        </FormControl>
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                    <Label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 font-normal">Remember me</Label>
                  </div>

                  <div className="text-sm">
                    <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">Forgot your password?</a>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 shadow-md text-base py-6" disabled={form.formState.isSubmitting}>
                  <KeyRound className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
