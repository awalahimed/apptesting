import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
}

interface ProgressBarProps {
  steps: Step[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ steps }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {/* Background connector lines */}
        <View style={styles.connectorsContainer}>
          {steps.map((step, index) => (
            index < steps.length - 1 && (
              <View
                key={`connector-${index}`}
                style={[
                  styles.connector,
                  step.status === 'completed' && styles.connectorCompleted,
                ]}
              />
            )
          ))}
        </View>

        {/* Steps */}
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepWrapper}>
            <View
              style={[
                styles.stepCircle,
                step.status === 'completed' && styles.stepCircleCompleted,
                step.status === 'current' && styles.stepCircleCurrent,
              ]}
            >
              {step.status === 'completed' ? (
                <Check size={14} color={colors.surface} />
              ) : (
                <View
                  style={[
                    styles.stepDot,
                    step.status === 'current' && styles.stepDotCurrent,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                step.status === 'completed' && styles.stepLabelCompleted,
                step.status === 'current' && styles.stepLabelCurrent,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  connectorsContainer: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '12.5%',
    zIndex: 0,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  connectorCompleted: {
    backgroundColor: '#10b981',
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
    zIndex: 2,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },
  stepDotCurrent: {
    backgroundColor: colors.surface,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#10b981',
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
