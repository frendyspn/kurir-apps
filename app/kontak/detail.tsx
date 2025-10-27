import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Contact = {
    id_konsumen: string;
    nama_lengkap: string;
    no_hp: string;
    type: string;
    alamat_lengkap: string;
};

export default function DetailKontakScreen() {
    const navigation = useNavigation();
    const { contact } = useLocalSearchParams<{ contact: string }>();
    const contactData: Contact = contact ? JSON.parse(contact) : null;

    // State untuk transaksi
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoadingTransactions(true);
            setTransactionsError(null);

            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                setTransactionsError('Data user tidak ditemukan');
                return;
            }

            const user = JSON.parse(userData);
            
            // Get transactions for the last 30 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const response = await apiService.getListTransaksiManual(
                user.no_hp,
                startDateStr,
                endDateStr,
                contactData.id_konsumen // Filter by customer ID
            );

            if (response.success && response.data && response.data.data) {
                const transactionsData = response.data.data;
                if (Array.isArray(transactionsData)) {
                    setTransactions(transactionsData);
                } else {
                    setTransactions([]);
                }
            } else {
                setTransactionsError(response.message || 'Gagal memuat transaksi');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactionsError('Terjadi kesalahan saat memuat transaksi');
        } finally {
            setLoadingTransactions(false);
        }
    }, [contactData?.id_konsumen]);

    useEffect(() => {
        // Triple protection against headers
        navigation.setOptions({
            headerShown: false,
            header: () => null,
            headerTitle: '',
            headerLeft: () => null,
            headerRight: () => null,
            headerBackVisible: false,
            headerBackTitleVisible: false,
        });

        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, [navigation]);

    // Separate useEffect for fetching transactions
    useEffect(() => {
        if (contactData?.id_konsumen) {
            fetchTransactions();
        }
    }, [contactData?.id_konsumen, fetchTransactions]);

    if (!contactData) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Data kontak tidak ditemukan</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleCall = () => {
        Linking.openURL(`tel:${contactData.no_hp}`);
    };

    const handleWhatsApp = () => {
        const whatsappUrl = `https://wa.me/${contactData.no_hp.replace(/^0/, '62')}`;
        Linking.openURL(whatsappUrl);
    };

    const handleTambahTransaksi = () => {
        router.push({
            pathname: '/transaksi-manual/tambah',
            params: { selectedCustomer: JSON.stringify(contactData) }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            {/* Header Custom */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.logo}>Detail Kontak</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Contact Header */}
                <View style={styles.headerCard}>
                    <Text style={styles.contactName}>{contactData.nama_lengkap}</Text>
                    <Text style={styles.contactDescription}>{contactData.alamat_lengkap}</Text>
                </View>

                {/* Contact Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="call" size={20} color="#0d6efd" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Telepon</Text>
                            <Text style={styles.infoValue}>{contactData.no_hp}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
                            <Ionicons name="call" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Telepon</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={handleWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionButton, styles.transaksiButton]} onPress={handleTambahTransaksi}>
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Tambah Transaksi</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Transaction History */}
                <View style={styles.transactionsSection}>
                    <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
                    
                    {loadingTransactions ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#0d6efd" />
                            <Text style={styles.loadingText}>Memuat transaksi...</Text>
                        </View>
                    ) : transactionsError ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{transactionsError}</Text>
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color="#6c757d" />
                            <Text style={styles.emptyText}>Belum ada transaksi</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={transactions}
                            keyExtractor={(item, index) => item.id_transaksi?.toString() || index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.transactionItem}>
                                    <View style={styles.transactionHeader}>
                                        <Text style={styles.transactionService}>{item.nama_layanan || 'N/A'}</Text>
                                        <Text style={styles.transactionDate}>
                                            {item.tanggal_order ? new Date(item.tanggal_order).toLocaleDateString('id-ID') : 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.transactionDetails}>
                                        <Text style={styles.transactionAddress} numberOfLines={1}>
                                            {item.alamat_penjemputan || 'N/A'}
                                        </Text>
                                        <Text style={styles.transactionAmount}>
                                            Rp {item.biaya_antar ? parseInt(item.biaya_antar).toLocaleString('id-ID') : '0'}
                                        </Text>
                                    </View>
                                    <View style={styles.transactionStatus}>
                                        <Text style={[
                                            styles.statusText,
                                            item.status === 'COMPLETED' ? styles.statusCompleted :
                                            item.status === 'PENDING' ? styles.statusPending :
                                            styles.statusCancelled
                                        ]}>
                                            {item.status || 'PENDING'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.transactionsList}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
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
        textAlign: 'center',
        flex: 1,
    },
    headerBackButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#0d6efd',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    headerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    contactName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
        textAlign: 'center',
        marginBottom: 8,
    },
    contactDescription: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6c757d',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#212529',
        fontWeight: '500',
    },
    actionsContainer: {
        gap: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        gap: 8,
    },
    callButton: {
        backgroundColor: '#0d6efd',
    },
    whatsappButton: {
        backgroundColor: '#25d366',
    },
    transaksiButton: {
        backgroundColor: '#28a745',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    transactionsSection: {
        flex: 1,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#6c757d',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
        marginTop: 8,
    },
    transactionsList: {
        gap: 12,
    },
    transactionItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    transactionService: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    transactionDate: {
        fontSize: 12,
        color: '#6c757d',
    },
    transactionDetails: {
        marginBottom: 8,
    },
    transactionAddress: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 4,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0d6efd',
    },
    transactionStatus: {
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        textTransform: 'uppercase',
    },
    statusCompleted: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    statusPending: {
        backgroundColor: '#fff3cd',
        color: '#856404',
    },
    statusCancelled: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
});
