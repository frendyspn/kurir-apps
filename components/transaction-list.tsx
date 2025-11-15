import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TransactionItem {
    id: string;
    kode_order: string;
    jenis_layanan: string;
    alamat_jemput: string;
    alamat_antar: string;
    tarif: string;
    tanggal_order: string;
    status: string;
    nama_pelanggan?: string;
    no_hp_pelanggan?: string;
}

interface TransactionListProps {
    transactions: TransactionItem[];
    loading?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, loading = false }) => {
    const formatCurrency = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numAmount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'finish':
            case 'selesai':
                return '#28a745';
            case 'ongoing':
            case 'proses':
                return '#ffc107';
            case 'cancel':
            case 'cancelled':
            case 'dibatalkan':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'finish':
                return 'Selesai';
            case 'ongoing':
                return 'Proses';
            case 'cancel':
            case 'cancelled':
                return 'Dibatalkan';
            default:
                return status;
        }
    };

    const handleTransactionPress = (transaction: TransactionItem) => {
        // Navigate to transaction detail
        router.push({
            pathname: '/transaksi-manual/detail',
            params: {
                id: transaction.id,
                from: 'history'
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Memuat transaksi...</Text>
            </View>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#6c757d" />
                <Text style={styles.emptyText}>Tidak ada transaksi</Text>
                <Text style={styles.emptySubtext}>Belum ada transaksi untuk periode ini</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {transactions.map((transaction, index) => (
                <TouchableOpacity
                    key={transaction.id || index}
                    style={styles.transactionItem}
                    onPress={() => handleTransactionPress(transaction)}
                >
                    <View style={styles.transactionHeader}>
                        <View style={styles.serviceInfo}>
                            <Text style={styles.serviceName} numberOfLines={1}>
                                {transaction.jenis_layanan}
                            </Text>
                            <Text style={styles.transactionId}>
                                ID: {transaction.kode_order}
                            </Text>
                        </View>
                        <View style={styles.statusContainer}>
                            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                                {getStatusText(transaction.status)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.transactionDetails}>
                        <View style={styles.addressContainer}>
                            <Ionicons name="location-outline" size={16} color="#6c757d" />
                            <Text style={styles.addressText} numberOfLines={2}>
                                {transaction.alamat_jemput}
                            </Text>
                        </View>

                        {transaction.alamat_antar && (
                            <View style={styles.addressContainer}>
                                <Ionicons name="location" size={16} color="#0097A7" />
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {transaction.alamat_antar}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.transactionFooter}>
                        <View style={styles.customerInfo}>
                            {transaction.nama_pelanggan && (
                                <Text style={styles.customerName} numberOfLines={1}>
                                    {transaction.nama_pelanggan}
                                </Text>
                            )}
                            {transaction.no_hp_pelanggan && (
                                <Text style={styles.customerPhone}>
                                    {transaction.no_hp_pelanggan}
                                </Text>
                            )}
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceText}>
                                {formatCurrency(transaction.tarif)}
                            </Text>
                            <Text style={styles.dateText}>
                                {formatDate(transaction.tanggal_order)}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        margin: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 4,
        textAlign: 'center',
    },
    transactionItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    serviceInfo: {
        flex: 1,
        marginRight: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 4,
    },
    transactionId: {
        fontSize: 12,
        color: '#6c757d',
    },
    statusContainer: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    transactionDetails: {
        marginBottom: 12,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#495057',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    transactionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    customerInfo: {
        flex: 1,
        marginRight: 12,
    },
    customerName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#212529',
        marginBottom: 2,
    },
    customerPhone: {
        fontSize: 12,
        color: '#6c757d',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0097A7',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 12,
        color: '#6c757d',
    },
});

export default TransactionList;
