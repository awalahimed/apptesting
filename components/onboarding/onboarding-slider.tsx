import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  id: string;
  animation: any;
  title: string;
  description: string;
  color: string;
}

const slides: SlideData[] = [
  {
    id: '1',
    animation: require('@/assets/animations/tracking.json'),
    title: 'Real-Time Tracking',
    description: 'Track your deliveries in real-time with precise GPS location updates',
    color: colors.primary,
  },
  {
    id: '2',
    animation: require('@/assets/animations/delivery.json'),
    title: 'Fast Delivery',
    description: 'Efficient logistics and route optimization for quick deliveries',
    color: colors.success,
  },
  {
    id: '3',
    animation: require('@/assets/animations/mobile.json'),
    title: 'Mobile Experience',
    description: 'Seamless tracking experience on your mobile device',
    color: colors.warning,
  },
];

interface OnboardingSliderProps {
  onComplete?: () => void;
}

export function OnboardingSlider({ onComplete }: OnboardingSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const animationRefs = useRef<(LottieView | null)[]>([]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index ?? 0;
        setCurrentIndex(index);
        animationRefs.current[index]?.play();
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onComplete?.();
    }
  }, [currentIndex, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => (
    <View style={styles.slide}>
      <View style={styles.animationContainer}>
        <LottieView
          ref={(ref) => {
            animationRefs.current[index] = ref;
          }}
          source={item.animation}
          style={styles.lottie}
          autoPlay={index === 0}
          loop
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
        initialScrollIndex={0}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <PaginationDot key={index} active={index === currentIndex} />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            currentIndex === slides.length - 1 && styles.getStartedButton,
          ]}
          onPress={handleNext}
        >
          {currentIndex === slides.length - 1 ? (
            <Text style={styles.getStartedText}>Get Started</Text>
          ) : (
            <MaterialIcons name="arrow-forward" size={24} color="#000" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface PaginationDotProps {
  active: boolean;
}

function PaginationDot({ active }: PaginationDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // bypass negative hash bug
    return {
      width: withSpring(active ? 24 : 8),
      opacity: withSpring(active ? 1 : 0.5),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  animationContainer: {
    width: 280,
    height: 280,
    marginBottom: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.xl,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    height: 8,
    backgroundColor: colors.text,
    borderRadius: 4,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButton: {
    width: 140,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  getStartedText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: spacing.sm,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
