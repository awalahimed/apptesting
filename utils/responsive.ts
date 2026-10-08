import { Dimensions, PixelRatio } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375
const BASE_HEIGHT = 812

// Responsive width
export const wp = (percentage: number): number => {
  const value = (percentage * SCREEN_WIDTH) / 100
  return Math.round(value)
}

// Responsive height
export const hp = (percentage: number): number => {
  const value = (percentage * SCREEN_HEIGHT) / 100
  return Math.round(value)
}

// Responsive font size
export const rf = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH
  const newSize = size * scale
  return Math.round(PixelRatio.roundToNearestPixel(newSize))
}

// Responsive spacing
export const rs = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT)
  const newSize = size * scale
  return Math.round(PixelRatio.roundToNearestPixel(newSize))
}

// Check if device is small (width < 375)
export const isSmallDevice = (): boolean => SCREEN_WIDTH < 375

// Check if device is large (width > 414)
export const isLargeDevice = (): boolean => SCREEN_WIDTH > 414

// Get screen dimensions
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
})

// Responsive map height based on screen size
export const getMapHeight = (): number => {
  if (SCREEN_HEIGHT < 700) return hp(45) // Small phones
  if (SCREEN_HEIGHT < 800) return hp(48) // Medium phones
  return hp(50) // Large phones
}

// Responsive card padding
export const getCardPadding = (): number => {
  if (SCREEN_WIDTH < 375) return rs(12)
  return rs(16)
}

// Responsive avatar size
export const getAvatarSize = (): number => {
  if (SCREEN_WIDTH < 375) return rs(40)
  return rs(48)
}
