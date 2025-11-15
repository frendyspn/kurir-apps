import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeepLinkHandler } from '@/hooks/use-deep-link';
import { useNotificationNavigation } from '@/hooks/use-notification-navigation';
import { notificationService } from '@/services/notificationService';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const notificationListenersRef = useRef<any>(null);
  const { handleNotificationNavigation } = useNotificationNavigation();

  // Initialize deep link handler
  useDeepLinkHandler();

  // Initialize push notifications
  useEffect(() => {
    // Set navigation handler
    notificationService.setNavigationHandler(handleNotificationNavigation);
    const initializeNotifications = async () => {
      try {
        const result = await notificationService.initialize();

        if (result) {
          notificationListenersRef.current = result.listeners;

          // Register device token if user is logged in
          const userData = await AsyncStorage.getItem('userData');
          if (userData && result.token) {
            const user = JSON.parse(userData);
            await notificationService.registerDeviceToken(user.id, result.token);
          }

          // Add notification listener for foreground messages
          const unsubscribeNotification = notificationService.addNotificationListener((remoteMessage: any) => {
            // Handle foreground notification (show local notification or alert)
            console.log('Foreground notification:', remoteMessage);
            // You can show a toast, alert, or local notification here
          });

          // Add token refresh listener
          const unsubscribeTokenRefresh = notificationService.addTokenRefreshListener(async (newToken: string) => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
              const user = JSON.parse(userData);
              await notificationService.registerDeviceToken(user.id, newToken);
            }
          });

          // Store unsubscribe functions
          notificationListenersRef.current = {
            ...notificationListenersRef.current,
            unsubscribeNotification,
            unsubscribeTokenRefresh
          };
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      if (notificationListenersRef.current) {
        notificationService.cleanup(notificationListenersRef.current);
      }
    };
  }, [handleNotificationNavigation]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="transaksi-manual" options={{ headerShown: false }} />
          <Stack.Screen name="live-order" options={{ headerShown: false }} />
          <Stack.Screen name="kontak" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/logout" options={{ headerShown: false }} />
          <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="akun" options={{ headerShown: false }} />
          <Stack.Screen name="saldo/top-up" options={{ headerShown: false }} />
          <Stack.Screen name="saldo/confirm-top-up" options={{ headerShown: false }} />
          <Stack.Screen name="saldo/withdraw" options={{ headerShown: false }} />
          <Stack.Screen name="saldo/transfer" options={{ headerShown: false }} />
          
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
