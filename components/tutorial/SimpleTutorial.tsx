import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, StatusBar, Platform } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position?: { x: number; y: number; width: number; height: number };
}

interface SimpleTutorialProps {
  visible: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen'); // Use 'screen' instead of 'window'
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
const FULL_HEIGHT = SCREEN_HEIGHT + 100; // Add extra padding to ensure full coverage

export const SimpleTutorial: React.FC<SimpleTutorialProps> = ({ visible, steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to first step when tutorial becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Define spotlight positions for each target
  const getSpotlightPosition = (target: string) => {
    switch (target) {
      case 'topBar':
        return { x: 0, y: 0, width: SCREEN_WIDTH, height: 100, shape: 'rect' };
      case 'orderButtons':
        return { x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH, height: 100, shape: 'rect' }; // Full-width at bottom
      case 'searchButton':
        return { x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH, height: 100, shape: 'rect' }; // Full-width at bottom
      default:
        return { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, radius: 100, shape: 'circle' };
    }
  };

  const spotlightData = getSpotlightPosition(step.target);
  const isMultiSpotlight = Array.isArray(spotlightData);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* Overlay with spotlight */}
        <Svg width={SCREEN_WIDTH} height={FULL_HEIGHT} style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="mask">
              <Rect x="0" y="0" width={SCREEN_WIDTH} height={FULL_HEIGHT} fill="white" />
              {isMultiSpotlight ? (
                // Multiple spotlights
                spotlightData.map((spot: any, idx: number) => (
                  <Circle key={idx} cx={spot.x} cy={spot.y} r={spot.radius} fill="black" />
                ))
              ) : spotlightData.shape === 'rect' ? (
                // Rectangle spotlight (for top bar)
                <Rect
                  x={spotlightData.x}
                  y={spotlightData.y}
                  width={spotlightData.width}
                  height={spotlightData.height}
                  fill="black"
                />
              ) : (
                // Circle spotlight
                <Circle cx={spotlightData.x} cy={spotlightData.y} r={spotlightData.radius} fill="black" />
              )}
            </Mask>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={SCREEN_WIDTH}
            height={FULL_HEIGHT}
            fill="rgba(0, 0, 0, 0.85)"
            mask="url(#mask)"
          />
          {isMultiSpotlight ? (
            // Multiple borders
            spotlightData.map((spot: any, idx: number) => (
              <Circle
                key={idx}
                cx={spot.x}
                cy={spot.y}
                r={spot.radius}
                stroke="#007AFF"
                strokeWidth="3"
                fill="transparent"
              />
            ))
          ) : spotlightData.shape === 'rect' ? (
            // Rectangle border
            <Rect
              x={spotlightData.x}
              y={spotlightData.y}
              width={spotlightData.width}
              height={spotlightData.height}
              stroke="#007AFF"
              strokeWidth="3"
              fill="transparent"
            />
          ) : (
            // Circle border
            <Circle
              cx={spotlightData.x}
              cy={spotlightData.y}
              r={spotlightData.radius}
              stroke="#007AFF"
              strokeWidth="3"
              fill="transparent"
            />
          )}
        </Svg>

        {/* Tooltip - always centered */}
        <View style={styles.tooltip}>
          <Text style={styles.stepCounter}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
          
          <View style={styles.buttons}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextText}>{isLastStep ? 'Finish' : 'Next'}</Text>
              {!isLastStep && <ChevronRight size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  stepCounter: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 6,
  },
  nextText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});
