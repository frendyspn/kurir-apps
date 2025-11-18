import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/button';
import Input from '../../components/input';
import { APP_NAME } from '../../constant';
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
                router.push({
                    pathname: '/auth/otp',
                    params: { 
                        phone: phoneNumber,
                        otp: result.data?.Message // Untuk development
                    }
                });
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
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="never"
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{APP_NAME}</Text>
                            <Text style={styles.subtitle}>
                                Masukkan nomor HP Anda untuk masuk
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <Input
                                label="Nomor HP"
                                placeholder="Contoh: 081234567890"
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={(text) => {
                                    setPhoneNumber(text);
                                    setError('');
                                }}
                                maxLength={15}
                                error={error}
                            />

                            <Button
                                title="Masuk"
                                onPress={handleLogin}
                                loading={loading}
                                variant="primary"
                            />
                        </View>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>atau</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Register Section */}
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
                            />
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
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        flexGrow: 1,
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
        color: '#0097A7',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        marginBottom: 24,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#dee2e6',
    },
    dividerText: {
        fontSize: 14,
        color: '#6c757d',
        paddingHorizontal: 16,
        fontWeight: '500',
    },
    registerSection: {
        marginBottom: 24,
        gap: 12,
    },
    registerText: {
        fontSize: 15,
        color: '#212529',
        textAlign: 'center',
        fontWeight: '500',
    },
    footer: {
        marginTop: 24,
    },
    footerText: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        color: '#0097A7',
        fontWeight: '500',
    },
});