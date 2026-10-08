import React, { useState, useEffect } from 'react';
import { useAlert } from '@/components/shared/CustomAlert';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, Share2, Gift, TrendingUp, Users, DollarSign, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { orpc } from '@/hooks/orpc';
import { useAuth } from '@/hooks/AuthContext';

// Skeleton Loaders
function ReferralCodeSkeleton({ colors }: any) {
  return (
    <View style={[styles.codeCard, { backgroundColor: colors.primary }]}>
      <View style={styles.codeHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={150} height={20} />
      </View>
      
      <View style={styles.codeDisplay}>
        <Skeleton width={180} height={32} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      
      <View style={styles.buttonRow}>
        <View style={[styles.actionButton, styles.copyButton]}>
          <Skeleton width={100} height={20} />
        </View>
        <View style={[styles.actionButton, styles.shareButton]}>
          <Skeleton width={100} height={20} />
        </View>
      </View>
      
      <View style={styles.rewardBanner}>
        <Skeleton width="100%" height={16} />
      </View>
    </View>
  );
}

function StatsSkeleton({ colors }: any) {
  return (
    <View style={styles.statsContainer}>
      <Skeleton width={100} height={24} style={{ marginBottom: spacing.lg }} />
      
      <View style={styles.statsGrid}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

function HowItWorksSkeleton({ colors }: any) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Skeleton width={120} height={24} style={{ marginBottom: spacing.lg }} />
      
      <View style={styles.stepsContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.stepItem}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <View style={styles.stepContent}>
              <Skeleton width={120} height={18} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="100%" height={14} />
            </View>
          </View>
        ))}
      </View>
      
      <View style={[styles.expiryInfo, { backgroundColor: colors.backgroundSecondary, marginTop: spacing.lg }]}>
        <Skeleton width={140} height={18} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: spacing.xs }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: spacing.xs }} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}

