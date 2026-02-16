import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Badge from '../../components/badge';
import JenisOrderChart from '../../components/charts/jenis-order-chart';
import OrderChart from '../../components/charts/order-chart';
import PendapatanChart from '../../components/charts/pendapatan-chart';
import FilterChip from '../../components/filter-chip';
import GlassBackground from '../../components/glass-background';
import InfoCard from '../../components/info-card';
import { APP_NAME } from '../../constant';
import { AuthColors } from '../../constants/theme';
import { apiService } from '../../services/api';
import socketService from '../../services/socket';
import { notificationEvents } from '../../utils/notificationEvents'; // sesuaikan path



function HomeScreen() {
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [listNotif, setListNotif] = useState<any[]>([]);
    const [showNotifModal, setShowNotifModal] = useState(false);
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

    // Fetch jumlah notifikasi belum dibaca
    const fetchUnreadNotifCount = async () => {
        try {
            // Pastikan userData sudah ada dan punya id_konsumen
            if (!userData?.id_konsumen) return;
            const response = await apiService.getNotification(userData.id_konsumen);
            console.log('INI NOTIF')
            console.log(response.data)
            if (response.success && response.data) {
                // Asumsikan response.data.unread_count adalah jumlah notif belum dibaca
                setUnreadNotifCount(response.data?.data?.notifications_new || 0);
                setListNotif(response.data?.data?.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching unread notification count:', error);
        }
    };

    useEffect(() => {
        // fetchUnreadNotifCount();
    }, []);

    // Data grafik pie jenis order
    const [jenisOrderData, setJenisOrderData] = useState([]);

    // Fetch user data from AsyncStorage
    const fetchUserData = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                let parsedData = JSON.parse(data);
                console.log('🔍 USER DATA FROM ASYNCSTORAGE:', parsedData);
                console.log('🔍 USER ROLE:', parsedData.role);
                console.log('🔍 USER AGEN:', parsedData.agen);
                console.log('🔍 USER NO_HP:', parsedData.no_hp);
                console.log('🔍 USER NAME:', parsedData.name);

                // Fetch latest sopir status from API
                try {
                    const statusRes = await apiService.cekStatusSopir(parsedData.no_hp);
                    if (statusRes.success && statusRes.data) {
                        // Merge status data into userData
                        parsedData = { ...parsedData, ...statusRes.data.data };
                        // Save updated userData to AsyncStorage
                        await AsyncStorage.setItem('userData', JSON.stringify(parsedData));
                        console.log('✅ Updated userData with sopir status:', parsedData);
                    }
                } catch (err) {
                    console.error('❌ Error fetching sopir status:', err);
                }

                setUserData(parsedData);
                // Fetch balance after getting user data
                await fetchBalance(parsedData.no_hp);
                await fetchPendapatan(parsedData.no_hp);
                await fetchUnreadNotifCount();
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



    // Toggle show/hide saldo
    const handleToggleSaldo = useCallback(() => {
        setShowSaldo(prev => !prev);
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

    useEffect(() => {
        const handler = () => fetchUnreadNotifCount();
        notificationEvents.on('refreshUnreadNotif', handler);
        return () => {
            notificationEvents.off('refreshUnreadNotif', handler);
        };
    }, [userData]);

    // Handle pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            if (userData?.no_hp) {
                // Fetch balance from API
                await fetchBalance(userData.no_hp);
                await fetchPendapatan(userData.no_hp);
                await fetchUnreadNotifCount();

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
            <GlassBackground />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.notificationButton} onPress={() => setShowNotifModal(true)}>
                    <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                    <Badge count={unreadNotifCount} variant="danger" size="medium" style={styles.notificationBadge} />
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
                <InfoCard
                    title="Saldo Anda"
                    value={showSaldo ? formatCurrency(saldo) : 'Rp ******'}
                    variant="default"
                    rightElement={
                        <TouchableOpacity onPress={handleToggleSaldo}>
                            <Ionicons
                                name={showSaldo ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#6c757d"
                            />
                        </TouchableOpacity>
                    }
                />

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


                {/* MENU KHUSUS AGEN */}
                {
                    userData?.agen === '1' && (
                        <View style={styles.agentMenuCard}>
                            <View style={styles.agentMenuHeader}>
                                <Text style={styles.agentMenuTitle}>Menu Khusus Agen</Text>
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
                            <FilterChip
                                key={pill.id}
                                label={pill.label}
                                selected={selectedFilter === pill.id}
                                variant="primary"
                                size="medium"
                                onPress={() => handleFilterChange(pill.id)}
                            />
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
            {/* Floating Live Order button for agent, always visible */}

            {/* Modal Notifikasi */}
            {showNotifModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999,
                }}>
                    <View style={{
                        width: '85%',
                        maxHeight: '70%',
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 8,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#0097A7', textAlign: 'center' }}>Notifikasi</Text>

                        <ScrollView style={{ maxHeight: 350 }}>

                            {listNotif.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#6c757d', marginTop: 32 }}>Tidak ada notifikasi</Text>
                            ) : (
                                listNotif.map((notif, idx) => (
                                    <View key={notif.id || idx} style={{ marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 12 }}>
                                        <Text style={{ fontWeight: 'bold', color: '#212529', marginBottom: 4 }}>{notif.title || notif.judul || 'Notifikasi'}</Text>
                                        <Text style={{ color: '#6c757d', marginBottom: 2 }}>{notif.body || notif.pesan || notif.text || '-'}</Text>
                                        {notif.created_at && (
                                            <Text style={{ fontSize: 12, color: '#adb5bd' }}>{notif.created_at}</Text>
                                        )}

                                        {
                                            JSON.parse(notif?.data).message?.data && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        JSON.parse(notif?.data).message?.data?.navigate_to === 'live-order' &&
                                                        router.push({
                                                            pathname: '/live-order/detail',
                                                            params: { id: JSON.parse(notif?.data).message?.data?.transaction_id }
                                                        });
                                                        
                                                    }
                                                    }

                                                    style={{ marginTop: 8, backgroundColor: '#f1f3f5', padding: 8, borderRadius: 8 }}>
                                                    <Text style={{ fontSize: 12, color: '#495057' }}>Lihat Detail</Text>
                                                </TouchableOpacity>
                                            )
                                        }
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={{ marginTop: 18, backgroundColor: '#0097A7', paddingVertical: 12, borderRadius: 8 }}
                            onPress={() => setShowNotifModal(false)}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    fabLiveOrder: {
        position: 'absolute',
        right: 15,
        bottom: Platform.OS === 'android' ? 130 : 135,
        borderRadius: 32,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
        zIndex: 100,
    },
    fabPascaOrder: {
        position: 'absolute',
        right: 15,
        bottom: Platform.OS === 'android' ? 60 : 64,
        borderRadius: 32,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
        zIndex: 100,
    },
    fabIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0097A7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        fontWeight: 'bold',
        fontSize: 10,
        color: 'rgba(0,151,167,0.95)',
    },
    container: {
        flex: 1,
        backgroundColor: AuthColors.backgroundEnd,
    },
    header: {
        // backgroundColor: 'rgba(0, 151, 167, 0.7)',
        // backgroundColor: '#2AA7A1',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
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
    agentMenuCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        // elevation: 4,
    },
    agentMenuHeader: {
        marginBottom: 12,
    },
    agentMenuTitle: {
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
    filterContainer: {
        marginTop: 16,
        marginBottom: 8,
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
});

export default memo(HomeScreen);
