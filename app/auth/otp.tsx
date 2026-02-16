import OtpInput from '@/components/otp-input';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GlassBackground from '../../components/glass-background';
import { AuthColors } from '../../constants/theme';

// Helper function to safely get FCM token (works in both Expo Go and production)
const getFirebaseFcmToken = async (): Promise<string> => {
    try {
        const messaging = (await import('@react-native-firebase/messaging')).default;
        const token = await messaging().getToken();
        console.log("FCM token for OTP:", token);
        return token;
    } catch (e) {
        console.warn("Firebase not available (likely Expo Go), skipping FCM token:", e);
        return "";
    }
};

// Helper function to safely subscribe to city topic
const subscribeToCity = async (city: string): Promise<void> => {
    try {
        const { subscribeCityTopic } = await import("@/utils/fcmTopicManager");
        await subscribeCityTopic(city);
        console.log(`Subscribed to city topic: ${city}`);
    } catch (e) {
        console.warn("Firebase not available (likely Expo Go), skipping topic subscription:", e);
    }
};

export default function LoginOtpScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const phoneNumber = params.phone as string;
    const [otpDev, setOtpDev] = useState('');


    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
            // Timer untuk resend OTP
            if (resendTimer > 0) {
                const timer = setTimeout(() => {
                    setResendTimer(resendTimer - 1);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                setCanResend(true);
            }
        }, [resendTimer]);


        const handleOtpComplete = async (otpValue: string) => {
        setOtp(otpValue);
        // Auto submit ketika OTP lengkap
        await verifyOtp(otpValue);
    };


    const verifyOtp = async (otpValue: string) => {
        setLoading(true);

        try {
            // Ambil FCM token (auto-detect: works in Expo Go and production)
            const fcmToken = await getFirebaseFcmToken();

            // Kirim ke API verifyOtp
            const result = await apiService.verifyOtp(phoneNumber, otpValue, fcmToken);

            if (result.success) {
                console.log('OTP verified successfully:', result.data);

                // Save token/user data to AsyncStorage
                await AsyncStorage.setItem('userToken', result.data?.token);
                
                // Save user data - handle different response structures
                const userData = result.data?.user_login || result.data?.user || result.data;
                console.log('💾 Saving user data:', userData);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));

                // Subscribe to city topic (auto-detect: works in Expo Go and production)
                if (userData?.kota) {
                    await subscribeToCity(userData.kota);
                }

                Alert.alert('Berhasil', 'OTP berhasil diverifikasi', [
                    {
                        text: 'OK',
                        onPress: () => {
                            router.replace('/');
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', result.message || 'Kode OTP salah, silakan coba lagi');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            Alert.alert('Error', 'Terjadi kesalahan, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setCanResend(false);
        setResendTimer(60);
        
        try {
            const result = await apiService.login(phoneNumber);
            if (result.success) {
                setOtpDev(result.data?.Message || '');
                Alert.alert('Berhasil', 'Kode OTP baru telah dikirim');
            } else {
                Alert.alert('Error', result.message || 'Gagal mengirim ulang OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            Alert.alert('Error', 'Terjadi kesalahan, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <KeyboardAvoidingView
                style={styles.container}
                // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <GlassBackground />
                
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.hero}>
                            <Text style={styles.heroTitle}>Verifikasi OTP</Text>
                            <Text style={styles.heroSubtitle}>Kami telah mengirim kode verifikasi</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.phoneNumberSection}>
                                <Text style={styles.phoneLabel}>Nomor Terdaftar</Text>
                                <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                            </View>

                            <Text style={styles.otpLabel}>Masukkan 6 Digit Kode OTP</Text>
                            <View style={styles.otpContainer}>
                                <OtpInput
                                    length={6}
                                    onComplete={handleOtpComplete}
                                    onChangeOtp={setOtp}
                                />
                            </View>

                            <Button
                                title="Verifikasi"
                                onPress={() => verifyOtp(otp)}
                                loading={loading}
                                disabled={otp.length !== 6}
                                variant="primary"
                                size="large"
                                fullWidth
                            />

                            <View style={styles.resendContainer}>
                                {!canResend ? (
                                    <Text style={styles.timerText}>
                                        Kirim ulang dalam <Text style={styles.timerBold}>{resendTimer}s</Text>
                                    </Text>
                                ) : (
                                    <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                                        <Text style={styles.resendText}>Kirim Ulang Kode OTP</Text>
                                    </TouchableOpacity>
                                )}
                                {otpDev ? (
                                    <Text style={styles.devText}>Dev: {otpDev}</Text>
                                ) : params.otp ? (
                                    <Text style={styles.devText}>Dev: {params.otp}</Text>
                                ) : null}
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push('/auth/login')}
                                style={styles.changePhoneButton}
                            >
                                <Text style={styles.changePhoneText}>Gunakan Nomor Lain</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuthColors.backgroundEnd,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 40,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 40,
    },
    hero: {
        alignItems: 'center',
        gap: 8,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: AuthColors.onPrimary,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        fontWeight: '500',
    },
    formContainer: {
        gap: 24,
    },
    phoneNumberSection: {
        alignItems: 'center',
        gap: 6,
    },
    phoneLabel: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.75)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    phoneNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: AuthColors.onPrimary,
        letterSpacing: 0.5,
    },
    otpLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    otpContainer: {
        marginBottom: 4,
        alignItems: 'center',
    },
    resendContainer: {
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    timerText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.75)',
        textAlign: 'center',
        fontWeight: '500',
    },
    timerBold: {
        fontWeight: '700',
        color: AuthColors.onPrimary,
    },
    resendText: {
        fontSize: 14,
        color: AuthColors.onPrimary,
        fontWeight: '600',
        textDecorationLine: 'underline',
        textDecorationColor: AuthColors.onPrimary,
    },
    devText: {
        fontSize: 10,
        color: AuthColors.error,
        fontWeight: '600',
        marginTop: 4,
    },
    changePhoneButton: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    changePhoneText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
        textDecorationLine: 'underline',
        textDecorationColor: 'rgba(255, 255, 255, 0.7)',
    },
    footer: {
        marginTop: 4,
    },
});
