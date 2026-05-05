// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Lock, CheckCircle2, ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '~/lib/supabase';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type PageState = 'loading' | 'ready' | 'success' | 'error';

export default function ResetPasswordPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    let cancelled = false;

    // Listen for the PASSWORD_RECOVERY event (fallback for ConfirmationURL-style links)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        if (event === 'PASSWORD_RECOVERY' && !cancelled) {
          setPageState('ready');
        }
      }
    );

    const verifyRecovery = async () => {
      // Primary: Check for token_hash & type in query params (custom email template link)
      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type');

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });

        if (!cancelled) {
          if (error) {
            setPageState('error');
            setErrorMessage(
              error.message.toLowerCase().includes('expired')
                ? 'This password reset link has expired. Please request a new one.'
                : 'This password reset link is invalid. Please request a new one.'
            );
          } else {
            setPageState('ready');
          }
        }
        return;
      }

      // Fallback: Check for hash fragment (#access_token=...&type=recovery)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('type') === 'recovery' && hashParams.get('access_token')) {
        if (!cancelled) setPageState('ready');
        return;
      }

      // Fallback: Check for an existing recovery session
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !cancelled) {
        setPageState('ready');
        return;
      }

      // No valid token found — wait for auth event, then show error
      setTimeout(() => {
        if (!cancelled) {
          setPageState((current) =>
            current === 'loading'
              ? (setErrorMessage('This password reset link is invalid or has expired. Please request a new one.'), 'error')
              : current
          );
        }
      }, 3000);
    };

    verifyRecovery();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('same')) {
          toast.error('New password must be different from your current password.');
        } else if (error.message.toLowerCase().includes('weak')) {
          toast.error('Please choose a stronger password.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      setPageState('success');
      toast.success('Password updated successfully!');

      // Sign out to clear the recovery session, then redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err: unknown) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  // Password strength indicator
  const password = form.watch('password');
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
    if (score <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' };
    return { label: 'Very Strong', color: 'bg-emerald-500', width: '100%' };
  };
  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <img alt="Lucky Luxury Logo" className="h-14 sm:h-16 md:h-20 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
            <span className="font-extrabold text-[#072b7e] text-xl sm:text-2xl tracking-tight block mt-0.5 text-center">Lucky Luxury PG Services</span>
          </div>

          {pageState === 'loading' && (
            <>
              <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                Verifying your link...
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600">
                Please wait while we verify your password reset link.
              </p>
            </>
          )}

          {pageState === 'ready' && (
            <>
              <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                Set new password
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600 max-w-sm">
                Your identity has been verified. Please enter your new password below.
              </p>
            </>
          )}

          {pageState === 'success' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                Password updated!
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
            </>
          )}

          {pageState === 'error' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                Link expired
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600 max-w-sm">
                {errorMessage}
              </p>
            </>
          )}
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
            {pageState === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm animate-pulse font-medium">Verifying reset link...</p>
              </div>
            )}

            {pageState === 'ready' && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPwd ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-10"
                              autoFocus
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* Password strength meter */}
                        {password && (
                          <div className="mt-2 space-y-1">
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                                style={{ width: strength.width }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              Password strength: <span className="font-medium">{strength.label}</span>
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showConfirmPwd ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-10"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-500">
                        Choose a strong password with at least 6 characters. We recommend using a mix of letters, numbers, and special characters.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md text-base py-6"
                    disabled={form.formState.isSubmitting}
                    loading={form.formState.isSubmitting}
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Update Password
                  </Button>
                </form>
              </Form>
            )}

            {pageState === 'success' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-full bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-800 font-medium">
                    You'll be redirected to the login page shortly.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Go to sign in now
                </Link>
              </div>
            )}

            {pageState === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm text-red-800">
                    Password reset links expire after a short time for security reasons. Please request a new link to continue.
                  </p>
                </div>
                <Link to="/forgot-password">
                  <Button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md text-base py-6"
                  >
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            )}

            {pageState !== 'success' && (
              <div className="mt-6">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
