// @ts-nocheck
import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Supabase may return a generic error for rate limiting
        if (error.message.toLowerCase().includes('rate')) {
          toast.error('Too many requests. Please wait a moment before trying again.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      setSentEmail(values.email);
      setEmailSent(true);
      toast.success('Password reset link sent!');
    } catch (err: unknown) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <img alt="Lucky Luxury Logo" className="h-14 sm:h-16 md:h-20 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
            <span className="font-extrabold text-[#072b7e] text-xl sm:text-2xl tracking-tight block mt-0.5 text-center">Lucky Luxury PG Services</span>
          </div>

          {!emailSent ? (
            <>
              <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                Forgot your password?
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600 max-w-sm">
                No worries! Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                Check your email
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600 max-w-sm">
                We've sent a password reset link to{' '}
                <span className="font-semibold text-slate-900">{sentEmail}</span>.
                Please check your inbox and click on the link to reset your password.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
            {!emailSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md text-base py-6"
                    disabled={form.formState.isSubmitting}
                    loading={form.formState.isSubmitting}
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send Reset Link
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Didn't receive the email?</strong> Check your spam folder, or make sure the email address you entered is correct.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-base py-6"
                  onClick={() => {
                    setEmailSent(false);
                    form.reset();
                  }}
                >
                  Try a different email
                </Button>
              </div>
            )}

            <div className="mt-6">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
