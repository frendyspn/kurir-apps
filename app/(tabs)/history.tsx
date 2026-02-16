import GlassBackground from '@/components/glass-background';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JenisOrderChart from '../../components/charts/jenis-order-chart';
import OrderChart from '../../components/charts/order-chart';
import PendapatanChart from '../../components/charts/pendapatan-chart';
import TransactionList from '../../components/transaction-list';
import { apiService } from '../../services/api';

type PeriodeType = 'harian' | 'bulanan' | 'custom';
type OrderType = 'semua' | 'pasca_order' | 'live_order';
type ReportType = 'chart' | 'list';

function HistoryScreen() {
    // Date picker modal state
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    // Handler for date picker
    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            const isoDate = selectedDate.toISOString().split('T')[0];
            setCustomStartDate(isoDate);
        }
    };
    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            const isoDate = selectedDate.toISOString().split('T')[0];
            setCustomEndDate(isoDate);
        }
    };
    // State for custom periode
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [periode, setPeriode] = useState<PeriodeType>('harian');
    const [type, setType] = useState<OrderType>('semua');
    const [reportType, setReportType] = useState<ReportType>('chart');
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

    // Data list transaksi untuk tampilan list
    const [transactionList, setTransactionList] = useState<any[]>([]);

    // Fetch user data from AsyncStorage
    const fetchUserData = async () => {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
            const parsedData = JSON.parse(data);
            setUserData(parsedData);
            // Fetch balance after getting user data
            await fetchPendapatan(parsedData.no_hp, periode, type);
        }
    };


    const fetchPendapatan = async (phoneNumber: string, periodeType: PeriodeType, type: OrderType = 'semua', showLoading: boolean = true, specificDate?: string, specificYear?: string, specificMonth?: string) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            
            let response;
            
            if (periodeType === 'harian') {
                // Use specific date if provided, otherwise use undefined for current/default
                const dateToUse = specificDate || undefined;
                response = await apiService.getPendapatanDaily(phoneNumber, dateToUse, type);
            } else if (periodeType === 'custom') {
                // Use specific start and end dates if provided, otherwise use undefined for current/default
                const startDateToUse = specificDate || undefined;
                const endDateToUse = specificDate || undefined;
                response = await apiService.getPendapatanCustom(phoneNumber, startDateToUse, endDateToUse, type);
            } else {
                // Use specific year/month if provided, otherwise use undefined for current/default
                const yearToUse = specificYear || undefined;
                const monthToUse = specificMonth || undefined;
                response = await apiService.getPendapatanMonthly(phoneNumber, yearToUse, monthToUse, type);
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
    const fetchTransactionList = async (phoneNumber: string, startDate: string, endDate: string, type: OrderType = 'semua') => {
        try {
            setLoading(true);
            
            // Map type to service type for API
            let serviceType = '';
            if (type === 'pasca_order') {
                serviceType = 'pasca_order';
            } else if (type === 'live_order') {
                serviceType = 'live_order';
            }
            
            const response = await apiService.getListTransaksiManual(
                phoneNumber,
                startDate,
                endDate,
                undefined, // idKonsumen
                serviceType || undefined,
                undefined // searchQuery
            );
            
            if (response.success && response.data) {
                setTransactionList(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching transaction list:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get date range for transaction list
    const getDateRangeForTransactionList = useCallback((periodeType: PeriodeType, selectedDate: string, selectedMonth: string) => {
        if (periodeType === 'harian') {
            return {
                startDate: selectedDate,
                endDate: selectedDate
            };
        } else {
            // For monthly, get the first and last day of the selected month
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month.padStart(2, '0')}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
            
            return {
                startDate,
                endDate
            };
        }
    }, []);

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
        
        if (userData?.no_hp) {
            await fetchPendapatan(userData.no_hp, 'harian', type, true, date);
            
            // If in list view, also fetch transaction list
            if (reportType === 'list') {
                await fetchTransactionList(userData.no_hp, date, date, type);
            }
        }
    }, [userData, type, reportType]);

    // Handle month selection
    const handleMonthSelect = useCallback(async (monthValue: string) => {
        setSelectedMonth(monthValue);
        
        const [year, month] = monthValue.split('-');
        if (userData?.no_hp) {
            await fetchPendapatan(userData.no_hp, 'bulanan', type, true, undefined, year, month);
            
            // If in list view, also fetch transaction list
            if (reportType === 'list') {
                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                const startDate = `${year}-${month.padStart(2, '0')}-01`;
                const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
                await fetchTransactionList(userData.no_hp, startDate, endDate, type);
            }
        }
    }, [userData, type, reportType]);

    // Memoize format currency function
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    }, []);

    // Handle periode change
    const handlePeriodeChange = useCallback(async (newPeriode: PeriodeType | 'custom') => {
        setPeriode(newPeriode);
        setLoading(true);
        // Reset custom dates if not custom
    if (newPeriode !== 'custom' as PeriodeType) {
            setCustomStartDate('');
            setCustomEndDate('');
        }
    if (userData?.no_hp && newPeriode !== 'custom' as PeriodeType) {
            await fetchPendapatan(userData.no_hp, newPeriode, type, false);
            // If in list view, also fetch transaction list
            if (reportType === 'list') {
                const { startDate, endDate } = getDateRangeForTransactionList(newPeriode, selectedDate, selectedMonth);
                await fetchTransactionList(userData.no_hp, startDate, endDate, type);
            }
        }
        setLoading(false);
    }, [userData, type, reportType, selectedDate, selectedMonth, getDateRangeForTransactionList]);

    // Handle type change
    const handleTypeChange = useCallback(async (newType: OrderType) => {
        setType(newType);
        setLoading(true);
        
        if (userData?.no_hp) {
            await fetchPendapatan(userData.no_hp, periode, newType, false);
            
            // If in list view, also fetch transaction list
            if (reportType === 'list') {
                const { startDate, endDate } = getDateRangeForTransactionList(periode, selectedDate, selectedMonth);
                await fetchTransactionList(userData.no_hp, startDate, endDate, newType);
            }
        }
        
        setLoading(false);
    }, [userData, periode, reportType, selectedDate, selectedMonth, getDateRangeForTransactionList]);

    // Handle report change
    const handleReportChange = useCallback(async (newReportType: ReportType) => {
        setReportType(newReportType);
        
        // If switching to list view, fetch transaction list data
        if (newReportType === 'list' && userData?.no_hp) {
            const { startDate, endDate } = getDateRangeForTransactionList(periode, selectedDate, selectedMonth);
            await fetchTransactionList(userData.no_hp, startDate, endDate, type);
        }
        
        // If switching to chart view, ensure chart data is fresh
        if (newReportType === 'chart' && userData?.no_hp) {
            await fetchPendapatan(userData.no_hp, periode, type, true);
        }
    }, [userData, periode, selectedDate, selectedMonth, type, getDateRangeForTransactionList]);

    // Handle pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        
        try {
            if (userData?.no_hp) {
                // Fetch balance from API
                await fetchPendapatan(userData.no_hp, periode, type);
                
                // If in list view, also fetch transaction list
                if (reportType === 'list') {
                    const { startDate, endDate } = getDateRangeForTransactionList(periode, selectedDate, selectedMonth);
                    await fetchTransactionList(userData.no_hp, startDate, endDate, type);
                }
                
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
    }, [userData, periode, type, reportType, selectedDate, selectedMonth, getDateRangeForTransactionList]);

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
            <GlassBackground />
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
                        colors={['#0097A7']}
                        tintColor="#0097A7"
                    />
                }
            >
                {/* Filter Periode */}
                <View style={styles.filterCard}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Periode:</Text>
                        <View style={styles.filterButtons}>
                            <TouchableOpacity
                                style={[styles.filterButton, periode === 'harian' && styles.filterButtonActive]}
                                onPress={() => handlePeriodeChange('harian')}
                            >
                                <Text style={[styles.filterButtonText, periode === 'harian' && styles.filterButtonTextActive]}>Harian</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterButton, periode === 'bulanan' && styles.filterButtonActive]}
                                onPress={() => handlePeriodeChange('bulanan')}
                            >
                                <Text style={[styles.filterButtonText, periode === 'bulanan' && styles.filterButtonTextActive]}>Bulanan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterButton, periode === 'custom' && styles.filterButtonActive]}
                                onPress={() => handlePeriodeChange('custom')}
                            >
                                <Text style={[styles.filterButtonText, periode === 'custom' && styles.filterButtonTextActive]}>Periode</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Custom Periode Date Pickers */}
                    {periode === 'custom' && (
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.filterLabel}>Periode Awal</Text>
                                <TouchableOpacity
                                    style={styles.filterButton}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Text style={styles.filterButtonText}>{customStartDate || 'Pilih tanggal'}</Text>
                                </TouchableOpacity>
                                {showStartDatePicker && (
                                    <DateTimePicker
                                        value={customStartDate ? new Date(customStartDate) : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleStartDateChange}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.filterLabel}>Periode Akhir</Text>
                                <TouchableOpacity
                                    style={styles.filterButton}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <Text style={styles.filterButtonText}>{customEndDate || 'Pilih tanggal'}</Text>
                                </TouchableOpacity>
                                {showEndDatePicker && (
                                    <DateTimePicker
                                        value={customEndDate ? new Date(customEndDate) : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleEndDateChange}
                                    />
                                )}
                            </View>
                            <View style={{ justifyContent: 'flex-end' }}>
                                <TouchableOpacity
                                    style={[styles.filterButton, { backgroundColor: '#28a745', borderColor: '#28a745' }]}
                                    disabled={!customStartDate || !customEndDate}
                                    onPress={async () => {
                                        if (userData?.no_hp && customStartDate && customEndDate) {
                                            setLoading(true);
                                            await fetchPendapatan(userData.no_hp, 'custom', type, false, customStartDate, customEndDate);
                                            if (reportType === 'list') {
                                                await fetchTransactionList(userData.no_hp, customStartDate, customEndDate, type);
                                            }
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <Text style={[styles.filterButtonText, { color: '#fff' }]}>Filter</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
                {/* Horizontal Line */}
                <View style={styles.filterDivider} />
                {/* List Tanggal atau Bulan */}
                {periode !== 'custom' && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.dateList}
                        contentContainerStyle={styles.dateListContent}
                    >
                        {periode === 'harian'
                            ? getAvailableDates().map((item) => (
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
                            : getAvailableMonths().map((item) => (
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
                            ))}
                    </ScrollView>
                )}
                <View style={styles.filterDivider} />
                <View style={{ ...styles.filterRow, marginTop: 12 }}>
                    <Text style={styles.filterLabel}>Order:</Text>
                    <View style={styles.filterButtons}>
                        <TouchableOpacity
                            style={[styles.filterButton, type === 'semua' && styles.filterButtonActive]}
                            onPress={() => handleTypeChange('semua')}
                        >
                            <Text style={[styles.filterButtonText, type === 'semua' && styles.filterButtonTextActive]}>Semua</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, type === 'pasca_order' && styles.filterButtonActive]}
                            onPress={() => handleTypeChange('pasca_order')}
                        >
                            <Text style={[styles.filterButtonText, type === 'pasca_order' && styles.filterButtonTextActive]}>Pasca</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, type === 'live_order' && styles.filterButtonActive]}
                            onPress={() => handleTypeChange('live_order')}
                        >
                            <Text style={[styles.filterButtonText, type === 'live_order' && styles.filterButtonTextActive]}>Live</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.filterDivider} />
                <View style={{ ...styles.filterRow, marginTop: 12 }}>
                    <Text style={styles.filterLabel}>Report:</Text>
                    <View style={styles.filterButtons}>
                        <TouchableOpacity
                            style={[styles.filterButton, reportType === 'chart' && styles.filterButtonActive]}
                            onPress={() => handleReportChange('chart')}
                        >
                            <Text style={[styles.filterButtonText, reportType === 'chart' && styles.filterButtonTextActive]}>Chart</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, reportType === 'list' && styles.filterButtonActive]}
                            onPress={() => handleReportChange('list')}
                        >
                            <Text style={[styles.filterButtonText, reportType === 'list' && styles.filterButtonTextActive]}>List</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Loading Indicator */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0097A7" />
                        <Text style={styles.loadingText}>Memuat data...</Text>
                    </View>
                )}
                {/* Conditional Rendering: Charts or Transaction List */}
                {!loading && reportType === 'chart' && (
                    <>
                        {memoizedPendapatanChart}
                        {memoizedOrderChart}
                        {memoizedJenisOrderChart}
                    </>
                )}
                {!loading && reportType === 'list' && (
                    <TransactionList transactions={transactionList} loading={loading} />
                )}
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
        // backgroundColor: '#0097A7',
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
        paddingHorizontal: 15,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
        alignItems: 'center',
        minWidth: 80,
    },
    filterButtonActive: {
        backgroundColor: '#0097A7',
        borderColor: '#0097A7',
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
        marginVertical: 12,
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
        backgroundColor: '#0097A7',
        borderColor: '#0097A7',
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
        backgroundColor: '#0097A7',
        borderColor: '#0097A7',
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
