import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../../components/button';
import Input from '../../../components/input';

export default function RegisterScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePhoneNumber = (phone: string): boolean => {
        const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
        return phoneRegex.test(phone);
    };

    const handleNext = async () => {
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
            // Call API to check if phone number exists
            const result = await apiService.cekNoHpRegistration(phoneNumber);
            
            if (result.data.success) {
                // Navigate ke detail screen dengan phone number dan status registrasi
                router.push({
                    pathname: '/auth/register/detail',
                    params: { 
                        phone: phoneNumber,
                        isRegistered: result.data?.registered ? 'true' : 'false',
                        existingData: result.data?.data ? JSON.stringify(result.data.data) : ''
                    }
                });
            } else {
                setError(result.data.message || 'Gagal memeriksa nomor HP');
            }
        } catch (err) {
            console.error('Check phone error:', err);
            setError('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                            <Text style={styles.title}>Daftar Akun</Text>
                            <Text style={styles.subtitle}>
                                Masukkan nomor HP Anda untuk mendaftar
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
                                title="Lanjutkan"
                                onPress={handleNext}
                                loading={loading}
                                variant="primary"
                            />
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Sudah punya akun?{' '}
                                <Text 
                                    style={styles.link}
                                    onPress={() => router.back()}
                                >
                                    Masuk di sini
                                </Text>
                            </Text>
                        </View>

                        <View style={styles.termsFooter}>
                            <Text style={styles.termsText}>
                                Dengan mendaftar, Anda menyetujui{' '}
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
        color: '#0d6efd',
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
        gap: 16,
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 15,
        color: '#212529',
        textAlign: 'center',
    },
    termsFooter: {
        marginTop: 16,
    },
    termsText: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        color: '#0d6efd',
        fontWeight: '600',
    },
});
