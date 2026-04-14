import DatePickerInput from '@/components/date-picker-input';
import DropdownInput from '@/components/dropdown-input';
import SearchInput from '@/components/search-input';
import TransaksiDetailModal from '@/components/transaksi-detail-modal';
import { apiService } from '@/services/api';
import { onlineStatusEvents } from '@/utils/onlineStatusEvents';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExportLaporanModal from '../../components/export-laporan-modal';

// Memoized Transaksi Item Component
const TransaksiItem = memo(({ item, onPress }: { item: any; onPress: (item: any) => void }) => {
    const handlePress = useCallback(() => {
        onPress(item);
    }, [item, onPress]);

    return (
        <TouchableOpacity
            style={styles.transaksiItem}
            activeOpacity={0.7}
            onPress={handlePress}
        >
            <View style={styles.transaksiHeader}>
                <Text style={styles.transaksiId}>#{item.kode_order}</Text>
                <Text style={styles.transaksiDate}>
                    {new Date(item.tanggal_order).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                </Text>
            </View>
            <View style={styles.transaksiBody}>
                <View style={styles.addressContainer}>
                    <Ionicons name="location-outline" size={16} color="#0097A7" />
                    <Text style={styles.addressLabel}>Jemput: </Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                        {item.alamat_jemput || '-'}
                    </Text>
                </View>
                <View style={styles.addressContainer}>
                    <Ionicons name="location" size={16} color="#dc3545" />
                    <Text style={styles.addressLabel}>Antar: </Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                        {item.alamat_antar || '-'}
                    </Text>
                </View>
                {item.service && (
                    <Text style={styles.transaksiService}>
                        {item.service}
                    </Text>
                )}
            </View>
            <View style={styles.transaksiFooter}>
                <Text style={styles.transaksiAmount}>
                    Rp {parseInt(item.tarif || 0).toLocaleString('id-ID')}
                </Text>
                <Text style={[
                    styles.transaksiStatus,
                    item.status === 'FINISH' && styles.statusCompleted,
                    item.status === 'PENDING' && styles.statusPending,
                ]}>
                    {item.status || 'Unknown'}
                </Text>
            </View>
            <View style={styles.viewDetailContainer}>
                <Text style={styles.viewDetailText}>Lihat Detail</Text>
                <Ionicons name="chevron-forward" size={16} color="#0097A7" />
            </View>
        </TouchableOpacity>
    );
});

TransaksiItem.displayName = 'TransaksiItem';

export default function TransaksiManualScreen() {
    const insets = useSafeAreaInsets();
    const now = new Date();
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [dateFilterMode, setDateFilterMode] = useState<'range' | 'monthly'>('range');
    const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
    const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1).padStart(2, '0'));
    const [serviceType, setServiceType] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
    const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ label: string; value: string }>>([
        { label: 'Semua Layanan', value: '' },
    ]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingTransaksi, setLoadingTransaksi] = useState<boolean>(false);
    const [transaksiList, setTransaksiList] = useState<any[]>([]);
    const [userData, setUserData] = useState<any>(null);

    // Modal states
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);

    // Online status
    const [isOnline, setIsOnline] = useState<boolean>(false);

    // Export modal
    const [isExportModalVisible, setIsExportModalVisible] = useState<boolean>(false);

    // Use ref to track if initial load is done
    const isInitialLoad = useRef(true);

    // Format date to YYYY-MM-DD
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const monthOptions = useMemo(() => ([
        { label: 'Januari', value: '01' },
        { label: 'Februari', value: '02' },
        { label: 'Maret', value: '03' },
        { label: 'April', value: '04' },
        { label: 'Mei', value: '05' },
        { label: 'Juni', value: '06' },
        { label: 'Juli', value: '07' },
        { label: 'Agustus', value: '08' },
        { label: 'September', value: '09' },
        { label: 'Oktober', value: '10' },
        { label: 'November', value: '11' },
        { label: 'Desember', value: '12' },
    ]), []);

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const options: Array<{ label: string; value: string }> = [];
        for (let year = 2024; year <= currentYear; year++) {
            options.push({ label: String(year), value: String(year) });
        }
        return options;
    }, []);

    const getCurrentFilterRange = useCallback(() => {
        if (dateFilterMode === 'monthly') {
            const year = Number(selectedYear);
            const month = Number(selectedMonth);
            const start = `${selectedYear}-${selectedMonth}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const end = `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
            return { startDate: start, endDate: end };
        }

        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        };
    }, [dateFilterMode, endDate, selectedMonth, selectedYear, startDate]);

    // Handle open modal
    const handleOpenDetail = useCallback((item: any) => {
        setSelectedTransaksi(item);
        setIsModalVisible(true);
    }, []);

    // Handle close modal
    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        setSelectedTransaksi(null);
    }, []);

    // Read online status from AsyncStorage and subscribe to changes
    useEffect(() => {
        const loadOnlineStatus = async () => {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                const parsed = JSON.parse(data);
                setIsOnline(parsed.is_online === 1 || parsed.is_online === '1' || parsed.is_online === true);
            }
        };
        loadOnlineStatus();

        const handleStatusChange = (status: boolean) => setIsOnline(status);
        onlineStatusEvents.on('statusChanged', handleStatusChange);
        return () => { onlineStatusEvents.off('statusChanged', handleStatusChange); };
    }, []);

    // Fetch jenis layanan from API
    useEffect(() => {
        fetchUserData();
        fetchJenisLayanan();
    }, []);

    // Refresh data when screen comes into focus (but skip initial load)
    useFocusEffect(
        useCallback(() => {
            // Skip on initial load since useEffect already handles it
            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }

            const refreshData = async () => {
                const data = await AsyncStorage.getItem('userData');
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (parsedData && parsedData.no_hp) {
                        fetchTransaksi(parsedData.no_hp);
                    }
                }
            };

            refreshData();
        }, [])
    );

    const fetchUserData = async () => {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
            const parsedData = JSON.parse(data);

            setUserData(parsedData);
            // Fetch transaksi on load
            fetchTransaksi(parsedData.no_hp);
        }
    };

    const fetchJenisLayanan = async () => {
        try {
            setLoading(true);
            const response = await apiService.getJenisLayanan();

            if (response.success && response.data && response.data.data) {
                // Data is nested: response.data.data contains {ride, send, food, shop}
                const servicesData = response.data.data;
                const dataArray = Object.values(servicesData) as any[];

                const options = [
                    { label: 'Semua Layanan', value: '' },
                    ...dataArray.map((item: any) => ({
                        label: item.name,
                        value: item.key,
                    }))
                ];

                setServiceTypeOptions(options);
            }
        } catch (error) {
            console.error('Error fetching jenis layanan:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransaksi = useCallback(async (phoneNumber: string, filters?: {
        startDate?: string;
        endDate?: string;
        no_hp?: string;
        serviceType?: string;
        searchQuery?: string;
    }) => {
        try {
            setLoadingTransaksi(true);

            const range = getCurrentFilterRange();

            // Use current state values if filters not provided
            const currentStartDate = filters?.startDate || range.startDate;
            const currentEndDate = filters?.endDate || range.endDate;

            const response = await apiService.getListTransaksiManual(
                phoneNumber,
                currentStartDate,
                currentEndDate,
                userData?.id_konsumen,
                filters?.serviceType || '',
                filters?.searchQuery || ''
            );

            if (response.success && response.data) {
                // response.data.data is the array
                let dataArray = [];

                if (response.data.data && Array.isArray(response.data.data)) {
                    dataArray = response.data.data;
                } else if (Array.isArray(response.data)) {
                    dataArray = response.data;
                }

                setTransaksiList(dataArray);
                // Sync selectedTransaksi jika modal sedang terbuka (misal: baru kembali dari edit)
                setSelectedTransaksi((prev: any) => {
                    if (!prev) return prev;
                    const updated = dataArray.find(
                        (item: any) => item.id === prev.id || item.kode_order === prev.kode_order
                    );
                    return updated ?? prev;
                });
            } else {
                setTransaksiList([]);
            }
        } catch (error) {
            console.error('Error fetching transaksi:', error);
            setTransaksiList([]);
        } finally {
            setLoadingTransaksi(false);
        }
    }, [getCurrentFilterRange, userData?.id_konsumen]);

    // Handle refresh after approve
    const handleRefreshAfterApprove = useCallback(() => {
        if (userData?.no_hp) {
            fetchTransaksi(userData.no_hp);
        }
    }, [userData, fetchTransaksi]);

    // Handle update selected transaction
    const handleUpdateSelectedTransaksi = useCallback((updatedTransaksi: any) => {
        setSelectedTransaksi(updatedTransaksi);
    }, []);

    const handleApplyFilter = () => {
        const { startDate: formattedStartDate, endDate: formattedEndDate } = getCurrentFilterRange();

        console.log('Apply filter:', {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            no_hp: userData?.no_hp,
            serviceType,
            searchQuery
        });

        // Fetch data dengan filter
        if (userData?.no_hp) {
            fetchTransaksi(userData.no_hp, {
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                no_hp: userData?.no_hp,
                serviceType,
                searchQuery
            });
        }

        setIsFilterExpanded(false);
    };

    const handleResetFilter = () => {
        setDateFilterMode('range');
        setStartDate(new Date());
        setEndDate(new Date());
        setSelectedYear(String(new Date().getFullYear()));
        setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
        setServiceType('');
        setSearchQuery('');
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

                <Text style={styles.headerTitle}>Pasca Order</Text>

                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 120 }}
            >
                {/* Filter Section */}
                <View style={styles.filterSection}>
                    <TouchableOpacity
                        style={styles.filterHeader}
                        onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.filterHeaderLeft}>
                            <Ionicons name="funnel-outline" size={20} color="#0097A7" />
                            <Text style={styles.filterTitle}>Filter & Export</Text>
                        </View>
                        <Ionicons
                            name={isFilterExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                            size={20}
                            color="#6c757d"
                        />
                    </TouchableOpacity>

                    {isFilterExpanded && (
                        <View style={styles.filterContent}>
                            {/* Mode Tanggal - Button Selection */}
                            <View style={styles.modeSelectionContainer}>
                                <Text style={styles.modeLabel}>Mode Tanggal</Text>
                                <View style={styles.modeButtonsGroup}>
                                    <TouchableOpacity
                                        style={[
                                            styles.modeButton,
                                            dateFilterMode === 'range' && styles.modeButtonActive,
                                        ]}
                                        onPress={() => setDateFilterMode('range')}
                                    >
                                        <Text
                                            style={[
                                                styles.modeButtonText,
                                                dateFilterMode === 'range' && styles.modeButtonTextActive,
                                            ]}
                                        >
                                            Range Tanggal
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.modeButton,
                                            dateFilterMode === 'monthly' && styles.modeButtonActive,
                                        ]}
                                        onPress={() => setDateFilterMode('monthly')}
                                    >
                                        <Text
                                            style={[
                                                styles.modeButtonText,
                                                dateFilterMode === 'monthly' && styles.modeButtonTextActive,
                                            ]}
                                        >
                                            Bulanan
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {dateFilterMode === 'monthly' ? (
                                <>
                                    <DropdownInput
                                        label="Tahun"
                                        value={selectedYear}
                                        onChange={setSelectedYear}
                                        options={yearOptions}
                                        placeholder="Pilih tahun"
                                        androidBottomOffset={-84}
                                    />

                                    <DropdownInput
                                        label="Bulan"
                                        value={selectedMonth}
                                        onChange={setSelectedMonth}
                                        options={monthOptions}
                                        placeholder="Pilih bulan"
                                        androidBottomOffset={-84}
                                    />
                                </>
                            ) : (
                                <>
                                    <DatePickerInput
                                        label="Tanggal Awal"
                                        value={startDate}
                                        onChange={setStartDate}
                                        placeholder="Pilih tanggal awal"
                                    />

                                    <DatePickerInput
                                        label="Tanggal Akhir"
                                        value={endDate}
                                        onChange={setEndDate}
                                        placeholder="Pilih tanggal akhir"
                                    />
                                </>
                            )}

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#0097A7" />
                                    <Text style={styles.loadingText}>Memuat jenis layanan...</Text>
                                </View>
                            ) : (
                                <DropdownInput
                                    label="Tipe Layanan"
                                    value={serviceType}
                                    onChange={setServiceType}
                                    options={serviceTypeOptions}
                                    placeholder="Pilih tipe layanan"
                                    androidBottomOffset={-84}
                                />
                            )}

                            <SearchInput
                                label="Cari Transaksi"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Cari berdasarkan nama, no order..."
                            />

                            {/* Filter Action Buttons */}
                            <View style={styles.filterActions}>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={handleResetFilter}
                                >
                                    <Ionicons name="refresh-outline" size={16} color="#6c757d" />
                                    <Text style={styles.resetButtonText}>Reset</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.exportFilterButton}
                                    onPress={() => setIsExportModalVisible(true)}
                                >
                                    <Ionicons name="download-outline" size={16} color="#ffffff" />
                                    <Text style={styles.exportFilterButtonText}>Export</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={handleApplyFilter}
                                >
                                    <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                                    <Text style={styles.applyButtonText}>Terapkan</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Placeholder untuk hasil */}
                <View style={styles.resultSection}>
                    {loadingTransaksi ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0097A7" />
                            <Text style={styles.loadingText}>Memuat transaksi...</Text>
                        </View>
                    ) : transaksiList.length > 0 ? (
                        transaksiList.map((item, index) => (
                            <TransaksiItem key={item.kode_order || index} item={item} onPress={handleOpenDetail} />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color="#dee2e6" />
                            <Text style={styles.emptyText}>Tidak ada transaksi</Text>
                            <Text style={styles.emptySubtext}>
                                Coba ubah filter atau tanggal untuk melihat transaksi lainnya
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.fabPascaOrder, !isOnline && styles.fabDisabled]}
                onPress={() => {
                    if (!isOnline) {
                        Alert.alert('Status Offline', 'Aktifkan status online terlebih dahulu untuk menambah transaksi baru.');
                        return;
                    }
                    router.push('/transaksi-manual/tambah');
                }}
            >
                <View style={[styles.fabIconContainer, !isOnline && styles.fabIconDisabled]}>
                    <Ionicons name="add-outline" size={32} color="#fff" />
                </View>
            </TouchableOpacity>

            {/* Modal Detail Transaksi */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={handleCloseModal}
            >
                {selectedTransaksi && <TransaksiDetailModal transaksi={selectedTransaksi} onClose={handleCloseModal} onRefresh={handleRefreshAfterApprove} onUpdateTransaksi={handleUpdateSelectedTransaksi} />}
            </Modal>

            {/* Modal Export Laporan */}
            <ExportLaporanModal
                visible={isExportModalVisible}
                onClose={() => setIsExportModalVisible(false)}
                id_konsumen={userData?.id_konsumen || ''}
                startDate={getCurrentFilterRange().startDate}
                endDate={getCurrentFilterRange().endDate}
                courierName={userData?.name || userData?.nama_lengkap || userData?.nama_sopir || userData?.nm_sopir}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#f8f9fa',
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
    backButton: {
        padding: 4,
    },
    addButton: {
        padding: 4,
    },
    exportButton: {
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
    filterSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    filterHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
    },
    filterContent: {
        padding: 16,
        paddingTop: 8,
    },
    filterActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    resetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        gap: 4,
    },
    resetButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6c757d',
    },
    exportFilterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f59e0b',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 8,
        gap: 4,
    },
    exportFilterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },
    applyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0097A7',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 8,
        gap: 4,
    },
    applyButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },
    resultSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 50,
    },
    transaksiItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    transaksiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    transaksiId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0097A7',
    },
    transaksiDate: {
        fontSize: 12,
        color: '#6c757d',
    },
    transaksiBody: {
        marginBottom: 8,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    addressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6c757d',
    },
    addressText: {
        flex: 1,
        fontSize: 12,
        color: '#212529',
    },
    transaksiCustomer: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    transaksiService: {
        fontSize: 14,
        color: '#6c757d',
    },
    transaksiFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    transaksiAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    transaksiStatus: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
    },
    statusCompleted: {
        backgroundColor: '#d1e7dd',
        color: '#0f5132',
    },
    statusPending: {
        backgroundColor: '#fff3cd',
        color: '#664d03',
    },
    viewDetailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        gap: 4,
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0097A7',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6c757d',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#adb5bd',
        textAlign: 'center',
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

    fabPascaOrder: {
        position: 'absolute',
        right: 15,
        bottom: Platform.OS === 'android' ? 70 : 74,
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
    fabDisabled: {
        opacity: 0.5,
    },
    fabIconDisabled: {
        backgroundColor: '#adb5bd',
    },
    modeSelectionContainer: {
        marginBottom: 16,
    },
    modeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    modeButtonsGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeButtonActive: {
        backgroundColor: '#0097A7',
        borderColor: '#0097A7',
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6c757d',
    },
    modeButtonTextActive: {
        color: '#ffffff',
    },
});
