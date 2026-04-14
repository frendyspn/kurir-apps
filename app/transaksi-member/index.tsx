import DatePickerInput from '@/components/date-picker-input';
import DropdownInput from '@/components/dropdown-input';
import SearchInput from '@/components/search-input';
import TransaksiDetailModal from '@/components/transaksi-detail-modal';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassBackground from '../../components/glass-background';

const TransaksiItem = memo(({ item, onPress }: { item: any; onPress: (item: any) => void }) => {
    const handlePress = useCallback(() => onPress(item), [item, onPress]);

    const statusStyle = item.status === 'FINISH'
        ? styles.statusCompleted
        : item.status === 'PENDING'
            ? styles.statusPending
            : null;

    return (
        <TouchableOpacity style={styles.transaksiItem} activeOpacity={0.7} onPress={handlePress}>
            <View style={styles.transaksiHeader}>
                <Text style={styles.transaksiId}>#{item.kode_order}</Text>
                <Text style={styles.transaksiDate}>
                    {new Date(item.tanggal_order).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </Text>
            </View>

            {/* Nama kurir */}
            {(item.nama_kurir || item.nama_sopir) && (
                <View style={styles.kurirRow}>
                    <Ionicons name="person-outline" size={13} color="#6c757d" />
                    <Text style={styles.kurirText} numberOfLines={1}>
                        {item.nama_kurir || item.nama_sopir}
                    </Text>
                </View>
            )}

            <View style={styles.transaksiBody}>
                <View style={styles.addressContainer}>
                    <Ionicons name="location-outline" size={16} color="#0097A7" />
                    <Text style={styles.addressLabel}>Jemput: </Text>
                    <Text style={styles.addressText} numberOfLines={1}>{item.alamat_jemput || '-'}</Text>
                </View>
                <View style={styles.addressContainer}>
                    <Ionicons name="location" size={16} color="#dc3545" />
                    <Text style={styles.addressLabel}>Antar: </Text>
                    <Text style={styles.addressText} numberOfLines={1}>{item.alamat_antar || '-'}</Text>
                </View>
                {item.service && <Text style={styles.transaksiService}>{item.service}</Text>}
            </View>

            <View style={styles.transaksiFooter}>
                <Text style={styles.transaksiAmount}>
                    Rp {parseInt(item.tarif || 0).toLocaleString('id-ID')}
                </Text>
                <Text style={[styles.transaksiStatus, statusStyle]}>
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

export default function TransaksiMemberScreen() {
    const insets = useSafeAreaInsets();
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
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

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);

    const isInitialLoad = useRef(true);

    const formatDate = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleOpenDetail = useCallback((item: any) => {
        setSelectedTransaksi(item);
        setIsModalVisible(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        setSelectedTransaksi(null);
    }, []);

    useEffect(() => {
        fetchUserData();
        fetchJenisLayanan();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }
            AsyncStorage.getItem('userData').then((data) => {
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed?.id_konsumen) fetchTransaksi(parsed.id_konsumen);
                }
            });
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const onHardwareBackPress = () => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/');
                }
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
            return () => subscription.remove();
        }, [])
    );

    const fetchUserData = async () => {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
            const parsed = JSON.parse(data);
            setUserData(parsed);
            if (parsed?.id_konsumen) fetchTransaksi(parsed.id_konsumen);
        }
    };

    const fetchJenisLayanan = async () => {
        try {
            setLoading(true);
            const response = await apiService.getJenisLayanan();
            if (response.success && response.data?.data) {
                const dataArray = Object.values(response.data.data) as any[];
                setServiceTypeOptions([
                    { label: 'Semua Layanan', value: '' },
                    ...dataArray.map((item: any) => ({ label: item.name, value: item.key })),
                ]);
            }
        } catch (error) {
            console.error('Error fetching jenis layanan:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransaksi = useCallback(async (idAgen: string, filters?: {
        startDate?: string;
        endDate?: string;
        serviceType?: string;
        searchQuery?: string;
    }) => {
        try {
            setLoadingTransaksi(true);
            const currentStartDate = filters?.startDate || formatDate(startDate);
            const currentEndDate = filters?.endDate || formatDate(endDate);

            const response = await apiService.getListTransaksiMemberAgen(
                idAgen,
                currentStartDate,
                currentEndDate,
                filters?.serviceType || '',
                filters?.searchQuery || '',
            );

            if (response.success && response.data) {
                let dataArray: any[] = [];
                if (response.data.data && Array.isArray(response.data.data)) {
                    dataArray = response.data.data;
                } else if (Array.isArray(response.data)) {
                    dataArray = response.data;
                }
                setTransaksiList(dataArray);
                // Sync modal jika sedang terbuka
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
            console.error('Error fetching transaksi member:', error);
            setTransaksiList([]);
        } finally {
            setLoadingTransaksi(false);
        }
    }, [startDate, endDate]);

    const handleApplyFilter = () => {
        if (userData?.id_konsumen) {
            fetchTransaksi(userData.id_konsumen, {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                serviceType,
                searchQuery,
            });
        }
        setIsFilterExpanded(false);
    };

    const handleResetFilter = () => {
        setStartDate(new Date());
        setEndDate(new Date());
        setServiceType('');
        setSearchQuery('');
    };

    const handleRefresh = useCallback(() => {
        if (userData?.id_konsumen) fetchTransaksi(userData.id_konsumen);
    }, [userData, fetchTransaksi]);

    return (
        <View style={styles.container}>
            <GlassBackground />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaksi Member</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 40 }}
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
                            <Text style={styles.filterTitle}>Filter Transaksi</Text>
                        </View>
                        <Ionicons
                            name={isFilterExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={20}
                            color="#6c757d"
                        />
                    </TouchableOpacity>

                    {isFilterExpanded && (
                        <View style={styles.filterContent}>
                            <DatePickerInput label="Tanggal Awal" value={startDate} onChange={setStartDate} placeholder="Pilih tanggal awal" />
                            <DatePickerInput label="Tanggal Akhir" value={endDate} onChange={setEndDate} placeholder="Pilih tanggal akhir" />

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
                                />
                            )}

                            <SearchInput
                                label="Cari Transaksi"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Cari berdasarkan nama, no order..."
                            />

                            <View style={styles.filterActions}>
                                <TouchableOpacity style={styles.resetButton} onPress={handleResetFilter}>
                                    <Ionicons name="refresh-outline" size={16} color="#6c757d" />
                                    <Text style={styles.resetButtonText}>Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilter}>
                                    <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                                    <Text style={styles.applyButtonText}>Terapkan</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Hasil */}
                <View style={styles.resultSection}>
                    {loadingTransaksi ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0097A7" />
                            <Text style={styles.loadingText}>Memuat transaksi...</Text>
                        </View>
                    ) : transaksiList.length > 0 ? (
                        transaksiList.map((item, index) => (
                            <TransaksiItem
                                key={item.kode_order || index}
                                item={item}
                                onPress={handleOpenDetail}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#dee2e6" />
                            <Text style={styles.emptyText}>Tidak ada transaksi member</Text>
                            <Text style={styles.emptySubtext}>
                                Belum ada transaksi yang terdaftar atas agen ini
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal Detail */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={handleCloseModal}
            >
                {selectedTransaksi && (
                    <TransaksiDetailModal
                        transaksi={selectedTransaksi}
                        onClose={handleCloseModal}
                        onRefresh={handleRefresh}
                        onUpdateTransaksi={setSelectedTransaksi}
                        showApproveSection={false}
                    />
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
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
    content: { flex: 1, padding: 16 },

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
    filterHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    filterTitle: { fontSize: 16, fontWeight: '600', color: '#212529' },
    filterContent: { padding: 16, paddingTop: 8 },
    filterActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
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
    resetButtonText: { fontSize: 13, fontWeight: '600', color: '#6c757d' },
    applyButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0097A7',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 8,
        gap: 4,
    },
    applyButtonText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

    resultSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    transaksiItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    transaksiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    transaksiId: { fontSize: 14, fontWeight: '600', color: '#0097A7' },
    transaksiDate: { fontSize: 12, color: '#6c757d' },
    kurirRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    kurirText: { fontSize: 12, color: '#6c757d', flex: 1 },
    transaksiBody: { marginBottom: 8 },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    addressLabel: { fontSize: 12, fontWeight: '600', color: '#6c757d' },
    addressText: { flex: 1, fontSize: 12, color: '#212529' },
    transaksiService: { fontSize: 14, color: '#6c757d' },
    transaksiFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    transaksiAmount: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
    transaksiStatus: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#e9ecef',
        color: '#495057',
    },
    statusCompleted: { backgroundColor: '#d1e7dd', color: '#0f5132' },
    statusPending: { backgroundColor: '#fff3cd', color: '#664d03' },
    viewDetailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        gap: 4,
    },
    viewDetailText: { fontSize: 13, fontWeight: '600', color: '#0097A7' },
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
    emptySubtext: { fontSize: 14, color: '#adb5bd', textAlign: 'center' },
});
