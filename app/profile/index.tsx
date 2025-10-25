import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/button';
import DropdownInput from '../../components/dropdown-input';
import Input from '../../components/input';
import { apiService } from '../../services/api';

export default function ProfileScreen() {
    const [userData, setUserData] = useState<any>(null);
    const [statusSopir, setStatusSopir] = useState<string>('');
    const [sopirData, setSopirData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>({});
    const [provinsiOptions, setProvinsiOptions] = useState<any[]>([]);
    const [kotaOptions, setKotaOptions] = useState<any[]>([]);
    const [kecamatanOptions, setKecamatanOptions] = useState<any[]>([]);
    const [kendaraanOptions] = useState<any[]>([
        { label: 'Motor', value: 'Motor' },
        { label: 'Mobil', value: 'Mobil' },
        { label: 'Truk', value: 'Truk' },
    ]);

    useEffect(() => {
        console.log('ProfileScreen rendered');
        // fetchUserData();
        
    }, []);

    const fetchUserData = async () => {
        try {
            const user = await AsyncStorage.getItem('userData');
            if (user) {
                const parsedUser = JSON.parse(user);

                // Fetch status sopir
                const resultStatus = await apiService.cekStatusSopir(parsedUser.no_hp);
                if (resultStatus.success) {
                    setSopirData(resultStatus.data?.data || 'Tidak diketahui');
                } else {
                    setSopirData('Gagal memuat');
                }

                // Fetch additional user data from cekNoHpRegistration
                const resultRegistration = await apiService.cekNoHpRegistration(parsedUser.no_hp);
                if (resultRegistration.success) {
                    setUserData(resultRegistration.data?.data);
                    setEditedData(resultRegistration.data?.data);
                    await fetchProvinsi();

                    if (resultRegistration.data?.data?.provinsi_id) {
                        await fetchKota(resultRegistration.data.data.provinsi_id);
                    }
                    if (resultRegistration.data?.data?.kota_id) {
                        await fetchKecamatan(resultRegistration.data.data.kota_id);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setStatusSopir('Error');
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(editedData));
            setUserData(editedData);
            setIsEditing(false);
            Alert.alert('Berhasil', 'Data berhasil diperbarui');
        } catch (error) {
            console.error('Error saving data:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat menyimpan');
        }
    };

    const handleCancel = () => {
        setEditedData(userData);
        setIsEditing(false);
    };

    const handleLogout = () => {
        router.push('/auth/logout');
    };

    const fetchProvinsi = async () => {
        try {
            const response = await apiService.getProvinsi();
            if (response.success) {
                const options = response.data?.data.map((item: any) => ({
                    label: item.province_name || item.nama_provinsi || item.nama,
                    value: String(item.province_id || item.id_provinsi || item.id),
                }));
                setProvinsiOptions(options);
            }
        } catch (error) {
            console.error('Error fetching provinsi:', error);
        }
    };

    const fetchKota = async (provinsiId: string) => {
        try {
            const response = await apiService.getKota(provinsiId);
            if (response.success) {
                const options = response.data?.data.map((item: any) => ({
                    label: item.city_name || item.nama_kota || item.nama,
                    value: String(item.city_id || item.id_kota || item.id),
                }));
                setKotaOptions(options);
            }
        } catch (error) {
            console.error('Error fetching kota:', error);
        }
    };

    const fetchKecamatan = async (kotaId: string) => {
        try {
            const response = await apiService.getKecamatan(kotaId);
            if (response.success) {
                const options = response.data?.data.map((item: any) => ({
                    label: item.subdistrict_name || item.nama_kecamatan || item.nama,
                    value: String(item.subdistrict_id || item.id_kecamatan || item.id),
                }));
                setKecamatanOptions(options);
            }
        } catch (error) {
            console.error('Error fetching kecamatan:', error);
        }
    };

    const updateEditedData = (key: string, value: string) => {
        setEditedData({ ...editedData, [key]: value });

        if (key === 'provinsi_id') {
            fetchKota(value);
            setEditedData({ ...editedData, [key]: value, kota_id: '', kecamatan_id: '' });
            setKotaOptions([]);
            setKecamatanOptions([]);
        } else if (key === 'kota_id') {
            fetchKecamatan(value);
            setEditedData({ ...editedData, [key]: value, kecamatan_id: '' });
            setKecamatanOptions([]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton} accessibilityLabel="Back">
                    <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                    <Text style={{ position: 'absolute', opacity: 0 }}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={{ flex: 1, backgroundColor: '#ffffff' }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ padding: 20 }}>
                        {/* Nama */}
                        <Input
                            label="Nama"
                            value={isEditing ? editedData.nama_lengkap || '' : userData?.nama_lengkap || 'N/A'}
                            onChangeText={(text) => updateEditedData('nama_lengkap', text)}
                            editable={isEditing}
                        />

                        {/* Provinsi */}
                        <DropdownInput
                            label="Provinsi"
                            value={isEditing ? editedData.provinsi_id || '' : userData?.provinsi_id || ''}
                            onChange={(value) => updateEditedData('provinsi_id', value)}
                            options={provinsiOptions}
                            disabled={!isEditing}
                        />

                        {/* Kota */}
                        <DropdownInput
                            label="Kota"
                            value={isEditing ? editedData.kota_id || '' : userData?.kota_id || ''}
                            onChange={(value) => updateEditedData('kota_id', value)}
                            options={kotaOptions}
                            disabled={!isEditing}
                        />

                        {/* Kecamatan */}
                        <DropdownInput
                            label="Kecamatan"
                            value={isEditing ? editedData.kecamatan_id || '' : userData?.kecamatan_id || ''}
                            onChange={(value) => updateEditedData('kecamatan_id', value)}
                            options={kecamatanOptions}
                            disabled={!isEditing}
                        />

                        {/* Alamat */}
                        <Input
                            label="Alamat"
                            value={isEditing ? editedData.alamat || '' : userData?.alamat || 'N/A'}
                            onChangeText={(text) => updateEditedData('alamat', text)}
                            multiline
                            editable={isEditing}
                        />

                        {/* No HP */}
                        <Input
                            label="No HP"
                            value={isEditing ? editedData.no_hp || '' : userData?.no_hp || 'N/A'}
                            onChangeText={(text) => updateEditedData('no_hp', text)}
                            editable={isEditing}
                        />

                        {/* Email */}
                        <Input
                            label="Email"
                            value={isEditing ? editedData.email || '' : userData?.email || 'N/A'}
                            onChangeText={(text) => updateEditedData('email', text)}
                            editable={isEditing}
                        />

                        {/* Kendaraan */}
                        <DropdownInput
                            label="Kendaraan"
                            value={isEditing ? editedData.kendaraan || '' : userData?.kendaraan || ''}
                            onChange={(value) => updateEditedData('kendaraan', value)}
                            options={kendaraanOptions}
                            disabled={!isEditing}
                        />

                        {/* Merek */}
                        <Input
                            label="Merek"
                            value={isEditing ? editedData.merek || '' : userData?.merek || 'N/A'}
                            onChangeText={(text) => updateEditedData('merek', text)}
                            editable={isEditing}
                        />

                        {/* Plat Nomor Kendaraan */}
                        <Input
                            label="Plat Nomor Kendaraan"
                            value={isEditing ? editedData.plat_nomor || '' : userData?.plat_nomor || 'N/A'}
                            onChangeText={(text) => updateEditedData('plat_nomor', text)}
                            editable={isEditing}
                        />

                        {/* Status Sopir */}
                        <Input
                            label="Status Sopir"
                            value={sopirData?.status || 'N/A'}
                            editable={false}
                        />

                        {/* Buttons */}
                        {!isEditing ? (
                            <View>
                                <Button title="Edit Profile" onPress={handleEdit} variant="primary" />
                                <View style={{ height: 16 }} />
                                <Button title="Logout" onPress={handleLogout} variant="secondary" />
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Button title="Cancel" onPress={handleCancel} variant="secondary" />
                                <Button title="Save" onPress={handleSave} variant="primary" />
                            </View>
                        )}


                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Hide default header for this screen
export const options = {
    headerShown: false,
};

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
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
