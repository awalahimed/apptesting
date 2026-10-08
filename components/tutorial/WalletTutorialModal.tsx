import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface WalletTutorialModalProps {
  visible: boolean;
  onCreateWallet: () => void;
  userType: 'user' | 'driver';
}

export const WalletTutorialModal: React.FC<WalletTutorialModalProps> = ({
  visible,
  onCreateWallet,
  userType,
}) => {
  const message = userType === 'user' 
    ? 'Create your wallet to start ordering'
    : 'Create your wallet to receive payments';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(iconBounce, {
            toValue: -10,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(iconBounce, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      iconBounce.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View style={{ transform: [{ translateY: iconBounce }] }}>
            <Svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <Rect x="3" y="6" width="18" height="14" rx="2" stroke="#007AFF" strokeWidth="1.5" fill="#E3F2FD" />
              <Path d="M3 10h18" stroke="#007AFF" strokeWidth="1.5" />
              <Circle cx="7" cy="15" r="1" fill="#007AFF" />
              <Path d="M17 13h2v4h-2z" fill="#007AFF" />
            </Svg>
          </Animated.View>
          
          <Text style={styles.message}>{message}</Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={onCreateWallet}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Create Wallet</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  message: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 28,
    lineHeight: 28,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
