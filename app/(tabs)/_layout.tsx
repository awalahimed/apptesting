import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';
import { Sidebar } from '@/components/user/Sidebar';

class TabsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('⚠️ TabLayout error (likely during logout):', error.message);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default function TabLayout() {
  return (
    <>
      <Sidebar />
      <TabsErrorBoundary>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          {/* User tabs */}
          <Tabs.Screen
            name="user/home"
            options={{
              title: 'User Home',
            }}
          />
          <Tabs.Screen
            name="user/wallet"
            options={{
              title: 'User Wallet',
            }}
          />
          
          {/* Driver tabs */}
          <Tabs.Screen
            name="driver/home"
            options={{
              title: 'Driver Home',
            }}
          />
          <Tabs.Screen
            name="driver/offers"
            options={{
              title: 'Driver Offers',
            }}
          />
          <Tabs.Screen
            name="driver/wallet"
            options={{
              title: 'Driver Wallet',
            }}
          />
          
          {/* Shared tabs */}
          <Tabs.Screen
            name="shared/profile"
            options={{
              title: 'Profile',
            }}
          />
          <Tabs.Screen
            name="shared/settings"
            options={{
              title: 'Settings',
            }}
          />
          <Tabs.Screen
            name="shared/orders"
            options={{
              title: 'Orders',
            }}
          />
          <Tabs.Screen
            name="shared/notifications"
            options={{
              title: 'Notifications',
            }}
          />
          <Tabs.Screen
            name="shared/referral"
            options={{
              title: 'Referral',
            }}
          />
          <Tabs.Screen
            name="shared/documents"
            options={{
              title: 'Documents',
            }}
          />
          <Tabs.Screen
            name="shared/help"
            options={{
              title: 'Help',
            }}
          />
        </Tabs>
      </TabsErrorBoundary>
    </>
  );
}