function HistorySkeleton({ colors }: any) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Skeleton width={150} height={24} style={{ marginBottom: spacing.lg }} />
      
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
          <View style={styles.historyLeft}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1 }}>
              <Skeleton width={100} height={16} style={{ marginBottom: spacing.xs }} />
              <Skeleton width={80} height={14} />
            </View>
          </View>
          
          <View style={styles.historyRight}>
            <Skeleton width={80} height={16} style={{ marginBottom: spacing.xs }} />
            <Skeleton width={70} height={20} borderRadius={borderRadius.sm} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function Referral() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showCode, setShowCode] = useState(false); // *** Toggle for showing/hiding code
  const [programConfig, setProgramConfig] = useState({
    referrerReward: '50.00',
    refereeReward: '25.00',
    minOrderAmount: '100.00',
    expiryDays: 30,
  });
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarned: '0.00',
    availableRewards: '0.00',
  });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      
      // Get program config
      const configResult = await orpc.referral.getProgramStatus();
      if (configResult.success) {
        setProgramConfig({
          referrerReward: configResult.referrerReward || '50.00',
          refereeReward: configResult.refereeReward || '25.00',
          minOrderAmount: configResult.minOrderAmount || '100.00',
          expiryDays: configResult.expiryDays || 30,
        });
      }
      
      // Get referral code
      const codeResult = await orpc.referral.getMyReferralCode();
      if (codeResult.success) {
        setReferralCode(codeResult.code);
        setShareUrl(codeResult.shareUrl);
      }
      
      // Get stats
      const statsResult = await orpc.referral.getStats();
      if (statsResult.success) {
        setStats({
          totalReferrals: statsResult.totalReferrals,
          completedReferrals: statsResult.completedReferrals,
          pendingReferrals: statsResult.pendingReferrals,
          totalEarned: statsResult.totalEarned,
          availableRewards: statsResult.availableRewards,
        });
      }
      
      // Get history
      const historyResult = await orpc.referral.getHistory();
      if (historyResult.success) {
        setHistory(historyResult.referrals);
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
      Alert.alert('Error', 'Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleShare = async () => {
    try {
      const message = `🎁 Join MyTrack and get ${programConfig.refereeReward} ETB bonus!\n\nUse my referral code: ${referralCode}\n\n${shareUrl}`;
      
      await Share.share({
        message,
        title: 'Join MyTrack',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  // *** Mask referral code with asterisks
  const getMaskedCode = () => {
    if (showCode) return referralCode;
    return '******';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'expired':
        return colors.textMuted;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Referral Program</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ReferralCodeSkeleton colors={colors} />
          <StatsSkeleton colors={colors} />
          <HowItWorksSkeleton colors={colors} />
          <HistorySkeleton colors={colors} />
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Referral Program</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* *** Referral Code Card - Redesigned */}
        <View style={[styles.codeCard, { backgroundColor: colors.primary }]}>
          <View style={styles.codeHeader}>
            <Gift size={24} color="#FFFFFF" />
            <Text style={styles.codeHeaderText}>Your Referral Code</Text>
          </View>
          
          <View style={styles.codeDisplay}>
            <Text style={styles.code}>{getMaskedCode()}</Text>
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCode(!showCode)}
            >
              {showCode ? (
                <EyeOff size={24} color="#FFFFFF" />
              ) : (
                <Eye size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={handleCopyCode}
            >
              <Copy size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Copy Code</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Share Link</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.rewardBanner}>
            <Text style={styles.rewardText}>
              🎉 Earn {programConfig.referrerReward} ETB for each friend who completes their first order!
            </Text>
          </View>
        </View>

        {/* *** Stats Grid - Improved Layout */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primaryOpacity10 }]}>
                <Users size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalReferrals}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <TrendingUp size={20} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.completedReferrals}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <DollarSign size={20} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalEarned}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ETB Earned</Text>
            </View>
          </View>
        </View>

        {/* *** How it Works - Compact Design */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How it Works</Text>
          
          <View style={styles.stepsContainer}>
            <StepItem
              number="1"
              title="Share your code"
              description="Send to friends via WhatsApp, SMS, or any app"
              colors={colors}
            />
            <StepItem
              number="2"
              title="Friend signs up"
              description={`They use your code within ${programConfig.expiryDays} days`}
              colors={colors}
            />
            <StepItem
              number="3"
              title="Earn rewards"
              description={`Get ${programConfig.referrerReward} ETB when they order ≥${programConfig.minOrderAmount} ETB`}
              colors={colors}
            />
          </View>
          
          {/* Expiry Explanation */}
          <View style={[styles.expiryInfo, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.expiryInfoTitle, { color: colors.text }]}>⏰ Expiry Rules</Text>
            <Text style={[styles.expiryInfoText, { color: colors.textSecondary }]}>
              • Friend must complete their first order within {programConfig.expiryDays} days of signing up{'\n'}
              • Order must be ≥{programConfig.minOrderAmount} ETB to qualify{'\n'}
              • After {programConfig.expiryDays} days, the referral expires and no reward is given
            </Text>
          </View>
        </View>

        {/* *** Referral History - Better Layout */}
        {history.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Referrals</Text>
            
            {history.slice(0, 5).map((item) => {
              const isExpired = item.status === 'expired';
              const isPending = item.status === 'pending';
              const expiryDate = item.expiresAt ? new Date(item.expiresAt) : null;
              const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <View key={item.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.historyLeft}>
                    <View style={[styles.historyAvatar, { backgroundColor: colors.primaryOpacity10 }]}>
                      <Text style={[styles.historyAvatarText, { color: colors.primary }]}>
                        {(item.refereeName || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyName, { color: colors.text }]}>
                        {item.refereeName || 'User'}
                      </Text>
                      <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                      {/* Show expiry info for pending referrals */}
                      {isPending && expiryDate && daysLeft > 0 && (
                        <Text style={[styles.expiryText, { color: colors.warning }]}>
                          Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </Text>
                      )}
                      {isPending && daysLeft <= 0 && (
                        <Text style={[styles.expiryText, { color: colors.error }]}>
                          Expired
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyAmount, { color: colors.success }]}>
                      +{item.referrerReward} ETB
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(item.status) + '20' }
                    ]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            
            {history.length > 5 && (
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View all {history.length} referrals
              </Text>
            )}
          </View>
        )}

        {/* Empty State */}
        {history.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Users size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No referrals yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start sharing your code to earn rewards!
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// *** Step Item Component
function StepItem({ number, title, description, colors }: any) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, { backgroundColor: colors.primaryOpacity10 }]}>
        <Text style={[styles.stepNumberText, { color: colors.primary }]}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
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
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
  },
  
  // *** Redesigned Code Card
  codeCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  codeHeaderText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  code: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    letterSpacing: 6,
    color: '#FFFFFF',
  },
  eyeButton: {
    padding: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  copyButton: {
    backgroundColor: '#FFFFFF',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  rewardBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  rewardText: {
    fontSize: fontSize.sm,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  
  // *** Stats Container
  statsContainer: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  
  // *** Section
  section: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
  },
  
  // *** Steps
  stepsContainer: {
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs / 2,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  
  // *** History
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  historyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  historyName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  historyDate: {
    fontSize: fontSize.sm,
  },
  expiryText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs / 2,
    fontWeight: fontWeight.medium,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  historyAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  
  // *** Expiry Info
  expiryInfo: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  expiryInfoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  expiryInfoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  
  // *** Empty State
  emptyState: {
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});
