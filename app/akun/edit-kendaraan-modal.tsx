import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropdownInput from '../../components/dropdown-input';
import { apiService } from '../../services/api';

export default function EditKendaraanModal({ visible, onClose, kendaraanData, onSave }: {
    visible: boolean;
    onClose: () => void;
    kendaraanData: any;
    onSave: (data: any) => void;
}) {
    const [form, setForm] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [fotoSim, setFotoSim] = useState<string>('');
    const [fotoStnk, setFotoStnk] = useState<string>('');

    useEffect(() => {
        if (visible && kendaraanData) {
            // Convert id_jenis_kendaraan to string for dropdown compatibility
            const processedData = { ...kendaraanData };
            if (processedData.id_jenis_kendaraan !== undefined && processedData.id_jenis_kendaraan !== null) {
                processedData.id_jenis_kendaraan = processedData.id_jenis_kendaraan.toString();
            }
            setForm(processedData);
            setFotoSim('');
            setFotoStnk('');
        }
    }, [visible, kendaraanData]);
    const pickImageSim = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setFotoSim(result.assets[0].uri);
        }
    };

    const pickImageStnk = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setFotoStnk(result.assets[0].uri);
        }
    };

    const handleChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const handleSave = async () => {
        // Validasi input
        if (!form.id_jenis_kendaraan && !form.type_kendaraan && !form.jenis_kendaraan) {
            Alert.alert('Error', 'Tipe kendaraan harus diisi');
            return;
        }
        if (!form.merek) {
            Alert.alert('Error', 'Merek kendaraan harus diisi');
            return;
        }
        if (!form.plat_nomor) {
            Alert.alert('Error', 'Plat nomor harus diisi');
            return;
        }

        // Cek apakah ada file yang diupload
        if (!fotoSim && !fotoStnk) {
            Alert.alert('Peringatan', 'Disarankan untuk mengupload foto SIM dan STNK untuk verifikasi. Lanjutkan tanpa upload?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Lanjutkan', onPress: () => performSave() }
            ]);
            return;
        }

        performSave();
    };

    const performSave = async () => {
        setLoading(true);
        try {
            // Siapkan payload sesuai backend
            const typeKendaraan = form.id_jenis_kendaraan === '1' ? 'Motor' : form.id_jenis_kendaraan === '2' ? 'Mobil' : (form.type_kendaraan || form.jenis_kendaraan);
            const payload = {
                no_hp: form.no_hp,
                type_kendaraan: form.id_jenis_kendaraan,
                merek: form.merek,
                plat_nomor: form.plat_nomor,
                foto_sim_uri: fotoSim || undefined,
                foto_stnk_uri: fotoStnk || undefined,
            };

            console.log('Sending payload:', payload);

            const response = await apiService.updateKelengkapanData(payload);
            console.log('API Response:', response);

            if (response.success) {
                try {
                    const userData = await AsyncStorage.getItem('userData');
                    let parsed = userData ? JSON.parse(userData) : {};
                    parsed = { ...parsed, ...payload };
                    await AsyncStorage.setItem('userData', JSON.stringify(parsed));
                    onSave(parsed);
                    onClose();
                    Alert.alert('Berhasil', 'Data kendaraan berhasil diupdate');
                } catch (err) {
                    console.error('AsyncStorage error:', err);
                    Alert.alert('Error', 'Gagal update data lokal');
                }
            } else {
                Alert.alert('Gagal', response.message || 'Gagal update data');
            }
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda.');
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
                            <Text style={styles.title}>Edit Kendaraan</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#0097A7" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.uploadSection}>
                            <Text style={styles.label}>Upload Foto SIM</Text>
                            <TouchableOpacity style={styles.uploadButton} onPress={pickImageSim} disabled={loading}>
                                <Text style={styles.uploadButtonText}>Pilih Foto SIM</Text>
                            </TouchableOpacity>
                            {fotoSim ? (
                                <Image source={{ uri: fotoSim }} style={styles.previewImage} />
                            ) : null}
                            <Text style={styles.label}>Upload Foto STNK</Text>
                            <TouchableOpacity style={styles.uploadButton} onPress={pickImageStnk} disabled={loading}>
                                <Text style={styles.uploadButtonText}>Pilih Foto STNK</Text>
                            </TouchableOpacity>
                            {fotoStnk ? (
                                <Image source={{ uri: fotoStnk }} style={styles.previewImage} />
                            ) : null}
                        </View>
                        <View style={styles.formGroup}>
                            <DropdownInput
                                label="Tipe Kendaraan"
                                value={form.id_jenis_kendaraan || form.jenis_kendaraan || ''}
                                onChange={(value) => handleChange('id_jenis_kendaraan', value)}
                                options={[
                                    { label: 'Motor', value: '1' },
                                    { label: 'Mobil', value: '2' }
                                ]}
                                placeholder="Pilih tipe kendaraan"
                            />
                            <Text style={styles.label}>Merek</Text>
                            <TextInput
                                style={styles.input}
                                value={form.merek || ''}
                                onChangeText={text => handleChange('merek', text)}
                            />
                            <Text style={styles.label}>Plat Nomor</Text>
                            <TextInput
                                style={styles.input}
                                value={form.plat_nomor || ''}
                                onChangeText={text => handleChange('plat_nomor', text)}
                            />
                        </View>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                            <Text style={styles.saveButtonText}>{loading ? 'Loading...' : 'Simpan'}</Text>
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
    formGroup: {
        marginTop: 8,
    },
    label: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#212529',
        marginTop: 4,
        marginBottom: 8,
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
    uploadSection: {
        marginBottom: 8,
    },
    uploadButton: {
        backgroundColor: '#e7f1ff',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    uploadButtonText: {
        color: '#0097A7',
        fontSize: 14,
        fontWeight: 'bold',
    },
    previewImage: {
        width: 120,
        height: 80,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#eee',
    },
});
