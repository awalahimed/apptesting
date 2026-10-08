import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { X, ArrowLeft } from 'lucide-react-native';
import { LocationStep } from './steps/LocationStep';
import { VehicleStep } from './steps/VehicleStep';
import { MaterialStep } from './steps/MaterialStep';

interface OrderData {
  pickup?: { latitude: number; longitude: number; address: string };
  destination?: { latitude: number; longitude: number; address: string };
  vehicleType?: 'motorcycle' | 'car' | 'truck';
  materialType?: string;
  description?: string;
  weight?: number;
}

interface OrderFlowModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (orderData: OrderData) => void;
}

export function OrderFlowModal({ visible, onClose, onComplete }: OrderFlowModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState<OrderData>({});

  const steps = [
    { title: 'Pickup & Destination', component: LocationStep },
    { title: 'Select Vehicle', component: VehicleStep },
    { title: 'Package Details', component: MaterialStep },
  ];

  const handleNext = (stepData: Partial<OrderData>) => {
    const updatedData = { ...orderData, ...stepData };
    setOrderData(updatedData);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(updatedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setOrderData({});
    onClose();
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={() => setCurrentStep(currentStep - 1)}>
              <ArrowLeft size={24} color="#191919" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{steps[currentStep].title}</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color="#191919" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.content}>
          <CurrentStepComponent
            data={orderData}
            onNext={handleNext}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#1a9b7f',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});