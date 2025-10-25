import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/button';
import OtpInput from '../../components/otp-input';
import { apiService } from '../../services/api';

export default function OtpScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const phoneNumber = params.phone as string;
    const [otpDev, setOtpDev] = useState(params.otp as string | undefined);

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
            const result = await apiService.verifyOtp(phoneNumber, otpValue);

            if (result.success) {
                console.log('OTP verified successfully:', result.data);

                // TODO: Save token/user data to AsyncStorage
                await AsyncStorage.setItem('userToken', result.data?.token);
                await AsyncStorage.setItem('userData', JSON.stringify(result.data));

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
        if (!canResend) return;

        setLoading(true);
        try {
            const result = await apiService.resendOtp(phoneNumber);

            if (result.success) {
                setResendTimer(60);
                setCanResend(false);
                setOtpDev(result.data?.Message);
                Alert.alert('Berhasil', 'Kode OTP telah dikirim ulang');
            } else {
                Alert.alert('Error', result.message || 'Gagal mengirim ulang OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            Alert.alert('Error', 'Gagal mengirim ulang OTP');
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
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Verifikasi OTP</Text>
                        <Text style={styles.subtitle}>
                            Masukkan kode 6 digit yang telah dikirim ke
                        </Text>
                        <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                    </View>

                    <View style={styles.otpContainer}>
                        <OtpInput
                            length={6}
                            onComplete={handleOtpComplete}
                            onChangeOtp={setOtp}
                        />
                    </View>

                    <View style={styles.resendContainer}>
                        {!canResend ? (
                            <>
                                <Text style={styles.timerText}>
                                    Kirim ulang kode dalam {resendTimer} detik
                                </Text>
                                {otpDev && (
                                    <Text style={styles.devText}>
                                        Dev Only - OTP: {otpDev}
                                    </Text>
                                )}
                            </>
                        ) : (
                            <>
                                <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                                    <Text style={styles.resendText}>Kirim Ulang Kode</Text>
                                </TouchableOpacity>
                                {params.otp && (
                                    <Text style={styles.devText}>
                                        Dev Only - OTP: {params.otp}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>

                    <Button
                        title="Verifikasi"
                        onPress={() => verifyOtp(otp)}
                        loading={loading}
                        disabled={otp.length !== 6}
                        variant="primary"
                        style={styles.button}
                    />

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backButtonText}>Ubah Nomor HP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0d6efd',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 8,
    },
    phoneNumber: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
        textAlign: 'center',
    },
    otpContainer: {
        marginBottom: 24,
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    timerText: {
        fontSize: 14,
        color: '#6c757d',
    },
    resendText: {
        fontSize: 16,
        color: '#0d6efd',
        fontWeight: '600',
    },
    devText: {
        fontSize: 12,
        color: '#dc3545',
        marginTop: 8,
    },
    button: {
        marginBottom: 16,
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: '#6c757d',
    },
});