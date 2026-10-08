import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

type SplashScreenProps = {
  mode?: 'splash' | 'loading';
  onAnimationComplete?: () => void;
};

export function SplashScreenLottie({ mode = 'splash', onAnimationComplete }: SplashScreenProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (mode === 'splash') {
      // Play once for splash
      animationRef.current?.play();
    } else {
      // Loop for loading
      animationRef.current?.play();
    }
  }, [mode]);

  const handleAnimationFinish = () => {
    if (mode === 'splash' && onAnimationComplete && typeof onAnimationComplete === 'function') {
      onAnimationComplete();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <LottieView
          ref={animationRef}
          source={require('@/assets/animations/truck-delivery.json')}
          style={styles.lottie}
          loop={mode === 'loading'}
          onAnimationFinish={handleAnimationFinish}
        />
      </View>

      <Text style={styles.title}>My Truck</Text>
      
      {mode === 'loading' && (
        <Text style={styles.loadingText}>Loading...</Text>
      )}
    </View>
    s
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginTop: 20,
    letterSpacing: 2,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#9CA3AF',
    letterSpacing: 1,
  },
});