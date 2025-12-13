import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeepLinkHandler } from '@/hooks/use-deep-link';

import InAppNotification from "@/components/InAppNotification";
import messaging from '@react-native-firebase/messaging';
import { useEffect, useState } from "react";

import { Linking } from 'react-native';
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

        // Handle foreground notification from Firebase (FCM)
        const unsubscribeMessaging = messaging().onMessage(async remoteMessage => {

            setNotif({
                visible: true,
                title: remoteMessage.notification?.title ?? "",
                body: remoteMessage.notification?.body ?? "",
                data: remoteMessage.data || {},
            });
            notificationEvents.emit('refreshUnreadNotif');
        });

        setTimeout(() => {
            setNotif((v) => ({ ...v, visible: false }));
        }, 5000);

        return unsubscribeMessaging;
    }, []);


    // Initialize deep link handler
    useDeepLinkHandler();

    useEffect(() => {
        registerForPush();
    }, []);

    async function registerForPush() {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) return;

        const fcmToken = await messaging().getToken();
        console.log("FCM Token:", fcmToken);

        return fcmToken;
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
                        console.log("User clicked notif!", notif);
                        setNotif((p) => ({ ...p, visible: false }));
                        notif.data?.transaction_id && notif.data?.navigate_to  && Linking.openURL(`mitra-klikquick://${notif.data?.navigate_to}/${notif.data.transaction_id}`);
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
