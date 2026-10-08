import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowUp, ArrowDown, Wallet, Plus, ArrowUpFromLine, User, Building2 } from 'lucide-react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { Transaction } from '@/hooks/wallet/useWallet';
import { formatCurrency } from '@/utils/formatters';
import { orpc } from '@/hooks/orpc';
import { config } from '@/config/config';

interface TransactionListProps {
  transactions: Transaction[];
  currentUserId: string;
  onSeeAll?: () => void;
  onTransactionUpdate?: () => void; // *** NEW: Callback when transaction is verified
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
}

function formatTransactionDate(date: Date): string {
  const now = new Date();
  const transactionDate = new Date(date);
  const diffInMs = now.getTime() - transactionDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInHours < 24) {
    const hours = transactionDate.getHours();
    const minutes = transactionDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    return `Today at ${formattedHours}:${minutes} ${ampm}`;
  } else if (diffInHours < 48) {
    const hours = transactionDate.getHours();
    const minutes = transactionDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    return `Yesterday ${formattedHours}:${minutes} ${ampm}`;
  } else {
    const month = transactionDate.toLocaleString('default', { month: 'short' });
    const day = transactionDate.getDate();
    const hours = transactionDate.getHours();
    const minutes = transactionDate.getMinutes().toString().padStart(2, '0');
    return `${month} ${day} ${hours}:${minutes}`;
  }
}

