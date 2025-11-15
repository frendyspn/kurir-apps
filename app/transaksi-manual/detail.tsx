import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import TransaksiDetailModal from '../../components/transaksi-detail-modal';
import { apiService } from '../../services/api';

export default function TransaksiDetailScreen() {
    const { id, from } = useLocalSearchParams();
    const [transaksi, setTransaksi] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);

    // Convert id to string if it's an array
    const transactionId = Array.isArray(id) ? id[0] : id;

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
        if (transactionId && userData?.no_hp) {
            fetchTransactionDetail();
        }
    }, [transactionId, userData]);

    const fetchTransactionDetail = async () => {
        try {
            setLoading(true);

            // Determine which API to use based on 'from' parameter
            let response;

            if (from === 'history') {
                // From history screen - use search parameter like live-order/detail.tsx
                const today = new Date();
                const startDate = today.toISOString().split('T')[0];
                const endDate = today.toISOString().split('T')[0];

                // Try manual transactions first with search parameter
                const manualResponse = await apiService.getListTransaksiManual(
                    userData.no_hp,
                    startDate,
                    endDate,
                    undefined,
                    undefined,
                    transactionId // Use transactionId as search query
                );

                if (manualResponse.success && manualResponse.data?.data) {
                    const foundTransaction = manualResponse.data.data.find((item: any) =>
                        item.id?.toString() === transactionId ||
                        item.kode_order === transactionId ||
                        item.id_transaksi?.toString() === transactionId
                    );
                    if (foundTransaction) {
                        setTransaksi(foundTransaction);
                        return;
                    }
                }

                // If not found in manual, try live orders with search parameter
                const liveResponse = await apiService.getListLiveOrder(
                    userData.no_hp,
                    startDate,
                    endDate,
                    undefined,
                    undefined,
                    transactionId // Use transactionId as search query
                );

                if (liveResponse.success && liveResponse.data?.data) {
                    const foundTransaction = liveResponse.data.data.find((item: any) =>
                        item.id?.toString() === transactionId ||
                        item.kode_order === transactionId ||
                        item.id_transaksi?.toString() === transactionId
                    );
                    if (foundTransaction) {
                        setTransaksi(foundTransaction);
                        return;
                    }
                }

                // If still not found, try yesterday's transactions
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                const manualResponseYesterday = await apiService.getListTransaksiManual(
                    userData.no_hp,
                    yesterdayStr,
                    yesterdayStr,
                    undefined,
                    undefined,
                    transactionId // Use transactionId as search query
                );

                if (manualResponseYesterday.success && manualResponseYesterday.data?.data) {
                    const foundTransaction = manualResponseYesterday.data.data.find((item: any) =>
                        item.id?.toString() === transactionId ||
                        item.kode_order === transactionId ||
                        item.id_transaksi?.toString() === transactionId
                    );
                    if (foundTransaction) {
                        setTransaksi(foundTransaction);
                        return;
                    }
                }

                const liveResponseYesterday = await apiService.getListLiveOrder(
                    userData.no_hp,
                    yesterdayStr,
                    yesterdayStr,
                    undefined,
                    undefined,
                    transactionId // Use transactionId as search query
                );

                if (liveResponseYesterday.success && liveResponseYesterday.data?.data) {
                    const foundTransaction = liveResponseYesterday.data.data.find((item: any) =>
                        item.id?.toString() === transactionId ||
                        item.kode_order === transactionId ||
                        item.id_transaksi?.toString() === transactionId
                    );
                    if (foundTransaction) {
                        setTransaksi(foundTransaction);
                        return;
                    }
                }

                console.error('Transaction not found in recent transactions');
                setTransaksi(null);
            } else {
                // Default behavior - assume it's from transaction list
                // This would need to be implemented based on how the navigation works
                console.log('Default transaction fetch - implement based on navigation pattern');
                setTransaksi(null);
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
            setTransaksi(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (transactionId && userData?.no_hp) {
            fetchTransactionDetail();
        }
    };

    if (loading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: 'Detail Transaksi',
                        headerShown: true,
                    }}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0097A7" />
                    <Text style={styles.loadingText}>Memuat detail transaksi...</Text>
                </View>
            </>
        );
    }

    if (!transaksi) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: 'Detail Transaksi',
                        headerShown: true,
                    }}
                />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Transaksi tidak ditemukan</Text>
                    <Text style={styles.errorSubtext}>ID transaksi tidak valid atau sudah dihapus</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Detail Transaksi',
                    headerShown: true,
                }}
            />
            <TransaksiDetailModal
                transaksi={transaksi}
                onClose={() => {}} // Not used in page mode
                onRefresh={handleRefresh}
                showApproveSection={true}
                isPageMode={true}
            />
        </>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
});
