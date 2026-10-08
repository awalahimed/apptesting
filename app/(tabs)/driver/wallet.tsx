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
import { ArrowLeft } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useWallet } from '@/hooks/wallet/useWallet';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { TransactionList } from '@/components/wallet/TransactionList';
import { WalletBalanceSkeleton, TransactionListSkeleton } from '@/components/wallet/WalletSkeleton';
import { WithdrawBottomSheet } from '@/components/wallet/WithdrawBottomSheet';
import { useAuth } from '@/hooks/AuthContext';
import { orpc } from '@/hooks/orpc';

export default function DriverWallet() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const { wallet, transactions, isLoading, isCreating, createWallet, refetch } = useWallet();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // *** NEW: Auto-verification state
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [pendingTxRefs, setPendingTxRefs] = useState<string[]>([]);
  const hasAutoVerified = useRef(false);

  // *** NEW: Auto-verify pending transactions when wallet loads
  useEffect(() => {
    if (!transactions || transactions.length === 0 || hasAutoVerified.current) return;

    // Find pending transactions
    const pending = transactions
      .filter(tx => tx.status.toLowerCase() === 'pending' && tx.type === 'topup')
      .map(tx => tx.txRef)
      .filter(Boolean);

    if (pending.length > 0) {
      console.log('[Driver Wallet] Found pending transactions:', pending);
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
    console.log('[Driver Wallet] Auto-verifying pending transactions:', txRefs);

    try {
      // Verify all pending transactions
      await Promise.all(
        txRefs.map(async (txRef) => {
          try {
            console.log('[Driver Wallet] Verifying:', txRef);
            const result = await orpc.payment.verify({ tx_ref: txRef });
            console.log('[Driver Wallet] Verification result for', txRef, ':', result);
          } catch (error) {
            console.error('[Driver Wallet] Verification error for', txRef, ':', error);
          }
        })
      );

      // Refresh wallet and transactions after verification
      console.log('[Driver Wallet] All verifications complete, refreshing...');
      await refetch();
      
      // Clear pending refs after successful verification
      setPendingTxRefs([]);
    } catch (error) {
      console.error('[Driver Wallet] Auto-verification error:', error);
    } finally {
      setIsAutoVerifying(false);
    }
  };

  // Reset the flag when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        hasAutoVerified.current = false;
      };
    }, [])
  );

  const handleBack = () => {
    // Direct redirect to driver home instead of using back function
    router.replace('/(tabs)/driver/home');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('[Driver Wallet] Pull-to-refresh triggered');
    await refetch();
    setRefreshing(false);
    console.log('[Driver Wallet] Refresh complete');
  };

  const Header = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Wallet</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header />
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
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You don't have a wallet yet</Text>
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary }]} 
            onPress={createWallet}
            disabled={isCreating}
          >
            <Text style={[styles.createButtonText, { color: colors.white }]}>
              {isCreating ? 'Creating...' : 'Create Wallet'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Header />
      
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
        contentContainerStyle={styles.scrollContent}
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
          totalWithdrawn={wallet.totalWithdrawn}
          showWithdraw
          onWithdraw={() => setShowWithdraw(true)}
        />
        <TransactionList
          transactions={transactions}
          currentUserId={session?.user?.id || ''}
          onTransactionUpdate={refetch}
        />
      </ScrollView>
      
      <WithdrawBottomSheet
        visible={showWithdraw}
        availableBalance={parseFloat(wallet.balance)}
        onClose={() => setShowWithdraw(false)}
        onWithdraw={(amount, methodId) => {
          console.log('Withdraw:', amount, methodId);
          setShowWithdraw(false);
        }}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  createButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
