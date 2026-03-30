import { useEffect, useState } from 'react';
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
import { Toaster } from "sonner";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Lucky Luxury PG - Premium PG Management System" />
        <title>Lucky Luxury PG</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

export default function App() {
  const { initialize, initialized } = useAuthStore();
  const navigate = useNavigate();
  // Create a stable QueryClient instance for the lifecycle of the App
  const [qc] = useState(() => getQueryClient());

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If signed out, redirect to login
      if (event === 'SIGNED_OUT') {
        // Clear user state
        useAuthStore.getState().setUser(null);
        // Clear query cache on logout to prevent data leak
        qc.clear();
        
        // Don't redirect if already on login/register/root
        const publicPaths = ['/login', '/register', '/'];
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
