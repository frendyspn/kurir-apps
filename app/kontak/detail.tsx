import TransaksiDetailModal from '@/components/transaksi-detail-modal';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const { contact, refresh } = useLocalSearchParams<{ contact: string; refresh?: string }>();
    const initialContactData: Contact = contact ? JSON.parse(contact) : null;

    // State untuk data kontak yang bisa diupdate
    const [currentContactData, setCurrentContactData] = useState<Contact | null>(initialContactData);

    // Update contact data when parameters change (e.g., after editing)
    useEffect(() => {
        if (contact) {
            const newContactData = JSON.parse(contact);
            console.log('Contact data updated from params:', newContactData);
            setCurrentContactData(newContactData);
        }
    }, [contact]);

    // State untuk transaksi
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);

    // State untuk menu options
    const [showMenu, setShowMenu] = useState(false);

    // State untuk modal detail transaksi
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Track if this is the first load
    const isFirstLoad = useRef(true);

    const fetchTransactions = useCallback(async () => {
        if (!currentContactData?.id_konsumen) return;
        
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

            const response = await apiService.getListTransaksiManualKonsumen(
                currentContactData.no_hp,
                startDateStr,
                endDateStr,
                currentContactData.id_konsumen // Filter by customer ID
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
    }, [currentContactData?.id_konsumen, currentContactData?.no_hp]);

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

    // Separate useEffect for fetching transactions on initial load
    useEffect(() => {
        if (currentContactData?.id_konsumen && isFirstLoad.current) {
            fetchTransactions();
            isFirstLoad.current = false;
        }
    }, [currentContactData?.id_konsumen]); // Remove fetchTransactions from dependency

    // Function to fetch updated contact data
    const fetchContactData = useCallback(async () => {
        if (!currentContactData?.id_konsumen) return;

        try {
            console.log('Fetching updated contact data for:', currentContactData.id_konsumen);
            const response = await apiService.getKonsumen(currentContactData.id_konsumen);
            console.log('Contact data response:', response);
            if (response.success && response.data) {
                // Update the contact data with fresh data from API
                const updatedData = {
                    ...currentContactData,
                    ...response.data,
                    // Ensure id_konsumen stays the same
                    id_konsumen: currentContactData.id_konsumen
                };
                console.log('Updating contact data to:', updatedData);
                setCurrentContactData(updatedData);
            }
        } catch (error) {
            console.error('Error fetching updated contact data:', error);
            // Don't show error to user, just keep existing data
        }
    }, []); // Remove dependency to prevent infinite loops

    // Refresh transactions when screen comes back into focus
    useFocusEffect(
        useCallback(() => {
            console.log('Screen focused');
            // Only refresh transactions, contact data is updated via navigation params
            if (currentContactData?.id_konsumen) {
                console.log('Refreshing transactions...');
                fetchTransactions();
            }
        }, [currentContactData?.id_konsumen])
    );

    if (!currentContactData) {
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
        if (currentContactData) {
            Linking.openURL(`tel:${currentContactData.no_hp}`);
        }
    };

    const handleWhatsApp = () => {
        if (currentContactData) {
            const whatsappUrl = `https://wa.me/${currentContactData.no_hp.replace(/^0/, '62')}`;
            Linking.openURL(whatsappUrl);
        }
    };

    const handleTambahTransaksi = () => {
        if (currentContactData) {
            router.push({
                pathname: '/transaksi-manual/tambah',
                params: { selectedCustomer: JSON.stringify(currentContactData) }
            });
        }
    };

    const handleEditKontak = () => {
        if (currentContactData) {
            router.push({
                pathname: '/kontak/edit',
                params: { contact: JSON.stringify(currentContactData) }
            });
        }
    };

    const handleDeleteKontak = () => {
        if (!currentContactData) return;

        Alert.alert(
            'Hapus Kontak',
            `Apakah Anda yakin ingin menghapus kontak ${currentContactData.nama_lengkap}?`,
            [
                {
                    text: 'Batal',
                    style: 'cancel',
                },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: performDeleteKontak,
                },
            ]
        );
    };

    const performDeleteKontak = async () => {
        if (!currentContactData) return;

        try {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            const user = JSON.parse(userData);

            const response = await apiService.deleteKontak({
                id_konsumen: currentContactData.id_konsumen,
                no_hp_user: user.no_hp,
            });

            if (response.success) {
                Alert.alert('Berhasil', 'Kontak berhasil dihapus', [
                    {
                        text: 'OK',
                        onPress: () => {
                            router.back();
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal menghapus kontak');
            }
        } catch (error) {
            console.error('Error deleting kontak:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat menghapus kontak');
        }
    };

    const handleTransactionPress = (transaction: any) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTransaction(null);
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            {/* Header Custom */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.logo}>Detail Kontak</Text>
                <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.headerMenuButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* Menu Overlay */}
            {showMenu && (
                <Modal
                    visible={showMenu}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowMenu(false)}
                >
                    <TouchableOpacity
                        style={styles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setShowMenu(false)}
                    >
                        <View style={styles.menuContainer}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    handleEditKontak();
                                }}
                            >
                                <Ionicons name="create-outline" size={20} color="#0d6efd" />
                                <Text style={styles.menuItemText}>Edit Kontak</Text>
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity
                                style={[styles.menuItem, styles.menuItemDelete]}
                                onPress={() => {
                                    setShowMenu(false);
                                    handleDeleteKontak();
                                }}
                            >
                                <Ionicons name="trash-outline" size={20} color="#dc3545" />
                                <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>Hapus Kontak</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            <View style={styles.content}>
                {/* Contact Header */}
                <View style={styles.headerCard}>
                    <Text style={styles.contactName}>{currentContactData.nama_lengkap}</Text>
                    <Text style={styles.contactDescription}>{currentContactData.alamat_lengkap}</Text>
                </View>

                {/* Contact Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="call" size={20} color="#0d6efd" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Telepon</Text>
                            <Text style={styles.infoValue}>{currentContactData.no_hp}</Text>
                        </View>
                    </View>
                </View>

                {/* Scrollable Content */}
                <ScrollView 
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
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
                                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.transactionItem} onPress={() => handleTransactionPress(item)}>
                                        <View style={styles.transactionHeader}>
                                            <Text style={styles.transactionService}>{item.jenis_layanan || 'N/A'}</Text>
                                            <Text style={styles.transactionDate}>
                                                {item.tanggal_order ? new Date(item.tanggal_order).toLocaleDateString('id-ID') : 'N/A'}
                                            </Text>
                                        </View>
                                        <View style={styles.transactionDetails}>
                                            <Text style={styles.transactionAddress} numberOfLines={1}>
                                                {item.alamat_jemput || 'N/A'}
                                            </Text>
                                            <Text style={styles.transactionAmount}>
                                                Rp {item.tarif ? parseInt(item.tarif).toLocaleString('id-ID') : '0'}
                                            </Text>
                                        </View>
                                        <View style={styles.transactionStatus}>
                                            <Text style={[
                                                styles.statusText,
                                                item.status === 'FINISH' ? styles.statusCompleted :
                                                item.status === 'PENDING' ? styles.statusPending :
                                                styles.statusCancelled
                                            ]}>
                                                {item.status || 'PENDING'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.transactionsList}
                                scrollEnabled={false} // Disable FlatList scrolling since parent ScrollView handles it
                            />
                        )}
                    </View>

                    {/* Bottom Spacing */}
                    <View style={{ height: 20 }} />
                </ScrollView>
            </View>

            {/* Transaction Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={false}
                onRequestClose={handleCloseDetailModal}
            >
                {selectedTransaction && (
                    <TransaksiDetailModal
                        transaksi={selectedTransaction}
                        onClose={handleCloseDetailModal}
                        onRefresh={fetchTransactions}
                        showApproveSection={true}
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
    headerMenuButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
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
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    menuContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    menuItemDelete: {
        // Additional styling for delete item if needed
    },
    menuItemText: {
        fontSize: 16,
        color: '#212529',
        fontWeight: '500',
    },
    menuItemTextDelete: {
        color: '#dc3545',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#dee2e6',
        marginHorizontal: 8,
    },
});
