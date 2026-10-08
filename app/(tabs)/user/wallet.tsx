import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Gift } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { Button } from '@/components/ui';
import { useWallet } from '@/hooks/wallet/useWallet';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { TransactionList } from '@/components/wallet/TransactionList';
import { TopUpBottomSheet } from '@/components/wallet/TopUpBottomSheet';
import { PaymentWebView } from '@/components/wallet/PaymentWebView';
import { WalletBalanceSkeleton, TransactionListSkeleton } from '@/components/wallet/WalletSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/AuthContext';
import { orpc } from '@/hooks/orpc';

// Referral Earnings Skeleton
function ReferralEarningsSkeleton() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.referralCard, { backgroundColor: colors.card }]}>
      <View style={styles.referralLeft}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ gap: 8 }}>
          <Skeleton width={120} height={16} />
          <Skeleton width={100} height={14} />
        </View>
      </View>
      <Skeleton width={80} height={14} />
    </View>
  );
}

// Referral Earnings Component
function ReferralEarnings() {
  const router = useRouter();
  const { colors } = useTheme();
  const [stats, setStats] = useState({ totalEarned: '0.00', availableRewards: '0.00' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReferralStats();
  }, []);

  const loadReferralStats = async () => {
    try {
      const result = await orpc.referral.getStats();
      if (result.success) {
        setStats({
          totalEarned: result.totalEarned,
          availableRewards: result.availableRewards,
        });
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <ReferralEarningsSkeleton />;
  }

  if (parseFloat(stats.totalEarned) === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.referralCard, { backgroundColor: colors.card }]}
      onPress={() => router.push('/(tabs)/shared/referral')}
    >
      <View style={styles.referralLeft}>
        <View style={[styles.referralIcon, { backgroundColor: colors.primaryOpacity10 }]}>
          <Gift size={24} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.referralTitle, { color: colors.text }]}>Referral Earnings</Text>
          <Text style={[styles.referralAmount, { color: colors.success }]}>
            {stats.totalEarned} ETB earned
          </Text>
        </View>
      </View>
      <Text style={[styles.referralLink, { color: colors.primary }]}>View Details →</Text>
    </TouchableOpacity>
  );
}

