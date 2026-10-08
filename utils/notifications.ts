import Constants, { ExecutionEnvironment } from 'expo-constants';

// Safe import for expo-notifications
let Notifications: any = null

try {
  // Only try to import expo-notifications if we are NOT in Expo Go
  if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
    Notifications = require('expo-notifications')
  } else {
    console.log('Running in Expo Go - push notifications disabled');
  }
} catch (error) {
  console.log('expo-notifications not available in this build')
}

export { Notifications }

export const isNotificationsAvailable = () => {
  return Notifications !== null
}

export const requestPermissions = async () => {
  if (!Notifications) return { status: 'unavailable' }
  
  try {
    return await Notifications.requestPermissionsAsync()
  } catch (error) {
    console.log('Failed to request notification permissions:', error)
    return { status: 'error' }
  }
}

export const scheduleNotification = async (content: {
  title: string
  body: string
  data?: any
}) => {
  if (!Notifications) return
  
  try {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null, // Show immediately
    })
  } catch (error) {
    console.log('Failed to schedule notification:', error)
  }
}

export const setNotificationHandler = (handler: {
  handleNotification: () => Promise<{
    shouldShowAlert: boolean
    shouldPlaySound: boolean
    shouldSetBadge: boolean
    shouldShowBanner?: boolean
    shouldShowList?: boolean
  }>
}) => {
  if (!Notifications) return
  
  try {
    Notifications.setNotificationHandler(handler)
  } catch (error) {
    console.log('Failed to set notification handler:', error)
  }
}

export const addNotificationResponseListener = (listener: (response: any) => void) => {
  if (!Notifications) return { remove: () => {} }
  
  try {
    return Notifications.addNotificationResponseReceivedListener(listener)
  } catch (error) {
    console.log('Failed to add notification listener:', error)
    return { remove: () => {} }
  }
}