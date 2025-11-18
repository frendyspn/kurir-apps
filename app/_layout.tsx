import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeepLinkHandler } from '@/hooks/use-deep-link';

import InAppNotification from "@/components/InAppNotification";
import messaging from '@react-native-firebase/messaging';
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";

import { notificationEvents } from '../utils/notificationEvents';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [notif, setNotif] = useState({
    visible: false,
    title: "",
    body: "",
    data: null as any
  });

  useEffect(() => {
    // Handle foreground notification from Expo (local or Expo push)
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification?.request?.content || {};
      setNotif({
        visible: true,
        title: title ?? "",
        body: body ?? "",
        data: notification.request.content.data || null,
      });
      notificationEvents.emit('refreshUnreadNotif');
    });

    // Handle foreground notification from Firebase (FCM)
    const unsubscribeMessaging = messaging().onMessage(async remoteMessage => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title ?? "",
          body: remoteMessage.notification?.body ?? "",
          data: remoteMessage.data || {},
        },
        trigger: null, // langsung tampil
      });
      setNotif({
        visible: true,
        title: remoteMessage.notification?.title ?? "",
        body: remoteMessage.notification?.body ?? "",
        data: remoteMessage.data || {},
      });
    });

    return () => {
      sub.remove();
      unsubscribeMessaging();
    };
  }, []);


  // Initialize deep link handler
  useDeepLinkHandler();

   useEffect(() => {
    registerForPush();

    Notifications.getNotificationChannelAsync('default').then(channel => {
  if (!channel) {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default', // harus string, bukan boolean
    });
    console.log('Channel default dibuat');
  } else {
    console.log('Channel default sudah ada:', channel);
  }
});
  }, []);

  async function registerForPush() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "ae6766a9-8ac2-4da4-bab4-96413dcb46b3",
    });

    console.log("Expo Push Token:", token.data);

    const deviceToken = await Notifications.getDevicePushTokenAsync();
    console.log("FCM token:", deviceToken.data);
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <InAppNotification
        visible={notif.visible}
        title={notif.title}
        body={notif.body}
        onHide={() =>
          setNotif((p) => ({ ...p, visible: false }))
        }
        onPress={() => {
          console.log("User clicked notif!", notif.data);
          setNotif((p) => ({ ...p, visible: false }));
        }}
      />
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
