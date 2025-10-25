import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OtpInput from '../../../components/otp-input';

export default function RegisterOtpScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Get all registration data from params
    const phoneNumber = params.phone as string;
    const namaLengkap = params.nama_lengkap as string;
    const email = params.email as string;
    const jenisKelamin = params.jenis_kelamin as string;
    const tanggalLahir = params.tanggal_lahir as string;
    const tempatLahir = params.tempat_lahir as string;
    const provinsiId = params.provinsi_id as string;
    const kotaId = params.kota_id as string;
    const kecamatanId = params.kecamatan_id as string;
    const alamat = params.alamat as string;

    console.log('Registration Data:', {
        phoneNumber,
        namaLengkap,
        email,
        jenisKelamin,
        tanggalLahir,
        tempatLahir,
        provinsiId,
        kotaId,
        kecamatanId,
        alamat
    });


    const [otp, setOtp] = useState('');
    const [otpDev, setOtpDev] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(true);

    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Send OTP automatically when screen loads
        handleResendOtp();

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, []);

    const startCountdown = () => {
        setCountdown(60);
        setCanResend(false);

        if (countdownRef.current) {
            clearInterval(countdownRef.current);
        }

        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleOtpChange = (value: string) => {
        setOtp(value);
        setError('');

        // Auto verify when OTP is complete (6 digits)
        if (value.length === 6) {
            handleVerify(value);
        }
    };

    const handleVerify = async (otpValue?: string) => {
        const otpToVerify = otpValue || otp;

        if (otpToVerify.length !== 6) {
            setError('Kode OTP harus 6 digit');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call API to register user with OTP verification
            const result = await apiService.verifyOtpRegister({
                no_hp: phoneNumber,
                nama_lengkap: namaLengkap,
                email: email,
                jenis_kelamin: jenisKelamin,
                tanggal_lahir: tanggalLahir,
                tempat_lahir: tempatLahir,
                provinsi_id: provinsiId,
                kota_id: kotaId,
                kecamatan_id: kecamatanId,
                alamat: alamat,
                otp: otpToVerify
            });

            console.log('Registration Result:', result);

            if (result.data?.success) {

                await AsyncStorage.setItem('userToken', result.data?.data?.token);
                await AsyncStorage.setItem('userData', JSON.stringify(result.data?.data?.user_login));
                
                Alert.alert('Berhasil', 'Registrasi Berhasil, Silahkan Lengkapi Data Pendukung', [
                    {
                        text: 'OK',
                        onPress: () => {
                            router.replace('/auth/register/kelengkapan-data');
                        },
                    },
                ]);

                // Save user data to AsyncStorage
                // const userData = {
                //     no_hp: phoneNumber,
                //     nama_lengkap: namaLengkap,
                //     email: email,
                //     jenis_kelamin: jenisKelamin,
                //     tanggal_lahir: tanggalLahir,
                //     tempat_lahir: tempatLahir,
                //     provinsi_id: provinsiId,
                //     kota_id: kotaId,
                //     kecamatan_id: kecamatanId,
                //     alamat: alamat,
                //     // Add other user data from API response if needed
                //     ...result.data
                // };

                // await AsyncStorage.setItem('userData', JSON.stringify(userData));

                // Navigate to home
                // router.replace('../login');
            } else {
                setError(result.data?.message || 'Kode OTP tidak valid');
            }
        } catch (err) {
            console.error('Verify OTP error:', err);
            setError('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;

        setResending(true);
        setError('');

        try {
            // Call API to resend OTP
            const result = await apiService.sendOtpRegister(phoneNumber);

            if (result.success) {
                startCountdown();
                setOtp('');
                setOtpDev(result.data?.message || '');
                console.log('OTP resent successfully');
            } else {
                setError(result.message || 'Gagal mengirim ulang kode OTP');
            }
        } catch (err) {
            console.error('Resend OTP error:', err);
            setError('Gagal mengirim ulang kode OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
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
                            value={otp}
                            onChange={handleOtpChange}
                            error={error}
                        />
                    </View>

                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0d6efd" />
                            <Text style={styles.loadingText}>Memverifikasi...</Text>
                        </View>
                    )}

                    <View style={styles.resendContainer}>
                        {!canResend ? (
                            <>
                                <Text style={styles.countdownText}>
                                    Kirim ulang kode dalam {countdown} detik
                                </Text>
                                {otpDev && (
                                    <Text style={styles.devText}>
                                        Dev Only - OTP: {otpDev}
                                    </Text>
                                )}
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={handleResendOtp}
                                    disabled={resending}
                                >
                                    <Text style={styles.resendText}>
                                        {resending ? 'Mengirim ulang...' : 'Kirim Ulang Kode'}
                                    </Text>
                                </TouchableOpacity>
                                {otpDev && (
                                    <Text style={styles.devText}>
                                        Dev Only - OTP: {otpDev}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
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
    loadingContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6c757d',
    },
    resendContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    resendText: {
        fontSize: 16,
        color: '#0d6efd',
        fontWeight: '600',
    },
    countdownText: {
        fontSize: 14,
        color: '#6c757d',
    },
    devText: {
        fontSize: 12,
        color: '#dc3545',
        marginTop: 8,
    },
});
