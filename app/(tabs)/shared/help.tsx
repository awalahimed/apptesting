import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageCircle, 
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/ThemeContext';

const faqData = [
  {
    id: '1',
    question: 'How do I track my order?',
    answer: 'You can track your order by going to "My Orders" and clicking on the "Track Order" button next to your order. You\'ll see real-time updates on your package location and delivery status.',
  },
  {
    id: '2',
    question: 'What are the delivery charges?',
    answer: 'Delivery charges vary based on distance, package size, and delivery speed. Standard delivery within the city starts from ETB 50. You can see the exact cost before confirming your order.',
  },
  {
    id: '3',
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 1-3 business days within the same city, and 3-7 days for intercity deliveries. Express delivery options are available for faster service.',
  },
  {
    id: '4',
    question: 'Can I cancel my order?',
    answer: 'You can cancel your order within 30 minutes of placing it if it hasn\'t been picked up yet. Go to "My Orders" and select "Cancel Order" if the option is available.',
  },
  {
    id: '5',
    question: 'What payment methods do you accept?',
    answer: 'We accept mobile money (Telebirr, CBE Birr), bank transfers, and cash on delivery for most orders. You can add your preferred payment method in the app.',
  },
  {
    id: '6',
    question: 'Is my package insured?',
    answer: 'All packages are covered by basic insurance up to ETB 1,000. For higher value items, you can purchase additional insurance during the booking process.',
  },
];

const contactOptions = [
  {
    id: 'phone',
    title: 'Call Us',
    subtitle: '+251 911 123 456',
    icon: Phone,
    action: () => Linking.openURL('tel:+251911123456'),
  },
  {
    id: 'email',
    title: 'Email Support',
    subtitle: 'support@mytrack.et',
    icon: Mail,
    action: () => Linking.openURL('mailto:support@mytrack.et'),
  },
  {
    id: 'chat',
    title: 'Live Chat',
    subtitle: 'Available 24/7',
    icon: MessageCircle,
    action: () => console.log('Open live chat'),
  },
];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function HelpSupport() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Get in Touch</Text>
          <View style={styles.contactGrid}>
            {contactOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.contactCard, { backgroundColor: colors.backgroundSecondary }]}
                onPress={option.action}
              >
                <View style={[styles.contactIcon, { backgroundColor: colors.primaryOpacity10 }]}>
                  <option.icon size={24} color={colors.primary} />
                </View>
                <Text style={[styles.contactTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
                <ExternalLink size={16} color={colors.textMuted} style={styles.externalIcon} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          </View>
          
          <View style={styles.faqList}>
            {faqData.map((faq) => (
              <View key={faq.id} style={[styles.faqItem, { backgroundColor: colors.backgroundSecondary }]}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <Text style={[styles.questionText, { color: colors.text }]}>{faq.question}</Text>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp size={20} color={colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
                
                {expandedFAQ === faq.id && (
                  <View style={[styles.faqAnswer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.answerText, { color: colors.textSecondary }]}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Additional Help */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Need More Help?</Text>
          <View style={[styles.helpCard, { backgroundColor: colors.primaryOpacity10 }]}>
            <Text style={[styles.helpText, { color: colors.text }]}>
              Can't find what you're looking for? Our support team is here to help you 24/7.
            </Text>
            <TouchableOpacity 
              style={[styles.helpButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL('tel:+251911123456')}
            >
              <Phone size={16} color={colors.background} />
              <Text style={[styles.helpButtonText, { color: colors.background }]}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Information</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Updated</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>January 2026</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Support</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>support@mytrack.et</Text>
            </View>
          </View>
        </View>
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
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  contactGrid: {
    gap: spacing.md,
  },
  contactCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs / 2,
  },
  contactSubtitle: {
    fontSize: fontSize.sm,
  },
  externalIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  questionText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  answerText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  helpCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  helpText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  helpButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: fontSize.md,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});