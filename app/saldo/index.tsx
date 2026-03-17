import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SaldoScreen() {
    const insets = useSafeAreaInsets();
    const [saldo, setSaldo] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
    const [tempDate, setTempDate] = useState(new Date());
    const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
    const [transactionLoading, setTransactionLoading] = useState(false);

    const fetchSaldo = useCallback(async () => {
        try {
            setLoading(true);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                setSaldo(null);
                return;
            }

            const user = JSON.parse(userData);
            const response = await apiService.getBalance(user.no_hp);

            if (response.success && response.data) {
                // backend may return nested structure; try common keys
                const value = response.data?.balance || response.data?.saldo || response.data?.data?.saldo || null;
                if (value !== null && value !== undefined) {
                    setSaldo(Number(value));
                } else {
                    // try parsing as number from message
                    setSaldo(null);
                }
            } else {
                Alert.alert('Error', response.message || 'Gagal memuat saldo');
                setSaldo(null);
            }
        } catch (error) {
            console.error('Error fetching saldo:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memuat saldo');
            setSaldo(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Helper function to group transactions by source_id
    const groupTransactionsBySourceId = useCallback((transactions: any[]) => {
        const grouped = new Map<string, any[]>();
        
        transactions.forEach((transaction) => {
            const sourceId = transaction.source_id || 'unknown';
            if (!grouped.has(sourceId)) {
                grouped.set(sourceId, []);
            }
            grouped.get(sourceId)!.push(transaction);
        });

        // Convert to array and calculate totals
        return Array.from(grouped.entries()).map(([sourceId, items]) => {
            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
            // Use the first (most recent) transaction for display details
            const firstItem = items[0];
            
            return {
                source_id: sourceId,
                id: sourceId,
                totalAmount,
                itemCount: items.length,
                date: firstItem.date,
                time: firstItem.time,
                status: firstItem.status,
                type: firstItem.type,
                note: firstItem.note,
                nama_konsumen_order: firstItem.nama_konsumen_order,
                nama_kurir: firstItem.nama_kurir,
                details: items, // Keep all items for reference
            };
        }).sort((a, b) => {
            // Sort by date descending, then by time descending
            if (a.date !== b.date) {
                return b.date.localeCompare(a.date);
            }
            return b.time.localeCompare(a.time);
        });
    }, []);

    const fetchTransactionHistory = useCallback(async (startDate?: string, endDate?: string) => {
        try {
            setTransactionLoading(true);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            const user = JSON.parse(userData);
            const response = await apiService.getTransactionHistory(user.no_hp, startDate, endDate);

            if (response.success && response.data) {
                // Transform data to match our expected format
                const transformedData = Array.isArray(response.data) 
                    ? response.data.map((item: any, index: number) => ({
                        id: item.id || index.toString(),
                        note: item.note || item.description || 'Transaksi',
                        amount: parseFloat(item.amount) || 0,
                        date: item.date || item.created_at?.split(' ')[0] || new Date().toISOString().split('T')[0],
                        time: item.time || item.created_at?.split(' ')[1] || '00:00',
                        status: item.status || 'success',
                        type: item.type || 'unknown',
                        source_id: item.source_id || '',
                        nama_konsumen_order: item.nama_konsumen_order || '',
                        nama_kurir: item.nama_kurir || '',
                    }))
                    : [];

                // Group transactions by source_id
                const groupedData = groupTransactionsBySourceId(transformedData);

                if (startDate && endDate) {
                    setFilteredTransactions(groupedData);
                } else {
                    setTransactionHistory(groupedData);
                    setFilteredTransactions(groupedData);
                }
            } else {
                Alert.alert('Error', response.message || 'Gagal memuat riwayat transaksi');
                if (startDate && endDate) {
                    setFilteredTransactions([]);
                } else {
                    setTransactionHistory([]);
                    setFilteredTransactions([]);
                }
            }
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat memuat riwayat transaksi');
            if (startDate && endDate) {
                setFilteredTransactions([]);
            } else {
                setTransactionHistory([]);
                setFilteredTransactions([]);
            }
        } finally {
            setTransactionLoading(false);
        }
    }, [groupTransactionsBySourceId]);

    useEffect(() => {
        fetchSaldo();
        fetchTransactionHistory();
    }, [fetchSaldo, fetchTransactionHistory]);

    // Handle pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            fetchSaldo(),
            fetchTransactionHistory()
        ]);
        setRefreshing(false);
    }, [fetchSaldo, fetchTransactionHistory]);

    // Handle action buttons
    const handleTopUp = useCallback(() => {
        router.push('/saldo/top-up');
    }, []);

    const handleTransfer = useCallback(() => {
        router.push('/saldo/transfer');
    }, []);

    const handleWithdraw = useCallback(() => {
        router.push('/saldo/withdraw');
    }, []);

    // Handle filter modal
    const handleOpenFilter = useCallback(() => {
        setFilterModalVisible(true);
    }, []);

    const handleCloseFilter = useCallback(() => {
        setFilterModalVisible(false);
    }, []);

    const handleApplyFilter = useCallback(() => {
        if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            
            // Validasi: tanggal awal tidak boleh lebih besar dari tanggal akhir
            if (fromDate > toDate) {
                Alert.alert('Error', 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
                return;
            }
            
            fetchTransactionHistory(dateFrom, dateTo);
            setFilterModalVisible(false);
            setIsFilterActive(true);
        } else {
            Alert.alert('Error', 'Silakan pilih rentang tanggal');
        }
    }, [dateFrom, dateTo, fetchTransactionHistory]);

    const handleResetFilter = useCallback(() => {
        setDateFrom('');
        setDateTo('');
        fetchTransactionHistory();
        setFilterModalVisible(false);
        setIsFilterActive(false);
    }, [fetchTransactionHistory]);

    // Handle date picker
    const handleDatePress = useCallback((type: 'from' | 'to') => {
        setShowDatePicker(type);
        setTempDate(new Date());
    }, []);

    const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
        setShowDatePicker(null);
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            if (showDatePicker === 'from') {
                setDateFrom(dateString);
            } else if (showDatePicker === 'to') {
                setDateTo(dateString);
            }
        }
    }, [showDatePicker]);

    // Format date for display
    const formatDate = useCallback((dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }, []);

    // Render transaction item (grouped by source_id)
    const renderTransactionItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => {
                // If it's a pending top up transaction, navigate to confirm screen
                if (item.type === 'topup' && item.status === 'pending') {
                    router.push({
                        pathname: '/saldo/confirm-top-up',
                        params: {
                            topUpId: item.details[0]?.id,
                            amount: Math.abs(item.totalAmount).toString(),
                            bankName: item.details[0]?.bank_name || 'Bank',
                            accountNumber: item.details[0]?.account_number || '-',
                            accountName: item.details[0]?.account_name || '-',
                        },
                    });
                } else if (item.source_id && item.source_id !== 'unknown') {
                    // Navigate to order detail
                    router.push({
                        pathname: '/live-order/detail',
                        params: {
                            id: item.source_id,
                        },
                    });
                }
            }}
        >
            <View style={styles.transactionIcon}>
                <Ionicons 
                    name="swap-horizontal" 
                    size={20} 
                    color={
                        item.totalAmount > 0 ? '#28a745' : '#dc3545'
                    } 
                />
            </View>
            <View style={styles.transactionDetails}>
                {/* Header dengan tanggal dan total amount */}
                <View style={styles.transactionDetailHeader}>
                    <View style={styles.transactionDateContainer}>
                        <Text style={styles.transactionDate}>
                            {new Date(item.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })} {item.time}
                        </Text>
                        {/* Nama Konsumen dan Kurir - Sejajar */}
                        <View style={styles.personInfoContainer}>
                            {/* Nama Konsumen */}
                            {item.nama_konsumen_order && (
                                <View style={styles.namaKonsumenContainer}>
                                    <Ionicons name="person" size={14} color="#dc3545" />
                                    <Text style={styles.namaKonsumen} numberOfLines={1} ellipsizeMode="tail">
                                        {item.nama_konsumen_order}
                                    </Text>
                                </View>
                            )}
                            {/* Nama Kurir */}
                            {item.nama_kurir && (
                                <View style={styles.namaKurirContainer}>
                                    <Ionicons name="bicycle" size={14} color="#28a745" />
                                    <Text style={styles.namaKurir} numberOfLines={1} ellipsizeMode="tail">
                                        {item.nama_kurir}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={[
                        styles.transactionAmount,
                        { color: item.totalAmount > 0 ? '#28a745' : '#dc3545' }
                    ]}>
                        {item.totalAmount > 0 ? '+' : ''}Rp {Math.abs(item.totalAmount).toLocaleString('id-ID')}
                    </Text>
                </View>

                {/* Detail mutasi */}
                {item.details.map((detail: any, index: number) => (
                    <View key={detail.id} style={styles.mutasiDetailItem}>
                        <Text style={styles.mutasiNote} numberOfLines={1} ellipsizeMode="tail">
                            {detail.note.length > 45 ? `${detail.note.substring(0, 45)}...` : detail.note}
                        </Text>
                        <Text style={[
                            styles.mutasiAmount,
                            { color: detail.amount > 0 ? '#28a745' : '#dc3545' }
                        ]}>
                            {detail.amount > 0 ? '+' : ''}Rp {Math.abs(detail.amount).toLocaleString('id-ID')}
                        </Text>
                    </View>
                ))}

                {/* Status */}
                <View style={styles.transactionStatusContainer}>
                    {item.status === 'pending' ? (
                        <Text style={styles.pendingStatus}>Pending</Text>
                    ) : item.status === 'onprocess' ? (
                        <Text style={styles.pendingStatus}>On Process</Text>
                    ) : (
                        <Text style={styles.successStatus}>Success</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    ), []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Saldo</Text>
            </View>

            {/* Content */}
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
                        <TouchableOpacity>
                            <Ionicons 
                                name="eye-outline" 
                                size={20} 
                                color="#6c757d" 
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {loading ? (
                        <ActivityIndicator size="large" color="#0097A7" style={styles.loading} />
                    ) : (
                        <Text style={styles.saldoAmount}>
                            {saldo !== null ? `Rp ${saldo.toLocaleString('id-ID')}` : 'Rp 0'}
                        </Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleTopUp}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="add-circle" size={24} color="#0097A7" />
                        </View>
                        <Text style={styles.actionText}>Top Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleTransfer}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="swap-horizontal" size={24} color="#0097A7" />
                        </View>
                        <Text style={styles.actionText}>Transfer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleWithdraw}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="cash" size={24} color="#0097A7" />
                        </View>
                        <Text style={styles.actionText}>Withdraw</Text>
                    </TouchableOpacity>
                </View>

                {/* Transaction History */}
                <View style={styles.transactionSection}>
                    <View style={styles.transactionHeader}>
                        <Text style={styles.transactionTitle}>Riwayat Transaksi</Text>
                        <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilter}>
                            <Ionicons name="filter" size={20} color="#0097A7" />
                        </TouchableOpacity>
                    </View>
                    
                    {isFilterActive && (
                        <View style={styles.filterInfo}>
                            <Ionicons name="information-circle" size={16} color="#0097A7" />
                            <Text style={styles.filterInfoText}>
                                Menampilkan transaksi dari {formatDate(dateFrom)} sampai {formatDate(dateTo)}
                            </Text>
                            <TouchableOpacity 
                                style={styles.clearFilterButton} 
                                onPress={handleResetFilter}
                            >
                                <Ionicons name="close" size={16} color="#6c757d" />
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    <FlatList
                        data={filteredTransactions}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTransactionItem}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                        ListEmptyComponent={
                            transactionLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#0097A7" />
                                    <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
                                </View>
                            ) : (
                                <Text style={styles.emptyText}>Tidak ada transaksi dalam rentang tanggal ini</Text>
                            )
                        }
                    />
                </View>

                {/* Bottom Spacing for Tab Bar */}
                <View style={{ height: Platform.OS === 'android' ? Math.max(insets.bottom, 20) + 180 : Math.max(insets.bottom, 20) + 120 }} />
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseFilter}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Transaksi</Text>
                            <TouchableOpacity onPress={handleCloseFilter}>
                                <Ionicons name="close" size={24} color="#6c757d" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.dateLabel}>Dari Tanggal</Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => handleDatePress('from')}>
                                <Text style={styles.dateText}>
                                    {formatDate(dateFrom) || 'Pilih tanggal mulai'}
                                </Text>
                                <Ionicons name="calendar" size={20} color="#0097A7" />
                            </TouchableOpacity>

                            <Text style={styles.dateLabel}>Sampai Tanggal</Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => handleDatePress('to')}>
                                <Text style={styles.dateText}>
                                    {formatDate(dateTo) || 'Pilih tanggal akhir'}
                                </Text>
                                <Ionicons name="calendar" size={20} color="#0097A7" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.resetButton} onPress={handleResetFilter}>
                                <Text style={styles.resetButtonText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilter}>
                                <Text style={styles.applyButtonText}>Terapkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Date Picker */}
                {showDatePicker && (
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                    />
                )}
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#f8f9fa',
    },
    header: {
        // backgroundColor: '#0097A7',
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
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
    loading: {
        marginTop: 20,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingHorizontal: 16,
    },
    actionButton: {
        alignItems: 'center',
        flex: 1,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
    actionText: {
        fontSize: 14,
        color: '#212529',
        textAlign: 'center',
        fontWeight: '500',
    },
    transactionSection: {
        marginTop: 24,
    },
    transactionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e7f1ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    transactionDateContainer: {
        flex: 1,
    },
    personInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 8,
        maxWidth: '95%',
    },
    namaKonsumen: {
        fontSize: 13,
        fontWeight: '500',
        color: '#212529',
        marginLeft: 6,
        maxWidth: 100,
    },
    namaKonsumenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    namaKurir: {
        fontSize: 13,
        fontWeight: '500',
        color: '#495057',
        marginLeft: 6,
        maxWidth: 80,
    },
    namaKurirContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mutasiDetailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#e7f1ff',
    },
    mutasiNote: {
        fontSize: 13,
        fontWeight: '400',
        color: '#6c757d',
        flex: 1,
        marginRight: 8,
    },
    mutasiAmount: {
        fontSize: 13,
        fontWeight: '600',
    },
    transactionStatusContainer: {
        marginTop: 10,
    },
    transactionType: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6c757d',
        marginTop: 2,
    },
    transactionSubtext: {
        fontSize: 12,
        fontWeight: '400',
        color: '#adb5bd',
        marginTop: 4,
    },
    transactionDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    pendingStatus: {
        fontSize: 12,
        color: '#ffc107',
        fontWeight: '500',
        marginTop: 2,
    },
    successStatus: {
        fontSize: 12,
        color: '#28a745',
        fontWeight: '500',
        marginTop: 2,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterButton: {
        padding: 8,
    },
    filterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e7f1ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    filterInfoText: {
        flex: 1,
        fontSize: 14,
        color: '#0097A7',
        marginLeft: 8,
    },
    clearFilterButton: {
        padding: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6c757d',
        fontSize: 14,
        marginTop: 20,
        marginBottom: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 8,
        color: '#6c757d',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
    },
    modalBody: {
        marginBottom: 20,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
        marginTop: 16,
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f8f9fa',
    },
    dateText: {
        fontSize: 16,
        color: '#6c757d',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        backgroundColor: '#6c757d',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#0097A7',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
