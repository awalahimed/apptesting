import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { X, MapPin, Navigation } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrderBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onNext: (data: { pickup: string; destination: string }) => void;
}

export function OrderBottomSheet({ visible, onClose, onNext }: OrderBottomSheetProps) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT * 0.33)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, // Move to final position
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT * 0.33, // Move down by sheet height
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (pickup.trim() && destination.trim()) {
      onNext({ pickup: pickup.trim(), destination: destination.trim() });
    }
  };

  const isValid = pickup.trim() && destination.trim();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Where to?</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#191919" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#FF6B35" />
            <TextInput
              style={styles.input}
              value={pickup}
              onChangeText={setPickup}
              placeholder="Pickup location"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Navigation size={20} color="#34C759" />
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="Destination"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isValid}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.33,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Sora',
    fontSize: 18,
    fontWeight: '600',
    color: '#191919',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Sora',
    fontSize: 16,
    color: '#191919',
    paddingVertical: 12,
  },
  nextButton: {
    backgroundColor: '#1a9b7f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});