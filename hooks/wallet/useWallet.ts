import { useState, useCallback, useEffect } from 'react';
import { orpc } from '@/hooks/orpc';
import { useAuth } from '@/hooks/AuthContext';

export interface TransactionUser {
  id: string | null;
  name: string | null;
  image: string | null;
  profilePhoto?: string | null; // *** NEW: Profile photo field from backend
}

export interface Transaction {
  id: string;
  txRef?: string; // *** NEW: Transaction reference for verification
  amount: string;
  type: 'topup' | 'withdrawal' | 'payment' | 'commission' | 'refund' | 'agent_fee';
  status: string;
  description: string | null;
  createdAt: Date;
  fromUser: TransactionUser;
  toUser: TransactionUser;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: string;
  totalTopup: string;
  totalWithdrawn: string;
  isActive: boolean;
}

export function useWallet() {
  const { session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!session?.user) return;

    try {
      const res = await orpc.wallet.get({});
      setWallet(res.wallet);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const fetchTransactions = useCallback(async () => {
    if (!session?.user) return;

    try {
      const res = await orpc.wallet.getTransactions({ limit: 20 });
      setTransactions(res.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [session]);

  const createWallet = useCallback(async () => {
    if (!session?.user) return;

    setIsCreating(true);
    try {
      await orpc.wallet.create({});
      await fetchWallet();
    } catch (error) {
      console.error('Failed to create wallet:', error);
    } finally {
      setIsCreating(false);
    }
  }, [session, fetchWallet]);

  const handleDeposit = useCallback(async (amount: string): Promise<{ checkoutUrl: string; txRef: string } | null> => {
    if (!session?.user) return null;

    // Validate required fields
    const firstName = session.user.name?.split(' ')[0] || 'User';
    const lastName = session.user.name?.split(' ').slice(1).join(' ') || 'Customer';

    console.log('[Wallet] Preparing payment with:', {
      amount,
      firstName,
      lastName,
    });

    setIsDepositing(true);
    try {
      console.log('[Wallet] Calling payment.initialize...');
      const res = await orpc.payment.initialize({
        amount,
        currency: 'ETB',
        first_name: firstName,
        last_name: lastName,
      });

      console.log('[Wallet] Payment initialized:', res);
      
      if (res.checkout_url && res.tx_ref) {
        return {
          checkoutUrl: res.checkout_url,
          txRef: res.tx_ref,
        };
      }
      
      return null;
    } catch (error) {
      console.error('[Wallet] Deposit error:', error);
      return null;
    } finally {
      setIsDepositing(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchWallet();
      fetchTransactions();
    }
  }, [session, fetchWallet, fetchTransactions]);

  return {
    wallet,
    transactions,
    isLoading,
    isCreating,
    isDepositing,
    createWallet,
    handleDeposit,
    refetch: () => {
      fetchWallet();
      fetchTransactions();
    },
  };
}
