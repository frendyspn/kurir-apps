import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/button';
import GlassBackground from '../../components/glass-background';
import Input from '../../components/input';
import { APP_NAME } from '../../constant';
import { AuthColors } from '../../constants/theme';
import { apiService } from '../../services/api';

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState(params.error ? String(params.error) : '');
    const [loading, setLoading] = useState(false);

    const validatePhoneNumber = (phone: string): boolean => {
        const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
        return phoneRegex.test(phone);
    };

    const handleLogin = async () => {
        setError('');

        if (!phoneNumber) {
            setError('Nomor HP harus diisi');
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            setError('Format nomor HP tidak valid');
            return;
        }

        setLoading(true);

    
        try {
            const result = await apiService.login(phoneNumber);
            
            if (result.success) {
                console.log('Login successful:', result.data);

                // Navigate ke OTP screen
                const encodedPhone = encodeURIComponent(phoneNumber);
                const encodedOtp = encodeURIComponent(result.data?.Message || '');
                router.push(`/auth/otp?phone=${encodedPhone}&otp=${encodedOtp}`);
            } else {
                setError(result.message || 'Login gagal, silakan coba lagi');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Terjadi kesalahan, silakan coba lagi');
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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <GlassBackground />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.hero}>
                            <Text style={styles.heroTitle}>{APP_NAME}</Text>
                            {/* <Text style={styles.heroSubtitle}>Masuk untuk melanjutkan pengiriman</Text> */}
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.headerSection}>
                                {/* <Text style={styles.welcomeText}>Selamat datang kembali</Text> */}
                                <Text style={styles.instructionText}>Masukkan nomor HP untuk menerima kode OTP</Text>
                            </View>

                            <View style={styles.form}>
                                <Input
                                    label="Nomor HP"
                                    placeholder="Contoh: 081234567890"
                                    placeholderTextColor={AuthColors.inputPlaceholder}
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={(text) => {
                                        setPhoneNumber(text);
                                        setError('');
                                    }}
                                    maxLength={15}
                                    error={error}
                                    labelStyle={styles.inputLabel}
                                    errorStyle={styles.inputError}
                                    style={styles.input}
                                />

                                <Button
                                    title="Masuk"
                                    onPress={handleLogin}
                                    loading={loading}
                                    variant="primary"
                                    size="large"
                                    fullWidth
                                />
                            </View>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>atau</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.registerSection}>
                                <Text style={styles.registerText}>
                                    Belum punya akun?
                                </Text>
                                <Button
                                    title="Daftar Sekarang"
                                    onPress={() => {
                                        router.push('/auth/register');
                                    }}
                                    variant="outline"
                                    size="medium"
                                    fullWidth
                                />
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Dengan masuk, Anda menyetujui{' '}
                                <Text style={styles.link}>Syarat & Ketentuan</Text>
                                {' '}dan{' '}
                                <Text style={styles.link}>Kebijakan Privasi</Text>
                            </Text>
                        </View>
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
        gap: 32,
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
    headerSection: {
        alignItems: 'center',
        gap: 6,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: '700',
        color: AuthColors.onPrimary,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    instructionText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    input: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        paddingVertical: 14,
    },
    inputLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        fontWeight: '600',
    },
    inputError: {
        color: AuthColors.error,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dividerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        paddingHorizontal: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    registerSection: {
        gap: 10,
    },
    registerText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        fontWeight: '600',
    },
    footer: {
        marginTop: 4,
        paddingHorizontal: 16,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        color: AuthColors.onPrimary,
        fontWeight: '700',
    },
});