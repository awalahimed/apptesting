import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Globe, Bell, Trash2, ChevronDown, ChevronRight, Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/AuthContext';
import { useTheme } from '@/hooks/ThemeContext';
import { useAlert } from '@/components/shared/CustomAlert';
import { orpc as client } from '@/hooks/orpc';
import React from 'react';

export default function Settings() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);
  const [referralEnabled, setReferralEnabled] = useState(true); // Track if referral program is enabled

  const languages = ['English'];

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Smartphone },
  ];

  useEffect(() => {
    loadNotificationPreference();
    checkReferralProgramStatus();
  }, []);

  // Also check when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkReferralProgramStatus();
    }, [])
  );

  const loadNotificationPreference = async () => {
    try {
      const result = await client.notifications.getNotificationPreference({ userId: session?.user?.id });
      if (result.success) {
        setNotificationsEnabled(result.notificationsEnabled);
      }
    } catch (error) {
      console.error('Failed to load notification preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkReferralProgramStatus = async () => {
    try {
      const result = await client.referral.getProgramStatus();
      if (result.success) {
        setReferralEnabled(result.enabled);
      }
    } catch (error) {
      console.error('Failed to check referral program status:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    const previousValue = notificationsEnabled;
    setNotificationsEnabled(value);
    
    try {
      const result = await client.notifications.toggleNotifications({ 
        userId: session?.user?.id, 
        enabled: value 
      });
      if (!result.success) {
        throw new Error('Failed to update preference');
      }
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      setNotificationsEnabled(previousValue);
      showAlert({ title: 'Error', message: 'Failed to update notification preference' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      showAlert({ title: 'Error', message: 'Please type "delete" to confirm' });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await client.notifications.softDeleteAccount();
      if (result.success) {
        await logout();
        
        showAlert({ 
          title: 'Account Deleted', 
          message: 'Your account has been successfully deleted.',
          buttons: [
            { text: 'OK', onPress: () => router.replace('/auth/login') }
          ]
        });
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      showAlert({ title: 'Error', message: 'Failed to delete account. Please try again.' });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          // Navigate back based on user role
          if (session?.user?.role === 'driver') {
            router.replace('/(tabs)/driver/home');
          } else {
            router.replace('/(tabs)/user/home');
          }
        }}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Referral Program Section - Only show if enabled */}
        {referralEnabled && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/(tabs)/shared/referral')}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>🎁 Referral Program</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Invite friends and earn rewards
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Theme Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setIsThemeExpanded(!isThemeExpanded)}
          >
            <View style={styles.sectionHeaderLeft}>
              <Sun size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            </View>
            {isThemeExpanded ? (
              <ChevronDown size={20} color={colors.textMuted} />
            ) : (
              <ChevronRight size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          {isThemeExpanded && (
            <>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Choose how the app looks
              </Text>

              <View style={[styles.themeOptionsContainer, { backgroundColor: colors.card }]}>
                {themeOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isSelected = themeMode === option.value;
                  const isFirst = index === 0;
                  const isLast = index === themeOptions.length - 1;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.themeOption,
                        { borderBottomColor: colors.border },
                        isFirst && styles.themeOptionFirst,
                        isLast && styles.themeOptionLast,
                        !isLast && styles.themeOptionBorder,
                      ]}
                      onPress={() => setThemeMode(option.value)}
                    >
                      <View style={styles.themeOptionLeft}>
                        <View style={[
                          styles.themeIconContainer,
                          { backgroundColor: isSelected ? colors.primaryOpacity10 : colors.backgroundSecondary }
                        ]}>
                          <Icon 
                            size={20} 
                            color={isSelected ? colors.primary : colors.textSecondary} 
                          />
                        </View>
                        <Text style={[
                          styles.themeOptionLabel,
                          { color: colors.text }
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={20} color={colors.primary} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Receive notifications about orders, updates, and promotions
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.primaryOpacity20 }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textMuted}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Language Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Language</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>App Language</Text>
              <Text style={[styles.settingValue, { color: colors.primary }]}>{selectedLanguage}</Text>
            </View>
            <ChevronDown size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color={colors.error} />
            <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem, { 
              borderColor: colors.errorLight,
              backgroundColor: colors.errorLight 
            }]}
            onPress={() => setShowDeleteModal(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.error }]}>Delete Account</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Permanently delete your account and all data
              </Text>
            </View>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <View style={styles.languageList}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageOption,
                  selectedLanguage === language && { backgroundColor: colors.primaryOpacity10 }
                ]}
                onPress={() => {
                  setSelectedLanguage(language);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={[
                  styles.languageText,
                  { color: colors.text },
                  selectedLanguage === language && { color: colors.primary, fontWeight: fontWeight.semibold }
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <View style={styles.deleteContent}>
            <Text style={[styles.deleteWarning, { color: colors.error }]}>
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </Text>
            
            <Text style={[styles.deleteInstruction, { color: colors.text }]}>
              Type "delete" to confirm:
            </Text>
            
            <TextInput
              style={[styles.deleteInput, { 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.inputBackground 
              }]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type delete here"
              placeholderTextColor={colors.textMuted}
            />
            
            <Button
              title={isDeleting ? 'Deleting...' : 'Delete Account'}
              onPress={handleDeleteAccount}
              disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  themeOptionsContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  themeOptionFirst: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  themeOptionLast: {
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  themeOptionBorder: {
    borderBottomWidth: 1,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    fontSize: fontSize.sm,
  },
  settingValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dangerItem: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  modalCancel: {
    fontSize: fontSize.md,
  },
  languageList: {
    padding: spacing.lg,
  },
  languageOption: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  languageText: {
    fontSize: fontSize.md,
  },
  deleteContent: {
    padding: spacing.lg,
  },
  deleteWarning: {
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  deleteInstruction: {
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  deleteInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  deleteButton: {},
});