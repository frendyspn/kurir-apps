import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Input from '@/components/input';
import { apiService } from '@/services/api';

export default function TambahKontakScreen() {
    const [formData, setFormData] = useState({
        nama: '',
        no_hp: '',
        alamat: '',
    });

    const [loading, setLoading] = useState(false);
    const [idKonsumen, setIdKonsumen] = useState<string>('');

    useEffect(() => {
        const getIdKonsumen = async () => {
            try {
                const storedId = await AsyncStorage.getItem('userData');
                if (storedId) {
                    const userData = JSON.parse(storedId);
                    setIdKonsumen(userData.id_konsumen);
                }
            } catch (error) {
                console.error('Error getting id_konsumen from AsyncStorage:', error);
            }
        };

        getIdKonsumen();

        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (!formData.nama.trim()) {
            Alert.alert('Error', 'Nama kontak harus diisi');
            return false;
        }
        if (!formData.no_hp.trim()) {
            Alert.alert('Error', 'Nomor HP harus diisi');
            return false;
        }
        if (!formData.alamat.trim()) {
            Alert.alert('Error', 'Alamat harus diisi');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        if (!idKonsumen) {
            Alert.alert('Error', 'ID Konsumen tidak ditemukan. Silakan login kembali.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.addKonsumen({
                id_konsumen: idKonsumen,
                nama_lengkap: formData.nama,
                no_hp: formData.no_hp,
                alamat_lengkap: formData.alamat,
            });

            if (response.success) {
                Alert.alert(
                    'Berhasil',
                    'Kontak berhasil ditambahkan',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                );
            } else {
                Alert.alert('Error', response.message || 'Gagal menambahkan kontak');
            }
        } catch (error) {
            Alert.alert('Error', 'Terjadi kesalahan saat menyimpan kontak');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            {/* Header Custom */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.logo}>Tambah Kontak</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Form Container */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Informasi Kontak</Text>

                    {/* Nama Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nama Lengkap</Text>
                        <Input
                            placeholder="Masukkan nama lengkap"
                            value={formData.nama}
                            onChangeText={(value) => handleInputChange('nama', value)}
                            style={styles.input}
                        />
                    </View>

                    {/* No HP Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nomor HP</Text>
                        <Input
                            placeholder="Masukkan nomor HP"
                            value={formData.no_hp}
                            onChangeText={(value) => handleInputChange('no_hp', value)}
                            keyboardType="phone-pad"
                            style={styles.input}
                        />
                    </View>

                    {/* Alamat Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Alamat</Text>
                        <Input
                            placeholder="Masukkan alamat lengkap"
                            value={formData.alamat}
                            onChangeText={(value) => handleInputChange('alamat', value)}
                            multiline
                            numberOfLines={3}
                            style={[styles.input, styles.textArea]}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Menyimpan...' : 'Simpan Kontak'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#0097A7',
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
        padding: 16,
    },
    formContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#ffffff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#0097A7',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    submitButtonDisabled: {
        backgroundColor: '#6c757d',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
