import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, Text, BackHandler, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { colors, spacing, fontSize } from '@/constants/theme';

interface PaymentWebViewProps {
  visible: boolean;
  checkoutUrl: string;
  txRef: string;
  onClose: () => void;
  onVerify: (txRef: string) => Promise<void>;
}

export const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  visible,
  checkoutUrl,
  txRef,
  onClose,
  onVerify,
}) => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const handleClose = async () => {
    // When WebView closes, verify the payment status
    setVerifying(true);
    try {
      await onVerify(txRef);
    } catch (error) {
      console.error('[PaymentWebView] Verification error:', error);
    } finally {
      setVerifying(false);
      onClose();
    }
  };

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('[PaymentWebView] Back button pressed');
      handleClose();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [visible, txRef]);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    console.log('[PaymentWebView] Navigation:', url);
    
    // Detect when Chapa closes/cancels (they redirect to their own pages)
    // Common patterns: checkout closed, payment cancelled, or back to merchant
    if (url.includes('close') || 
        url.includes('cancel') || 
        url.includes('cancelled') ||
        url.includes('success') || 
        url.includes('payment-success') || 
        url.includes('status=success') ||
        url.includes('status=cancel') ||
        url.includes('status=failed')) {
      console.log('[PaymentWebView] Payment flow completed, verifying...');
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Close button - floating on top right */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          disabled={verifying}
        >
          <X size={20} color={colors.background} />
        </TouchableOpacity>

        {(loading || verifying) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {verifying ? 'Verifying payment...' : 'Loading payment page...'}
            </Text>
          </View>
        )}
        
        <WebView
          source={{ uri: checkoutUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          style={styles.webview}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(request) => {
            // Allow all navigation within the WebView
            return true;
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 1,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

