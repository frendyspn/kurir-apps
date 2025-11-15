import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JenisOrderChart from '../../components/charts/jenis-order-chart';
import OrderChart from '../../components/charts/order-chart';
import PendapatanChart from '../../components/charts/pendapatan-chart';
import { APP_NAME } from '../../constant';
import { apiService } from '../../services/api';
import socketService from '../../services/socket';


function HomeScreen() {
    const insets = useSafeAreaInsets();
    const [saldo, setSaldo] = useState(0);
    const [showSaldo, setShowSaldo] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [acceptedOrders, setAcceptedOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('semua');

    // Data grafik pendapatan per jam (TODO: Get from API)
    const [pendapatanData, setPendapatanData] = useState({
        labels: [],
        datasets: [{
            data: []
        }]
    });

    // Data grafik total order per jam (TODO: Get from API)
    const [orderData, setOrderData] = useState({
        labels: [],
        datasets: [{
            data: []
        }]
    });

    // Data grafik pie jenis order
    const [jenisOrderData, setJenisOrderData] = useState([]);

    // Fetch user data from AsyncStorage
    const fetchUserData = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                const parsedData = JSON.parse(data);
                console.log('🔍 USER DATA FROM ASYNCSTORAGE:', parsedData);
                console.log('🔍 USER ROLE:', parsedData.role);
                console.log('🔍 USER AGEN:', parsedData.agen);
                console.log('🔍 USER NO_HP:', parsedData.no_hp);
                console.log('🔍 USER NAME:', parsedData.name);
                setUserData(parsedData);
                // Fetch balance after getting user data
                await fetchBalance(parsedData.no_hp);
                await fetchPendapatan(parsedData.no_hp);
            } else {
                console.log('❌ NO USER DATA FOUND IN ASYNCSTORAGE');
            }
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
        }
    };    // Fetch balance from API
    const fetchBalance = async (phoneNumber: string) => {
        try {
            const response = await apiService.getBalance(phoneNumber);
            if (response.success && response.data) {
                setSaldo(response.data.balance || 0);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const fetchPendapatan = async (phoneNumber: string, type?: string) => {
        const date = new Date();
        try {
            const response = await apiService.getPendapatanDaily(phoneNumber, date.toLocaleDateString('sv-SE'), type);
            if (response.success && response.data) {
                console.log(response.data?.data?.pendapatan);
                setPendapatanData(response.data?.data?.pendapatan);
                setOrderData(response.data?.data?.orders);

                // Set jenis order data from API
                if (response.data?.data?.jenis_order) {
                    setJenisOrderData(response.data.data.jenis_order);
                }
            }
        } catch (error) {
            console.error('Error fetching pendapatan:', error);
        }
    };

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Get user data
            const user = await AsyncStorage.getItem('userData');
            if (user) {
                const parsedUser = JSON.parse(user);
                setUserData(parsedUser);

                // 🚫 DISABLE SOCKET - Comment out untuk testing
                // // Set current user in socket service
                // socketService.setCurrentUser(parsedUser);

                // // Connect to Firebase
                // await socketService.connect();
                // console.log('🔥 Firebase connected in Order List');

                // // Test Firebase connection
                // console.log('🧪 Testing Firebase connection...');
                // try {
                //     // Simple test: try to read from a test path
                //     const testRef = ref(database, 'test');
                //     console.log('✅ Firebase database reference created successfully');
                // } catch (testError) {
                //     console.warn('⚠️ Firebase test failed:', testError);
                // }

                // Log user role for debugging
                // console.log('👤 User role:', parsedUser.role);
                // console.log('🏢 User agen:', parsedUser.agen);
                // console.log('📱 User data:', parsedUser);

                // Listen for new orders (khusus kurir)
                // REMOVED: Listener moved to RealtimeOrderList component to avoid conflicts
                // if (parsedUser.role === 'kurir') {
                //     socketService.onNewOrders((newOrders) => {
                //         console.log('📦 New orders received:', newOrders.length);
                //         setOrders(newOrders);
                //     });
                // }
            }
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            Alert.alert('Error', 'Gagal menginisialisasi aplikasi');
        } finally {
            setLoading(false);
        }
    };

    // Handle order accepted
    const handleOrderAccepted = useCallback((order: any) => {
        console.log('✅ Order accepted:', order);
        setAcceptedOrders(prev => [...prev, order]);
        
        // Navigate to order detail or show success message
        Alert.alert(
            'Order Diambil!',
            `Order ${order.kode_order} berhasil diambil dan sedang diproses.`,
            [
                { text: 'Lihat Detail', onPress: () => {
                    // TODO: Navigate to order detail screen
                    console.log('Navigate to order detail:', order.id);
                }},
                { text: 'OK' }
            ]
        );
    }, []);

    // Toggle show/hide saldo
    const handleToggleSaldo = useCallback(() => {
        setShowSaldo(prev => !prev);
    }, []);

    // Test socket functionality - Update order status
    const testUpdateOrderStatus = useCallback(async () => {
        console.log('🔄 Testing Order Status Update...');
        
        try {
            // Find the test order we created
            const testOrderId = 'test_' + Date.now(); // This won't work, need to store the ID
            
            // For now, let's create and immediately update
            const orderId = 'test_update_' + Date.now();
            const orderData = {
                id: orderId,
                kode_order: 'UPDATE_TEST_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                status: 'SEARCH',
                tarif: '15000',
                alamat_jemput: 'Test Pickup',
                alamat_antar: 'Test Delivery',
                service: 'FOOD',
                created_at: new Date().toISOString()
            };
            
            // Create order
            await socketService.createOrder(orderData);
            console.log('📦 Test order created for update:', orderData.kode_order);
            
            // Wait 2 seconds then update status
            setTimeout(async () => {
                try {
                    console.log('� Updating order status to PROCESS...');
                    await socketService.updateOrderStatus(orderId, 'PROCESS', {
                        id_sopir: '36',
                        accepted_at: new Date().toISOString()
                    });
                    console.log('✅ Order status updated to PROCESS');
                    
                    // Wait another 2 seconds then complete
                    setTimeout(async () => {
                        console.log('✅ Completing order...');
                        await socketService.updateOrderStatus(orderId, 'DELIVERED', {
                            delivered_at: new Date().toISOString()
                        });
                        console.log('🎉 Order completed!');
                    }, 2000);
                    
                } catch (updateError) {
                    console.error('❌ Status update failed:', updateError);
                }
            }, 2000);
            
            Alert.alert('Status Update Test', 'Order akan diupdate otomatis dalam 2 detik!');
            
        } catch (error) {
            console.error('❌ Status update test failed:', error);
            Alert.alert('Test Failed', error instanceof Error ? error.message : 'Unknown error');
        }
    }, []);

    // Test socket connection and create test order
    const testSocketConnection = useCallback(async () => {
        console.log('🔌 Testing Socket Connection...');
        
        try {
            // Test 1: Check connection status
            const isConnected = socketService.getConnectionStatus();
            console.log('📡 Socket connection status:', isConnected ? '✅ Connected' : '❌ Disconnected');
            
            if (!isConnected) {
                console.log('🔄 Attempting to reconnect...');
                await socketService.connect();
                console.log('✅ Reconnected successfully');
            }
            
            // Test 2: Create a test order
            const orderId = 'test_conn_' + Date.now();
            const orderData = {
                id: orderId,
                kode_order: 'CONN_TEST_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                status: 'SEARCH',
                tarif: '10000',
                alamat_jemput: 'Test Connection Pickup',
                alamat_antar: 'Test Connection Delivery',
                service: 'FOOD',
                created_at: new Date().toISOString()
            };
            
            console.log('📦 Creating test order...');
            await socketService.createOrder(orderData);
            console.log('✅ Test order created successfully:', orderData.kode_order);
            
            // Test 3: Listen for the order in real-time (should appear in RealtimeOrderList)
            console.log('👂 Listening for new orders...');
            
            Alert.alert(
                'Socket Test Success!',
                `✅ Connection: ${isConnected ? 'Connected' : 'Reconnected'}\n📦 Order Created: ${orderData.kode_order}\n👂 Listening for updates...`,
                [{ text: 'OK' }]
            );
            
        } catch (error) {
            console.error('❌ Socket test failed:', error);
            Alert.alert('Socket Test Failed', error instanceof Error ? error.message : 'Unknown error');
        }
    }, []);

    // Update data based on selected filter
    // MOVED TO handleFilterChange for immediate UI feedback

    // Fetch user data on mount
    // Initialize socket connection
    const initializeSocket = async () => {
        try {
            console.log('🔌 Initializing socket connection...');
            await socketService.connect();
            console.log('✅ Socket connected successfully');
            
            // Test socket connection immediately
            console.log('🧪 Testing socket connection...');
            const testResult = socketService.getConnectionStatus();
            console.log('🧪 Socket connection status:', testResult);
            
        } catch (error) {
            console.error('❌ Socket connection failed:', error);
            Alert.alert('Connection Error', 'Failed to connect to real-time service');
        }
    };

    useEffect(() => {
        initializeSocket();
        fetchUserData();
    }, []);

    // Handle hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Exit app when back button is pressed on home screen
            BackHandler.exitApp();
            return true; // Prevent default behavior
        });

        return () => backHandler.remove();
    }, []);

    // Memoize format currency function
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    }, []);

    // Handle pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            if (userData?.no_hp) {
                // Fetch balance from API
                await fetchBalance(userData.no_hp);
                await fetchPendapatan(userData.no_hp);

                // TODO: Fetch other data from API
                // await fetchPendapatanData();
                // await fetchOrderData();
                // await fetchJenisOrderData();
            }

            console.log('Data refreshed');
        } catch (error) {
            console.error('Error refreshing data:', error);

        } finally {
            setRefreshing(false);
        }
    }, [userData]);

    // Handle filter change
    const handleFilterChange = useCallback(async (filterId: string) => {
        console.log(`Filter changed to: ${filterId}`);
        setSelectedFilter(filterId);
        
        // Fetch data immediately for better UX
        if (userData?.no_hp) {
            if (filterId === 'live_order') {
                console.log('Fetching live order data...');
                await fetchPendapatan(userData.no_hp, 'live_order');
            } else if (filterId === 'pasca_order') {
                console.log('Fetching pasca order data...');
                await fetchPendapatan(userData.no_hp, 'pasca_order');
            } else {
                console.log('Fetching all data...');
                await fetchPendapatan(userData.no_hp, 'semua');
            }
        }
    }, [userData?.no_hp]);

    // Menu items data
    const menuItems: any[] = [
        // { id: 1, name: 'Transaksi\nManual', icon: 'create-outline' },
        // { id: 2, name: 'Riwayat', icon: 'time-outline' },
        // { id: 3, name: 'Pengaturan', icon: 'settings-outline' },
        // { id: 4, name: 'Bantuan', icon: 'help-circle-outline' },
    ];

    // Handle menu press
    const handleMenuPress = useCallback((item: any) => {
        console.log(`Menu pressed: ${item.name}`);

        // Navigate based on menu id
        switch (item.id) {
            case 1:
                router.push('/transaksi-manual');
                break;
            case 2:
                // TODO: Navigate to Riwayat screen
                break;
            case 3:
                // TODO: Navigate to Pengaturan screen
                break;
            case 4:
                // TODO: Navigate to Bantuan screen
                break;
        }
    }, []);

    // Memoize charts untuk prevent re-render yang tidak perlu
    const memoizedPendapatanChart = useMemo(() => (
        <PendapatanChart
            data={pendapatanData}
            mode="hourly"
        // date="2025-10-01" 
        />
    ), [pendapatanData]);

    const memoizedOrderChart = useMemo(() => (
        <OrderChart
            data={orderData}
            mode="hourly"
        // date="2025-10-01" 
        />
    ), [orderData]);

    const memoizedJenisOrderChart = useMemo(() => (
        <JenisOrderChart data={jenisOrderData} />
    ), [jenisOrderData]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>4</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.logo}>{APP_NAME}</Text>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/akun')}>
                        <View style={styles.profileImage}>
                            {userData?.foto ? (
                                <Image
                                    source={{ uri: userData.foto }}
                                    style={styles.profileImageContent}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons name="person" size={24} color="#ffffff" />
                            )}
                        </View>
                        {/* <View style={styles.profileBadge}>
                            <Text style={styles.profileBadgeText}>6</Text>
                        </View> */}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content with Pull to Refresh */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0097A7']} // Android
                        tintColor="#0097A7" // iOS
                    />
                }
            >
                {/* Saldo Card */}
                <View style={styles.saldoCard}>
                    <View style={styles.saldoHeader}>
                        <Text style={styles.saldoLabel}>Saldo Anda</Text>
                        <TouchableOpacity onPress={handleToggleSaldo}>
                            <Ionicons
                                name={showSaldo ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#6c757d"
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.saldoAmount}>
                        {showSaldo ? formatCurrency(saldo) : 'Rp ******'}
                    </Text>
                </View>

                {/* Horizontal Menu */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.menuScroll}
                    contentContainerStyle={styles.menuContainer}
                >
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => handleMenuPress(item)}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon as any} size={28} color="#0097A7" />
                            </View>
                            <Text style={styles.menuText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Real-Time Order List - KHUSUS KURIR */}
                {(__DEV__ || userData?.role === 'kurir') && (
                    <>
                        {console.log('🎯 RENDERING RealtimeOrderList - __DEV__:', __DEV__, 'userData.role:', userData?.role)}
                        {/* <RealtimeOrderList 
                            onOrderAccepted={handleOrderAccepted}
                            maxHeight={300}
                        /> */}
                    </>
                )}                {/* Debug Info */}
                {__DEV__ && (
                    <></>
                    // <View style={[styles.saldoCard, { marginTop: 16 }]}>
                    //     <Text style={styles.saldoLabel}>Debug Info:</Text>
                    //     <Text>Role: {userData?.role || 'null'}</Text>
                    //     <Text>Agen: {userData?.agen || 'null'}</Text>
                    //     <Text>Name: {userData?.name || 'null'}</Text>
                    //     <Text>RealtimeOrderList: {(userData?.role === 'kurir' || (__DEV__ && userData?.no_hp)) ? '✅ Rendered' : '❌ Not Rendered'}</Text>
                    //     <Text>Condition: role==='kurir' OR (__DEV__ AND no_hp exists)</Text>
                        
                    //     <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    //         <TouchableOpacity
                    //             style={[styles.menuItem, { backgroundColor: '#28a745', paddingHorizontal: 12, paddingVertical: 6 }]}
                    //             onPress={() => {
                    //                 // Force render RealtimeOrderList for testing
                    //                 setUserData((prev: any) => ({ ...prev, role: 'kurir' }));
                    //                 Alert.alert('Debug', 'RealtimeOrderList akan muncul');
                    //             }}
                    //         >
                    //             <Text style={{ color: '#fff', fontSize: 12 }}>Force Show Orders</Text>
                    //         </TouchableOpacity>
                            
                    //         <TouchableOpacity
                    //             style={[styles.menuItem, { backgroundColor: '#17a2b8', paddingHorizontal: 12, paddingVertical: 6 }]}
                    //             onPress={async () => {
                    //                 // Test if socket listener is working
                    //                 console.log('🧪 TESTING SOCKET LISTENER...');
                    //                 try {
                    //                     const testOrder = {
                    //                         kode_order: 'TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                    //                         service: 'express',
                    //                         tarif: Math.floor(Math.random() * 50000) + 15000, // Random tariff 15k-65k
                    //                         titik_jemput: 'Test Pickup ' + Math.floor(Math.random() * 100),
                    //                         alamat_jemput: 'Jl. Test Pickup No. ' + Math.floor(Math.random() * 100) + ', Jakarta',
                    //                         titik_antar: 'Test Delivery ' + Math.floor(Math.random() * 100),
                    //                         alamat_antar: 'Jl. Test Delivery No. ' + Math.floor(Math.random() * 100) + ', Jakarta',
                    //                         time_remaining: 300,
                    //                         created_at: new Date().toISOString()
                    //                     };
                                        
                    //                     console.log('📤 SENDING TEST ORDER TO FIREBASE:', testOrder);
                    //                     await socketService.createOrder(testOrder);
                    //                     Alert.alert('Test', `Test order ${testOrder.kode_order} dikirim ke Firebase`);
                    //                 } catch (error) {
                    //                     console.error('❌ Error sending test order:', error);
                    //                     Alert.alert('Error', 'Gagal mengirim test order: ' + (error as Error).message);
                    //                 }
                    //             }}
                    //         >
                    //             <Text style={{ color: '#fff', fontSize: 12 }}>Send Test Order</Text>
                    //         </TouchableOpacity>
                            
                    //         <TouchableOpacity
                    //             style={[styles.menuItem, { backgroundColor: '#ffc107', paddingHorizontal: 12, paddingVertical: 6 }]}
                    //             onPress={testSocketConnection}
                    //         >
                    //             <Text style={{ color: '#000', fontSize: 12 }}>Test Socket</Text>
                    //         </TouchableOpacity>
                            
                    //         <TouchableOpacity
                    //             style={[styles.menuItem, { backgroundColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 6 }]}
                    //             onPress={() => {
                    //                 // Reset role
                    //                 setUserData((prev: any) => ({ ...prev, role: undefined }));
                    //                 Alert.alert('Debug', 'RealtimeOrderList disembunyikan');
                    //             }}
                    //         >
                    //             <Text style={{ color: '#fff', fontSize: 12 }}>Hide Orders</Text>
                    //         </TouchableOpacity>
                    //     </View>
                    // </View>
                )}

                {/* MENU KHUSUS AGEN */}
                {
                    userData?.agen === '1' && (
                        <View style={styles.saldoCard}>
                            <View style={styles.saldoHeader}>
                                <Text style={styles.saldoLabel}>Menu Khusus Agen</Text>
                            </View>

                            <View style={styles.menuRow}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => router.push('/live-order')}
                                >
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="flash-outline" size={28} color="#0097A7" />
                                    </View>
                                    <Text style={styles.menuText}>Live Order</Text>
                                </TouchableOpacity>

                                {/* <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={testSocketConnection}
                                >
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="wifi-outline" size={28} color="#28a745" />
                                    </View>
                                    <Text style={styles.menuText}>Test Socket</Text>
                                </TouchableOpacity> */}

                                {/* <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={testUpdateOrderStatus}
                                >
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="refresh-outline" size={28} color="#ffc107" />
                                    </View>
                                    <Text style={styles.menuText}>Test Update</Text>
                                </TouchableOpacity> */}
                            </View>
                        </View>
                    )
                }

                {/* Filter Pills */}
                <View style={styles.filterContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScrollContent}
                    >
                        {[
                            { id: 'semua', label: 'Semua' },
                            { id: 'pasca_order', label: 'Pasca Order' },
                            { id: 'live_order', label: 'Live Order' }
                        ].map((pill) => (
                            <TouchableOpacity
                                key={pill.id}
                                style={[
                                    styles.filterPill,
                                    selectedFilter === pill.id && styles.filterPillActive
                                ]}
                                onPress={() => handleFilterChange(pill.id)}
                            >
                                <Text style={[
                                    styles.filterPillText,
                                    selectedFilter === pill.id && styles.filterPillTextActive
                                ]}>
                                    {pill.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Grafik Pendapatan */}
                {memoizedPendapatanChart}

                {/* Grafik Total Order */}
                {memoizedOrderChart}

                {/* Grafik Jenis Order */}
                {memoizedJenisOrderChart}

                {/* Bottom Spacing for Tab Bar */}
                <View style={{ height: Platform.OS === 'android' ? Math.max(insets.bottom, 20) + 180 : Math.max(insets.bottom, 20) + 120 }} />
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
        backgroundColor: '#0097A7',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationButton: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#dc3545',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    profileButton: {
        position: 'relative',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6c757d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageContent: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#dc3545',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#0097A7',
    },
    profileBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    saldoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    saldoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    saldoLabel: {
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
    saldoAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#212529',
    },
    menuScroll: {
        marginTop: 16,
        marginHorizontal: -16,
    },
    menuRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 16,
    },
    menuContainer: {
        paddingHorizontal: 0,
        paddingLeft: 16,
        gap: 16,
    },
    menuItem: {
        alignItems: 'center',
        width: 80,
    },
    menuIconContainer: {
        width: 54,
        height: 54,
        borderRadius: 32,
        backgroundColor: '#e7f1ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuText: {
        fontSize: 10,
        color: '#212529',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 16,
    },
    filterContainer: {
        marginTop: 16,
        marginBottom: 8,
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    filterPillActive: {
        backgroundColor: '#0097A7',
        borderColor: '#0097A7',
    },
    filterPillText: {
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
    filterPillTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
});

export default memo(HomeScreen);
