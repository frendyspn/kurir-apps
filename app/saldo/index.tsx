import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
                    }))
                    : [];

                if (startDate && endDate) {
                    setFilteredTransactions(transformedData);
                } else {
                    setTransactionHistory(transformedData);
                    setFilteredTransactions(transformedData);
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
    }, []);

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

    // Render transaction item
    const renderTransactionItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => {
                // If it's a pending top up transaction, navigate to confirm screen
                if (item.type === 'topup' && item.status === 'pending' && item.bukti_topup === null) {
                    router.push({
                        pathname: '/saldo/confirm-top-up',
                        params: {
                            topUpId: item.id,
                            amount: Math.abs(item.amount).toString(),
                            bankName: item.bank_name || 'Bank',
                            accountNumber: item.account_number || '-',
                            accountName: item.account_name || '-',
                        },
                    });
                } else {
                    // Otherwise, just show details or do nothing
                    // router.push({
                    //     pathname: '/saldo/detail',
                    //     params: {
                    //         transactionId: item.id,
                    //     },
                    // });
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
                        item.amount > 0 ? '#28a745' : '#dc3545'
                    } 
                />
            </View>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionDate}>
                    {new Date(item.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })} {item.time}
                </Text>
                <Text style={styles.transactionType} numberOfLines={1} ellipsizeMode="tail">
                    {item.note.length > 50 ? `${item.note.substring(0, 50)}...` : item.note}
                </Text>
            </View>
            <View style={styles.transactionRight}>
                <Text style={[
                    styles.transactionAmount,
                    { color: item.amount > 0 ? '#28a745' : '#dc3545' }
                ]}>
                    {item.amount > 0 ? '+' : ''}Rp {Math.abs(item.amount).toLocaleString('id-ID')}
                </Text>
                {item.status === 'pending' ? (
                    <Text style={styles.pendingStatus}>Pending</Text>
                ) : item.status === 'onprocess' && (
                    <Text style={styles.pendingStatus}>On Process</Text>
                )}
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#0097A7',
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
    transactionType: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6c757d',
        marginTop: 2,
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
