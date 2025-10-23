import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JenisOrderChart from '../../components/charts/jenis-order-chart';
import OrderChart from '../../components/charts/order-chart';
import PendapatanChart from '../../components/charts/pendapatan-chart';
import { APP_NAME } from '../../constant';
import { apiService } from '../../services/api';

function HomeScreen() {
    const insets = useSafeAreaInsets();
    const [saldo, setSaldo] = useState(0);
    const [showSaldo, setShowSaldo] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userData, setUserData] = useState<any>(null);

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
        const data = await AsyncStorage.getItem('userData');
        if (data) {
            const parsedData = JSON.parse(data);
            setUserData(parsedData);
            // Fetch balance after getting user data
            await fetchBalance(parsedData.no_hp);
            await fetchPendapatan(parsedData.no_hp);
        }
    };

    // Fetch balance from API
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

    const fetchPendapatan = async (phoneNumber: string) => {
        const date = new Date();
        try {
            const response = await apiService.getPendapatanDaily(phoneNumber, date.toLocaleDateString('sv-SE'));
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

    // Toggle show/hide saldo
    const handleToggleSaldo = useCallback(() => {
        setShowSaldo(prev => !prev);
    }, []);

    // Menu items data
    const menuItems = [
        { id: 1, name: 'Transaksi\nManual', icon: 'create-outline' },
        { id: 2, name: 'Riwayat', icon: 'time-outline' },
        { id: 3, name: 'Pengaturan', icon: 'settings-outline' },
        { id: 4, name: 'Bantuan', icon: 'help-circle-outline' },
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
                    <TouchableOpacity style={styles.profileButton}>
                        <View style={styles.profileImage}>
                            <Ionicons name="person" size={24} color="#ffffff" />
                        </View>
                        <View style={styles.profileBadge}>
                            <Text style={styles.profileBadgeText}>6</Text>
                        </View>
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
                        colors={['#0d6efd']} // Android
                        tintColor="#0d6efd" // iOS
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
                <Ionicons name={item.icon as any} size={28} color="#0d6efd" />
              </View>
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>                

                {/* Grafik Pendapatan */}
                {memoizedPendapatanChart}

                {/* Grafik Total Order */}
                {memoizedOrderChart}

                {/* Grafik Jenis Order */}
                {memoizedJenisOrderChart}

                {/* Bottom Spacing for Tab Bar */}
                <View style={{ height: Math.max(insets.bottom, 20) + 80 }} />
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
        borderColor: '#0d6efd',
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
    width: 64,
    height: 64,
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
        fontSize: 12,
        color: '#212529',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 16,
    },
});

export default memo(HomeScreen);