export default function Wallet() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  const { wallet, transactions, isLoading, isCreating, createWallet, handleDeposit, refetch } = useWallet();

  const [showTopUpSheet, setShowTopUpSheet] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [txRef, setTxRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // *** NEW: Pull-to-refresh state
  const hasOpenedTopUp = useRef(false);
  
  // *** NEW: Auto-verification state
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [pendingTxRefs, setPendingTxRefs] = useState<string[]>([]);
  const hasAutoVerified = useRef(false);

  // Auto-open top-up sheet if openTopUp param is present (only once)
  useEffect(() => {
    if (params.openTopUp === 'true' && wallet && !hasOpenedTopUp.current) {
      hasOpenedTopUp.current = true;
      setShowTopUpSheet(true);
      // Clear the parameter immediately
      router.replace('/(tabs)/user/wallet');
    }
  }, [params.openTopUp, wallet]);

  // *** NEW: Auto-verify pending transactions when wallet loads
  useEffect(() => {
    if (!transactions || transactions.length === 0 || hasAutoVerified.current) return;

    // Find pending transactions
    const pending = transactions
      .filter(tx => tx.status.toLowerCase() === 'pending' && tx.type === 'topup')
      .map(tx => tx.txRef)
      .filter(Boolean);

    if (pending.length > 0) {
      console.log('[Wallet] Found pending transactions:', pending);
      setPendingTxRefs(pending);
      hasAutoVerified.current = true;
      
      // Auto-verify all pending transactions
      autoVerifyPendingTransactions(pending);
    }
  }, [transactions]);

  // *** NEW: Auto-verify pending transactions in background
  const autoVerifyPendingTransactions = async (txRefs: string[]) => {
    if (txRefs.length === 0) return;

    setIsAutoVerifying(true);
    console.log('[Wallet] Auto-verifying pending transactions:', txRefs);

    try {
      // Verify all pending transactions
      await Promise.all(
        txRefs.map(async (txRef) => {
          try {
            console.log('[Wallet] Verifying:', txRef);
            const result = await orpc.payment.verify({ tx_ref: txRef });
            console.log('[Wallet] Verification result for', txRef, ':', result);
          } catch (error) {
            console.error('[Wallet] Verification error for', txRef, ':', error);
          }
        })
      );

      // Refresh wallet and transactions after verification
      console.log('[Wallet] All verifications complete, refreshing...');
      await refetch();
      
      // Clear pending refs after successful verification
      setPendingTxRefs([]);
    } catch (error) {
      console.error('[Wallet] Auto-verification error:', error);
    } finally {
      setIsAutoVerifying(false);
    }
  };

  // Reset the flag when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        hasOpenedTopUp.current = false;
        hasAutoVerified.current = false; // *** NEW: Reset auto-verify flag
      };
    }, [])
  );

  const handleOpenTopUp = () => {
    setShowTopUpSheet(true);
  };

  const handleTopUpSubmit = async (amount: string) => {
    setIsProcessing(true);
    const result = await handleDeposit(amount);
    setIsProcessing(false);
    
    if (result) {
      setCheckoutUrl(result.checkoutUrl);
      setTxRef(result.txRef);
      setShowTopUpSheet(false);
      setShowPaymentWebView(true);
    }
  };

  const handleVerifyPayment = async (txRef: string) => {
    try {
      console.log('[Wallet] Verifying payment:', txRef);
      const result = await orpc.payment.verify({ tx_ref: txRef });
      console.log('[Wallet] Verification result:', result);
    } catch (error) {
      console.error('[Wallet] Verification error:', error);
    } finally {
      // Always refresh wallet and transactions after verification (success or cancelled)
      console.log('[Wallet] Refreshing wallet and transactions...');
      refetch();
    }
  };

  const handleClosePaymentWebView = () => {
    setShowPaymentWebView(false);
    // Refresh transactions when WebView closes
    console.log('[Wallet] Payment WebView closed, refreshing data...');
    refetch();
  };

  const handleCloseTopUp = () => {
    setShowTopUpSheet(false);
  };

  // *** NEW: Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    console.log('[Wallet] Pull-to-refresh triggered');
    await refetch();
    setRefreshing(false);
    console.log('[Wallet] Refresh complete');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/user/home')}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Wallet</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <WalletBalanceSkeleton />
          <TransactionListSkeleton count={5} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!wallet) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/user/home')}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Wallet</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Create Your Wallet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start managing your payments by creating a wallet
          </Text>
          <Button
            title={isCreating ? 'Creating...' : 'Create Wallet'}
            onPress={createWallet}
            disabled={isCreating}
            style={styles.createButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/user/home')}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Wallet</Text>
      </View>

      {/* *** NEW: Auto-verification banner */}
      {isAutoVerifying && pendingTxRefs.length > 0 && (
        <View style={[styles.verifyingBanner, { backgroundColor: colors.warning + '20', borderBottomColor: colors.warning }]}>
          <View style={styles.verifyingContent}>
            <View style={styles.verifyingLeft}>
              <ActivityIndicator size="small" color={colors.warning} />
              <View>
                <Text style={[styles.verifyingTitle, { color: colors.text }]}>
                  Verifying Payment...
                </Text>
                <Text style={[styles.verifyingSubtext, { color: colors.textMuted }]}>
                  {pendingTxRefs.length} pending {pendingTxRefs.length === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
            </View>
            <Text style={[styles.verifyingNote, { color: colors.textMuted }]}>
              You can take screenshots
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <WalletBalance
          balance={wallet.balance}
          totalTopup={wallet.totalTopup}
          showTopup
          onTopup={handleOpenTopUp}
        />

        {/* Referral Earnings Section */}
        <ReferralEarnings />

        <TransactionList
          transactions={transactions}
          currentUserId={session?.user?.id || ''}
          onTransactionUpdate={refetch}
        />
      </ScrollView>

      <TopUpBottomSheet
        visible={showTopUpSheet}
        onClose={handleCloseTopUp}
        onTopup={handleTopUpSubmit}
        isLoading={isProcessing}
      />

      <PaymentWebView
        visible={showPaymentWebView}
        checkoutUrl={checkoutUrl}
        txRef={txRef}
        onClose={handleClosePaymentWebView}
        onVerify={handleVerifyPayment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  createButton: {
    minWidth: 200,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  referralLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  referralIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  referralAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  referralLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  // *** NEW: Verification banner styles
  verifyingBanner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  verifyingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifyingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  verifyingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  verifyingSubtext: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  verifyingNote: {
    fontSize: fontSize.xs,
    fontStyle: 'italic',
  },
});
