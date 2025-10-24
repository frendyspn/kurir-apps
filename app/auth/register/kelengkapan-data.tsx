import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Button from '../../../components/button';
import DropdownInput from '../../../components/dropdown-input';
import Input from '../../../components/input';

export default function KelengkapanDataScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const phoneNumber = params.phone as string;
    const initialData = params.data ? JSON.parse(params.data as string) : null;

    // console.log('Params data:', initialData);
    // console.log('Type kendaraan from data:', initialData?.type_kendaraan);

    const [typeKendaraan, setTypeKendaraan] = useState('');
    const [merek, setMerek] = useState('');
    const [platNomor, setPlatNomor] = useState('');
    const [fotoSim, setFotoSim] = useState<string | null>(null);
    const [fotoSimUrl, setFotoSimUrl] = useState<string | null>(null); // URL dari server untuk existing image
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [errors, setErrors] = useState<{
        typeKendaraan?: string;
        merek?: string;
        platNomor?: string;
        fotoSim?: string;
    }>({});

    const typeKendaraanOptions = [
        { label: 'Motor', value: '1' },
        { label: 'Mobil', value: '2' }
    ];

    // Set initial data from params
    useEffect(() => {
        if (initialData) {
            if (initialData.id_jenis_kendaraan) {
                const typeValue = String(initialData.id_jenis_kendaraan);
                console.log('Setting type kendaraan to:', typeValue);
                setTypeKendaraan(typeValue);
            }
            if (initialData.merek) {
                setMerek(initialData.merek);
            }
            if (initialData.plat_nomor) {
                setPlatNomor(initialData.plat_nomor);
            }
            if (initialData.lampiran) {
                // Set foto SIM dari server (URL)
                setFotoSimUrl(initialData.lampiran);
                // Set fotoSim juga untuk validasi
                setFotoSim(initialData.lampiran);
            }
        }
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        // Navigate to index (home) to re-check status
        setTimeout(() => {
            setRefreshing(false);
            router.replace('/');
        }, 500);
    };

    const pickImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Izinkan akses ke galeri untuk mengupload foto SIM');
                return;
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setFotoSim(uri);
                setFotoSimUrl(null); // Clear existing URL jika upload baru
                setErrors({ ...errors, fotoSim: '' });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Gagal memilih gambar');
        }
    };

    const takePhoto = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Izinkan akses kamera untuk mengambil foto SIM');
                return;
            }

            // Take photo
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setFotoSim(uri);
                setFotoSimUrl(null); // Clear existing URL jika upload baru
                setErrors({ ...errors, fotoSim: '' });
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Gagal mengambil foto');
        }
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            'Upload Foto SIM',
            'Pilih metode upload foto',
            [
                {
                    text: 'Ambil Foto',
                    onPress: takePhoto
                },
                {
                    text: 'Pilih dari Galeri',
                    onPress: pickImage
                },
                {
                    text: 'Batal',
                    style: 'cancel'
                }
            ]
        );
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!typeKendaraan) {
            newErrors.typeKendaraan = 'Tipe kendaraan harus dipilih';
        }

        if (!merek || merek.trim().length < 2) {
            newErrors.merek = 'Merek kendaraan minimal 2 karakter';
        }

        if (!platNomor || platNomor.trim().length < 3) {
            newErrors.platNomor = 'Plat nomor minimal 3 karakter';
        }

        if (!fotoSim) {
            newErrors.fotoSim = 'Foto SIM harus diupload';
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
            // Call API to update kelengkapan data
            const result = await apiService.updateKelengkapanData({
                no_hp: phoneNumber,
                type_kendaraan: typeKendaraan,
                merek: merek,
                plat_nomor: platNomor,
                foto_sim_uri: fotoSim || '', // Kirim URI file, bukan base64
            });

            
            if (result.success) {
                Alert.alert(
                    'Berhasil',
                    'Data kelengkapan berhasil disimpan. Mohon tunggu verifikasi admin.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Update userData in AsyncStorage
                                AsyncStorage.getItem('userData').then(data => {
                                    if (data) {
                                        const userData = JSON.parse(data);
                                        userData.kelengkapan_submitted = true;
                                        AsyncStorage.setItem('userData', JSON.stringify(userData));
                                    }
                                });
                                
                                // Navigate to home
                                router.replace('/');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', result.message || 'Gagal menyimpan data');
            }
        } catch (error) {
            console.error('Submit kelengkapan data error:', error);
            Alert.alert('Error', 'Terjadi kesalahan, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Kelengkapan Data',
                    headerStyle: {
                        backgroundColor: '#ffffff',
                    },
                    headerTintColor: '#0d6efd',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        fontSize: 18,
                    },
                    headerShadowVisible: false,
                }}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0d6efd']}
                        tintColor="#0d6efd"
                    />
                }
            >
                <View style={styles.header}>
                    <View style={styles.warningBox}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.warningText}>
                            Akun kurir Anda belum aktif.{'\n'}
                            Mohon lengkapi data berikut untuk aktivasi akun.{'\n'}
                            Atau refresh halaman ini.
                        </Text>
                    </View>
                </View>

                <View style={styles.form}>
                    <DropdownInput
                        label="Tipe Kendaraan"
                        placeholder="Pilih tipe kendaraan"
                        value={typeKendaraan}
                        onChange={(value: string) => {
                            setTypeKendaraan(value);
                            setErrors({ ...errors, typeKendaraan: '' });
                        }}
                        options={typeKendaraanOptions}
                        error={errors.typeKendaraan}
                    />

                    <Input
                        label="Merek Kendaraan"
                        placeholder="Contoh: Honda Beat, Toyota Avanza"
                        value={merek}
                        onChangeText={(text) => {
                            setMerek(text);
                            setErrors({ ...errors, merek: '' });
                        }}
                        error={errors.merek}
                    />

                    <Input
                        label="Plat Nomor"
                        placeholder="Contoh: B 1234 XYZ"
                        value={platNomor}
                        onChangeText={(text) => {
                            setPlatNomor(text.toUpperCase());
                            setErrors({ ...errors, platNomor: '' });
                        }}
                        error={errors.platNomor}
                        autoCapitalize="characters"
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Foto SIM</Text>
                        
                        {(fotoSim || fotoSimUrl) ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image 
                                    source={{ 
                                        uri: fotoSim || fotoSimUrl || ''
                                    }} 
                                    style={styles.imagePreview}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity 
                                    style={styles.changeImageButton}
                                    onPress={showImagePickerOptions}
                                >
                                    <Text style={styles.changeImageText}>Ubah Foto</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[
                                    styles.uploadButton,
                                    errors.fotoSim && styles.uploadButtonError
                                ]}
                                onPress={showImagePickerOptions}
                            >
                                <Text style={styles.uploadIcon}>📷</Text>
                                <Text style={styles.uploadText}>Upload Foto SIM</Text>
                                <Text style={styles.uploadSubtext}>
                                    Klik untuk mengambil foto atau pilih dari galeriii
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        {errors.fotoSim && (
                            <Text style={styles.errorText}>{errors.fotoSim}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Simpan & Kirim"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        variant="primary"
                    />

                    <Text style={styles.infoText}>
                        Data akan diverifikasi oleh admin
                    </Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 100, // Extra padding untuk menghindari navigation bar
    },
    header: {
        marginBottom: 24,
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffc107',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    warningIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#856404',
        lineHeight: 20,
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    uploadButton: {
        borderWidth: 2,
        borderColor: '#dee2e6',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 32,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    uploadButtonError: {
        borderColor: '#dc3545',
    },
    uploadIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    uploadSubtext: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
    },
    imagePreviewContainer: {
        alignItems: 'center',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    changeImageButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    changeImageText: {
        fontSize: 14,
        color: '#0d6efd',
        fontWeight: '600',
    },
    errorText: {
        fontSize: 12,
        color: '#dc3545',
        marginTop: 4,
    },
    footer: {
        marginTop: 16,
    },
    infoText: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 16,
    },
});
