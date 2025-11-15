import DatePickerInput from '@/components/date-picker-input';
import PelangganSearchInput from '@/components/pelanggan-search-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LiveOrderData {
    id: string;
    source: string;
    status: string;
    kode_order?: string;
    service?: string;
    nama_layanan?: string;
    jenis_layanan?: string;
    customer_name?: string;
    customer_phone?: string;
    pickup_address?: string;
    delivery_address?: string;
    alamat_jemput?: string;
    alamat_antar?: string;
    tarif?: string;
    item_description?: string;
    item_weight?: string;
    item_value?: string;
    delivery_fee?: string;
    payment_method?: string;
    notes?: string;
    pickup_date?: string;
    delivery_date?: string;
    created_at?: string;
    updated_at?: string;
    nama_toko?: string;
    produk?: any[];
    id_pemesan?: string;
    nama_pemesan?: string;
    no_hp_pemesan?: string;
    id_penjualan?: string;
}

export default function EditLiveOrderScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [orderData, setOrderData] = useState<LiveOrderData | null>(null);

    // Form states - sesuai dengan tambah.tsx
    const [tanggal, setTanggal] = useState<Date>(new Date());
    const [pelanggan, setPelanggan] = useState<string>('');
    const [pelangganLabel, setPelangganLabel] = useState<string>('');
    const [pelangganData, setPelangganData] = useState<any>(null);
    const [layanan, setLayanan] = useState<string>('');
    const [alamatJemput, setAlamatJemput] = useState<string>('');
    const [alamatAntar, setAlamatAntar] = useState<string>('');
    const [biayaAntar, setBiayaAntar] = useState<string>('');
    const [namaRestoToko, setNamaRestoToko] = useState<string>('');

    // Produk state
    const [produkList, setProdukList] = useState<Array<{
        id_barang: string;
        nama_barang: string;
        qty: string;
        satuan: string;
        harga: string;
    }>>([]);
    const [produkData, setProdukData] = useState<any[]>([]);
    const [isLoadingProduk, setIsLoadingProduk] = useState(false);
    const [idBarang, setIdBarang] = useState<string>('');
    const [namaBarang, setNamaBarang] = useState<string>('');
    const [qtyBarang, setQtyBarang] = useState<string>('');
    const [satuanBarang, setSatuanBarang] = useState<string>('Pcs');
    const [hargaBarang, setHargaBarang] = useState<string>('');
    const [showProdukModal, setShowProdukModal] = useState(false);
    const [editingProdukIndex, setEditingProdukIndex] = useState<number | null>(null);

    // Dropdown options
    const [pelangganOptions, setPelangganOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [layananOptions, setLayananOptions] = useState<Array<{ label: string; value: string }>>([]);

    // Loading state for dropdowns
    const [loadingPelanggan, setLoadingPelanggan] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

    // Memoized selected label to ensure it's always computed correctly
    const memoizedSelectedLabel = useMemo(() => {
        if (pelanggan && pelangganData) {
            return pelangganLabel || `${pelangganData.nama_lengkap} (${pelangganData.no_hp})`;
        }
        return pelangganLabel;
    }, [pelanggan, pelangganLabel, pelangganData]);

    useEffect(() => {
        loadOrderData();
    }, []);

    useEffect(() => {
        // Set hardcoded layanan options
        setLayananOptions([
            { label: 'Ride', value: 'RIDE' },
            { label: 'Send', value: 'SEND' },
            { label: 'Food', value: 'FOOD' },
            { label: 'Shop', value: 'SHOP' },
        ]);
        // setLoadingLayanan(false);
    }, []);

    useEffect(() => {
        // Handle produk list when service changes
        console.log('useEffect produk - layanan:', layanan, 'orderData.produk:', orderData?.produk, 'orderData.id_penjualan:', orderData?.id_penjualan);

        if (layanan && layanan !== 'FOOD' && layanan !== 'SHOP') {
            // Clear produk list when changing from FOOD/SHOP to other services
            console.log('Clearing produk list for non-FOOD/SHOP service');
            setProdukList([]);
            setNamaRestoToko('');
        } else if (layanan && (layanan === 'FOOD' || layanan === 'SHOP')) {
            // Set produk list when changing to FOOD/SHOP services
            if (orderData?.produk && Array.isArray(orderData.produk) && orderData.produk.length > 0) {
                console.log('Setting produk list from orderData:', orderData.produk);
                setProdukList(orderData.produk);
            } else if (produkData && produkData.length > 0) {
                // Use fetched produkData if available
                console.log('Setting produk list from fetched produkData:', produkData);
                const convertedProduk = produkData.map((produk: any) => ({
                    id_barang: produk.id_produk || produk.id || '',
                    nama_barang: produk.nama_barang || produk.nama || produk.name || 'Produk',
                    qty: String(produk.qty || produk.quantity || 1),
                    satuan: produk.satuan || 'Pcs',
                    harga: String(produk.harga || produk.harga_satuan || produk.price || 0),
                }));
                setProdukList(convertedProduk);
            } else {
                console.log('No produk found in orderData or produkData, keeping empty list');
                // Keep produkList empty if no produk in orderData and no fetched produkData
            }
        }
    }, [layanan, orderData, produkData]);

    useLayoutEffect(() => {
        // Ensure customer input shows selected label when data is loaded
        if (pelanggan && pelangganLabel && pelangganData) {
            // Force update of options to include current selection
            const currentOption = {
                label: pelangganLabel,
                value: pelanggan,
                data: pelangganData,
            } as any;

            setPelangganOptions(prev => {
                const filtered = prev.filter(opt => opt.value !== pelanggan);
                return [currentOption, ...filtered];
            });
        }
    }, [pelanggan, pelangganLabel, pelangganData]);

    useEffect(() => {
        // Set layanan after layananOptions are loaded and we have orderData
        if (layananOptions.length > 0 && orderData && !layanan) {
            // Try to find matching option by value first
            let serviceValue = orderData.service || orderData.nama_layanan || orderData.jenis_layanan;

            if (serviceValue) {
                let matchingOption = layananOptions.find(opt => opt.value === serviceValue);

                // If not found by value, try to find by label (case insensitive)
                if (!matchingOption) {
                    matchingOption = layananOptions.find(opt =>
                        opt.label.toLowerCase() === serviceValue.toLowerCase()
                    );
                }

                if (matchingOption) {
                    setLayanan(matchingOption.value);
                } else {
                    console.warn('Layanan tidak ditemukan dalam options:', serviceValue);
                    // Default to first option if available
                    if (layananOptions.length > 0) {
                        setLayanan(layananOptions[0].value);
                    }
                }
            } else {
                console.warn('Service value tidak ditemukan di orderData');
                // Default to first option if available
                if (layananOptions.length > 0) {
                    setLayanan(layananOptions[0].value);
                }
            }
        }
    }, [layananOptions, orderData]);

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    // Fetch produk data ketika id_penjualan tersedia
    useEffect(() => {
        if (orderData?.id_penjualan && !orderData?.produk) {
            // Jika ada id_penjualan tapi tidak ada produk data, gunakan API
            console.log('📦 Fetching produk data from API for id_penjualan:', orderData.id_penjualan);
            setIsLoadingProduk(true);
            apiService.getDetailPenjualan(orderData.id_penjualan)
                .then(response => {
                    if (response.success && response.data) {
                        let produkArray = [];

                        if (Array.isArray(response.data)) {
                            produkArray = response.data;
                        } else if (response.data.produk && Array.isArray(response.data.produk)) {
                            produkArray = response.data.produk;
                        } else if (response.data.data && Array.isArray(response.data.data)) {
                            produkArray = response.data.data;
                        }

                        console.log('✅ Produk data fetched from API:', produkArray);
                        setProdukData(produkArray);
                        // Convert API data to produkList format for editing
                        const convertedProduk = produkArray.map((produk: any) => ({
                            id_barang: produk.id_produk || produk.id || '',
                            nama_barang: produk.nama_barang || produk.nama || produk.name || 'Produk',
                            qty: String(produk.qty || produk.quantity || 1),
                            satuan: produk.satuan || 'Pcs',
                            harga: String(produk.harga || produk.harga_satuan || produk.price || 0),
                        }));
                        setProdukList(convertedProduk);
                    } else {
                        console.log('⚠️ No produk data found in API response');
                        setProdukData([]);
                        setProdukList([]);
                    }
                })
                .catch(error => {
                    console.error('❌ Error fetching produk data:', error);
                    setProdukData([]);
                    setProdukList([]);
                })
                .finally(() => {
                    setIsLoadingProduk(false);
                });
        } else if (orderData?.produk && Array.isArray(orderData.produk)) {
            // Jika sudah ada produk data dari orderData
            console.log('📦 Using produk data from orderData:', orderData.produk);
            setProdukData(orderData.produk);
            setProdukList(orderData.produk);
            setIsLoadingProduk(false);
        } else {
            setProdukData([]);
            setIsLoadingProduk(false);
        }
    }, [orderData?.id_penjualan, orderData?.produk]);

    const loadOrderData = async () => {
        try {
            setLoadingData(true);
            const orderId = params.id as string;
            if (!orderId) {
                Alert.alert('Error', 'Order ID tidak ditemukan');
                router.back();
                return;
            }

            // Get user data from AsyncStorage
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                router.back();
                return;
            }

            const user = JSON.parse(userData);

            // Get current date for filtering
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];

            // Fetch live orders using API
            const response = await apiService.getListLiveOrder(
                user.no_hp,
                startDate,
                endDate,
                user.no_hp,
                '',
                orderId // Search by order code or ID
            );

            if (response.success && response.data) {
                let dataArray = [];

                if (response.data.data && Array.isArray(response.data.data)) {
                    dataArray = response.data.data;
                } else if (Array.isArray(response.data)) {
                    dataArray = response.data;
                }

                // Find the matching transaction
                const foundOrder = dataArray.find((item: any) =>
                    item.id?.toString() === orderId ||
                    item.kode_order === orderId ||
                    item.id_transaksi?.toString() === orderId
                );

                if (foundOrder) {
                    setOrderData(foundOrder);

                    // Debug: log customer fields
                    console.log('Order customer fields:', {
                        id_pemesan: foundOrder.id_pemesan,
                        nama_pemesan: foundOrder.nama_pemesan,
                        no_hp_pemesan: foundOrder.no_hp_pemesan,
                        customer_name: foundOrder.customer_name,
                        customer_phone: foundOrder.customer_phone,
                    });

                    // Set existing customer immediately after setting orderData
                    if (foundOrder.nama_pemesan && foundOrder.no_hp_pemesan) {
                        const existingCustomerLabel = `${foundOrder.nama_pemesan} (${foundOrder.no_hp_pemesan})`;
                        const existingCustomerData = {
                            id_konsumen: foundOrder.id_pemesan || 'existing',
                            nama_lengkap: foundOrder.nama_pemesan,
                            no_hp: foundOrder.no_hp_pemesan,
                        };

                        setPelangganOptions([{
                            label: existingCustomerLabel,
                            value: foundOrder.id_pemesan || 'existing',
                            data: existingCustomerData,
                        } as any]);

                        setPelanggan(foundOrder.id_pemesan || 'existing');
                        setPelangganLabel(existingCustomerLabel);
                        setPelangganData(existingCustomerData);

                        console.log('Setting customer data (nama_pemesan):', {
                            pelanggan: foundOrder.id_pemesan || 'existing',
                            pelangganLabel: existingCustomerLabel,
                            pelangganData: existingCustomerData,
                        });

                        setForceUpdate(prev => prev + 1); // Force re-render

                        // Don't trigger handlePelangganChange here as it might cause issues
                        // The data is already set correctly above
                    } else if (foundOrder.customer_name && foundOrder.customer_phone) {
                        // Fallback to old field names if new ones don't exist
                        const existingCustomerLabel = `${foundOrder.customer_name} (${foundOrder.customer_phone})`;
                        const existingCustomerData = {
                            id_konsumen: foundOrder.id_pemesan || 'existing',
                            nama_lengkap: foundOrder.customer_name,
                            no_hp: foundOrder.customer_phone,
                        };

                        setPelangganOptions([{
                            label: existingCustomerLabel,
                            value: foundOrder.id_pemesan || 'existing',
                            data: existingCustomerData,
                        } as any]);

                        setPelanggan(foundOrder.id_pemesan || 'existing');
                        setPelangganLabel(existingCustomerLabel);
                        setPelangganData(existingCustomerData);

                        console.log('Setting customer data (customer_name):', {
                            pelanggan: foundOrder.id_pemesan || 'existing',
                            pelangganLabel: existingCustomerLabel,
                            pelangganData: existingCustomerData,
                        });

                        setForceUpdate(prev => prev + 1); // Force re-render

                        // Don't trigger handlePelangganChange here as it might cause issues
                        // The data is already set correctly above
                    } else {
                        console.log('No customer data found in orderData');
                    }

                    populateForm(foundOrder);
                } else {
                    Alert.alert('Error', 'Data order tidak ditemukan');
                    router.back();
                }
            } else {
                Alert.alert('Error', response.message || 'Gagal memuat data order');
                router.back();
            }
        } catch (error) {
            console.error('Error loading order data:', error);
            Alert.alert('Error', 'Gagal memuat data order');
            router.back();
        } finally {
            setLoadingData(false);
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

            let options: Array<{ label: string; value: string; data?: any }> = [];

            if (response.success && response.data && response.data.data) {
                const pelangganData = response.data.data;

                if (Array.isArray(pelangganData)) {
                    options = pelangganData.map((item: any) => ({
                        label: item.nama_lengkap + ' (' + item.no_hp + ')',
                        value: item.id_konsumen || item.id,
                        data: item, // Store full data
                    }));
                } else {
                    console.error('Pelanggan data is not an array:', pelangganData);
                }
            }

            // Always include existing customer if it exists and is different from current search results
            if (pelanggan && pelangganData && pelangganLabel &&
                !options.some(opt => opt.value === pelanggan)) {
                const existingOption = {
                    label: pelangganLabel,
                    value: pelanggan,
                    data: pelangganData,
                };

                // Add existing customer to the beginning of results
                options.unshift(existingOption);
                console.log('Added existing customer to search results:', existingOption);
            }

            setPelangganOptions(options);
        } catch (error) {
            console.error('Error searching pelanggan:', error);
        } finally {
            setLoadingPelanggan(false);
        }
    };

    const handlePelangganChange = (value: string) => {
        console.log('handlePelangganChange called with value:', value);
        setPelanggan(value);
        // Find and set the label and full data
        const selected = pelangganOptions.find(opt => opt.value === value);
        if (selected) {
            setPelangganLabel(selected.label);
            setPelangganData((selected as any).data);
            console.log('Found selected customer:', selected);
        } else if (value && value !== 'existing' && pelangganData && pelangganLabel) {
            // Handle existing customer case with actual ID
            // pelangganData and pelangganLabel are already set from orderData
            console.log('Using existing customer data for value:', value);
        } else if (value === 'existing' && pelangganData && pelangganLabel) {
            // Handle the 'existing' case - customer data should already be set
            console.log('Using existing customer data for "existing" value');
        } else {
            // Only clear if we have no valid customer data at all
            console.log('No valid customer data found, clearing...');
            setPelangganLabel('');
            setPelangganData(null);
        }
    };

    const handleClearPelangganResults = () => {
        setPelangganOptions([]);
        // Don't clear existing customer data - only clear if it's a newly searched customer
        // The existing customer from orderData should always remain selected
        console.log('Clearing pelanggan results, but keeping existing customer:', {
            currentPelanggan: pelanggan,
            orderDataIdPemesan: orderData?.id_pemesan,
            pelangganData: pelangganData
        });
    };

    // Produk functions
    const handleOpenProdukModal = (index?: number) => {
        if (index !== undefined) {
            // Edit mode
            const produk = produkList[index];
            setIdBarang(produk.id_barang);
            setNamaBarang(produk.nama_barang);
            setQtyBarang(produk.qty);
            setSatuanBarang(produk.satuan);
            setHargaBarang(produk.harga);
            setEditingProdukIndex(index);
        } else {
            // Add mode - reset form
            setIdBarang('');
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
        setIdBarang('');
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
            id_barang: String(idBarang || '').trim(),
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
    };

    const handleHapusProduk = (index: number) => {
        setProdukList(prev => prev.filter((_, i) => i !== index));
    };

    const getTotalHargaProduk = () => {
        return produkList.reduce((total, produk) => {
            const qty = parseInt(produk.qty) || 0;
            const harga = parseInt(produk.harga) || 0;
            return total + (qty * harga);
        }, 0);
    };

    const populateForm = (data: LiveOrderData) => {
        // Set tanggal
        if (data.created_at) {
            setTanggal(new Date(data.created_at));
        }

        // Set customer data if available
        if (data.customer_name && data.customer_phone) {
            // Customer data will be set in useEffect after orderData is loaded
            // This is just for backward compatibility
        }

        // Note: layanan is now set in useEffect after layananOptions are loaded

        // Set alamat
        setAlamatJemput(data.pickup_address || data.alamat_jemput || '');
        setAlamatAntar(data.delivery_address || data.alamat_antar || '');

        // Set biaya antar
        setBiayaAntar(data.delivery_fee || data.tarif || '');

        // Set nama resto/toko - try multiple possible field names
        const dataAny = data as any; // Type assertion to access potential API fields
        const namaToko = dataAny.nama_toko || dataAny.nama_resto || dataAny.nama_restoran || dataAny.store_name || dataAny.restaurant_name || dataAny.pemberi_barang || '';
        setNamaRestoToko(namaToko);

        // Note: produk is now set in useEffect after orderData is loaded

        // Debug: log service value and store name
        console.log('Order data service fields:', {
            service: data.service,
            nama_layanan: data.nama_layanan,
            jenis_layanan: data.jenis_layanan,
            produk: data.produk,
            nama_toko: dataAny.nama_toko,
            nama_resto: dataAny.nama_resto,
            nama_restoran: dataAny.nama_restoran,
            store_name: dataAny.store_name,
            restaurant_name: dataAny.restaurant_name,
            final_nama_toko: namaToko
        });
    };

    const handleSave = async () => {
        if (!orderData) return;

        // Validation
        if (!layanan || !alamatJemput || !alamatAntar || !biayaAntar) {
            Alert.alert('Error', 'Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        // Validation for Food and Shop
        if ((layanan === 'FOOD' || layanan === 'SHOP') && !namaRestoToko) {
            Alert.alert('Error', 'Mohon isi nama restoran/toko');
            return;
        }

        // Validation for Produk (Food and Shop)
        if ((layanan === 'FOOD' || layanan === 'SHOP') && produkList.length === 0) {
            Alert.alert('Error', 'Mohon tambahkan minimal satu produk');
            return;
        }

        // Validation for Customer
        if (!pelanggan || !pelangganData) {
            Alert.alert('Error', 'Mohon pilih pelanggan');
            return;
        }

        // For existing customers, we don't update customer data in API
        // as we don't have the actual customer ID
        const shouldUpdateCustomer = pelanggan !== orderData?.id_pemesan;

        setLoading(true);
        try {
            const updatedData: any = {
                nama_layanan: layanan,
                alamat_penjemputan: alamatJemput,
                alamat_tujuan: alamatAntar,
                biaya_antar: biayaAntar,
                nama_toko: (layanan === 'FOOD' || layanan === 'SHOP') ? namaRestoToko : undefined,
                tanggal_order: tanggal.toISOString().split('T')[0],
                produk: (layanan === 'FOOD' || layanan === 'SHOP') ? produkList : undefined,
            };

            // Only add customer data if it's not an existing customer
            if (shouldUpdateCustomer) {
                updatedData.id_konsumen = pelangganData?.id_konsumen || pelangganData?.id;
                updatedData.nama_konsumen = pelangganData?.nama_lengkap;
                updatedData.no_hp_konsumen = pelangganData?.no_hp;
            }

            // Update via API
            const response = await apiService.updateLiveOrder(orderData.id, updatedData);

            if (response.success) {
                Alert.alert('Sukses', 'Order berhasil diperbarui', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', 'Gagal memperbarui order');
            }


        } catch (error) {
            console.error('Error updating order:', error);
            Alert.alert('Error', 'Gagal memperbarui order');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.loadingText}>Memuat data order...</ThemedText>
            </ThemedView>
        );
    }

    if (!orderData) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.loadingText}>Data order tidak ditemukan</ThemedText>
            </ThemedView>
        );
    }

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

                <Text style={styles.headerTitle}>Edit Live Order</Text>

                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 120 }}
            >
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Form Edit Live Order</Text>

                    {/* Tanggal */}
                    <DatePickerInput
                        label="Tanggal"
                        value={tanggal}
                        onChange={setTanggal}
                        placeholder="Pilih tanggal"
                    />

                    {/* Customer/Pelanggan */}
                    <PelangganSearchInput
                        key={`customer-${pelanggan}-${memoizedSelectedLabel}-${forceUpdate}`}
                        label="Customer"
                        value={pelanggan}
                        selectedLabel={memoizedSelectedLabel}
                        onChange={handlePelangganChange}
                        onSearch={handleSearchPelanggan}
                        onClearResults={handleClearPelangganResults}
                        options={pelangganOptions}
                        isSearching={loadingPelanggan}
                        placeholder="Cari customer..."
                    />

                    {/* Layanan */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Layanan *</Text>
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

                            {/* Loading state for produk */}
                            {isLoadingProduk && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#0097A7" />
                                    <Text style={styles.loadingText}>Memuat produk...</Text>
                                </View>
                            )}

                            {/* List Produk */}
                            {!isLoadingProduk && produkList.length > 0 && (
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

                            {/* Empty state for produk */}
                            {!isLoadingProduk && produkList.length === 0 && (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Belum ada produk ditambahkan</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <Text style={styles.submitButtonText}>Menyimpan...</Text>
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
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
    loadingText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 50,
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
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#6c757d',
        fontStyle: 'italic',
    },
});
