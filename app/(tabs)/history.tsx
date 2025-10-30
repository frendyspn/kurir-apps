import AsyncStorage from '@react-native-async-storage/async-storage';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JenisOrderChart from '../../components/charts/jenis-order-chart';
import OrderChart from '../../components/charts/order-chart';
import PendapatanChart from '../../components/charts/pendapatan-chart';
import { apiService } from '../../services/api';

type PeriodeType = 'harian' | 'bulanan';

function HistoryScreen() {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [periode, setPeriode] = useState<PeriodeType>('harian');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');

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
            await fetchPendapatan(parsedData.no_hp, periode);
        }
    };


    const fetchPendapatan = async (phoneNumber: string, periodeType: PeriodeType = 'harian', showLoading: boolean = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            
            let response;
            
            if (periodeType === 'harian') {
                response = await apiService.getPendapatanDaily(phoneNumber);
            } else {
                response = await apiService.getPendapatanMonthly(phoneNumber);
            }
            
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
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchUserData();
        // Set default selected date/month to today
        const today = new Date();
        setSelectedDate(today.toISOString().split('T')[0]);
        setSelectedMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    }, []);

    // Generate list tanggal dalam bulan ini (hanya yang sudah lewat)
    const getAvailableDates = useCallback(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11, untuk Oktober = 9
        const currentDate = today.getDate(); // 1-31
        
        
        const dates = [];
        
        // Loop dari tanggal 1 sampai tanggal hari ini dalam bulan yang sama
        for (let day = 1; day <= currentDate; day++) {
            // Format manual tanpa timezone conversion
            const monthPadded = String(month + 1).padStart(2, '0');
            const dayPadded = String(day).padStart(2, '0');
            const dateString = `${year}-${monthPadded}-${dayPadded}`;
            
            dates.push({
                value: dateString,
                label: `${day} ${year}`,
                day: day
            });
            
        }
        
        return dates.reverse(); // Urutkan dari terbaru (20, 19, 18, ... 1)
    }, []);

    // Generate list bulan dalam tahun ini (hanya yang sudah lewat)
    const getAvailableMonths = useCallback(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-11
        
        const months = [];
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        
        for (let month = 0; month <= currentMonth; month++) {
            months.push({
                value: `${currentYear}-${String(month + 1).padStart(2, '0')}`,
                label: `${monthNames[month]} ${currentYear}`,
                month: month + 1
            });
        }
        
        return months.reverse(); // Urutkan dari terbaru
    }, []);

    // Handle date selection
    const handleDateSelect = useCallback(async (date: string) => {
        console.log('Selected date:', date);
        setSelectedDate(date);
        setLoading(true);
        
        if (userData?.no_hp) {
            try {
                const response = await apiService.getPendapatanDaily(userData.no_hp, date);
                if (response.success && response.data) {
                    setPendapatanData(response.data?.data?.pendapatan);
                    setOrderData(response.data?.data?.orders);
                    if (response.data?.data?.jenis_order) {
                        setJenisOrderData(response.data.data.jenis_order);
                    }
                }
            } catch (error) {
                console.error('Error fetching date data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [userData]);

    // Handle month selection
    const handleMonthSelect = useCallback(async (monthValue: string) => {
        setSelectedMonth(monthValue);
        setLoading(true);
        
        const [year, month] = monthValue.split('-');
        if (userData?.no_hp) {
            try {
                const response = await apiService.getPendapatanMonthly(userData.no_hp, year, month);
                if (response.success && response.data) {
                    setPendapatanData(response.data?.data?.pendapatan);
                    setOrderData(response.data?.data?.orders);
                    if (response.data?.data?.jenis_order) {
                        setJenisOrderData(response.data.data.jenis_order);
                    }
                }
            } catch (error) {
                console.error('Error fetching month data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [userData]);

    // Memoize format currency function
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    }, []);

    // Handle periode change
    const handlePeriodeChange = useCallback(async (newPeriode: PeriodeType) => {
        setPeriode(newPeriode);
        setLoading(true);
        
        if (userData?.no_hp) {
            await fetchPendapatan(userData.no_hp, newPeriode, false);
        }
        
        setLoading(false);
    }, [userData]);

    // Handle pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        
        try {
            if (userData?.no_hp) {
                // Fetch balance from API
                await fetchPendapatan(userData.no_hp, periode);
                
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
    }, [userData, periode]);

    // Memoize charts untuk prevent re-render yang tidak perlu
    const memoizedPendapatanChart = useMemo(() => (
        <PendapatanChart 
            data={pendapatanData} 
            mode={periode === 'harian' ? 'hourly' : 'monthly'} 
            // date="2025-10-01" 
        />
    ), [pendapatanData, periode]);

    const memoizedOrderChart = useMemo(() => (
        <OrderChart 
            data={orderData} 
            mode={periode === 'harian' ? 'hourly' : 'monthly'} 
            // date="2025-10-01" 
        />
    ), [orderData, periode]);

    const memoizedJenisOrderChart = useMemo(() => (
        <JenisOrderChart data={jenisOrderData} />
    ), [jenisOrderData]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                
                <Text style={styles.logo}>History Order</Text>

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
                {/* Filter Periode */}
                <View style={styles.filterCard}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Periode:</Text>
                        
                        <View style={styles.filterButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    periode === 'harian' && styles.filterButtonActive
                                ]}
                                onPress={() => handlePeriodeChange('harian')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    periode === 'harian' && styles.filterButtonTextActive
                                ]}>
                                    Harian
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    periode === 'bulanan' && styles.filterButtonActive
                                ]}
                                onPress={() => handlePeriodeChange('bulanan')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    periode === 'bulanan' && styles.filterButtonTextActive
                                ]}>
                                    Bulanan
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* Horizontal Line */}
                    <View style={styles.filterDivider} />
                    
                    {/* List Tanggal atau Bulan */}
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.dateList}
                        contentContainerStyle={styles.dateListContent}
                    >
                        {periode === 'harian' ? (
                            // List Tanggal
                            getAvailableDates().map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.dateItem,
                                        selectedDate === item.value && styles.dateItemActive
                                    ]}
                                    onPress={() => handleDateSelect(item.value)}
                                >
                                    <Text style={[
                                        styles.dateItemDay,
                                        selectedDate === item.value && styles.dateItemTextActive
                                    ]}>
                                        {item.day}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            // List Bulan
                            getAvailableMonths().map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.monthItem,
                                        selectedMonth === item.value && styles.monthItemActive
                                    ]}
                                    onPress={() => handleMonthSelect(item.value)}
                                >
                                    <Text style={[
                                        styles.monthItemText,
                                        selectedMonth === item.value && styles.monthItemTextActive
                                    ]}>
                                        {item.label.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
                
                {/* Loading Indicator */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0d6efd" />
                        <Text style={styles.loadingText}>Memuat data...</Text>
                    </View>
                )}
                
                {/* Grafik Pendapatan */}
                {!loading && memoizedPendapatanChart}

                {/* Grafik Total Order */}
                {!loading && memoizedOrderChart}

                {/* Grafik Jenis Order */}
                {!loading && memoizedJenisOrderChart}

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
    filterCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
    },
    filterDivider: {
        height: 1,
        backgroundColor: '#e9ecef',
        width: '100%',
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginRight: 12,
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
        alignItems: 'center',
        minWidth: 80,
    },
    filterButtonActive: {
        backgroundColor: '#0d6efd',
        borderColor: '#0d6efd',
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6c757d',
    },
    filterButtonTextActive: {
        color: '#ffffff',
    },
    dateList: {
        marginTop: 12,
    },
    dateListContent: {
        gap: 8,
        paddingRight: 12,
    },
    dateItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
    },
    dateItemActive: {
        backgroundColor: '#0d6efd',
        borderColor: '#0d6efd',
    },
    dateItemDay: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    dateItemTextActive: {
        color: '#ffffff',
    },
    monthItem: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthItemActive: {
        backgroundColor: '#0d6efd',
        borderColor: '#0d6efd',
    },
    monthItemText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#212529',
    },
    monthItemTextActive: {
        color: '#ffffff',
    },
    loadingContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
});

export default memo(HistoryScreen);
