import TransaksiDetailModal from '@/components/transaksi-detail-modal';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveOrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [transaksi, setTransaksi] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTransaksiDetail();
    }, [id]);

    // Refresh data when screen comes back into focus (e.g., from edit screen)
    useFocusEffect(
        useCallback(() => {
            fetchTransaksiDetail();
        }, [id])
    );

    const fetchTransaksiDetail = async () => {
        if (!id) {
            setError('ID transaksi tidak ditemukan');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                setError('Data user tidak ditemukan');
                return;
            }

            const user = JSON.parse(userData);

            // Get current date for filtering
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];

            // Fetch live orders
            console.log('Fetching live order detail for ID:', id);
            const response = await apiService.getListLiveOrder(
                user.no_hp,
                startDate,
                endDate,
                user.no_hp,
                '',
                '',
                id // Search by order code or ID
            );

            if (response.success && response.data) {
                let dataArray = [];

                if (response.data.data && Array.isArray(response.data.data)) {
                    dataArray = response.data.data;
                } else if (Array.isArray(response.data)) {
                    dataArray = response.data;
                }

                // Find the matching transaction
                const foundTransaksi = dataArray.find((item: any) =>
                    item.id?.toString() === id ||
                    item.kode_order === id ||
                    item.id_transaksi?.toString() === id
                );
console.log('Fetched transaksi detail:', id, foundTransaksi);
                if (foundTransaksi) {
                    setTransaksi(foundTransaksi);
                } else {
                    setError('Transaksi tidak ditemukan');
                }
            } else {
                setError(response.message || 'Gagal memuat detail transaksi');
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            setError('Terjadi kesalahan saat memuat detail transaksi');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        router.back();
    };

    const handleRefresh = () => {
        fetchTransaksiDetail();
    };

    const handleShare = async () => {
        try {
            const encodedId = btoa(id); // Base64 encode the ID
            const shareLink = `https://mitra.klikquick.id/app/live-order/${encodedId}`;
            await Clipboard.setString(shareLink);
            Alert.alert('Berhasil', 'Link berhasil disalin ke clipboard');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            Alert.alert('Error', 'Gagal menyalin link');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['left', 'right', 'bottom']}>
                <View style={{
                    backgroundColor: '#0097A7',
                    paddingTop: 50,
                    paddingBottom: 16,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                        <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#ffffff',
                        textAlign: 'center',
                        flex: 1,
                    }}>Detail Live Order</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}>
                    <ActivityIndicator size="large" color="#0097A7" />
                    <Text style={{
                        fontSize: 16,
                        color: '#6c757d',
                        marginTop: 12,
                    }}>Memuat detail transaksi...</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    if (error || !transaksi) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['left', 'right', 'bottom']}>
                <View style={{
                    backgroundColor: '#0097A7',
                    paddingTop: 50,
                    paddingBottom: 16,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                        <Ionicons name="chevron-back-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#ffffff',
                        textAlign: 'center',
                        flex: 1,
                    }}>Detail Live Order</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#6c757d',
                        textAlign: 'center',
                        marginBottom: 20,
                    }}>{error || 'Data transaksi tidak ditemukan'}</Text>
                    <Text>{JSON.stringify(transaksi)}</Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#0097A7',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                        }}
                        onPress={fetchTransaksiDetail}
                    >
                        <Text style={{
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: '500',
                        }}>Coba Lagi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#6c757d',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 8,
                        }}
                        onPress={() => router.back()}
                    >
                        <Text style={{
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: '500',
                        }}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

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

                <Text style={styles.headerTitle}>Detail Order</Text>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                >
                    <Ionicons name="link-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>
            <TransaksiDetailModal
                transaksi={transaksi}
                onClose={handleClose}
                onRefresh={handleRefresh}
                showApproveSection={true}
                isPageMode={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#0097A7',
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    shareButton: {
        padding: 4,
    },
    headerRight: {
        width: 32,
    },
});
