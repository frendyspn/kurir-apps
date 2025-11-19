import DatePickerInput from '@/components/date-picker-input';
import PelangganSearchInput from '@/components/pelanggan-search-input';
import { apiService } from '@/services/api';
import socketService from '@/services/socket';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const [linkMapsPenjemputan, setLinkMapsPenjemputan] = useState<string>('');
    const [linkMapsAntar, setLinkMapsAntar] = useState<string>('');

    // Produk state
    const [produkList, setProdukList] = useState<Array<{
        nama_barang: string;
        qty: string;
        satuan: string;
        harga: string;
    }>>([]);
    const [namaBarang, setNamaBarang] = useState<string>('');
    const [qtyBarang, setQtyBarang] = useState<string>('');
    const [satuanBarang, setSatuanBarang] = useState<string>('Pcs');
    const [hargaBarang, setHargaBarang] = useState<string>('');
    const [showProdukModal, setShowProdukModal] = useState(false);
    const [editingProdukIndex, setEditingProdukIndex] = useState<number | null>(null);
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

    // Produk functions
    const handleOpenProdukModal = (index?: number) => {
        if (index !== undefined) {
            // Edit mode
            const produk = produkList[index];
            setNamaBarang(produk.nama_barang);
            setQtyBarang(produk.qty);
            setSatuanBarang(produk.satuan);
            setHargaBarang(produk.harga);
            setEditingProdukIndex(index);
        } else {
            // Add mode - reset form
            setNamaBarang('');
            setQtyBarang('');
            setSatuanBarang('Pcs');
            setHargaBarang('');
            setEditingProdukIndex(null);
        }
        setShowProdukModal(true);
    };

    const handleCloseProdukModal = () => {
        setShowProdukModal(false);
        // Reset form when closing
        setNamaBarang('');
        setQtyBarang('');
        setSatuanBarang('Pcs');
        setHargaBarang('');
        setEditingProdukIndex(null);
    };

    const handleSaveProduk = () => {
        if (!namaBarang.trim() || !qtyBarang.trim() || !satuanBarang.trim() || !hargaBarang.trim()) {
            alert('Mohon lengkapi semua field produk');
            return;
        }

        const produkData = {
            nama_barang: namaBarang.trim(),
            qty: qtyBarang.trim(),
            satuan: satuanBarang.trim(),
            harga: hargaBarang.trim(),
        };

        if (editingProdukIndex !== null) {
            // Edit existing product
            setProdukList(prev => prev.map((item, index) => 
                index === editingProdukIndex ? produkData : item
            ));
        } else {
            // Add new product
            setProdukList(prev => [...prev, produkData]);
        }
        
        // Reset form and close modal
        setNamaBarang('');
        setQtyBarang('');
        setSatuanBarang('Pcs');
        setHargaBarang('');
        setEditingProdukIndex(null);
        setShowProdukModal(false);
    };    const handleHapusProduk = (index: number) => {
        setProdukList(prev => prev.filter((_, i) => i !== index));
    };

    const getTotalHargaProduk = () => {
        return produkList.reduce((total, produk) => {
            const qty = parseInt(produk.qty) || 0;
            const harga = parseInt(produk.harga) || 0;
            return total + (qty * harga);
        }, 0);
    };

    const handleSubmit = async () => {
        // Validation
        if (!tanggal || (!selectedCustomer && !pelanggan) || !layanan || !alamatJemput || !alamatAntar || !biayaAntar) {
            alert('Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        // Validation for Food and Shop
        if ((layanan === 'FOOD' || layanan === 'SHOP') && !namaRestoToko) {
            alert(`Mohon isi nama ${layanan === 'FOOD' ? 'restoran' : 'toko'}`);
            return;
        }

        // Validation for Produk (Food and Shop)
        if ((layanan === 'FOOD' || layanan === 'SHOP') && produkList.length === 0) {
            alert('Mohon tambahkan minimal satu produk');
            return;
        }

        // Jika kedua link maps diisi, tidak boleh sama
        if (linkMapsPenjemputan && linkMapsAntar && linkMapsPenjemputan === linkMapsAntar) {
            alert('Link Maps Penjemputan dan Link Maps Antar tidak boleh sama!');
            return;
        }

        try {
            setLoading(true);
            
            // Get user data for API call
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                alert('Data user tidak ditemukan. Silakan login kembali.');
                return;
            }
            
            const user = JSON.parse(userData);
            
            // Prepare data for API call
            const apiOrderData = {
                no_hp_pelanggan: selectedCustomer ? JSON.parse(selectedCustomer).no_hp : pelanggan,
                no_hp_pelanggan_baru: selectedCustomer ? undefined : pelanggan,
                nama_pelanggan: selectedCustomer ? JSON.parse(selectedCustomer).nama_lengkap : undefined,
                nama_layanan: layanan,
                alamat_penjemputan: alamatJemput,
                link_maps_penjemputan: linkMapsPenjemputan,
                alamat_tujuan: alamatAntar,
                link_maps_tujuan: linkMapsAntar,
                biaya_antar: biayaAntar,
                nama_toko: (layanan === 'FOOD' || layanan === 'SHOP') ? namaRestoToko : undefined,
                agen_kurir: user.id_konsumen, // Using agen phone number
                tanggal_order: formatDate(tanggal),
                btn_simpan: 'create',
                no_hp: user.no_hp,
                produk: (layanan === 'FOOD' || layanan === 'SHOP') ? produkList : undefined,
            };

            console.log('📤 Creating order via API:', apiOrderData);
            
            // Step 1: Save to database via API
            const apiResponse = await apiService.createLiveOrder(apiOrderData);
            
            if (!apiResponse.success) {
                throw new Error(apiResponse.message || 'Gagal menyimpan order ke database');
            }
            
            console.log('✅ Order saved to database:', apiResponse.data);
            
            // Step 2: Create Firebase order for real-time notifications
            const firebaseOrderData = {
                kode_order: apiResponse.data?.data?.kode_order || `ORD-${Date.now()}`,
                service: layanan,
                tarif: parseInt(biayaAntar),
                titik_jemput: alamatJemput,
                alamat_jemput: alamatJemput,
                titik_antar: alamatAntar,
                alamat_antar: alamatAntar,
                produk: (layanan === 'FOOD' || layanan === 'SHOP') ? produkList : null,
                // Add additional Firebase-specific fields
                id_transaksi: apiResponse.data?.data?.id_transaksi,
                status: 'SEARCH',
                created_at: new Date().toISOString(),
            };

            console.log('📤 Creating order via Firebase:', firebaseOrderData);
            const firebaseOrder = await socketService.createOrder(firebaseOrderData);
            
            Alert.alert(
                'Berhasil!',
                `Order ${firebaseOrder.kode_order} berhasil dibuat dan dikirim ke kurir`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
            
        } catch (error) {
            console.error('❌ Error creating order:', error);
            Alert.alert('Gagal', 'Gagal membuat order. Silakan coba lagi.');
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
                
                <Text style={styles.headerTitle}>Tambah Live Order</Text>
                
                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <ScrollView 
                style={styles.content}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 120 }}
            >
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Form Live Order</Text>
                    
                    {/* Tanggal */}
                    <DatePickerInput
                        label="Tanggal"
                        value={tanggal}
                        onChange={setTanggal}
                        placeholder="Pilih tanggal"
                    />

                    {/* Agen Kurir */}
                    {/* {loadingAgen ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#0097A7" />
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
                    )} */}

                    {/* Pelanggan */}
                    {selectedCustomer ? (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Pelanggan</Text>
                            <View style={styles.selectedCustomerContainer}>
                                <Ionicons name="person" size={20} color="#0097A7" />
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
                                            color={layanan === option.value ? '#ffffff' : '#0097A7'} 
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

                    {/* Produk Form - Only show for FOOD or SHOP */}
                    {(layanan === 'FOOD' || layanan === 'SHOP') && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Produk *</Text>
                            
                            {/* Tombol Tambah Produk */}
                            <TouchableOpacity 
                                style={styles.addProdukButtonLarge}
                                onPress={() => handleOpenProdukModal()}
                            >
                                <Ionicons name="add-circle" size={20} color="#ffffff" />
                                <Text style={styles.addProdukButtonText}>Tambah Produk</Text>
                            </TouchableOpacity>

                            {/* List Produk */}
                            {produkList.length > 0 && (
                                <View style={styles.produkListContainer}>
                                    <Text style={styles.produkListTitle}>Daftar Produk:</Text>
                                    {produkList.map((produk, index) => (
                                        <View key={index} style={styles.produkItem}>
                                            <View style={styles.produkItemInfo}>
                                                <Text style={styles.produkItemName}>{produk.nama_barang}</Text>
                                                <Text style={styles.produkItemDetail}>
                                                    {produk.qty} {produk.satuan} x Rp {parseInt(produk.harga).toLocaleString('id-ID')}
                                                </Text>
                                            </View>
                                            <View style={styles.produkItemActions}>
                                                <TouchableOpacity 
                                                    style={[styles.produkActionButton, styles.editButton]}
                                                    onPress={() => handleOpenProdukModal(index)}
                                                >
                                                    <Ionicons name="pencil" size={14} color="#0097A7" />
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={[styles.produkActionButton, styles.deleteButton]}
                                                    onPress={() => handleHapusProduk(index)}
                                                >
                                                    <Ionicons name="trash-outline" size={14} color="#dc3545" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                    
                                    {/* Total Produk */}
                                    <View style={styles.produkTotalContainer}>
                                        <Text style={styles.produkTotalLabel}>Total Produk:</Text>
                                        <Text style={styles.produkTotalValue}>
                                            Rp {getTotalHargaProduk().toLocaleString('id-ID')}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
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

            {/* Produk Modal */}
            <Modal
                visible={showProdukModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseProdukModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingProdukIndex !== null ? 'Edit Produk' : 'Tambah Produk'}
                        </Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            value={namaBarang}
                            onChangeText={setNamaBarang}
                            placeholder="Nama barang"
                            placeholderTextColor="#adb5bd"
                        />
                        
                        <View style={styles.modalInputRow}>
                            <TextInput
                                style={[styles.modalInput, { flex: 1 }]}
                                value={qtyBarang}
                                onChangeText={setQtyBarang}
                                placeholder="Quantity"
                                placeholderTextColor="#adb5bd"
                                keyboardType="numeric"
                            />
                            
                            <TextInput
                                style={[styles.modalInput, { flex: 1, marginLeft: 8 }]}
                                value={satuanBarang}
                                onChangeText={setSatuanBarang}
                                placeholder="Satuan"
                                placeholderTextColor="#adb5bd"
                            />
                        </View>
                        
                        <TextInput
                            style={styles.modalInput}
                            value={hargaBarang}
                            onChangeText={setHargaBarang}
                            placeholder="Harga per item"
                            placeholderTextColor="#adb5bd"
                            keyboardType="numeric"
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={handleCloseProdukModal}
                            >
                                <Text style={styles.modalButtonText}>Batal</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveProduk}
                            >
                                <Text style={styles.modalButtonText}>
                                    {editingProdukIndex !== null ? 'Update' : 'Tambah'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
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
    layananButtonTextActive: {
        color: '#ffffff',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0097A7',
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
        borderColor: '#0097A7',
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
        color: '#0097A7',
        fontWeight: '500',
    },
    produkFormContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    produkInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    produkInput: {
        backgroundColor: '#ffffff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dee2e6',
        paddingHorizontal: 8,
        paddingVertical: 8,
        fontSize: 14,
        color: '#212529',
    },
    addProdukButton: {
        backgroundColor: '#28a745',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    produkListContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        padding: 12,
    },
    produkListTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    produkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        padding: 8,
        marginBottom: 8,
    },
    produkItemInfo: {
        flex: 1,
    },
    produkItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
    },
    produkItemDetail: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 2,
    },
    removeProdukButton: {
        padding: 4,
    },
    produkItemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    produkActionButton: {
        padding: 6,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButton: {
        backgroundColor: '#e7f3ff',
        borderWidth: 1,
        borderColor: '#0097A7',
    },
    deleteButton: {
        backgroundColor: '#f8d7da',
        borderWidth: 1,
        borderColor: '#dc3545',
    },
    produkTotalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
        paddingTop: 8,
        marginTop: 8,
    },
    produkTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
    },
    produkTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0097A7',
    },
    addProdukButtonLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0097A7',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
    },
    addProdukButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        margin: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: '#212529',
        marginBottom: 12,
    },
    modalInputRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#6c757d',
    },
    modalButtonSave: {
        backgroundColor: '#28a745',
    },
    modalButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
});
