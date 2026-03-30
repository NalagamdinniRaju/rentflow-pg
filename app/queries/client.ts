import { QueryClient } from '@tanstack/react-query';

let client: QueryClient | null = null;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: {
        queries: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
      },
    });
  }
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
      },
    });
  }
  return client;
}

export const queryClient = getQueryClient();
