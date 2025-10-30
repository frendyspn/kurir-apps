import DatePickerInput from '@/components/date-picker-input';
import DropdownInput from '@/components/dropdown-input';
import PelangganSearchInput from '@/components/pelanggan-search-input';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TambahTransaksiScreen() {
    const insets = useSafeAreaInsets();
    const { selectedCustomer } = useLocalSearchParams<{ selectedCustomer?: string }>();
    const [loading, setLoading] = useState(false);
    const [tanggal, setTanggal] = useState<Date>(new Date());
    const [agenKurir, setAgenKurir] = useState<string>('');
    const [pelanggan, setPelanggan] = useState<string>('');
    const [pelangganLabel, setPelangganLabel] = useState<string>('');
    const [pelangganData, setPelangganData] = useState<any>(null);
    const [layanan, setLayanan] = useState<string>('');
    const [alamatJemput, setAlamatJemput] = useState<string>('');
    const [alamatAntar, setAlamatAntar] = useState<string>('');
    const [biayaAntar, setBiayaAntar] = useState<string>('');
    const [namaRestoToko, setNamaRestoToko] = useState<string>('');
    
    // Options state
    const [agenOptions, setAgenOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [pelangganOptions, setPelangganOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [layananOptions, setLayananOptions] = useState<Array<{ label: string; value: string }>>([]);
    
    // Loading state for dropdowns
    const [loadingAgen, setLoadingAgen] = useState(false);
    const [loadingPelanggan, setLoadingPelanggan] = useState(false);
    const [loadingLayanan, setLoadingLayanan] = useState(false);

    useEffect(() => {
        fetchAgen();
        fetchLayanan();
        
        // Handle selected customer from params
        if (selectedCustomer) {
            try {
                const customerData = JSON.parse(selectedCustomer);
                setPelanggan(customerData.id_konsumen);
                setPelangganLabel(`${customerData.nama_lengkap} (${customerData.no_hp})`);
                setPelangganData(customerData);
            } catch (error) {
                console.error('Error parsing selected customer:', error);
            }
        }
    }, [selectedCustomer]);

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    const fetchAgen = async () => {
        try {
            setLoadingAgen(true);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                console.error('No user data found');
                return;
            }

            const user = JSON.parse(userData);
            const response = await apiService.getListAgent(user.no_hp);
            
            if (response.success && response.data && response.data.data) {
                const agentData = response.data.data;
                
                // Check if data is array
                if (Array.isArray(agentData)) {
                    const options = agentData.map((item: any) => ({
                        label: item.nama_lengkap,
                        value: item.id_konsumen,
                    }));
                    
                    setAgenOptions(options);
                } else {
                    console.error('Agent data is not an array:', agentData);
                }
            }
        } catch (error) {
            console.error('Error fetching agen:', error);
        } finally {
            setLoadingAgen(false);
        }
    };

    const handleSearchPelanggan = async (query: string) => {
        try {
            setLoadingPelanggan(true);
            setPelangganOptions([]);
            
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                console.error('No user data found');
                return;
            }

            const user = JSON.parse(userData);
            const response = await apiService.getListPelanggan(user.no_hp, query);
            
            if (response.success && response.data && response.data.data) {
                const pelangganData = response.data.data;
                
                if (Array.isArray(pelangganData)) {
                    const options = pelangganData.map((item: any) => ({
                        label: item.nama_lengkap + ' (' + item.no_hp + ')',
                        value: item.id_konsumen || item.id,
                        data: item, // Store full data
                    }));
                    
                    setPelangganOptions(options);
                } else {
                    console.error('Pelanggan data is not an array:', pelangganData);
                }
            }
        } catch (error) {
            console.error('Error searching pelanggan:', error);
        } finally {
            setLoadingPelanggan(false);
        }
    };

    const handlePelangganChange = (value: string) => {
        setPelanggan(value);
        // Find and set the label and full data
        const selected = pelangganOptions.find(opt => opt.value === value);
        if (selected) {
            setPelangganLabel(selected.label);
            setPelangganData((selected as any).data);
        }
    };

    const handleClearPelangganResults = () => {
        setPelangganOptions([]);
        setPelanggan('');
        setPelangganLabel('');
        setPelangganData(null);
    };

    const fetchLayanan = async () => {
        try {
            setLoadingLayanan(true);
            const response = await apiService.getJenisLayanan();
            
            if (response.success && response.data && response.data.data) {
                const servicesData = response.data.data;
                const dataArray = Object.values(servicesData) as any[];
                
                const options = dataArray.map((item: any) => ({
                    label: item.name,
                    value: item.key,
                }));
                
                setLayananOptions(options);
            }
        } catch (error) {
            console.error('Error fetching layanan:', error);
        } finally {
            setLoadingLayanan(false);
        }
    };

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateTime = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const handleSubmit = async () => {
        // Validation
        if (!tanggal || !agenKurir || (!selectedCustomer && !pelanggan) || !layanan || !alamatJemput || !alamatAntar || !biayaAntar) {
            alert('Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        // Validation for Food and Shop
        if ((layanan === 'FOOD' || layanan === 'SHOP') && !namaRestoToko) {
            alert(`Mohon isi nama ${layanan === 'FOOD' ? 'restoran' : 'toko'}`);
            return;
        }

        try {
            setLoading(true);
            
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                alert('Data user tidak ditemukan');
                return;
            }

            const user = JSON.parse(userData);
            
            // Prepare data
            const requestData: any = {
                no_hp_pelanggan: pelangganData?.no_hp || '-',
                nama_layanan: layanan,
                alamat_penjemputan: alamatJemput,
                alamat_tujuan: alamatAntar,
                biaya_antar: biayaAntar,
                agen_kurir: agenKurir,
                tanggal_order: formatDateTime(tanggal),
                btn_simpan: 'create',
                no_hp: user.no_hp || '',
            };

            // If pelanggan baru (no_hp = '-')
            if (!pelangganData || !pelangganData.no_hp) {
                requestData.no_hp_pelanggan = '-';
                requestData.no_hp_pelanggan_baru = ''; // Bisa ditambahkan input untuk pelanggan baru
                requestData.nama_pelanggan = pelangganLabel || '';
            }

            // Add nama_toko for FOOD/SHOP
            if (layanan === 'FOOD' || layanan === 'SHOP') {
                requestData.nama_toko = namaRestoToko;
            }

            const response = await apiService.createTransaksiManual(requestData);
            
            if (response.success) {
                alert('Transaksi berhasil disimpan!');
                router.back();
            } else {
                alert(response.message || 'Gagal menyimpan transaksi');
            }
        } catch (error) {
            console.error('Error submitting transaksi:', error);
            alert('Terjadi kesalahan saat menyimpan transaksi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>Tambah Transaksi</Text>
                
                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <ScrollView 
                style={styles.content}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 120 }}
            >
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Form Transaksi Manual</Text>
                    
                    {/* Tanggal */}
                    <DatePickerInput
                        label="Tanggal"
                        value={tanggal}
                        onChange={setTanggal}
                        placeholder="Pilih tanggal"
                    />

                    {/* Agen Kurir */}
                    {loadingAgen ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#0d6efd" />
                            <Text style={styles.loadingText}>Memuat agen...</Text>
                        </View>
                    ) : (
                        <DropdownInput
                            label="Agen Kurir"
                            value={agenKurir}
                            onChange={setAgenKurir}
                            options={agenOptions}
                            placeholder="Pilih agen kurir"
                        />
                    )}

                    {/* Pelanggan */}
                    {selectedCustomer ? (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Pelanggan</Text>
                            <View style={styles.selectedCustomerContainer}>
                                <Ionicons name="person" size={20} color="#0d6efd" />
                                <View style={styles.selectedCustomerInfo}>
                                    <Text style={styles.selectedCustomerName}>{pelangganLabel}</Text>
                                    <Text style={styles.selectedCustomerNote}>Pelanggan sudah dipilih</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <PelangganSearchInput
                            label="Pelanggan"
                            value={pelanggan}
                            onChange={handlePelangganChange}
                            onSearch={handleSearchPelanggan}
                            onClearResults={handleClearPelangganResults}
                            options={pelangganOptions}
                            placeholder="Cari pelanggan"
                            searchPlaceholder="Masukkan no HP atau nama"
                            selectedLabel={pelangganLabel}
                            isSearching={loadingPelanggan}
                        />
                    )}

                    {/* Layanan */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Layanan *</Text>
                        {loadingLayanan ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#0d6efd" />
                                <Text style={styles.loadingText}>Memuat layanan...</Text>
                            </View>
                        ) : (
                            <View style={styles.layananButtonContainer}>
                                {layananOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.layananButton,
                                            layanan === option.value && styles.layananButtonActive
                                        ]}
                                        onPress={() => setLayanan(option.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons 
                                            name={
                                                option.value === 'RIDE' ? 'bicycle' :
                                                option.value === 'SEND' ? 'cube' :
                                                option.value === 'FOOD' ? 'restaurant' :
                                                option.value === 'SHOP' ? 'cart' :
                                                'ellipse'
                                            } 
                                            size={24} 
                                            color={layanan === option.value ? '#ffffff' : '#0d6efd'} 
                                        />
                                        <Text style={[
                                            styles.layananButtonText,
                                            layanan === option.value && styles.layananButtonTextActive
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Nama Resto/Toko - Only show for FOOD or SHOP */}
                    {(layanan === 'FOOD' || layanan === 'SHOP') && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {layanan === 'FOOD' ? 'Nama Restoran' : 'Nama Toko'} *
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                value={namaRestoToko}
                                onChangeText={setNamaRestoToko}
                                placeholder={`Masukkan nama ${layanan === 'FOOD' ? 'restoran' : 'toko'}`}
                                placeholderTextColor="#adb5bd"
                            />
                        </View>
                    )}

                    {/* Alamat Jemput */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Alamat Penjemputan *</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={alamatJemput}
                            onChangeText={setAlamatJemput}
                            placeholder="Masukkan alamat penjemputan"
                            placeholderTextColor="#adb5bd"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Alamat Antar */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Alamat Antar *</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={alamatAntar}
                            onChangeText={setAlamatAntar}
                            placeholder="Masukkan alamat tujuan"
                            placeholderTextColor="#adb5bd"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Biaya Antar */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Biaya Antar *</Text>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.pricePrefix}>Rp</Text>
                            <TextInput
                                style={styles.priceInput}
                                value={biayaAntar}
                                onChangeText={(text) => {
                                    // Only allow numbers
                                    const numericValue = text.replace(/[^0-9]/g, '');
                                    setBiayaAntar(numericValue);
                                }}
                                placeholder="0"
                                placeholderTextColor="#adb5bd"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <Text style={styles.submitButtonText}>Menyimpan...</Text>
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Simpan Transaksi</Text>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
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
        padding: 16,
    },
    formSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
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
    placeholder: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#6c757d',
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
        minHeight: 80,
        paddingTop: 12,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        paddingHorizontal: 12,
    },
    pricePrefix: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#212529',
    },
    layananButtonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    layananButton: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#0d6efd',
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    layananButtonActive: {
        backgroundColor: '#0d6efd',
        borderColor: '#0d6efd',
    },
    layananButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0d6efd',
    },
    layananButtonTextActive: {
        color: '#ffffff',
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
    selectedCustomerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e7f3ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0d6efd',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 12,
    },
    selectedCustomerInfo: {
        flex: 1,
    },
    selectedCustomerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
    },
    selectedCustomerNote: {
        fontSize: 12,
        color: '#0d6efd',
        fontWeight: '500',
    },
});
