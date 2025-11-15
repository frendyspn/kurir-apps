import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePickerInput from '../../components/date-picker-input';
import DropdownInput from '../../components/dropdown-input';
import Input from '../../components/input';
import { apiService } from '../../services/api';

export default function EditProfileModal({ visible, onClose, userData, onSave }: {
    visible: boolean;
    onClose: () => void;
    userData: any;
    onSave: (data: any) => void;
}) {
    const [form, setForm] = useState<any>({});
    const [tanggalLahir, setTanggalLahir] = useState<Date | null>(null);
    const [provinsiOptions, setProvinsiOptions] = useState<any[]>([]);
    const [kotaOptions, setKotaOptions] = useState<any[]>([]);
    const [kecamatanOptions, setKecamatanOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && userData) {
            // Pastikan provinsi_id, kota_id, kecamatan_id bertipe string
            setForm({
                ...userData,
                provinsi_id: userData.provinsi_id ? String(userData.provinsi_id) : '',
                kota_id: userData.kota_id ? String(userData.kota_id) : '',
                kecamatan_id: userData.kecamatan_id ? String(userData.kecamatan_id) : '',
            });

            // Convert tanggal_lahir string ke Date object
            if (userData.tanggal_lahir) {
                const dateParts = userData.tanggal_lahir.split('-'); // Format: YYYY-MM-DD
                if (dateParts.length === 3) {
                    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    setTanggalLahir(date);
                }
            } else {
                setTanggalLahir(null);
            }

            fetchProvinsi();
            if (userData.provinsi_id) fetchKota(String(userData.provinsi_id));
            if (userData.kota_id) fetchKecamatan(String(userData.kota_id));
        }
    }, [visible, userData]);

    const fetchProvinsi = async () => {
        const response = await apiService.getProvinsi();
        if (response.success) {
            const options = response.data?.data.map((item: any) => ({
                label: item.province_name || item.nama_provinsi || item.nama,
                value: String(item.province_id || item.id_provinsi || item.id),
            }));
            setProvinsiOptions(options);
        }
    };

    const fetchKota = async (provinsiId: string) => {
        const response = await apiService.getKota(provinsiId);
        if (response.success) {
            const options = response.data?.data.map((item: any) => ({
                label: item.city_name || item.nama_kota || item.nama,
                value: String(item.city_id || item.id_kota || item.id),
            }));
            setKotaOptions(options);
        }
    };

    const fetchKecamatan = async (kotaId: string) => {
        const response = await apiService.getKecamatan(kotaId);
        if (response.success) {
            const options = response.data?.data.map((item: any) => ({
                label: item.subdistrict_name || item.nama_kecamatan || item.nama,
                value: String(item.subdistrict_id || item.id_kecamatan || item.id),
            }));
            setKecamatanOptions(options);
        }
    };

    const handleChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
        if (key === 'provinsi_id') {
            fetchKota(value);
            setForm({ ...form, [key]: value, kota_id: '', kecamatan_id: '' });
            setKotaOptions([]);
            setKecamatanOptions([]);
        } else if (key === 'kota_id') {
            fetchKecamatan(value);
            setForm({ ...form, [key]: value, kecamatan_id: '' });
            setKecamatanOptions([]);
        }
    };

    const handleSave = async () => {
        setLoading(true);

        // Convert Date object ke string format YYYY-MM-DD
        const tanggalLahirString = tanggalLahir
            ? `${tanggalLahir.getFullYear()}-${String(tanggalLahir.getMonth() + 1).padStart(2, '0')}-${String(tanggalLahir.getDate()).padStart(2, '0')}`
            : '';

        const payload = {
            id_konsumen: form.id_konsumen,
            no_hp: form.no_hp,
            nama_lengkap: form.nama_lengkap,
            email: form.email,
            jenis_kelamin: form.jenis_kelamin,
            tanggal_lahir: tanggalLahirString,
            tempat_lahir: form.tempat_lahir,
            provinsi_id: form.provinsi_id,
            kota_id: form.kota_id,
            kecamatan_id: form.kecamatan_id,
            alamat: form.alamat_lengkap || form.alamat,
        };

        const response = await apiService.updateKonsumen(payload);
        if (response.success) {
            try {
                const userData = await AsyncStorage.getItem('userData');
                let parsed = userData ? JSON.parse(userData) : {};
                parsed = { ...parsed, ...payload };
                await AsyncStorage.setItem('userData', JSON.stringify(parsed));
                onSave(parsed);
                onClose();
                Alert.alert('Berhasil', 'Data profil berhasil diupdate');
            } catch (err) {
                Alert.alert('Error', 'Gagal update data lokal');
            }
        } else {
            Alert.alert('Gagal', response.message || 'Gagal update data');
        }
        setLoading(false);
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
                    <View style={styles.header}>
                        <Text style={styles.title}>Update Profile</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#0097A7" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 16 }}>
                        <View style={styles.formGroup}>
                            
                            <Input
                                label="Nama Lengkap"
                                value={form.nama_lengkap || ''}
                                editable={false}
                            />
                            <Input
                                label="No HP"
                                value={form.no_hp || ''}
                                onChangeText={text => handleChange('no_hp', text)}
                                keyboardType="numeric"
                            />
                            <Input
                                label="Email"
                                value={form.email || ''}
                                onChangeText={text => handleChange('email', text)}
                            />
                            <Input
                                label="Tempat Lahir"
                                value={form.tempat_lahir || ''}
                                onChangeText={text => handleChange('tempat_lahir', text)}
                            />
                            <DatePickerInput
                                label="Tanggal Lahir"
                                value={tanggalLahir || new Date()}
                                onChange={setTanggalLahir}
                                placeholder="Pilih tanggal lahir"
                            />
                            <Input
                                label="Alamat"
                                value={form.alamat_lengkap || ''}
                                onChangeText={text => handleChange('alamat_lengkap', text)}
                            />
                            <DropdownInput
                                label="Provinsi"
                                value={form.provinsi_id || ''}
                                onChange={value => handleChange('provinsi_id', value)}
                                options={provinsiOptions}
                            />
                            <DropdownInput
                                label="Kota"
                                value={form.kota_id || ''}
                                onChange={value => handleChange('kota_id', value)}
                                options={kotaOptions}
                            />
                            <DropdownInput
                                label="Kecamatan"
                                value={form.kecamatan_id || ''}
                                onChange={value => handleChange('kecamatan_id', value)}
                                options={kecamatanOptions}
                            />
                        </View>
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>{loading ? 'Loading...' : 'Simpan'}</Text>
                    </TouchableOpacity>
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
