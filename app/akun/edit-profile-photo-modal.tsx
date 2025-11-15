import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiService } from '../../services/api';

function EditProfilePhotoModal({ visible, onClose, userData, onSave }: {
    visible: boolean;
    onClose: () => void;
    userData: any;
    onSave: (data: any) => void;
}) {
    const [form, setForm] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [fotoDiri, setFotoDiri] = useState<string>('');

    useEffect(() => {
        if (visible && userData) {
            // Set form dengan data user yang ada
            const processedData = {
                no_hp: userData.no_hp || '',
            };
            console.log('User data for profile photo modal:', userData);
            console.log('Processed form data:', processedData);
            setForm(processedData);
            setFotoDiri('');
        }
    }, [visible, userData]);

    const pickImageDiri = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setFotoDiri(result.assets[0].uri);
        }
    };

    const handleChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const handleSave = async () => {
        // Validasi input mandatory untuk API
        if (!form.no_hp) {
            Alert.alert('Error', 'No HP harus diisi');
            return;
        }

        // Cek apakah ada foto yang diupload
        if (!fotoDiri) {
            Alert.alert('Peringatan', 'Pilih foto profile terlebih dahulu');
            return;
        }

        performSave();
    };

    const performSave = async () => {
        setLoading(true);
        try {
            // Siapkan payload sesuai backend
            const payload = {
                no_hp: form.no_hp,
                foto_diri_uri: fotoDiri,
            };

            console.log('Sending payload for profile photo:', payload);

            const response = await apiService.updateProfileFoto(payload);
            console.log('API Response:', response);

            if (response.success) {
                try {
                    const userData = await AsyncStorage.getItem('userData');
                    let parsed = userData ? JSON.parse(userData) : {};
                    // Update foto dengan URL dari response jika ada
                    if (response.data?.data?.foto) {
                        parsed.foto = response.data.data.foto;
                        parsed.foto_diri = response.data.data.foto_diri;
                    }
                    await AsyncStorage.setItem('userData', JSON.stringify(parsed));
                    onSave(parsed);
                    onClose();
                    Alert.alert('Berhasil', 'Foto profile berhasil diupdate');
                } catch (err) {
                    console.error('AsyncStorage error:', err);
                    Alert.alert('Error', 'Gagal update data lokal');
                }
            } else {
                Alert.alert('Gagal', response.message || 'Gagal update foto profile');
            }
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda. Dan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <ScrollView>
                        <View style={styles.header}>
                            <Text style={styles.title}>Update Foto Profile</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#0097A7" />
                            </TouchableOpacity>
                        </View>

                        {/* Upload Foto Profile */}
                        <View style={styles.uploadSection}>
                            <Text style={styles.sectionTitle}>Foto Profile</Text>
                            <TouchableOpacity style={styles.uploadButton} onPress={pickImageDiri} disabled={loading}>
                                <Ionicons name="camera" size={24} color="#0097A7" />
                                <Text style={styles.uploadButtonText}>Pilih Foto Profile</Text>
                            </TouchableOpacity>
                            {fotoDiri ? (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: fotoDiri }} style={styles.previewImage} />
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => setFotoDiri('')}
                                        disabled={loading}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#dc3545" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.placeholderContainer}>
                                    <Ionicons name="person" size={48} color="#6c757d" />
                                    <Text style={styles.placeholderText}>Belum ada foto dipilih</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                            <Text style={styles.saveButtonText}>
                                {loading ? 'Mengupload...' : 'Simpan Foto Profile'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0097A7',
    },
    closeButton: {
        padding: 4,
    },
    uploadSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 12,
    },
    uploadButton: {
        backgroundColor: '#e7f1ff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    uploadButtonText: {
        color: '#0097A7',
        fontSize: 14,
        fontWeight: 'bold',
    },
    previewContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    previewImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#eee',
    },
    removeButton: {
        position: 'absolute',
        top: 0,
        right: '35%',
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    placeholderContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginTop: 8,
    },
    placeholderText: {
        color: '#6c757d',
        fontSize: 14,
        marginTop: 8,
    },
    saveButton: {
        backgroundColor: '#0097A7',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditProfilePhotoModal;
