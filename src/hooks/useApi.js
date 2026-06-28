import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

// ---- Generic helpers -------------------------------------------------------
export const useList = (key, path, params, options = {}) =>
  useQuery({ queryKey: [key, params], queryFn: () => api.get(path, params), ...options });

export function useApiMutation(fn, { invalidate = [], successMsg } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      if (successMsg) toast.success(successMsg);
    },
    onError: (e) => toast.error(e.message || 'Something went wrong'),
  });
}

// ---- Domain hooks ----------------------------------------------------------
export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/analytics/dashboard'), refetchInterval: 60_000 });

export const useProducts = (params) => useList('products', '/products', params);
export const useInvoices = (params) => useList('invoices', '/invoices', params);
export const useCustomers = (params) => useList('customers', '/customers', params);
export const useNotifications = (params) =>
  useQuery({ queryKey: ['notifications', params], queryFn: () => api.get('/notifications', params) });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories') });
export const useBrands = () => useQuery({ queryKey: ['brands'], queryFn: () => api.get('/brands') });
