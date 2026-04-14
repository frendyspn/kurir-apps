import DatePickerInput from '@/components/date-picker-input';
import DropdownInput from '@/components/dropdown-input';
import GlassBackground from '@/components/glass-background';
import PelangganSearchInput from '@/components/pelanggan-search-input';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditTransaksiScreen() {
    const insets = useSafeAreaInsets();
    const { transaksi: transaksiParam } = useLocalSearchParams<{ transaksi?: string }>();

    // Parse data transaksi dari params
    const transaksiData = transaksiParam ? (() => {
        try { return JSON.parse(transaksiParam); } catch { return null; }
    })() : null;

    const [loading, setLoading] = useState(false);
    const [tanggal, setTanggal] = useState<Date>(new Date());
    const [agenKurir, setAgenKurir] = useState<string>('');
    const [pelanggan, setPelanggan] = useState<string>('');
    const [pelangganLabel, setPelangganLabel] = useState<string>('');
    const [pelangganData, setPelangganData] = useState<any>(null);
    const [isOtomatis, setIsOtomatis] = useState<boolean>(false);
    const [layanan, setLayanan] = useState<string>('');
    const [alamatJemput, setAlamatJemput] = useState<string>('');
    const [alamatAntar, setAlamatAntar] = useState<string>('');
    const [biayaAntar, setBiayaAntar] = useState<string>('');
    const [namaRestoToko, setNamaRestoToko] = useState<string>('');
    const [linkMapsPenjemputan, setLinkMapsPenjemputan] = useState<string>('');
    const [linkMapsAntar, setLinkMapsAntar] = useState<string>('');

    // Options state
    const [agenOptions, setAgenOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [pelangganOptions, setPelangganOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [layananOptions, setLayananOptions] = useState<Array<{ label: string; value: string }>>([]);

    // Loading state
    const [loadingAgen, setLoadingAgen] = useState(false);
    const [loadingPelanggan, setLoadingPelanggan] = useState(false);
    const [loadingLayanan, setLoadingLayanan] = useState(false);

    // Pre-fill form dari data transaksi yang ada
    useEffect(() => {
        if (!transaksiData) return;

        // Tanggal
        if (transaksiData.tanggal_order) {
            const d = new Date(transaksiData.tanggal_order);
            if (!isNaN(d.getTime())) setTanggal(d);
        }

        // Layanan
        setLayanan(transaksiData.service || transaksiData.jenis_layanan || '');

        // Alamat
        setAlamatJemput(transaksiData.alamat_jemput || '');
        setAlamatAntar(transaksiData.alamat_antar || '');
        setLinkMapsPenjemputan(transaksiData.titik_jemput || '');
        setLinkMapsAntar(transaksiData.titik_antar || '');

        // Biaya
        setBiayaAntar(String(transaksiData.tarif || ''));

        // Nama resto/toko
        setNamaRestoToko(transaksiData.pemberi_barang || transaksiData.nama_toko || '');

        // Pelanggan — gunakan id_pemesan sebagai ID, no_hp_pemesan sebagai identifier
        const pelangganId = transaksiData.id_pemesan
            || transaksiData.id_konsumen_pemesan
            || transaksiData.id_pelanggan
            || transaksiData.no_hp_pemesan
            || '';
        const pelangganNama = transaksiData.nama_pemesan || '';
        const pelangganNoHp = transaksiData.no_hp_pemesan || '';
        if (pelangganNama || pelangganNoHp) {
            const label = pelangganNama
                ? `${pelangganNama} (${pelangganNoHp || '-'})`
                : pelangganNoHp;
            setPelangganLabel(label);
            setPelanggan(pelangganId);
            setPelangganData({
                id_konsumen: pelangganId,
                nama_lengkap: pelangganNama,
                no_hp: pelangganNoHp,
                alamat_lengkap: transaksiData.alamat_jemput || '',
            });
        }
    }, [transaksiParam]);

    // Fetch agen & layanan
    useEffect(() => {
        fetchAgen();
        fetchLayanan();
    }, []);

    useEffect(() => {
        const backAction = () => { router.back(); return true; };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    // Setelah agenOptions loaded, set agen dari data transaksi
    useEffect(() => {
        if (agenOptions.length > 0 && transaksiData?.id_agen) {
            setAgenKurir(transaksiData.id_agen);
        }
    }, [agenOptions]);

    const fetchAgen = async () => {
        try {
            setLoadingAgen(true);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) return;
            const user = JSON.parse(userData);
            const response = await apiService.getListAgent(user.no_hp);
            if (response.success && response.data?.data && Array.isArray(response.data.data)) {
                const options = response.data.data.map((item: any) => ({
                    label: `${item.nama_lengkap} (${item.kota})`,
                    value: item.id_konsumen,
                }));
                setAgenOptions(options);
            }
        } catch (error) {
            console.error('Error fetching agen:', error);
        } finally {
            setLoadingAgen(false);
        }
    };

    const fetchLayanan = async () => {
        try {
            setLoadingLayanan(true);
            const response = await apiService.getJenisLayanan();
            if (response.success && response.data?.data) {
                const dataArray = Object.values(response.data.data) as any[];
                setLayananOptions(dataArray.map((item: any) => ({
                    label: item.name,
                    value: item.key,
                })));
            }
        } catch (error) {
            console.error('Error fetching layanan:', error);
        } finally {
            setLoadingLayanan(false);
        }
    };

    const handleSearchPelanggan = async (query: string) => {
        try {
            setLoadingPelanggan(true);
            setPelangganOptions([]);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) return;
            const user = JSON.parse(userData);
            const response = await apiService.getListPelanggan(user.no_hp, query);
            if (response.success && response.data?.data && Array.isArray(response.data.data)) {
                const options = response.data.data.map((item: any) => ({
                    label: `${item.nama_lengkap} (${item.no_hp})`,
                    value: item.id_konsumen || item.id,
                    data: item,
                }));
                setPelangganOptions(options);
            }
        } catch (error) {
            console.error('Error searching pelanggan:', error);
        } finally {
            setLoadingPelanggan(false);
        }
    };

    const handlePelangganChange = (value: string, label: string, data?: any) => {
        setPelanggan(value);
        setPelangganLabel(label);
        if (data) {
            setPelangganData(data);
            setIsOtomatis(!!data.is_favorite_list);
        } else {
            const selected = pelangganOptions.find(opt => opt.value === value);
            if (selected) {
                setPelangganData((selected as any).data);
                setIsOtomatis(!!((selected as any).data?.is_favorite_list));
            } else {
                const match = label.match(/^(.*)\s*\(([^)]+)\)$/);
                setPelangganData({
                    id_konsumen: value,
                    nama_lengkap: match ? match[1].trim() : label,
                    no_hp: match ? match[2].trim() : '',
                    alamat_lengkap: '',
                });
                setIsOtomatis(false);
            }
        }
    };

    const handleClearPelangganResults = () => {
        setPelangganOptions([]);
        setPelanggan('');
        setPelangganLabel('');
        setPelangganData(null);
    };

    const formatDateTime = (date: Date): string => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const handleSubmit = async () => {
        const isPelangganValid = !!(pelanggan || pelangganData?.no_hp || pelangganLabel);
        if (!tanggal || !agenKurir || !isPelangganValid || !layanan || !alamatJemput || !alamatAntar || !biayaAntar) {
            Alert.alert('Perhatian', 'Mohon lengkapi semua field yang wajib diisi');
            return;
        }
        if ((layanan === 'FOOD' || layanan === 'SHOP') && !namaRestoToko) {
            Alert.alert('Perhatian', `Mohon isi nama ${layanan === 'FOOD' ? 'restoran' : 'toko'}`);
            return;
        }

        try {
            setLoading(true);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) { Alert.alert('Error', 'Data user tidak ditemukan'); return; }
            const user = JSON.parse(userData);

            const requestData: any = {
                id_transaksi: transaksiData?.id || transaksiData?.id_transaksi,
                no_hp_pelanggan: pelangganData?.no_hp || transaksiData?.no_hp_pemesan || '-',
                nama_layanan: layanan,
                alamat_penjemputan: alamatJemput,
                titik_jemput: linkMapsPenjemputan,
                alamat_tujuan: alamatAntar,
                titik_antar: linkMapsAntar,
                biaya_antar: biayaAntar,
                agen_kurir: agenKurir,
                tanggal_order: formatDateTime(tanggal),
                no_hp: user.no_hp || '',
                is_favorite: isOtomatis,
            };

            if (!pelangganData?.no_hp && !transaksiData?.no_hp_pemesan) {
                requestData.no_hp_pelanggan = '-';
            }
            if (pelangganLabel || transaksiData?.nama_pemesan) {
                requestData.nama_pelanggan = pelangganData?.nama_lengkap || pelangganLabel || transaksiData?.nama_pemesan || '';
            }
            if (layanan === 'FOOD' || layanan === 'SHOP') {
                requestData.nama_toko = namaRestoToko;
            }

            console.log('[EDIT] requestData dikirim:', JSON.stringify(requestData, null, 2));
            const response = await apiService.updateTransaksiManual(requestData);
            console.log('[EDIT] response:', JSON.stringify(response, null, 2));

            if (response.success) {
                Alert.alert('Berhasil', 'Transaksi berhasil diperbarui', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal memperbarui transaksi');
            }
        } catch (error) {
            console.error('Error updating transaksi:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memperbarui transaksi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <GlassBackground />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Transaksi</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Info kode order */}
            {transaksiData?.kode_order && (
                <View style={styles.orderBadge}>
                    <Ionicons name="receipt-outline" size={14} color="#0097A7" />
                    <Text style={styles.orderBadgeText}>#{transaksiData.kode_order}</Text>
                </View>
            )}

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 120 }}
            >
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Edit Pasca Order</Text>

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
                            <ActivityIndicator size="small" color="#0097A7" />
                            <Text style={styles.loadingText}>Memuat agen...</Text>
                        </View>
                    ) : (
                        <DropdownInput
                            label="Agen Kurir (Pemberi Order)"
                            value={agenKurir}
                            onChange={setAgenKurir}
                            options={agenOptions}
                            placeholder="Pilih agen kurir"
                        />
                    )}

                    {/* Pelanggan */}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <TouchableOpacity
                            style={{ marginRight: 8 }}
                            onPress={() => setIsOtomatis(!isOtomatis)}
                        >
                            <Ionicons
                                name={isOtomatis ? 'checkbox' : 'square-outline'}
                                size={20}
                                color={isOtomatis ? '#0097A7' : '#adb5bd'}
                            />
                        </TouchableOpacity>
                        <Text style={styles.selectedCustomerNote}>Pelanggan Favorite</Text>
                    </View>

                    {/* Layanan */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Layanan *</Text>
                        {loadingLayanan ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#0097A7" />
                                <Text style={styles.loadingText}>Memuat layanan...</Text>
                            </View>
                        ) : (
                            <View style={styles.layananButtonContainer}>
                                {layananOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.layananButton,
                                            layanan === option.value && styles.layananButtonActive,
                                        ]}
                                        onPress={() => setLayanan(option.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={
                                                option.value === 'RIDE' ? 'bicycle' :
                                                option.value === 'SEND' ? 'cube' :
                                                option.value === 'FOOD' ? 'restaurant' :
                                                option.value === 'SHOP' ? 'cart' : 'ellipse'
                                            }
                                            size={24}
                                            color={layanan === option.value ? '#ffffff' : '#0097A7'}
                                        />
                                        <Text style={[
                                            styles.layananButtonText,
                                            layanan === option.value && styles.layananButtonTextActive,
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Nama Resto/Toko */}
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
                        <View style={styles.inputLabelRow}>
                            <Text style={styles.inputLabel}>Alamat Penjemputan *</Text>
                            <TouchableOpacity
                                style={styles.fillAddressButton}
                                onPress={() => {
                                    const alamat = pelangganData?.alamat_lengkap || pelangganData?.alamat || '';
                                    if (!alamat) { Alert.alert('Info', 'Alamat pelanggan tidak tersedia'); return; }
                                    setAlamatJemput(alamat);
                                }}
                            >
                                <Text style={styles.fillAddressText}>Ambil Alamat Customer</Text>
                            </TouchableOpacity>
                        </View>
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

                    {/* Link Maps Penjemputan */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Link Maps Penjemputan</Text>
                        <View style={styles.priceInputContainer}>
                            <TextInput
                                style={styles.priceInput}
                                value={linkMapsPenjemputan}
                                onChangeText={setLinkMapsPenjemputan}
                                placeholder="Masukkan link maps penjemputan"
                                placeholderTextColor="#adb5bd"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Alamat Antar */}
                    <View style={styles.inputContainer}>
                        <View style={styles.inputLabelRow}>
                            <Text style={styles.inputLabel}>Alamat Antar *</Text>
                            <TouchableOpacity
                                style={styles.fillAddressButton}
                                onPress={() => {
                                    const alamat = pelangganData?.alamat_lengkap || pelangganData?.alamat || '';
                                    if (!alamat) { Alert.alert('Info', 'Alamat pelanggan tidak tersedia'); return; }
                                    setAlamatAntar(alamat);
                                }}
                            >
                                <Text style={styles.fillAddressText}>Ambil Alamat Customer</Text>
                            </TouchableOpacity>
                        </View>
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

                    {/* Link Maps Antar */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Link Maps Antar</Text>
                        <View style={styles.priceInputContainer}>
                            <TextInput
                                style={styles.priceInput}
                                value={linkMapsAntar}
                                onChangeText={setLinkMapsAntar}
                                placeholder="Masukkan link maps antar"
                                placeholderTextColor="#adb5bd"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Biaya Antar */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Biaya Antar *</Text>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.pricePrefix}>Rp</Text>
                            <TextInput
                                style={styles.priceInput}
                                value={biayaAntar}
                                onChangeText={(text) => setBiayaAntar(text.replace(/[^0-9]/g, ''))}
                                placeholder="0"
                                placeholderTextColor="#adb5bd"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                            <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: { padding: 4 },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: { width: 32 },
    orderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        backgroundColor: '#e7f3ff',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#0097A7',
    },
    orderBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0097A7',
    },
    content: { flex: 1, padding: 16 },
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
    loadingText: { fontSize: 14, color: '#6c757d' },
    inputContainer: { marginBottom: 16 },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 8,
    },
    fillAddressButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#e7f3ff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#0097A7',
    },
    fillAddressText: {
        fontSize: 12,
        color: '#0097A7',
        fontWeight: '600',
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
    textArea: { minHeight: 80, paddingTop: 12 },
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
        borderColor: '#0097A7',
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
        backgroundColor: '#0097A7',
        borderColor: '#0097A7',
    },
    layananButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0097A7',
    },
    layananButtonTextActive: { color: '#ffffff' },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f59e0b',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    selectedCustomerNote: {
        fontSize: 12,
        color: '#0097A7',
        fontWeight: '500',
    },
});
