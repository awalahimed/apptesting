import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

type VerificationStatus = 'verified' | 'pending' | 'banned' | 'rejected' | 'unverified';

interface VerifiedBadgeProps {
  status: VerificationStatus;
  accountStatus?: string | null;
}

const BADGE_CONFIG = {
  verified: { icon: '✓', color: colors.primary, text: 'Verified' },
  pending: { icon: '⏳', color: colors.warning, text: 'Pending' },
  banned: { icon: '✕', color: colors.error, text: 'Banned' },
  rejected: { icon: '!', color: colors.error, text: 'Rejected' },
  unverified: { icon: '!', color: colors.error, text: 'Unverified' },
} as const;

export function VerifiedBadge({ status, accountStatus }: VerifiedBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.unverified;

  const toggleExpand = () => {
    setIsExpanded(true);
  };

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8} style={styles.container}>
      <View style={styles.badgeWrapper}>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        {isExpanded && (
          <View style={[styles.textBubble, { backgroundColor: config.color }]}>
            <Text style={styles.text}>{config.text}</Text>
            <View style={[styles.arrow, { borderTopColor: config.color }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -120,
    right: -5,
    zIndex: 10,
  },
  badgeWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  icon: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textBubble: {
    position: 'absolute',
    bottom: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  arrow: {
    position: 'absolute',
    top: '100%',
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
