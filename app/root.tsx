import { useEffect, useRef, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '~/queries/client';
import { useAuthStore } from '~/store/auth.store';
import { supabase } from '~/lib/supabase';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate
} from "react-router";
import type { Route } from "./+types/root";
import { Toaster, toast } from "sonner";
import "./app.css";

type InstallPromptChoice = {
  outcome: 'accepted' | 'dismissed';
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "apple-touch-icon", sizes: "192x192", href: "/icon-192.png" },
  { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
  { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Lucky Luxury PG - Premium PG Management System" />
        <meta name="theme-color" content="#072b7e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lucky PG" />
        <title>Lucky Luxury PG</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster position="top-right" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  );
}

export default function App() {
  const { initialize, initialized } = useAuthStore();
  const navigate = useNavigate();
  // Create a stable QueryClient instance for the lifecycle of the App
  const [qc] = useState(() => getQueryClient());
  const deferredInstallPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const installToastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const isInstalled = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const dismissInstallToast = () => {
      if (installToastIdRef.current !== null) {
        toast.dismiss(installToastIdRef.current);
        installToastIdRef.current = null;
      }
    };

    const showInstallToast = () => {
      if (!deferredInstallPromptRef.current || isInstalled() || installToastIdRef.current !== null) {
        return;
      }

      installToastIdRef.current = toast.message('Install Lucky PG', {
        description: 'Add the app to your device for a faster, full-screen experience.',
        duration: Infinity,
        action: {
          label: 'Install',
          onClick: async () => {
            const deferredPrompt = deferredInstallPromptRef.current;
            if (!deferredPrompt) {
              return;
            }

            deferredInstallPromptRef.current = null;
            dismissInstallToast();

            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome !== 'accepted') {
              deferredInstallPromptRef.current = deferredPrompt;
              showInstallToast();
            }
          },
        },
        cancel: {
          label: 'Later',
          onClick: () => {
            dismissInstallToast();
          },
        },
      });
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredInstallPromptRef.current = event as BeforeInstallPromptEvent;
      showInstallToast();
    };

    const handleAppInstalled = () => {
      deferredInstallPromptRef.current = null;
      dismissInstallToast();
      toast.success('Lucky PG installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      dismissInstallToast();
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // When user clicks the recovery link in their email, redirect to reset page
        navigate('/reset-password', { replace: true });
        return;
      }
      if (event === 'SIGNED_OUT') {
        qc.clear();
        const publicPaths = ['/login', '/register', '/', '/forgot-password', '/reset-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          navigate('/login', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, qc]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse font-medium">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={qc}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 - Page Not Found" : "Error";
    details = error.status === 404 ? "The page you're looking for doesn't exist." : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-lg w-full bg-white p-10 rounded-[32px] border border-slate-100 shadow-xl">
        <h1 className="text-5xl font-black text-slate-900 mb-6">{message}</h1>
        <p className="text-slate-500 mb-8 font-medium italic">"{details}"</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20"
        >
          Return to Safety
        </button>
      </div>
    </main>
  );
}
