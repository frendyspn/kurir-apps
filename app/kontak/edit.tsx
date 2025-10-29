import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Contact = {
    id_konsumen: string;
    nama_lengkap: string;
    no_hp: string;
    type: string;
    alamat_lengkap: string;
};

export default function EditKontakScreen() {
    const navigation = useNavigation();
    const { contact } = useLocalSearchParams<{ contact: string }>();
    const contactData: Contact = contact ? JSON.parse(contact) : null;

    // Form states
    const [namaLengkap, setNamaLengkap] = useState('');
    const [noHp, setNoHp] = useState('');
    const [alamatLengkap, setAlamatLengkap] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Triple protection against headers
        navigation.setOptions({
            headerShown: false,
            header: () => null,
            headerTitle: '',
            headerLeft: () => null,
            headerRight: () => null,
            headerBackVisible: false,
            headerBackTitleVisible: false,
        });

        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, [navigation]);

    // Initialize form with contact data
    useEffect(() => {
        if (contactData && !namaLengkap && !noHp && !alamatLengkap) {
            setNamaLengkap(contactData.nama_lengkap || '');
            setNoHp(contactData.no_hp || '');
            setAlamatLengkap(contactData.alamat_lengkap || '');
        }
    }, [contactData, namaLengkap, noHp, alamatLengkap]);

    if (!contactData) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Data kontak tidak ditemukan</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleSubmit = async () => {
        // Validation
        if (!namaLengkap.trim()) {
            Alert.alert('Perhatian', 'Nama lengkap harus diisi');
            return;
        }

        if (!noHp.trim()) {
            Alert.alert('Perhatian', 'Nomor HP harus diisi');
            return;
        }

        if (!alamatLengkap.trim()) {
            Alert.alert('Perhatian', 'Alamat lengkap harus diisi');
            return;
        }

        try {
            setLoading(true);

            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            const user = JSON.parse(userData);

            const requestData = {
                id_konsumen: contactData.id_konsumen,
                nama_lengkap: namaLengkap.trim(),
                no_hp: noHp.trim(),
                alamat_lengkap: alamatLengkap.trim(),
                no_hp_user: user.no_hp,
            };

            const response = await apiService.updateKontak(requestData);

            if (response.success) {
                // Prepare updated contact data to send back
                const updatedContactData = {
                    ...contactData,
                    nama_lengkap: namaLengkap.trim(),
                    no_hp: noHp.trim(),
                    alamat_lengkap: alamatLengkap.trim(),
                };

                Alert.alert('Berhasil', 'Kontak berhasil diperbarui', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigate back with updated data
                            router.replace({
                                pathname: '/kontak/detail',
                                params: { 
                                    contact: JSON.stringify(updatedContactData),
                                    refresh: 'true' // Flag to indicate data was updated
                                }
                            });
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal memperbarui kontak');
            }
        } catch (error) {
            console.error('Error updating kontak:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memperbarui kontak');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            {/* Header Custom */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.logo}>Edit Kontak</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                {/* Form Section */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Informasi Kontak</Text>

                    {/* Nama Lengkap */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Nama Lengkap *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={namaLengkap}
                            onChangeText={setNamaLengkap}
                            placeholder="Masukkan nama lengkap"
                            placeholderTextColor="#adb5bd"
                            returnKeyType="next"
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Nomor HP */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Nomor HP *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={noHp}
                            onChangeText={setNoHp}
                            placeholder="Masukkan nomor HP"
                            placeholderTextColor="#adb5bd"
                            keyboardType="phone-pad"
                            returnKeyType="next"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Alamat Lengkap */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Alamat Lengkap *</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={alamatLengkap}
                            onChangeText={setAlamatLengkap}
                            placeholder="Masukkan alamat lengkap"
                            placeholderTextColor="#adb5bd"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            returnKeyType="default"
                            autoCapitalize="sentences"
                            autoCorrect={true}
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                            <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 32 }} />
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#0d6efd',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        flex: 1,
    },
    headerBackButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#0d6efd',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    formSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: '#212529',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d6efd',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonDisabled: {
        backgroundColor: '#6c757d',
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
