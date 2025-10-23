import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../../components/button';
import DatePickerInput from '../../../components/date-picker-input';
import DropdownInput from '../../../components/dropdown-input';
import Input from '../../../components/input';
import { apiService } from '../../../services/api';

export default function RegisterDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const phoneNumber = params.phone as string;
    const userData = params.existingData ? JSON.parse(params.existingData as string) : null;
    
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    console.log('Existing User Data:', userData);
    
    // Form state
    const [namaLengkap, setNamaLengkap] = useState(userData?.nama_lengkap || '');
    const [email, setEmail] = useState(userData?.email || '');
    const [jenisKelamin, setJenisKelamin] = useState(() => {
        if (!userData?.jenis_kelamin) return '';
        const value = String(userData.jenis_kelamin).toUpperCase();
        // Normalize to 'L' or 'P'
        if (value.startsWith('L') || value === 'LAKI-LAKI') return 'L';
        if (value.startsWith('P') || value === 'PEREMPUAN') return 'P';
        return value;
    });
    const [tanggalLahir, setTanggalLahir] = useState<Date>(
        userData?.tanggal_lahir ? new Date(userData.tanggal_lahir) : new Date()
    );
    const [tempatLahir, setTempatLahir] = useState(userData?.tempat_lahir || '');
    const [provinsi, setProvinsi] = useState(userData?.provinsi_id ? String(userData.provinsi_id) : '');
    const [kota, setKota] = useState(userData?.kota_id ? String(userData.kota_id) : '');
    const [kecamatan, setKecamatan] = useState(userData?.kecamatan_id ? String(userData.kecamatan_id) : '');
    const [alamat, setAlamat] = useState(userData?.alamat_lengkap || '');
    const [errors, setErrors] = useState<any>({});

    // Dropdown options
    const [provinsiOptions, setProvinsiOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [kotaOptions, setKotaOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [kecamatanOptions, setKecamatanOptions] = useState<Array<{ label: string; value: string }>>([]);
    
    // Loading states
    const [loadingProvinsi, setLoadingProvinsi] = useState(false);
    const [loadingKota, setLoadingKota] = useState(false);
    const [loadingKecamatan, setLoadingKecamatan] = useState(false);

    // Jenis Kelamin options
    const jenisKelaminOptions = [
        { label: 'Laki-laki', value: 'L' },
        { label: 'Perempuan', value: 'P' },
    ];

    useEffect(() => {
        // Fetch provinsi on mount
        fetchProvinsi();
        
        // If user has existing provinsi, fetch kota and keep the selected value
        if (userData?.provinsi_id) {
            fetchKota(userData.provinsi_id, true).then(() => {
                // After kota options loaded, if user has existing kota, fetch kecamatan and keep value
                if (userData?.kota_id) {
                    fetchKecamatan(userData.kota_id, true);
                }
            });
        }
    }, []);

    // Fetch provinsi from API
    const fetchProvinsi = async () => {
        setLoadingProvinsi(true);
        try {
            const response = await apiService.getProvinsi();
            console.log('Provinsi API Response:', JSON.stringify(response, null, 2));
            
            // Check nested data structure
            const provinsiArray = response.data?.data || response.data;
            
            if (response.success && provinsiArray && Array.isArray(provinsiArray)) {
                const provinsiData = provinsiArray.map((item: any) => ({
                    label: item.province_name || item.nama_provinsi || item.nama,
                    value: String(item.province_id || item.id_provinsi || item.id),
                }));
                setProvinsiOptions(provinsiData);
            } else {
                console.error('Failed to fetch provinsi:', response.message);
                console.error('Response data type:', typeof response.data);
                setProvinsiOptions([]);
            }
        } catch (error) {
            console.error('Error fetching provinsi:', error);
            setProvinsiOptions([]);
        } finally {
            setLoadingProvinsi(false);
        }
    };

    // Fetch kota based on provinsi
    const fetchKota = async (provinsiId: string, keepKotaValue = false) => {
        setLoadingKota(true);
        setKotaOptions([]);
        setKecamatanOptions([]);
        if (!keepKotaValue) {
            setKota('');
            setKecamatan('');
        }
        
        try {
            const response = await apiService.getKota(provinsiId);
            console.log('Kota API Response:', JSON.stringify(response, null, 2));
            
            // Check nested data structure
            const kotaArray = response.data?.data || response.data;
            
            if (response.success && kotaArray && Array.isArray(kotaArray)) {
                const kotaData = kotaArray.map((item: any) => ({
                    label: item.city_name || item.nama_kota || item.nama,
                    value: String(item.city_id || item.id_kota || item.id),
                }));
                setKotaOptions(kotaData);
            } else {
                console.error('Failed to fetch kota:', response.message);
                console.error('Response data type:', typeof response.data);
                setKotaOptions([]);
            }
        } catch (error) {
            console.error('Error fetching kota:', error);
            setKotaOptions([]);
        } finally {
            setLoadingKota(false);
        }
    };

    const fetchKecamatan = async (kotaId: string, keepKecamatanValue = false) => {
        setLoadingKecamatan(true);
        setKecamatanOptions([]);
        if (!keepKecamatanValue) {
            setKecamatan('');
        }
        
        try {
            const response = await apiService.getKecamatan(kotaId);
            console.log('Kecamatan API Response:', JSON.stringify(response, null, 2));
            
            // Check nested data structure
            const kecamatanArray = response.data?.data || response.data;
            
            if (response.success && kecamatanArray && Array.isArray(kecamatanArray)) {
                const kecamatanData = kecamatanArray.map((item: any) => ({
                    label: item.subdistrict_name || item.nama_kecamatan || item.nama,
                    value: String(item.subdistrict_id || item.id_kecamatan || item.id),
                }));
                setKecamatanOptions(kecamatanData);
            } else {
                console.error('Failed to fetch kecamatan:', response.message || 'Data is not an array');
                console.error('Response data type:', typeof response.data);
                console.error('Is array?', Array.isArray(response.data));
                setKecamatanOptions([]);
            }
        } catch (error) {
            console.error('Error fetching kecamatan:', error);
            setKecamatanOptions([]);
        } finally {
            setLoadingKecamatan(false);
        }
    };

    const handleProvinsiChange = (value: string) => {
        setProvinsi(value);
        if (value) {
            fetchKota(value);
        } else {
            setKotaOptions([]);
            setKecamatanOptions([]);
            setKota('');
            setKecamatan('');
        }
    };

    // Handle kota change
    const handleKotaChange = (value: string) => {
        setKota(value);
        if (value) {
            fetchKecamatan(value);
        } else {
            setKecamatanOptions([]);
            setKecamatan('');
        }
    };

    const fetchUserData = async () => {
        setLoadingData(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: any = {};

        // Validasi Nama Lengkap
        if (!namaLengkap.trim()) {
            newErrors.namaLengkap = 'Nama lengkap harus diisi';
        } else if (namaLengkap.trim().length < 3) {
            newErrors.namaLengkap = 'Nama lengkap minimal 3 karakter';
        }

        // Validasi Email
        if (!email.trim()) {
            newErrors.email = 'Email harus diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Format email tidak valid (contoh: nama@email.com)';
        }

        // Validasi Jenis Kelamin
        if (!jenisKelamin) {
            newErrors.jenisKelamin = 'Jenis kelamin harus dipilih';
        }

        // Validasi Tempat Lahir
        if (!tempatLahir.trim()) {
            newErrors.tempatLahir = 'Tempat lahir harus diisi';
        } else if (tempatLahir.trim().length < 3) {
            newErrors.tempatLahir = 'Tempat lahir minimal 3 karakter';
        }

        // Validasi Tanggal Lahir (minimal 17 tahun)
        const today = new Date();
        const birthDate = new Date(tanggalLahir);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 17) {
            newErrors.tanggalLahir = 'Usia minimal 17 tahun untuk mendaftar';
        } else if (birthDate > today) {
            newErrors.tanggalLahir = 'Tanggal lahir tidak valid';
        }

        // Validasi Provinsi
        if (!provinsi) {
            newErrors.provinsi = 'Provinsi harus dipilih';
        }

        // Validasi Kota
        if (!kota) {
            newErrors.kota = 'Kota/Kabupaten harus dipilih';
        }

        // Validasi Kecamatan
        if (!kecamatan) {
            newErrors.kecamatan = 'Kecamatan harus dipilih';
        }

        // Validasi Alamat
        if (!alamat.trim()) {
            newErrors.alamat = 'Alamat lengkap harus diisi';
        } else if (alamat.trim().length < 10) {
            newErrors.alamat = 'Alamat minimal 10 karakter';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Format tanggal lahir
            const formattedTanggalLahir = tanggalLahir.toISOString().split('T')[0];
            
            // Navigate to OTP screen for verification
            router.push({
                pathname: '/auth/register/otp',
                params: {
                    phone: phoneNumber,
                    nama_lengkap: namaLengkap,
                    email: email,
                    jenis_kelamin: jenisKelamin,
                    tanggal_lahir: formattedTanggalLahir,
                    tempat_lahir: tempatLahir,
                    provinsi_id: provinsi,
                    kota_id: kota,
                    kecamatan_id: kecamatan,
                    alamat: alamat,
                }
            });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Memuat data...</Text>
            </View>
        );
    }

    return (
        <>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Data Diri</Text>
                    
                    <View style={styles.headerRight} />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Lengkapi Data Diri Anda</Text>
                        <Text style={styles.sectionSubtitle}>
                            Data ini akan digunakan untuk profil akun Anda
                        </Text>

                        <View style={styles.form}>
                            {/* Nomor HP (Read only) */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Nomor HP</Text>
                                <View style={styles.readOnlyInput}>
                                    <Text style={styles.readOnlyText}>{phoneNumber}</Text>
                                </View>
                            </View>

                            {/* Nama Lengkap */}
                            <Input
                                label="Nama Lengkap"
                                placeholder="Masukkan nama lengkap"
                                value={namaLengkap}
                                onChangeText={(text) => {
                                    setNamaLengkap(text);
                                    if (errors.namaLengkap) {
                                        setErrors({ ...errors, namaLengkap: undefined });
                                    }
                                }}
                                error={errors.namaLengkap}
                            />

                            {/* Email */}
                            <Input
                                label="Email"
                                placeholder="contoh@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errors.email) {
                                        setErrors({ ...errors, email: undefined });
                                    }
                                }}
                                error={errors.email}
                            />

                            {/* Jenis Kelamin */}
                            <DropdownInput
                                label="Jenis Kelamin"
                                value={jenisKelamin}
                                onChange={(value) => {
                                    setJenisKelamin(value);
                                    if (errors.jenisKelamin) {
                                        setErrors({ ...errors, jenisKelamin: undefined });
                                    }
                                }}
                                options={jenisKelaminOptions}
                                placeholder="Pilih jenis kelamin"
                                error={errors.jenisKelamin}
                            />

                            {/* Tempat Lahir */}
                            <Input
                                label="Tempat Lahir"
                                placeholder="Masukkan tempat lahir"
                                value={tempatLahir}
                                onChangeText={(text) => {
                                    setTempatLahir(text);
                                    if (errors.tempatLahir) {
                                        setErrors({ ...errors, tempatLahir: undefined });
                                    }
                                }}
                                error={errors.tempatLahir}
                            />

                            {/* Tanggal Lahir */}
                            <DatePickerInput
                                label="Tanggal Lahir"
                                value={tanggalLahir}
                                onChange={(date) => {
                                    setTanggalLahir(date);
                                    if (errors.tanggalLahir) {
                                        setErrors({ ...errors, tanggalLahir: undefined });
                                    }
                                }}
                                placeholder="Pilih tanggal lahir"
                                error={errors.tanggalLahir}
                            />

                            {/* Provinsi */}
                            {loadingProvinsi ? (
                                <View style={styles.loadingField}>
                                    <ActivityIndicator size="small" color="#0d6efd" />
                                    <Text style={styles.loadingFieldText}>Memuat provinsi...</Text>
                                </View>
                            ) : (
                                <DropdownInput
                                    label="Provinsi"
                                    value={provinsi}
                                    onChange={handleProvinsiChange}
                                    options={provinsiOptions}
                                    placeholder="Pilih provinsi"
                                    error={errors.provinsi}
                                />
                            )}

                            {/* Kota/Kabupaten */}
                            {loadingKota ? (
                                <View style={styles.loadingField}>
                                    <ActivityIndicator size="small" color="#0d6efd" />
                                    <Text style={styles.loadingFieldText}>Memuat kota...</Text>
                                </View>
                            ) : (
                                <DropdownInput
                                    label="Kota/Kabupaten"
                                    value={kota}
                                    onChange={handleKotaChange}
                                    options={kotaOptions}
                                    placeholder="Pilih provinsi terlebih dahulu"
                                    error={errors.kota}
                                    disabled={!provinsi}
                                />
                            )}

                            {/* Kecamatan */}
                            {loadingKecamatan ? (
                                <View style={styles.loadingField}>
                                    <ActivityIndicator size="small" color="#0d6efd" />
                                    <Text style={styles.loadingFieldText}>Memuat kecamatan...</Text>
                                </View>
                            ) : (
                                <DropdownInput
                                    label="Kecamatan"
                                    value={kecamatan}
                                    onChange={(value) => {
                                        setKecamatan(value);
                                        if (errors.kecamatan) {
                                            setErrors({ ...errors, kecamatan: undefined });
                                        }
                                    }}
                                    options={kecamatanOptions}
                                    placeholder="Pilih kota terlebih dahulu"
                                    error={errors.kecamatan}
                                    disabled={!kota}
                                />
                            )}

                            {/* Alamat */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Alamat Lengkap</Text>
                                <Input
                                    placeholder="Masukkan alamat lengkap (jalan, RT/RW, dll)"
                                    value={alamat}
                                    onChangeText={(text) => {
                                        setAlamat(text);
                                        if (errors.alamat) {
                                            setErrors({ ...errors, alamat: undefined });
                                        }
                                    }}
                                    multiline
                                    numberOfLines={3}
                                    error={errors.alamat}
                                />
                            </View>

                            <Button
                                title="Lanjutkan"
                                onPress={handleSubmit}
                                loading={loading}
                                variant="primary"
                            />
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
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        fontSize: 16,
        color: '#6c757d',
        marginTop: 12,
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
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    formSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 24,
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        marginBottom: 0,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    readOnlyInput: {
        backgroundColor: '#e9ecef',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    readOnlyText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '500',
    },
    loadingField: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 0,
    },
    loadingFieldText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
    },
});
