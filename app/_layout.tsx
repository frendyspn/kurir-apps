import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeepLinkHandler } from '@/hooks/use-deep-link';

import InAppNotification from "@/components/InAppNotification";
import messaging from '@react-native-firebase/messaging';
import { useEffect, useRef, useState } from "react";

import { Alert, Animated, Easing, ImageBackground, Linking, StyleSheet, View } from 'react-native';
import { notificationEvents } from '../utils/notificationEvents';

// Enable debug mode - set to false for production
const DEBUG_NOTIFICATIONS = false;

// Keep native splash visible until the first React frame is ready.
SplashScreen.preventAutoHideAsync().catch(() => {
    // Ignore if splash screen was already hidden.
});

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    const splashOpacity = useRef(new Animated.Value(1)).current;

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

    useEffect(() => {
        const hideNativeTimer = setTimeout(() => {
            SplashScreen.hideAsync().catch(() => {
                // Native splash may already be hidden on some builds.
            });
        }, 50);

        const hideCustomSplashTimer = setTimeout(() => {
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 350,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => setShowSplash(false));
        }, 1600);

        return () => {
            clearTimeout(hideNativeTimer);
            clearTimeout(hideCustomSplashTimer);
        };
    }, [splashOpacity]);

    // Handle notification opened from background/closed state
    useEffect(() => {
        // Handle notification opened when app is in background or closed
        const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('📲 Notification opened from background:', JSON.stringify(remoteMessage));
            
            if (DEBUG_NOTIFICATIONS) {
                Alert.alert('Debug: Notif from Background', JSON.stringify(remoteMessage?.data));
            }
            
            const data = remoteMessage?.data;
            if (data?.navigate_to) {
                console.log('🔗 Navigation data:', data);
                handleNotificationNavigation(data);
            } else {
                console.log('⚠️ No navigate_to found in notification data');
            }
        });

        // Handle notification when app is opened from closed state via notification
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('📲 App opened from notification (closed state):', JSON.stringify(remoteMessage));
                    
                    if (DEBUG_NOTIFICATIONS) {
                        Alert.alert('Debug: App Opened from Notif', JSON.stringify(remoteMessage?.data));
                    }
                    
                    const data = remoteMessage?.data;
                    if (data?.navigate_to) {
                        console.log('🔗 Initial notification data:', data);
                        setTimeout(() => {
                            handleNotificationNavigation(data);
                        }, 1500); // Delay to ensure navigation is ready
                    } else {
                        console.log('⚠️ No navigate_to found in initial notification data');
                    }
                }
            });

        return unsubscribeOnNotificationOpenedApp;
    }, []);

    const handleNotificationNavigation = (data: any) => {
        console.log('🔗 handleNotificationNavigation called with:', data);
        
        const route = data?.navigate_to;
        const transactionId = data?.transaction_id;

        console.log('🔗 Route:', route, 'Transaction ID:', transactionId);

        // Debug alert - remove in production
        if (DEBUG_NOTIFICATIONS) {
            Alert.alert(
                'Debug: Notification Clicked',
                `Route: ${route}\nTransaction: ${transactionId}`,
                [{ text: 'OK' }]
            );
        }

        try {
            if (route === 'live-order') {
                console.log('🔗 Navigating to live-order...');
                // Use deep linking URL
                Linking.openURL(`mitra-klikquick://live-order/${transactionId || ''}`);
            } else if (route === 'history') {
                console.log('🔗 Navigating to history...');
                Linking.openURL(`mitra-klikquick://history/${transactionId || ''}`);
            } else if (route === 'transaksi') {
                console.log('🔗 Navigating to transaksi...');
                Linking.openURL(`mitra-klikquick://transaksi/${transactionId || ''}`);
            } else if (route === 'saldo') {
                console.log('🔗 Navigating to saldo...');
                // Use deep linking URL
                Linking.openURL(`mitra-klikquick://saldo`);
            } else {
                console.log('⚠️ Unknown route:', route);
                if (DEBUG_NOTIFICATIONS) {
                    Alert.alert('Debug', `Unknown route: ${route}`);
                }
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
            if (DEBUG_NOTIFICATIONS) {
                Alert.alert('Navigation Error', String(error));
            }
        }
    };

    async function registerForPush() {
        try {
            // Request permission first
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                console.warn('⚠️ User did not grant notification permission');
                Alert.alert(
                    'Izin Notifikasi',
                    'Notifikasi diblokir. Aktifkan izin agar bisa menerima order baru.',
                    [
                        { text: 'Batal', style: 'cancel' },
                        {
                            text: 'Buka Pengaturan',
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
                return null;
            }

            console.log('✅ Notification permission granted:', authStatus);

            // Get FCM token
            const fcmToken = await messaging().getToken();
            console.log("📱 FCM Token:", fcmToken);

            return fcmToken;
        } catch (error) {
            console.error('❌ Error requesting notification permission:', error);
            return null;
        }
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
                    <Stack.Screen name="transaksi-member" options={{ headerShown: false }} />
                    <Stack.Screen name="splash-debug" options={{ headerShown: false }} />
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
                {showSplash && (
                    <Animated.View pointerEvents="none" style={[styles.splashOverlay, { opacity: splashOpacity }]}
                    >
                        <ImageBackground
                            source={require('../assets/images/splash-full.jpeg')}
                            resizeMode="cover"
                            style={styles.splashImage}
                        />
                    </Animated.View>
                )}
                <StatusBar style="auto" />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    splashOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    splashImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
