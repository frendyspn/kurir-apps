import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TransaksiDetailModalProps {
    transaksi: any;
    onClose: () => void;
    onRefresh?: () => void;
    showApproveSection?: boolean;
}

const TransaksiDetailModal = memo(({
    transaksi,
    onClose,
    onRefresh,
    showApproveSection = true
}: TransaksiDetailModalProps) => {
    const [userData, setUserData] = useState<any>(null);
    const [approveText, setApproveText] = useState('');
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        const getUserData = async () => {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                setUserData(JSON.parse(data));
            }
        };
        getUserData();
    }, []);

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);

    const formatCurrency = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numAmount || 0);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'finish':
            case 'completed':
                return '#28a745';
            case 'pending':
            case 'process':
                return '#ffc107';
            case 'cancel':
            case 'cancelled':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'finish':
            case 'completed':
                return 'checkmark-circle';
            case 'pending':
            case 'process':
                return 'time';
            case 'cancel':
            case 'cancelled':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    const handleApprove = async () => {
        if (approveText.toUpperCase() !== 'SETUJU') {
            Alert.alert('Perhatian', 'Silakan ketik "SETUJU" untuk menyetujui transaksi');
            return;
        }

        try {
            setIsApproving(true);

            if (!userData || !userData.no_hp) {
                Alert.alert('Error', 'Data user tidak ditemukan');
                return;
            }

            const requestData = {
                id_transaksi: transaksi.id || transaksi.id_transaksi,
                btn_simpan: 'approve',
                text_approve: 'SETUJU',
                id_sopir: transaksi.id_sopir || '-',
                no_hp: userData.no_hp,
                biaya_antar: transaksi.tarif || '0',
            };

            const response = await apiService.approveTransaksi(requestData);

            if (response.success) {
                Alert.alert('Berhasil', 'Transaksi berhasil disetujui', [
                    {
                        text: 'OK',
                        onPress: () => {
                            onClose();
                            // Refresh transaction list
                            if (onRefresh) {
                                onRefresh();
                            }
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Gagal menyetujui transaksi');
            }
        } catch (error) {
            console.error('Error approving transaksi:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat menyetujui transaksi');
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                    <Ionicons name="close" size={28} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Detail Transaksi</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent}>
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusIconContainer}>
                        <Ionicons
                            name={getStatusIcon(transaksi.status)}
                            size={48}
                            color={getStatusColor(transaksi.status)}
                        />
                    </View>
                    <Text style={styles.statusTitle}>Status Transaksi</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaksi.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(transaksi.status) }]}>
                            {transaksi.status || 'Unknown'}
                        </Text>
                    </View>
                </View>

                {/* Order Info */}
                <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                        <Ionicons name="receipt-outline" size={20} color="#0d6efd" />
                        <Text style={styles.modalSectionTitle}>Informasi Order</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Kode Order</Text>
                        <Text style={styles.infoValue}>#{transaksi.kode_order}</Text>
                    </View>

                    <View style={styles.modalDivider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tanggal Order</Text>
                        <Text style={styles.infoValue}>{formatDate(transaksi.tanggal_order)}</Text>
                    </View>

                    <View style={styles.modalDivider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Waktu Order</Text>
                        <Text style={styles.infoValue}>{formatTime(transaksi.tanggal_order)}</Text>
                    </View>

                    {transaksi.service && (
                        <>
                            <View style={styles.modalDivider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Jenis Layanan</Text>
                                <Text style={styles.infoValue}>{transaksi.service}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Location Info */}
                <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                        <Ionicons name="navigate-outline" size={20} color="#0d6efd" />
                        <Text style={styles.modalSectionTitle}>Informasi Lokasi</Text>
                    </View>

                    <View style={styles.locationItem}>
                        <View style={styles.locationIconContainer}>
                            <Ionicons name="location-outline" size={20} color="#0d6efd" />
                        </View>
                        <View style={styles.locationContent}>
                            <Text style={styles.locationLabel}>Alamat Penjemputan</Text>
                            <Text style={styles.locationText}>{transaksi.alamat_jemput || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.locationDivider}>
                        <View style={styles.locationDot} />
                        <View style={styles.locationLine} />
                        <View style={styles.locationDot} />
                    </View>

                    <View style={styles.locationItem}>
                        <View style={styles.locationIconContainer}>
                            <Ionicons name="location" size={20} color="#dc3545" />
                        </View>
                        <View style={styles.locationContent}>
                            <Text style={styles.locationLabel}>Alamat Tujuan</Text>
                            <Text style={styles.locationText}>{transaksi.alamat_antar || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Info */}
                <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                        <Ionicons name="wallet-outline" size={20} color="#0d6efd" />
                        <Text style={styles.modalSectionTitle}>Informasi Pembayaran</Text>
                    </View>

                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Biaya Antar</Text>
                        <Text style={styles.paymentValue}>{formatCurrency(transaksi.tarif)}</Text>
                    </View>

                    <View style={styles.modalDivider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Pembayaran</Text>
                        <Text style={styles.totalValue}>{formatCurrency(transaksi.tarif)}</Text>
                    </View>
                </View>

                {/* Approve Section - Only for Agen with PENDING status */}
                {showApproveSection && userData?.agen === '1' && transaksi.status?.toUpperCase() === 'PENDING' && (
                    <View style={styles.approveSection}>
                        <View style={styles.modalSectionHeader}>
                            <Ionicons name="checkmark-done-outline" size={20} color="#28a745" />
                            <Text style={styles.modalSectionTitle}>Approve Transaksi</Text>
                        </View>

                        <Text style={styles.approveInstruction}>
                            Ketik "SETUJU" untuk menyetujui transaksi ini
                        </Text>

                        <TextInput
                            style={styles.approveInput}
                            value={approveText}
                            onChangeText={setApproveText}
                            placeholder="Ketik SETUJU"
                            placeholderTextColor="#adb5bd"
                            autoCapitalize="characters"
                        />

                        <TouchableOpacity
                            style={[
                                styles.approveButton,
                                (approveText.toUpperCase() !== 'SETUJU' || isApproving) && styles.approveButtonDisabled
                            ]}
                            onPress={handleApprove}
                            disabled={approveText.toUpperCase() !== 'SETUJU' || isApproving}
                        >
                            {isApproving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                                    <Text style={styles.approveButtonText}>Setujui Transaksi</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
});

TransaksiDetailModal.displayName = 'TransaksiDetailModal';

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalHeader: {
        backgroundColor: '#0d6efd',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 32,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    statusCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusIconContainer: {
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6c757d',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        flex: 1,
        textAlign: 'right',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#e9ecef',
        marginVertical: 4,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    locationIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationContent: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 14,
        color: '#212529',
        lineHeight: 20,
    },
    locationDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15,
        paddingVertical: 8,
    },
    locationDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#dee2e6',
    },
    locationLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#dee2e6',
        marginHorizontal: 4,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#6c757d',
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0d6efd',
    },
    approveSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#28a745',
    },
    approveInstruction: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 12,
    },
    approveInput: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#dee2e6',
        fontSize: 16,
        marginBottom: 12,
    },
    approveButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    approveButtonDisabled: {
        backgroundColor: '#adb5bd',
    },
    approveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TransaksiDetailModal;
