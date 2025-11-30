import { apiService } from '@/services/api';
import socketService from '@/services/socket';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


interface TransaksiDetailModalProps {
    transaksi: any;
    onClose: () => void;
    onRefresh?: () => void;
    showApproveSection?: boolean;
    onUpdateTransaksi?: (updatedTransaksi: any) => void;
    isPageMode?: boolean; // New prop to indicate if used as page instead of modal
}

const TransaksiDetailModal = memo(({
    transaksi,
    onClose,
    onRefresh,
    showApproveSection = true,
    onUpdateTransaksi,
    isPageMode = false
}: TransaksiDetailModalProps) => {
    const [userData, setUserData] = useState<any>(null);
    const [approveText, setApproveText] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    
    // Real-time status updates
    const [currentTransaksi, setCurrentTransaksi] = useState(transaksi);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Produk data state
    const [produkData, setProdukData] = useState<any[]>([]);
    const [isLoadingProduk, setIsLoadingProduk] = useState(false);

    // Komisi data state
    const [komisiData, setKomisiData] = useState<any[]>([]);
    const [isLoadingKomisi, setIsLoadingKomisi] = useState(false);

    // Potongan admin data state
    const [adminData, setAdminData] = useState<any[]>([]);
    const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

    // Pickup validation states
    const [isCustomerReady, setIsCustomerReady] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const getUserData = async () => {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                setUserData(JSON.parse(data));
            }
        };
        getUserData();
    }, []);

    // Update currentTransaksi ketika props berubah
    useEffect(() => {
        setCurrentTransaksi(transaksi);
    }, [transaksi]);

    // Fetch produk data ketika id_penjualan tersedia
    useEffect(() => {
        if (currentTransaksi.id_penjualan && currentTransaksi.produk) {
            console.log('📦 Using produk data from transaksi:', currentTransaksi.produk);
            setProdukData(Array.isArray(currentTransaksi.produk) ? currentTransaksi.produk : []);
            setIsLoadingProduk(false);
        } else if (currentTransaksi.id_penjualan) {
            // Jika ada id_penjualan tapi tidak ada produk data, gunakan dummy data
            // console.log('📦 Using dummy produk data for id_penjualan:', currentTransaksi.id_penjualan);
            // const dummyProduk = [
            //     { nama_barang: 'Produk A', qty: '2', harga: '50000', satuan: 'Pcs' },
            //     { nama_barang: 'Produk B', qty: '1', harga: '75000', satuan: 'Pcs' },
            //     { nama_barang: 'Produk C', qty: '3', harga: '25000', satuan: 'Pcs' }
            // ];
            // setProdukData(dummyProduk);
            // setIsLoadingProduk(false);
            
            // Uncomment kode di bawah ini ketika API sudah tersedia
            
            setIsLoadingProduk(true);
            apiService.getDetailPenjualan(currentTransaksi.id_penjualan)
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
                        
                        console.log('✅ Produk data fetched:', produkArray);
                        setProdukData(produkArray);
                    } else {
                        console.log('⚠️ No produk data found or API error');
                        setProdukData([]);
                    }
                })
                .catch(error => {
                    console.error('❌ Error fetching produk data:', error);
                    setProdukData([]);
                })
                .finally(() => {
                    setIsLoadingProduk(false);
                });
            
        } else {
            setProdukData([]);
            setIsLoadingProduk(false);
        }
    }, [currentTransaksi.id_penjualan, currentTransaksi.produk]);

    // Fetch komisi data ketika status = FINISH
    useEffect(() => {
        if (currentTransaksi.status?.toUpperCase() === 'FINISH' && currentTransaksi.id) {
            setIsLoadingKomisi(true);
            apiService.getKomisi(currentTransaksi.id || currentTransaksi.id_transaksi)
                .then(response => {
                    if (response.success && response.data) {
                        let komisiArray = [];
                        
                        if (Array.isArray(response.data)) {
                            komisiArray = response.data;
                        } else if (response.data.komisi && Array.isArray(response.data.komisi)) {
                            komisiArray = response.data.komisi;
                        } else if (response.data.data && Array.isArray(response.data.data)) {
                            komisiArray = response.data.data;
                        }
                        
                        console.log('✅ Komisi data fetched:', komisiArray);
                        setKomisiData(komisiArray);
                    } else {
                        console.log('⚠️ No komisi data found or API error');
                        setKomisiData([]);
                    }
                })
                .catch(error => {
                    console.error('❌ Error fetching komisi data:', error);
                    setKomisiData([]);
                })
                .finally(() => {
                    setIsLoadingKomisi(false);
                });
        } else {
            setKomisiData([]);
            setIsLoadingKomisi(false);
        }
    }, [currentTransaksi.id, currentTransaksi.status]);

    // Fetch potongan admin data ketika status = FINISH
    useEffect(() => {
        if (currentTransaksi.status?.toUpperCase() === 'FINISH' && currentTransaksi.id) {
            setIsLoadingAdmin(true);
            apiService.getAdminKurir(currentTransaksi.id || currentTransaksi.id_transaksi)
                .then(response => {
                    if (response.success && response.data) {
                        let adminArray = [];
                        
                        if (Array.isArray(response.data)) {
                            adminArray = response.data;
                        } else if (response.data.admin && Array.isArray(response.data.admin)) {
                            adminArray = response.data.admin;
                        } else if (response.data.data && Array.isArray(response.data.data)) {
                            adminArray = response.data.data;
                        }
                        
                        console.log('✅ Admin data fetched:', adminArray);
                        setAdminData(adminArray);
                    } else {
                        console.log('⚠️ No admin data found or API error');
                        setAdminData([]);
                    }
                })
                .catch(error => {
                    console.error('❌ Error fetching admin data:', error);
                    setAdminData([]);
                })
                .finally(() => {
                    setIsLoadingAdmin(false);
                });
        } else {
            setAdminData([]);
            setIsLoadingAdmin(false);
        }
    }, [currentTransaksi.id, currentTransaksi.status]);

    // Socket connection status
    useEffect(() => {
        const initializeSocket = async () => {
            try {
                await socketService.connect();
                setSocketConnected(true);
                socketService.emit('connected', {});
            } catch (error) {
                console.error('Failed to connect socket:', error);
                setSocketConnected(false);
            }
        };

        initializeSocket();

        const handleConnected = () => {
            console.log('🔌 Socket connected in TransaksiDetailModal');
            setSocketConnected(true);
        };

        const handleDisconnected = () => {
            console.log('🔌 Socket disconnected in TransaksiDetailModal');
            setSocketConnected(false);
        };

        socketService.on('connected', handleConnected);
        socketService.on('disconnected', handleDisconnected);

        // Set initial connection status
        setSocketConnected(socketService.getConnectionStatus());

        return () => {
            socketService.off('connected', handleConnected);
            socketService.off('disconnected', handleDisconnected);
        };
    }, []);

    // WebSocket listeners untuk status updates
    useEffect(() => {
        const handleOrderStatusUpdated = (data: any) => {
            // Check jika update untuk transaksi ini
            if (data.order_id === currentTransaksi.id || 
                data.kode_order === currentTransaksi.kode_order ||
                data.id_transaksi === currentTransaksi.id) {
                
                console.log('🔄 Updating transaction status:', data);
                setIsStatusUpdating(true);
                
                // Update status lokal
                setCurrentTransaksi((prev: any) => ({
                    ...prev,
                    status: data.status,
                    status_text: data.status_text || data.status,
                    updated_at: data.updated_at || new Date().toISOString(),
                    // Update field lain jika ada
                    ...data
                }));

                // Auto-refresh setelah 2 detik
                setTimeout(() => {
                    setIsStatusUpdating(false);
                    if (onRefresh) {
                        onRefresh();
                    }
                }, 2000);
            }
        };

        const handleTransaksiStatusChanged = (data: any) => {
            // Handle transaksi status changes
            if (data.id_transaksi === currentTransaksi.id) {
                console.log('📊 Transaction status changed:', data);
                handleOrderStatusUpdated(data);
            }
        };

        // Subscribe to events
        socketService.on('orderStatusUpdated', handleOrderStatusUpdated);
        socketService.on('transaksiStatusChanged', handleTransaksiStatusChanged);

        // Cleanup
        return () => {
            socketService.off('orderStatusUpdated', handleOrderStatusUpdated);
            socketService.off('transaksiStatusChanged', handleTransaksiStatusChanged);
        };
    }, [currentTransaksi.id, currentTransaksi.kode_order, onRefresh]);

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    const formatCurrency = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numAmount || 0);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'finish':
            case 'completed':
                return '#28a745';
            case 'pending':
            case 'search':
                return '#ffc107';
            case 'send':
                return '#ffc107';
            case 'cancel':
            case 'cancelled':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'finish':
            case 'completed':
                return 'checkmark-circle';
            case 'pending':
            case 'search':
                return 'time-outline';
            case 'pickup':
                return 'car-outline';
            case 'send':
                return 'cube-outline';
            case 'cancel':
            case 'cancelled':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    const handlePullRefresh = async () => {
        try {
            setRefreshing(true);
            console.log('🔄 Pulling to refresh transaction details...');
            
            // First call onRefresh if provided (parent component will handle API call)
            if (onRefresh) {
                await onRefresh();
            }
            
            // Fetch fresh data for this specific transaction
            if (userData?.no_hp) {
                console.log('📡 Fetching fresh transaction data...');
                
                const today = new Date();
                const startDate = today.toISOString().split('T')[0];
                const endDate = today.toISOString().split('T')[0];
                
                let response;
                
                // Determine which API to use based on transaction type
                if (currentTransaksi.id_penjualan) {
                    // Live order
                    response = await apiService.getListLiveOrder(
                        userData.no_hp,
                        startDate,
                        endDate,
                        userData.no_hp,
                        '',
                        currentTransaksi.kode_order // Search by order code
                    );
                } else {
                    // Manual transaction
                    response = await apiService.getListTransaksiManual(
                        userData.no_hp,
                        startDate,
                        endDate,
                        userData.no_hp,
                        '',
                        currentTransaksi.kode_order // Search by order code
                    );
                }
                
                if (response.success && response.data) {
                    let dataArray = [];
                    
                    if (response.data.data && Array.isArray(response.data.data)) {
                        dataArray = response.data.data;
                    } else if (Array.isArray(response.data)) {
                        dataArray = response.data;
                    }
                    
                    // Find the matching transaction
                    const updatedTransaksi = dataArray.find((item: any) => 
                        item.id === currentTransaksi.id || 
                        item.kode_order === currentTransaksi.kode_order ||
                        item.id_transaksi === currentTransaksi.id
                    );
                    console.log(currentTransaksi)
                    console.log('SUDAHHHHH')
                    if (updatedTransaksi) {
                        console.log('✅ Found updated transaction data:', updatedTransaksi);
                        setCurrentTransaksi(updatedTransaksi);
                        
                        // Notify parent component if callback provided
                        if (onUpdateTransaksi) {
                            onUpdateTransaksi(updatedTransaksi);
                        }
                    } else {
                        console.log('⚠️ Transaction not found in refreshed data');
                    }
                }
            }
            
            console.log('✅ Transaction details refreshed');
        } catch (error) {
            console.error('❌ Error refreshing transaction:', error);
            Alert.alert('Error', 'Gagal memperbarui data transaksi');
        } finally {
            setRefreshing(false);
        }
    };

    const handleApprove = async () => {
        if (approveText.toUpperCase() !== 'SETUJU') {
            Alert.alert('Perhatian', 'Silakan ketik "SETUJU" untuk menyetujui transaksi');
            return;
        }

        try {
            setIsApproving(true);

            if (!userData || !userData.no_hp) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            const requestData = {
                id_transaksi: currentTransaksi.id || currentTransaksi.id_transaksi,
                btn_simpan: 'approve',
                text_approve: 'SETUJU',
                id_sopir: currentTransaksi.id_sopir || '-',
                no_hp: userData.no_hp,
                biaya_antar: currentTransaksi.tarif || '0',
            };

            const response = await apiService.approveTransaksi(requestData);

            if (response.success) {
                Alert.alert('Berhasil', 'Transaksi berhasil disetujui', [
                    {
                        text: 'OK',
                        onPress: () => {
                            onClose();
                            // Refresh transaction list
                            if (onRefresh) {
                                onRefresh();
                            }
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal menyetujui transaksi');
            }
        } catch (error) {
            console.error('Error approving transaksi:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat menyetujui transaksi');
        } finally {
            setIsApproving(false);
        }
    };

    const handleAmbilOrder = async () => {
        try {
            setIsApproving(true);

            if (!userData || !userData.no_hp) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            const requestData = {
                id_transaksi: currentTransaksi.id || currentTransaksi.id_transaksi,
                btn_simpan: 'ambil_order',
                no_hp: userData.no_hp,
                id_sopir: userData.id_sopir || userData.id,
            };

            const response = await apiService.ambilOrder(requestData);

            if (response.success) {
                Alert.alert('Berhasil', 'Order berhasil diambil', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Don't close modal, just refresh transaction list
                            if (onRefresh) {
                                onRefresh();
                            }
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal mengambil order');
                if (onRefresh) {
                                onRefresh();
                            }
            }
        } catch (error) {
            console.error('Error ambil order:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat mengambil order');
        } finally {
            setIsApproving(false);
        }
    };

    const handleEditOrder = () => {
        // Navigate to edit screen with transaction data
        router.push({
            pathname: '/live-order/edit',
            params: { id: currentTransaksi.id }
        });
    };

    const handleTakePhoto = async () => {
        try {
            // Request camera permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required to take photos');
                return;
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const handlePickupOrder = async () => {
        try {
            setIsApproving(true);

            if (!userData || !userData.no_hp) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            // Prepare pickup data based on service type
            const pickupData: any = {
                id_transaksi: currentTransaksi.id || currentTransaksi.id_transaksi,
                btn_simpan: 'pickup_order',
                no_hp: userData.no_hp,
                id_sopir: userData.id_konsumen || userData.id,
            };

            // Add service-specific data
            if (currentTransaksi.jenis_layanan === 'RIDE') {
                pickupData.customer_ready = isCustomerReady;
            } else if (['FOOD', 'SHOP', 'SEND'].includes(currentTransaksi.jenis_layanan)) {
                if (selectedImage) {
                    pickupData.foto_pickup_uri = selectedImage;
                }
            }

            const response = await apiService.pickupOrder(pickupData);

            if (response.success) {
                Alert.alert('Berhasil', 'Order berhasil di-pickup', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Update local transaction status
                            setCurrentTransaksi((prev: any) => ({
                                ...prev,
                                status: 'PROCESS',
                                status_text: 'Sedang Diproses',
                            }));

                            // Notify parent component if callback provided
                            if (onUpdateTransaksi) {
                                onUpdateTransaksi({
                                    ...currentTransaksi,
                                    status: 'PROCESS',
                                    status_text: 'Sedang Diproses',
                                });
                            }

                            // Don't close modal, just refresh transaction list
                            if (onRefresh) {
                                onRefresh();
                            }
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal melakukan pickup order');
            }
        } catch (error) {
            console.error('Error pickup order:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat melakukan pickup order');
        } finally {
            setIsApproving(false);
        }
    };

    const handleCompleteOrder = async () => {
        try {
            setIsApproving(true);

            if (!userData || !userData.no_hp) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            // Prepare complete data based on service type
            const completeData: any = {
                id_transaksi: currentTransaksi.id || currentTransaksi.id_transaksi,
                btn_simpan: 'complete_order',
                no_hp: userData.no_hp,
                id_sopir: userData.id_konsumen || userData.id,
            };

            // Add service-specific data
            if (currentTransaksi.jenis_layanan === 'RIDE') {
                completeData.customer_received = isCustomerReady;
            } else if (['FOOD', 'SHOP', 'SEND'].includes(currentTransaksi.jenis_layanan)) {
                if (selectedImage) {
                    completeData.foto_complete_uri = selectedImage;
                }
            }

            const response = await apiService.completeOrder(completeData);

            if (response.success) {
                Alert.alert('Berhasil', 'Order berhasil diselesaikan', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Update local transaction status
                            setCurrentTransaksi((prev: any) => ({
                                ...prev,
                                status: 'FINISH',
                                status_text: 'Selesai',
                            }));

                            // Notify parent component if callback provided
                            if (onUpdateTransaksi) {
                                onUpdateTransaksi({
                                    ...currentTransaksi,
                                    status: 'FINISH',
                                    status_text: 'Selesai',
                                });
                            }

                            // Don't close modal, just refresh transaction list
                            if (onRefresh) {
                                onRefresh();
                            }
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal menyelesaikan order');
            }
        } catch (error) {
            console.error('Error complete order:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat menyelesaikan order');
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <View style={styles.modalContainer}>
            {/* Modal Header - Only show if not in page mode */}
            {!isPageMode && (
                <View style={styles.modalHeader}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Ionicons name="close" size={28} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.modalHeaderTitle}>Detail Transaksi</Text>
                    <View style={styles.headerRight}>
                        {/* Socket Connection Status */}
                        <View style={[
                            styles.connectionIndicator, 
                            { backgroundColor: socketConnected ? '#28a745' : '#dc3545' }
                        ]} />
                        {/* Refresh Status Indicator */}
                        {refreshing && (
                            <View style={styles.refreshIndicator}>
                                <Ionicons name="refresh" size={16} color="#ffffff" />
                            </View>
                        )}
                    </View>
                    {/* Status Update Indicator */}
                    {isStatusUpdating && (
                        <View style={styles.statusUpdateIndicator}>
                            <Ionicons name="refresh" size={16} color="#ffffff" />
                            <Text style={styles.statusUpdateText}>Updating...</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Modal Content */}
            <ScrollView 
                style={[styles.modalContent, isPageMode && styles.pageContent]}
                contentContainerStyle={isPageMode && styles.pageContentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handlePullRefresh}
                        colors={['#0097A7']} // Android
                        tintColor="#0097A7" // iOS
                        title="Memperbarui..." // iOS
                        titleColor="#0097A7" // iOS
                    />
                }
            >
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusIconContainer}>
                        <Ionicons
                            name={getStatusIcon(currentTransaksi.status)}
                            size={48}
                            color={getStatusColor(currentTransaksi.status)}
                        />
                    </View>
                    <Text style={styles.statusTitle}>Status Transaksi</Text>
                    <View style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusColor(currentTransaksi.status) + '20' },
                        isStatusUpdating && styles.statusUpdating
                    ]}>
                        <Text style={[styles.statusText, { color: getStatusColor(currentTransaksi.status) }]}>
                            {currentTransaksi.status === 'SEARCH' ? 'Mencari Kurir' : 
                             currentTransaksi.status_text || currentTransaksi.status || 'Unknown'}
                        </Text>
                        {isStatusUpdating && (
                            <ActivityIndicator size="small" color={getStatusColor(currentTransaksi.status)} style={{ marginLeft: 8 }} />
                        )}
                    </View>
                </View>

                {/* Order Info */}
                <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                        <Ionicons name="receipt-outline" size={20} color="#0097A7" />
                        <Text style={styles.modalSectionTitle}>Informasi Order</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Kode Order</Text>
                        <Text style={styles.infoValue}>#{currentTransaksi.kode_order}</Text>
                    </View>

                    <View style={styles.modalDivider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tanggal Order</Text>
                        <Text style={styles.infoValue}>{formatDate(currentTransaksi.tanggal_order)}</Text>
                    </View>

                    <View style={styles.modalDivider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Waktu Order</Text>
                        <Text style={styles.infoValue}>{formatTime(currentTransaksi.tanggal_order)}</Text>
                    </View>

                    {currentTransaksi.service && (
                        <>
                            <View style={styles.modalDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Jenis Layanan</Text>
                                <Text style={styles.infoValue}>{currentTransaksi.service}</Text>
                            </View>
                        </>
                    )}
                </View>



                {/* Location Info */}
                <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                        <Ionicons name="navigate-outline" size={20} color="#0097A7" />
                        <Text style={styles.modalSectionTitle}>Informasi Lokasi</Text>
                    </View>

                    {
                        currentTransaksi.jenis_layanan === 'FOOD' || currentTransaksi.jenis_layanan === 'SHOP' ? (
                            <>
                            <View style={styles.locationItem}>
                                <View style={styles.locationIconContainer}>
                                    <Ionicons name="home-outline" size={20} color="#0097A7" />
                                </View>
                                <View style={styles.locationContent}>
                                    <Text style={styles.locationLabel}>Toko</Text>
                                    <Text style={styles.locationText}>{currentTransaksi.pemberi_barang}</Text>
                                </View>
                            </View>
                            <View style={styles.locationDivider}>
                                <View style={styles.locationDot} />
                                <View style={styles.locationLine} />
                                <View style={styles.locationDot} />
                            </View>
                            </>
                        ) : null
                    }

                    <View style={styles.locationItem}>
                        <View style={styles.locationIconContainer}>
                            <Ionicons name="location-outline" size={20} color="#0097A7" />
                        </View>
                        <View style={styles.locationContent}>
                            <Text style={styles.locationLabel}>Alamat Penjemputan</Text>
                            <Text style={styles.locationText}>{currentTransaksi.alamat_jemput || '-'}</Text>
                            {
                                currentTransaksi.titik_jemput !== '' && currentTransaksi.titik_jemput ? (
                                    <TouchableOpacity
                                        style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0097A7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' }}
                                        onPress={() => {
                                        Linking.openURL(currentTransaksi.titik_jemput);
                                        }}
                                    >
                                        <Ionicons name="map-outline" size={16} color="#ffffff" />
                                        <Text style={{ color: '#ffffff' }}>Buka Peta</Text>
                                    </TouchableOpacity>
                                ) : null
                            }
                            
                        </View>
                    </View>

                    <View style={styles.locationDivider}>
                        <View style={styles.locationDot} />
                        <View style={styles.locationLine} />
                        <View style={styles.locationDot} />
                    </View>

                    <View style={styles.locationItem}>
                        <View style={styles.locationIconContainer}>
                            <Ionicons name="location" size={20} color="#dc3545" />
                        </View>
                        <View style={styles.locationContent}>
                            <Text style={styles.locationLabel}>Alamat Tujuan</Text>
                            <Text style={styles.locationText}>{currentTransaksi.alamat_antar || '-'}</Text>
                            {
                                currentTransaksi.titik_antar !== '' && currentTransaksi.titik_antar ? (
                                    <TouchableOpacity
                                        style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0097A7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' }}
                                        onPress={() => {
                                        Linking.openURL(currentTransaksi.titik_antar);
                                        }}
                                    >
                                        <Ionicons name="map-outline" size={16} color="#ffffff" />
                                        <Text style={{ color: '#ffffff' }}>Buka Peta</Text>
                                    </TouchableOpacity>
                                ) : null
                            }
                        </View>
                    </View>
                </View>

                    {/* Customer Info */}
                    <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="person-outline" size={20} color="#0097A7" />
                            <Text style={styles.modalSectionTitle}>Informasi Customer</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nama Customer</Text>
                            <Text style={styles.infoValue}>{currentTransaksi.nama_pemesan || '-'}</Text>
                        </View>
                        <View style={styles.modalDivider} />
                        {['PICKUP', 'SEND'].includes((currentTransaksi.status || '').toUpperCase()) ? (
                            <View style={styles.infoRow}>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity
                                        style={[styles.contactButton, { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }]}
                                        onPress={() => {
                                            let phone = currentTransaksi.no_hp_pemesan;
                                            if (phone && phone.startsWith('08')) {
                                                phone = '628' + phone.slice(2);
                                            }
                                            if (phone) {
                                                const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
                                                Linking.openURL(url);
                                            }
                                        }}
                                    >
                                        <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={styles.contactButtonText}>WhatsApp</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.contactButton, { backgroundColor: '#0097A7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }]}
                                        onPress={() => {
                                            const phone = currentTransaksi.no_hp_pemesan;
                                            if (phone) {
                                                const url = `tel:${phone.replace(/[^0-9]/g, '')}`;
                                                Linking.openURL(url);
                                            }
                                        }}
                                    >
                                        <Ionicons name="call-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={styles.contactButtonText}>Telepon</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>No. HP Customer</Text>
                                <Text style={styles.infoValue}>{currentTransaksi.no_hp_pemesan || '-'}</Text>
                            </View>
                        )}
                    </View>


                    {/* Customer Info */}
                    <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="person-outline" size={20} color="#0097A7" />
                            <Text style={styles.modalSectionTitle}>Informasi Kurir</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nama Kurir</Text>
                            <Text style={styles.infoValue}>{currentTransaksi.nama_kurir || '-'}</Text>
                        </View>
                        <View style={styles.modalDivider} />
                        <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>No. HP</Text>
                                <Text style={styles.infoValue}>{currentTransaksi.no_hp_kurir || '-'}</Text>
                            </View>
                        
                    </View>

                    {/* Customer Info */}
                    <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="person-outline" size={20} color="#0097A7" />
                            <Text style={styles.modalSectionTitle}>Informasi Agen</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nama Agen</Text>
                            <Text style={styles.infoValue}>{currentTransaksi.nama_agen || '-'}</Text>
                        </View>
                        <View style={styles.modalDivider} />
                        <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>No. HP</Text>
                                <Text style={styles.infoValue}>{currentTransaksi.no_hp_agen || '-'}</Text>
                            </View>
                        
                    </View>

                {/* Products Info - Show if id_penjualan exists */}
                {currentTransaksi.id_penjualan && (
                    <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="bag-outline" size={20} color="#0097A7" />
                            <Text style={styles.modalSectionTitle}>Daftar Produk</Text>
                        </View>

                        {isLoadingProduk ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#0097A7" />
                                <Text style={styles.loadingText}>Memuat produk...</Text>
                            </View>
                        ) : produkData.length > 0 ? (
                            produkData.map((produk, index) => {
                                // Handle different field names that might be used in API
                                const namaProduk = produk.nama_barang || produk.nama || produk.name || 'Produk';
                                const qty = parseInt(produk.qty || produk.quantity || 1);
                                const hargaSatuan = parseInt(produk.harga || produk.harga_satuan || produk.price || 0);
                                const totalHarga = qty * hargaSatuan;

                                return (
                                    <View key={index}>
                                        <View style={styles.productRow}>
                                            <View style={styles.productInfo}>
                                                <Text style={styles.productName}>{namaProduk}</Text>
                                                <View style={styles.productDetails}>
                                                    <Text style={styles.productQty}>Qty: {qty}</Text>
                                                    <Text style={styles.productUnitPrice}>
                                                        @ {formatCurrency(hargaSatuan)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.productPrice}>{formatCurrency(totalHarga)}</Text>
                                        </View>
                                        {index < produkData.length - 1 && <View style={styles.modalDivider} />}
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Tidak ada data produk</Text>
                            </View>
                        )}

                        {produkData.length > 0 && (
                            <>
                                <View style={styles.modalDivider} />

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total Produk</Text>
                                    <Text style={styles.totalValue}>
                                        {formatCurrency(
                                            produkData.reduce((total, produk) => {
                                                const qty = parseInt(produk.qty || produk.quantity || 1);
                                                const hargaSatuan = parseInt(produk.harga || produk.harga_satuan || produk.price || 0);
                                                return total + (qty * hargaSatuan);
                                            }, 0)
                                        )}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* Payment Info */}
                <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                        <Ionicons name="wallet-outline" size={20} color="#0097A7" />
                        <Text style={styles.modalSectionTitle}>Informasi Pembayaran</Text>
                    </View>

                    {currentTransaksi.id_penjualan && produkData.length > 0 && (
                        <>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Total Produk</Text>
                                <Text style={styles.paymentValue}>
                                    {formatCurrency(
                                        produkData.reduce((total, produk) => {
                                            const qty = parseInt(produk.qty || produk.quantity || 1);
                                            const hargaSatuan = parseInt(produk.harga || produk.harga_satuan || produk.price || 0);
                                            return total + (qty * hargaSatuan);
                                        }, 0)
                                    )}
                                </Text>
                            </View>

                            <View style={styles.modalDivider} />
                        </>
                    )}

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Biaya Antar</Text>
                        <Text style={styles.paymentValue}>{formatCurrency(currentTransaksi.tarif)}</Text>
                    </View>

                    <View style={styles.modalDivider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Pembayaran</Text>
                        <Text style={styles.totalValue}>
                            {formatCurrency(
                                (currentTransaksi.id_penjualan && produkData.length > 0 ?
                                    produkData.reduce((total, produk) => {
                                        const qty = parseInt(produk.qty || produk.quantity || 1);
                                        const hargaSatuan = parseInt(produk.harga || produk.harga_satuan || produk.price || 0);
                                        return total + (qty * hargaSatuan);
                                    }, 0)
                                    : 0) + parseInt(currentTransaksi.tarif || '0')
                            )}
                        </Text>
                    </View>
                </View>

                {/* Komisi Info - Show if status = FINISH */}
                {currentTransaksi.status?.toUpperCase() === 'FINISH' && (
                    <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="cash-outline" size={20} color="#28a745" />
                            <Text style={styles.modalSectionTitle}>Pembagian Komisi</Text>
                        </View>

                        {isLoadingKomisi ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#28a745" />
                                <Text style={styles.loadingText}>Memuat data komisi...</Text>
                            </View>
                        ) : komisiData.length > 0 ? (
                            komisiData.map((komisi, index) => {
                                // Handle different field names that might be used in API
                                const amount = parseInt(komisi.amount || 0);
                                const trxType = komisi.trx_type || komisi.type || 'credit';
                                const note = komisi.note || '';
                                const createdAt = komisi.created_at || komisi.date || '';
                                
                                // Format date
                                let formattedDate = '';
                                if (createdAt) {
                                    try {
                                        const date = new Date(createdAt);
                                        formattedDate = date.toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        });
                                    } catch (e) {
                                        formattedDate = createdAt;
                                    }
                                }

                                return (
                                    <View key={komisi.id || index}>
                                        <View style={styles.komisiRow}>
                                            <View style={styles.komisiInfo}>
                                                <Text style={styles.komisiNote}>
                                                    {note || `Komisi ${trxType === 'credit' ? 'Pemasukan' : 'Pengeluaran'}`}
                                                </Text>
                                                {formattedDate && (
                                                    <Text style={styles.komisiDate}>{formattedDate}</Text>
                                                )}
                                            </View>
                                            <View style={styles.komisiAmountContainer}>
                                                <Text style={[
                                                    styles.komisiAmount,
                                                    { color: trxType === 'credit' ? '#28a745' : '#dc3545' }
                                                ]}>
                                                    {trxType === 'credit' ? '+' : '-'}{formatCurrency(amount)}
                                                </Text>
                                                <Text style={[
                                                    styles.komisiType,
                                                    { color: trxType === 'credit' ? '#28a745' : '#dc3545' }
                                                ]}>
                                                    {trxType === 'credit' ? 'Credit' : 'Debit'}
                                                </Text>
                                            </View>
                                        </View>
                                        {index < komisiData.length - 1 && <View style={styles.modalDivider} />}
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cash-outline" size={32} color="#dee2e6" />
                                <Text style={styles.emptyText}>Tidak ada data komisi</Text>
                            </View>
                        )}

                        {komisiData.length > 0 && (
                            <>
                                <View style={styles.modalDivider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total Komisi</Text>
                                    <Text style={styles.totalValue}>
                                        {formatCurrency(
                                            komisiData.reduce((total, komisi) => {
                                                const amount = parseInt(komisi.amount || 0);
                                                const trxType = komisi.trx_type || komisi.type || 'credit';
                                                return trxType === 'credit' ? total + amount : total - amount;
                                            }, 0)
                                        )}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* Potongan Admin Info - Show if status = FINISH */}
                {currentTransaksi.status?.toUpperCase() === 'FINISH' && (
                    <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="business-outline" size={20} color="#dc3545" />
                            <Text style={styles.modalSectionTitle}>Potongan Admin</Text>
                        </View>

                        {isLoadingAdmin ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#dc3545" />
                                <Text style={styles.loadingText}>Memuat data potongan admin...</Text>
                            </View>
                        ) : adminData.length > 0 ? (
                            adminData.map((admin, index) => {
                                // Handle different field names that might be used in API
                                const amount = parseInt(admin.amount || admin.potongan || 0);
                                const trxType = admin.trx_type || admin.type || 'debit';
                                const note = admin.note || admin.keterangan || '';
                                const createdAt = admin.created_at || admin.date || '';
                                
                                // Format date
                                let formattedDate = '';
                                if (createdAt) {
                                    try {
                                        const date = new Date(createdAt);
                                        formattedDate = date.toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        });
                                    } catch (e) {
                                        formattedDate = createdAt;
                                    }
                                }

                                return (
                                    <View key={admin.id || index}>
                                        <View style={styles.adminRow}>
                                            <View style={styles.adminInfo}>
                                                <Text style={styles.adminNote}>
                                                    {note || `Potongan Admin ${trxType === 'debit' ? 'Pengeluaran' : 'Pemasukan'}`}
                                                </Text>
                                                {formattedDate && (
                                                    <Text style={styles.adminDate}>{formattedDate}</Text>
                                                )}
                                            </View>
                                            <View style={styles.adminAmountContainer}>
                                                <Text style={[
                                                    styles.adminAmount,
                                                    { color: trxType === 'debit' ? '#dc3545' : '#28a745' }
                                                ]}>
                                                    {trxType === 'debit' ? '-' : '+'}{formatCurrency(amount)}
                                                </Text>
                                                <Text style={[
                                                    styles.adminType,
                                                    { color: trxType === 'debit' ? '#dc3545' : '#28a745' }
                                                ]}>
                                                    {trxType === 'debit' ? 'Debit' : 'Credit'}
                                                </Text>
                                            </View>
                                        </View>
                                        {index < adminData.length - 1 && <View style={styles.modalDivider} />}
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="business-outline" size={32} color="#dee2e6" />
                                <Text style={styles.emptyText}>Tidak ada data potongan admin</Text>
                            </View>
                        )}

                        {adminData.length > 0 && (
                            <>
                                <View style={styles.modalDivider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total Potongan Admin</Text>
                                    <Text style={styles.totalValue}>
                                        {formatCurrency(
                                            adminData.reduce((total, admin) => {
                                                const amount = parseInt(admin.amount || admin.potongan || 0);
                                                const trxType = admin.trx_type || admin.type || 'debit';
                                                return trxType === 'debit' ? total + amount : total - amount;
                                            }, 0)
                                        )}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* Approve Section - Only for Agen with PENDING status */}
                {showApproveSection && userData?.agen === '1' && currentTransaksi.status?.toUpperCase() === 'PENDING' && (
                    <View style={styles.approveSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="checkmark-done-outline" size={20} color="#28a745" />
                            <Text style={styles.modalSectionTitle}>Approve Transaksi</Text>
                        </View>

                        <Text style={styles.approveInstruction}>
                            Ketik &quot;SETUJU&quot; untuk menyetujui transaksi ini
                        </Text>

                        <TextInput
                            style={styles.approveInput}
                            value={approveText}
                            onChangeText={setApproveText}
                            placeholder="Ketik SETUJU"
                            placeholderTextColor="#adb5bd"
                            autoCapitalize="characters"
                        />

                        <TouchableOpacity
                            style={[
                                styles.approveButton,
                                (approveText.toUpperCase() !== 'SETUJU' || isApproving) && styles.approveButtonDisabled
                            ]}
                            onPress={handleApprove}
                            disabled={approveText.toUpperCase() !== 'SETUJU' || isApproving}
                        >
                            {isApproving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                                    <Text style={styles.approveButtonText}>Setujui Transaksi</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Ambil Order Section - Only for Kurir with SEARCH status and LIVE_ORDER source */}
                {/* userData?.agen === '0' &&  */}
                {currentTransaksi.status?.toUpperCase() === 'SEARCH' && currentTransaksi.source === 'LIVE_ORDER' && (
                    <View style={styles.ambilOrderSection}>
                        <TouchableOpacity
                            style={styles.ambilOrderButton}
                            onPress={handleAmbilOrder}
                            disabled={isApproving}
                        >
                            {isApproving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="car-outline" size={20} color="#ffffff" />
                                    <Text style={styles.ambilOrderButtonText}>Ambil Order</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Pickup Order Section - Only for PICKUP status and id_konsumen = id_sopir */}
                {currentTransaksi.status?.toUpperCase() === 'PICKUP' && userData?.id_konsumen === currentTransaksi.id_kurir && (
                    <View style={styles.pickupOrderSection}>
                        {/* Checkbox for RIDE service */}
                        {currentTransaksi.jenis_layanan === 'RIDE' && (
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setIsCustomerReady(!isCustomerReady)}
                                >
                                    {isCustomerReady && (
                                        <Ionicons name="checkmark" size={16} color="#17a2b8" />
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>Pastikan customer sudah siap</Text>
                            </View>
                        )}

                        {/* Photo form for FOOD, SHOP, SEND services */}
                        {(currentTransaksi.jenis_layanan === 'FOOD' || currentTransaksi.jenis_layanan === 'SHOP' || currentTransaksi.jenis_layanan === 'SEND') && (
                            <View style={styles.photoContainer}>
                                <Text style={styles.photoLabel}>Ambil foto bukti pickup</Text>
                                <TouchableOpacity
                                    style={styles.photoButton}
                                    onPress={handleTakePhoto}
                                >
                                    <Ionicons name="camera-outline" size={20} color="#17a2b8" />
                                    <Text style={styles.photoButtonText}>
                                        {selectedImage ? 'Foto Diambil' : 'Ambil Foto'}
                                    </Text>
                                </TouchableOpacity>
                                {selectedImage && (
                                    <View style={styles.photoPreviewContainer}>
                                        <Image
                                            source={{ uri: selectedImage }}
                                            style={styles.photoPreview}
                                            resizeMode="cover"
                                        />
                                        <Text style={styles.photoStatus}>✓ Foto berhasil diambil</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.pickupOrderButton,
                                ((currentTransaksi.jenis_layanan === 'RIDE' && !isCustomerReady) ||
                                 ((currentTransaksi.jenis_layanan === 'FOOD' || currentTransaksi.jenis_layanan === 'SHOP' || currentTransaksi.jenis_layanan === 'SEND') && !selectedImage)) &&
                                styles.pickupOrderButtonDisabled
                            ]}
                            onPress={handlePickupOrder}
                            disabled={isApproving || 
                                (currentTransaksi.jenis_layanan === 'RIDE' && !isCustomerReady) ||
                                ((currentTransaksi.jenis_layanan === 'FOOD' || currentTransaksi.jenis_layanan === 'SHOP' || currentTransaksi.jenis_layanan === 'SEND') && !selectedImage)}
                        >
                            {isApproving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="car-sport-outline" size={20} color="#ffffff" />
                                    <Text style={styles.pickupOrderButtonText}>Pickup Order</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Complete Order Section - Only for SEND status and id_konsumen = id_sopir */}
                {currentTransaksi.status?.toUpperCase() === 'SEND' && userData?.id_konsumen === currentTransaksi.id_kurir && (
                    <View style={styles.completeOrderSection}>
                        {/* Checkbox for RIDE service */}
                        {currentTransaksi.jenis_layanan === 'RIDE' && (
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setIsCustomerReady(!isCustomerReady)}
                                >
                                    {isCustomerReady && (
                                        <Ionicons name="checkmark" size={16} color="#28a745" />
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>Pastikan pesanan sudah diterima customer</Text>
                            </View>
                        )}

                        {/* Photo form for FOOD, SHOP, SEND services */}
                        {(currentTransaksi.jenis_layanan === 'FOOD' || currentTransaksi.jenis_layanan === 'SHOP' || currentTransaksi.jenis_layanan === 'SEND') && (
                            <View style={styles.photoContainer}>
                                <Text style={styles.photoLabel}>Ambil foto bukti penyelesaian</Text>
                                <TouchableOpacity
                                    style={styles.photoButton}
                                    onPress={handleTakePhoto}
                                >
                                    <Ionicons name="camera-outline" size={20} color="#28a745" />
                                    <Text style={styles.photoButtonText}>
                                        {selectedImage ? 'Foto Diambil' : 'Ambil Foto'}
                                    </Text>
                                </TouchableOpacity>
                                {selectedImage && (
                                    <View style={styles.photoPreviewContainer}>
                                        <Image
                                            source={{ uri: selectedImage }}
                                            style={styles.photoPreview}
                                            resizeMode="cover"
                                        />
                                        <Text style={styles.photoStatus}>✓ Foto berhasil diambil</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.completeOrderButton,
                                ((currentTransaksi.jenis_layanan === 'RIDE' && !isCustomerReady) ||
                                 ((currentTransaksi.jenis_layanan === 'FOOD' || currentTransaksi.jenis_layanan === 'SHOP' || currentTransaksi.jenis_layanan === 'SEND') && !selectedImage)) &&
                                styles.completeOrderButtonDisabled
                            ]}
                            onPress={handleCompleteOrder}
                            disabled={isApproving ||
                                (currentTransaksi.jenis_layanan === 'RIDE' && !isCustomerReady) ||
                                ((currentTransaksi.jenis_layanan === 'FOOD' || currentTransaksi.jenis_layanan === 'SHOP' || currentTransaksi.jenis_layanan === 'SEND') && !selectedImage)}
                        >
                            {isApproving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-done" size={20} color="#ffffff" />
                                    <Text style={styles.completeOrderButtonText}>Selesaikan Order</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Edit Order Section - Only for LIVE_ORDER source and status != FINISH */}
                {currentTransaksi.source === 'LIVE_ORDER' &&
                 currentTransaksi.status?.toUpperCase() !== 'FINISH' &&
                 (userData?.id_konsumen === currentTransaksi.id_agen || userData?.id_konsumen === currentTransaksi.id_kurir) && (
                    <View style={styles.editOrderSection}>
                        <TouchableOpacity
                            style={styles.editOrderButton}
                            onPress={handleEditOrder}
                        >
                            <Ionicons name="create-outline" size={20} color="#ffffff" />
                            <Text style={styles.editOrderButtonText}>Edit Order</Text>
                        </TouchableOpacity>
                    </View>
                )}

                

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
});

TransaksiDetailModal.displayName = 'TransaksiDetailModal';

const styles = StyleSheet.create({
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginHorizontal: 2,
    },
    contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalHeader: {
        backgroundColor: '#0097A7',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 32,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    pageContent: {
        paddingTop: 16,
    },
    pageContentContainer: {
        paddingBottom: 32,
    },
    statusCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusIconContainer: {
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalSection: {
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
    modalSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6c757d',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        flex: 1,
        textAlign: 'right',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#e9ecef',
        marginVertical: 4,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    locationIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationContent: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 14,
        color: '#212529',
        lineHeight: 20,
    },
    locationDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15,
        paddingVertical: 8,
    },
    locationDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#dee2e6',
    },
    locationLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#dee2e6',
        marginHorizontal: 4,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#6c757d',
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0097A7',
    },
    approveSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#28a745',
    },
    approveInstruction: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 12,
    },
    approveInput: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#dee2e6',
        fontSize: 16,
        marginBottom: 12,
    },
    approveButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    approveButtonDisabled: {
        backgroundColor: '#adb5bd',
    },
    approveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    productQty: {
        fontSize: 12,
        color: '#6c757d',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
    },
    productDetails: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    productUnitPrice: {
        fontSize: 12,
        color: '#6c757d',
    },
    connectionIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    refreshIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    statusUpdateIndicator: {
        position: 'absolute',
        top: 50,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusUpdateText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    statusUpdating: {
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    ambilOrderSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#0097A7',
    },
    ambilOrderButton: {
        backgroundColor: '#0097A7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    ambilOrderButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    editOrderSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    editOrderButton: {
        backgroundColor: '#ffc107',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    editOrderButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    pickupOrderSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#17a2b8',
    },
    pickupOrderButton: {
        backgroundColor: '#17a2b8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    pickupOrderButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    pickupOrderButtonDisabled: {
        backgroundColor: '#adb5bd',
    },
    completeOrderSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#28a745',
    },
    completeOrderButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    completeOrderButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    completeOrderButtonDisabled: {
        backgroundColor: '#adb5bd',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#17a2b8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#ffffff',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#212529',
        flex: 1,
    },
    photoContainer: {
        marginBottom: 16,
    },
    photoLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 8,
    },
    photoButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#17a2b8',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoButtonText: {
        color: '#17a2b8',
        fontSize: 14,
        fontWeight: '600',
    },
    photoStatus: {
        fontSize: 12,
        color: '#28a745',
        marginTop: 8,
        textAlign: 'center',
    },
    photoPreviewContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    photoPreview: {
        width: 200,
        height: 150,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#6c757d',
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
    komisiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    komisiInfo: {
        flex: 1,
    },
    komisiNote: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 2,
    },
    komisiDate: {
        fontSize: 12,
        color: '#6c757d',
    },
    komisiAmountContainer: {
        alignItems: 'flex-end',
    },
    komisiAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    komisiType: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    adminRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    adminInfo: {
        flex: 1,
    },
    adminNote: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 2,
    },
    adminDate: {
        fontSize: 12,
        color: '#6c757d',
    },
    adminAmountContainer: {
        alignItems: 'flex-end',
    },
    adminAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    adminType: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
});

export default TransaksiDetailModal;