function TransactionItem({ 
  transaction, 
  currentUserId,
  onTransactionUpdate 
}: { 
  transaction: Transaction; 
  currentUserId: string;
  onTransactionUpdate?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [isVerifying, setIsVerifying] = useState(false);
  const [localStatus, setLocalStatus] = useState(transaction.status);

  // *** Auto-verify pending topup AND payment transactions
  useEffect(() => {
    const isPending = transaction.status.toLowerCase() === 'pending';
    const isTopup = transaction.type === 'topup';
    const isPayment = transaction.type === 'payment';
    
    console.log('[TransactionItem] Transaction check:', {
      id: transaction.id,
      txRef: transaction.txRef,
      status: transaction.status,
      type: transaction.type,
      isPending,
      isTopup,
      isPayment,
      willVerify: isPending && (isTopup || isPayment) && transaction.txRef && !isVerifying
    });
    
    // Auto-verify pending topup transactions (Chapa payments) AND pending payment transactions
    if (isPending && (isTopup || isPayment) && transaction.txRef && !isVerifying) {
      console.log('[TransactionItem] 🔄 Starting auto-verification for:', transaction.type, transaction.txRef);
      verifyTransaction();
    }
  }, [transaction.status, transaction.type, transaction.txRef]);

  const verifyTransaction = async () => {
    if (!transaction.txRef || isVerifying) {
      console.log('[TransactionItem] ⚠️ Cannot verify:', { 
        hasTxRef: !!transaction.txRef, 
        isVerifying,
        txRef: transaction.txRef 
      });
      return;
    }

    setIsVerifying(true);
    console.log('[TransactionItem] 📤 Calling verify API for:', transaction.txRef);
    
    try {
      const result = await orpc.payment.verify({ tx_ref: transaction.txRef });
      console.log('[TransactionItem] ✅ Verification result:', result);
      
      // Update local status
      if (result.success && result.status) {
        console.log('[TransactionItem] 🔄 Updating local status to:', result.status);
        setLocalStatus(result.status);
      } else {
        console.log('[TransactionItem] ⚠️ Verification returned:', result);
      }
      
      // Notify parent to refresh
      if (onTransactionUpdate) {
        console.log('[TransactionItem] 🔄 Triggering wallet refresh...');
        setTimeout(() => {
          onTransactionUpdate();
        }, 1000); // Small delay to let backend update
      }
    } catch (error) {
      console.error('[TransactionItem] ❌ Verification error:', error);
    } finally {
      setIsVerifying(false);
      console.log('[TransactionItem] ✅ Verification complete');
    }
  };

  const isIncome = transaction.type === 'topup' || transaction.type === 'commission' ||
    (transaction.type === 'payment' && transaction.toUser?.id === currentUserId);

  const counterparty = transaction.type === 'topup' || transaction.type === 'withdrawal'
    ? null
    : transaction.fromUser?.id === currentUserId
    ? transaction.toUser
    : transaction.fromUser;

  // *** NEW: Shorten description - replace order IDs with ****
  const shortenDescription = (desc: string) => {
    // Replace order_xxxxx_xxxxx with order_****
    return desc.replace(/order_\d+_[a-z0-9]+/gi, 'order_****');
  };

  // Get display name and avatar based on transaction type
  let displayName = '';
  let avatarContent = null;

  if (transaction.type === 'topup') {
    displayName = 'Wallet Top-up';
    avatarContent = (
      <View style={[styles.avatarPlaceholder, { backgroundColor: '#D1F4E8' }]}>
        <Plus size={24} color={colors.success} strokeWidth={2.5} />
      </View>
    );
  } else if (transaction.type === 'withdrawal') {
    displayName = 'Withdrawal';
    avatarContent = (
      <View style={[styles.avatarPlaceholder, { backgroundColor: '#FFE5E5' }]}>
        <ArrowUpFromLine size={24} color={colors.error} />
      </View>
    );
  } else if (transaction.type === 'agent_fee') {
    // *** NEW: Platform fee with platform icon
    displayName = shortenDescription(transaction.description || 'Platform fee');
    avatarContent = (
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
        <Building2 size={24} color={colors.primary} />
      </View>
    );
  } else if (transaction.type === 'payment') {
    displayName = isIncome ? `Payment from ${counterparty?.name || 'User'}` : `Payment to ${counterparty?.name || 'User'}`;
    // *** Smart profile photo URL construction with extension detection
    const profilePhoto = counterparty?.profilePhoto;
    
    // Format profile photo URL with smart handling
    let imageUrl: string | null = null;
    if (profilePhoto) {
      // Check if path has a file extension
      const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(profilePhoto);
      
      if (profilePhoto.startsWith('/uploads/profile_photo/') && hasExtension) {
        // Already has full correct path with extension
        imageUrl = `${config.api.baseUrl}${profilePhoto}`;
      } else if (profilePhoto.startsWith('/uploads/') && !hasExtension) {
        // Has /uploads/ but missing profile_photo/ folder and extension
        // Extract just the UUID and try common extensions
        const uuid = profilePhoto.substring(9); // Remove '/uploads/'
        // Try .jpeg first (most common), will fallback to initials if fails
        imageUrl = `${config.api.baseUrl}/uploads/profile_photo/${uuid}.jpeg`;
      } else if (profilePhoto.startsWith('/uploads/') && hasExtension) {
        // Has /uploads/ and extension but might be missing profile_photo/
        const filename = profilePhoto.substring(9); // Remove '/uploads/'
        if (!filename.includes('/')) {
          // No folder, add profile_photo/
          imageUrl = `${config.api.baseUrl}/uploads/profile_photo/${filename}`;
        } else {
          // Has folder already
          imageUrl = `${config.api.baseUrl}${profilePhoto}`;
        }
      } else if (profilePhoto.startsWith('/')) {
        // Starts with / but not /uploads/
        imageUrl = `${config.api.baseUrl}${profilePhoto}`;
      } else {
        // No leading slash - check if it has a folder
        const hasFolder = profilePhoto.includes('/');
        imageUrl = hasFolder
          ? `${config.api.baseUrl}/uploads/${profilePhoto}`
          : `${config.api.baseUrl}/uploads/profile_photo/${profilePhoto}`;
      }
    }
    
    console.log('[TransactionList] Payment transaction:', {
      type: transaction.type,
      isIncome,
      counterpartyName: counterparty?.name,
      originalProfilePhoto: profilePhoto,
      constructedImageUrl: imageUrl,
    });
    
    if (imageUrl) {
      const initials = getInitials(counterparty?.name || null);
      avatarContent = (
        <View style={styles.avatar}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.avatar}
            onError={(e) => {
              console.log('[TransactionList] Image load failed for:', counterparty?.name, imageUrl);
            }}
          />
          {/* Fallback shown behind image - will be visible if image fails */}
          <View style={[styles.avatarPlaceholder, styles.avatarFallback, { backgroundColor: colors.text }]}>
            <Text style={[styles.avatarText, { color: colors.background }]}>{initials}</Text>
          </View>
        </View>
      );
    } else {
      const initials = getInitials(counterparty?.name || null);
      avatarContent = (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.text }]}>
          <Text style={[styles.avatarText, { color: colors.background }]}>{initials}</Text>
        </View>
      );
    }
  } else if (transaction.type === 'refund') {
    displayName = `Refund from ${counterparty?.name || 'User'}`;
    avatarContent = (
      <View style={[styles.avatarPlaceholder, { backgroundColor: '#D1F4E8' }]}>
        <Wallet size={24} color={colors.success} />
      </View>
    );
  } else if (transaction.type === 'commission') {
    displayName = 'Commission';
    avatarContent = (
      <View style={[styles.avatarPlaceholder, { backgroundColor: '#D1F4E8' }]}>
        <Wallet size={24} color={colors.success} />
      </View>
    );
  } else {
    displayName = shortenDescription(transaction.description || 'Transaction');
    avatarContent = (
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
        <User size={24} color={colors.textSecondary} />
      </View>
    );
  }

  // Status badge
  const getStatusBadge = () => {
    const status = localStatus.toLowerCase(); // *** CHANGED: Use localStatus instead of transaction.status
    let badgeColor = colors.textMuted;
    let badgeText = status;

    if (status === 'success' || status === 'completed') {
      badgeColor = colors.success;
      badgeText = 'Completed';
    } else if (status === 'pending') {
      badgeColor = colors.warning;
      badgeText = isVerifying ? 'Verifying...' : 'Pending'; // *** NEW: Show "Verifying..." when checking
    } else if (status === 'failed' || status === 'cancelled') {
      badgeColor = colors.error;
      badgeText = status === 'failed' ? 'Failed' : 'Cancelled';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: `${badgeColor}20` }]}>
        {isVerifying && status === 'pending' && (
          <ActivityIndicator size="small" color={badgeColor} style={{ marginRight: 4 }} />
        )}
        <Text style={[styles.statusText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.transactionItem, { backgroundColor: colors.background }]}>
      <View style={styles.transactionLeft}>
        <View style={styles.avatarContainer}>
          {avatarContent}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionName, { color: colors.text }]}>{displayName}</Text>
          <View style={styles.transactionMeta}>
            <Text style={[styles.transactionTime, { color: colors.textMuted }]}>
              {formatTransactionDate(transaction.createdAt)}
            </Text>
            {getStatusBadge()}
          </View>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: isIncome ? colors.success : colors.error }
        ]}>
          {isIncome ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
        </Text>
        {isIncome ? (
          <ArrowUp size={16} color={colors.success} strokeWidth={2.5} />
        ) : (
          <ArrowDown size={16} color={colors.error} strokeWidth={2.5} />
        )}
      </View>
    </View>
  );
}

export function TransactionList({ transactions, currentUserId, onSeeAll, onTransactionUpdate }: TransactionListProps) {
  const { colors, isDark } = useTheme();
  
  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Latest Transactions</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listContainer}>
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            currentUserId={currentUserId}
            onTransactionUpdate={onTransactionUpdate}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  transactionTime: {
    fontSize: fontSize.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
  },
});
