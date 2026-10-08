import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Package, Truck, CreditCard } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';
import { useAuth } from '@/hooks/AuthContext';
import { useNotificationContext } from '@/hooks/NotificationContext';
import { orpc } from '@/hooks/orpc';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const { decrementUnreadCount, refreshUnreadCount } = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await orpc.notifications.getUserNotifications({});
      setNotifications(result.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Find the notification to check if it's already read
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.read) {
      return; // Already read, don't decrement
    }

    try {
      await orpc.notifications.markAsRead({
        notificationId,
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Decrement the badge count
      decrementUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await refreshUnreadCount(); // Refresh the badge count too
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return <Package size={20} color={colors.success} />;
      case 'payment':
        return <CreditCard size={20} color={colors.primary} />;
      case 'pickup':
        return <Truck size={20} color={colors.warning} />;
      default:
        return <Bell size={20} color={colors.info} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                { borderBottomColor: colors.borderLight },
                !notification.read && { backgroundColor: colors.primaryOpacity10 }
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={[styles.notificationIcon, { backgroundColor: colors.backgroundSecondary }]}>
                {getNotificationIcon(notification.type)}
              </View>
              
              <View style={styles.notificationContent}>
                <Text style={[
                  styles.notificationTitle,
                  { color: colors.text },
                  !notification.read && { fontWeight: fontWeight.semibold }
                ]}>
                  {notification.title}
                </Text>
                <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
                  {formatTime(notification.createdAt)}
                </Text>
              </View>
              
              {!notification.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
  },
  emptyMessage: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  unreadNotification: {
    // Removed - now applied inline
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  unreadTitle: {
    // Removed - now applied inline
  },
  notificationMessage: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: fontSize.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});