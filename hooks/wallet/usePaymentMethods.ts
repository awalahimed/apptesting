import { useState, useCallback, useEffect } from 'react';
import { orpc } from '@/hooks/orpc';
import { useAuth } from '@/hooks/AuthContext';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'bank_account' | 'mobile_money';
  provider: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  createdAt: Date;
}

export function usePaymentMethods() {
  const { session } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchMethods = useCallback(async () => {
    if (!session?.user) return;

    try {
      const res = await orpc.paymentMethod.list({});
      setMethods(res.methods);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const addMethod = useCallback(async (data: {
    type: 'bank_account' | 'mobile_money';
    provider: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
  }) => {
    if (!session?.user) return;

    setIsAdding(true);
    try {
      await orpc.paymentMethod.create(data);
      await fetchMethods();
      return { success: true };
    } catch (error) {
      console.error('Failed to add payment method:', error);
      return { success: false, error };
    } finally {
      setIsAdding(false);
    }
  }, [session, fetchMethods]);

  const setDefault = useCallback(async (methodId: string) => {
    if (!session?.user) return;

    try {
      await orpc.paymentMethod.setDefault({ methodId });
      await fetchMethods();
    } catch (error) {
      console.error('Failed to set default method:', error);
    }
  }, [session, fetchMethods]);

  const deleteMethod = useCallback(async (methodId: string) => {
    if (!session?.user) return;

    try {
      await orpc.paymentMethod.delete({ methodId });
      await fetchMethods();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
    }
  }, [session, fetchMethods]);

  useEffect(() => {
    if (session?.user) {
      fetchMethods();
    }
  }, [session, fetchMethods]);

  const defaultMethod = methods.find(m => m.isDefault);

  return {
    methods,
    defaultMethod,
    isLoading,
    isAdding,
    addMethod,
    setDefault,
    deleteMethod,
    refetch: fetchMethods,
  };
}
