import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface VehicleOption {
  id: 'motorcycle' | 'car' | 'truck';
  label: string;
  disabled: boolean;
}

interface VehicleSelectorProps {
  selectedVehicle: string;
  onSelectVehicle: (vehicleId: 'motorcycle' | 'car' | 'truck') => void;
}

const vehicles: VehicleOption[] = [
  { id: 'motorcycle', label: 'Motorcycle', disabled: true },
  { id: 'car', label: 'Car', disabled: true },
  { id: 'truck', label: 'Truck', disabled: false },
];

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicle,
  onSelectVehicle,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vehicle Type</Text>
      <View style={styles.options}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.option,
              selectedVehicle === vehicle.id && styles.optionSelected,
              vehicle.disabled && styles.optionDisabled,
            ]}
            onPress={() => !vehicle.disabled && onSelectVehicle(vehicle.id)}
            disabled={vehicle.disabled}
          >
            <Text
              style={[
                styles.optionText,
                selectedVehicle === vehicle.id && styles.optionTextSelected,
                vehicle.disabled && styles.optionTextDisabled,
              ]}
            >
              {vehicle.label}
            </Text>
            {vehicle.disabled && (
              <Text style={styles.comingSoon}>Coming Soon</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionDisabled: {
    opacity: 0.5,
    backgroundColor: colors.background,
  },
  optionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.primary,
  },
  optionTextDisabled: {
    color: colors.textSecondary,
  },
  comingSoon: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.warning,
    marginTop: spacing.xs,
  },
});
