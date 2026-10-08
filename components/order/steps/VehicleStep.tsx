import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Car, Truck, Bike } from 'lucide-react-native';

interface VehicleStepProps {
  data: any;
  onNext: (data: any) => void;
}

const vehicles = [
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    icon: Bike,
    capacity: 'Up to 20kg',
    price: '50 ብር',
    description: 'Fast delivery for small packages',
  },
  {
    id: 'car',
    name: 'Car',
    icon: Car,
    capacity: 'Up to 100kg',
    price: '120 ብር',
    description: 'Standard delivery for medium packages',
  },
  {
    id: 'truck',
    name: 'Truck',
    icon: Truck,
    capacity: 'Up to 1000kg',
    price: '300 ብር',
    description: 'Heavy delivery for large packages',
  },
];

export function VehicleStep({ data, onNext }: VehicleStepProps) {
  const [selected, setSelected] = useState(data.vehicleType || '');

  const handleNext = () => {
    if (selected) {
      onNext({ vehicleType: selected });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Choose your delivery vehicle</Text>
        
        {vehicles.map((vehicle) => {
          const IconComponent = vehicle.icon;
          const isSelected = selected === vehicle.id;
          
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
              onPress={() => setSelected(vehicle.id)}
            >
              <View style={styles.vehicleIcon}>
                <IconComponent size={32} color={isSelected ? '#1a9b7f' : '#78838D'} />
              </View>
              
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleCapacity}>{vehicle.capacity}</Text>
                <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
              </View>
              
              <Text style={styles.vehiclePrice}>{vehicle.price}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextButton, !selected && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!selected}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontFamily: 'Sora',
    fontSize: 16,
    color: '#78838D',
    marginBottom: 20,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  vehicleCardSelected: {
    borderColor: '#1a9b7f',
    backgroundColor: '#F0FDF4',
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 30,
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
  },
  vehicleCapacity: {
    fontFamily: 'Sora',
    fontSize: 14,
    color: '#78838D',
    marginTop: 2,
  },
  vehicleDescription: {
    fontFamily: 'Sora',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  vehiclePrice: {
    fontFamily: 'Sora',
    fontSize: 16,
    fontWeight: '600',
    color: '#1a9b7f',
  },
  nextButton: {
    backgroundColor: '#1a9b7f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
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