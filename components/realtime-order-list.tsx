import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import socketService from '../services/socket';

interface Order {
    id: string;
    kode_order: string;
    service: string;
    tarif: number;
    titik_jemput: string;
    alamat_jemput: string;
    titik_antar: string;
    alamat_antar: string;
    time_remaining: number;
    created_at: string;
}

interface RealtimeOrderListProps {
    onOrderAccepted?: (order: Order) => void;
    maxHeight?: number;
}

const RealtimeOrderList: React.FC<RealtimeOrderListProps> = ({
    onOrderAccepted,
    maxHeight = 400
}) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');

    // console.log('🚀 RealtimeOrderList COMPONENT RENDERED');
    // console.log('🚀 ORDERS STATE LENGTH:', orders.length);
    // console.log('🚀 ORDERS STATE DATA:', orders);

    // Force render test function
    const forceRenderTestOrders = () => {
        console.log('🧪 FORCE RENDERING TEST ORDERS');
        const testOrders: Order[] = [
            {
                id: 'test-1',
                kode_order: 'TEST-001',
                service: 'express',
                tarif: 25000,
                titik_jemput: 'Test Pickup 1',
                alamat_jemput: 'Jl. Test No. 1, Jakarta',
                titik_antar: 'Test Delivery 1',
                alamat_antar: 'Jl. Test No. 2, Jakarta',
                time_remaining: 250,
                created_at: new Date().toISOString()
            },
            {
                id: 'test-2',
                kode_order: 'TEST-002',
                service: 'food',
                tarif: 35000,
                titik_jemput: 'Test Pickup 2',
                alamat_jemput: 'Jl. Test No. 3, Jakarta',
                titik_antar: 'Test Delivery 2',
                alamat_antar: 'Jl. Test No. 4, Jakarta',
                time_remaining: 180,
                created_at: new Date().toISOString()
            }
        ];
        setOrders(testOrders);
        console.log('✅ TEST ORDERS SET:', testOrders);
    };

    useEffect(() => {
        console.log('🔄 RealtimeOrderList: Setting up listener...');

        // Check if socket is connected
        const isConnected = socketService.getConnectionStatus();
        console.log('🔌 Socket connection status:', isConnected);

        if (!isConnected) {
            console.warn('⚠️ Socket not connected, attempting to connect...');
            socketService.connect().then(() => {
                console.log('✅ Socket connected in RealtimeOrderList');
                setupListener();
            }).catch((error) => {
                console.error('❌ Failed to connect socket in RealtimeOrderList:', error);
            });
        } else {
            setupListener();
        }

        function setupListener() {
            setConnectionStatus('Connected');
            // Listen for new orders
            socketService.onNewOrders((newOrders: Order[]) => {
                console.log('📦 RealtimeOrderList: New orders received:', newOrders.length);
                console.log('📋 Orders data:', newOrders);
                setOrders(newOrders);

                // Log current state after update
                setTimeout(() => {
                    console.log('📊 RealtimeOrderList: Current orders state:', orders.length);
                    console.log('📊 RealtimeOrderList: Current orders data:', orders);
                }, 100);
            });
        }

        return () => {
            console.log('🧹 RealtimeOrderList: Cleanup listener');
            // Cleanup will be handled by parent component
        };
    }, []);

    // Update countdown every second
    useEffect(() => {
        const interval = setInterval(() => {
            setOrders(prevOrders =>
                prevOrders.map(order => ({
                    ...order,
                    time_remaining: Math.max(0, order.time_remaining - 1)
                })).filter(order => order.time_remaining > 0)
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleAcceptOrder = async (order: Order) => {
        try {
            setLoading(true);
            console.log('🚀 Accepting order:', order.id);

            const acceptedOrder = await socketService.acceptOrder(order.id);

            Alert.alert(
                'Berhasil!',
                `Order ${order.kode_order} berhasil diambil`,
                [{ text: 'OK' }]
            );

            // Remove from local list
            setOrders(prev => prev.filter(o => o.id !== order.id));

            // Notify parent
            if (onOrderAccepted) {
                onOrderAccepted(acceptedOrder);
            }

        } catch (error: any) {
            console.error('❌ Error accepting order:', error);
            Alert.alert(
                'Gagal',
                error.message || 'Gagal mengambil order. Order mungkin sudah diambil kurir lain.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getServiceIcon = (service: string): string => {
        switch (service.toLowerCase()) {
            case 'food': return 'restaurant-outline';
            case 'shop': return 'bag-outline';
            case 'express': return 'bicycle-outline';
            default: return 'cube-outline';
        }
    };

    const getServiceColor = (service: string): string => {
        switch (service.toLowerCase()) {
            case 'food': return '#28a745';
            case 'shop': return '#007bff';
            case 'express': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
        const isUrgent = item.time_remaining < 60; // Less than 1 minute

        return (
            <View style={[styles.orderCard, isUrgent && styles.urgentCard]}>
                {/* Header */}
                <View style={styles.orderHeader}>
                    <View style={styles.serviceInfo}>
                        <View style={[styles.serviceIcon, { backgroundColor: getServiceColor(item.service) + '20' }]}>
                            <Ionicons
                                name={getServiceIcon(item.service) as any}
                                size={20}
                                color={getServiceColor(item.service)}
                            />
                        </View>
                        <View>
                            <Text style={styles.orderCode}>{item.kode_order}</Text>
                            <Text style={styles.serviceType}>{item.service.toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={[styles.timerContainer, isUrgent && styles.urgentTimer]}>
                        <Ionicons name="time-outline" size={16} color={isUrgent ? '#dc3545' : '#6c757d'} />
                        <Text style={[styles.timerText, isUrgent && styles.urgentTimerText]}>
                            {formatTime(item.time_remaining)}
                        </Text>
                    </View>
                </View>

                {/* Route Info */}
                <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                        <View style={styles.pickupDot} />
                        <View style={styles.routeLine}>
                            <Text style={styles.routeText} numberOfLines={1}>
                                {item.titik_jemput}
                            </Text>
                            <Text style={styles.addressText} numberOfLines={2}>
                                {item.alamat_jemput}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.routeDivider}>
                        <Ionicons name="chevron-down" size={16} color="#dee2e6" />
                    </View>

                    <View style={styles.routePoint}>
                        <View style={styles.deliveryDot} />
                        <View style={styles.routeLine}>
                            <Text style={styles.routeText} numberOfLines={1}>
                                {item.titik_antar}
                            </Text>
                            <Text style={styles.addressText} numberOfLines={2}>
                                {item.alamat_antar}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.orderFooter}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Tarif</Text>
                        <Text style={styles.priceAmount}>
                            Rp {item.tarif.toLocaleString()}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.acceptButton, loading && styles.disabledButton]}
                        onPress={() => handleAcceptOrder(item)}
                        disabled={loading}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                        <Text style={styles.acceptButtonText}>
                            {loading ? 'Mengambil...' : 'Ambil Order'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (orders.length === 0) {
        // console.log('📭 RENDERING EMPTY STATE: orders.length === 0');
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#dee2e6" />
                <Text style={styles.emptyText}>Belum ada order tersedia</Text>
                <Text style={styles.emptySubtext}>Order baru akan muncul secara real-time</Text>
            </View>
        );
    }

    console.log('📋 RENDERING ORDERS LIST: orders.length =', orders.length);
    console.log('📋 ORDERS ARRAY:', orders);
    console.log('📋 ORDERS IS ARRAY:', Array.isArray(orders));

    // Debug rendering logic
    const shouldRenderOrders = orders.length > 0;
    console.log('🔍 SHOULD RENDER ORDERS:', shouldRenderOrders);

    if (shouldRenderOrders) {
        console.log('✅ RENDERING ORDERS MAP');
        orders.forEach((item, index) => {
            console.log('🔄 MAPPING ORDER:', index, item);
        });
    } else {
        console.log('❌ RENDERING EMPTY STATE');
    }

    return (
        <View style={[styles.container, { maxHeight }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Order Tersedia</Text>
                <View style={styles.connectionIndicator}>
                    <Ionicons
                        name={connectionStatus === 'Connected' ? 'wifi' : 'wifi-outline'}
                        size={16}
                        color={connectionStatus === 'Connected' ? '#28a745' : '#ffc107'}
                    />
                    <Text style={[styles.connectionText, { color: connectionStatus === 'Connected' ? '#28a745' : '#ffc107' }]}>
                        {connectionStatus}
                    </Text>
                </View>
            </View>
            <ScrollView
                style={[styles.scrollContainer, { maxHeight: maxHeight - 60 }]}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                {shouldRenderOrders ? (
                    orders.map((item, index) => (
                        <View key={item.id || `order-${index}`}>
                            {renderOrderItem({ item })}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={48} color="#dee2e6" />
                        <Text style={styles.emptyText}>Belum ada order tersedia</Text>
                        <Text style={styles.emptySubtext}>Order baru akan muncul secara real-time</Text>

                        {/* Debug button for testing */}
                        {__DEV__ && (
                            <TouchableOpacity
                                style={styles.debugButton}
                                onPress={forceRenderTestOrders}
                            >
                                <Text style={styles.debugButtonText}>Force Test Orders</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    connectionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    connectionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    scrollContainer: {
        flex: 1,
    },
    listContainer: {
        paddingBottom: 8,
    },
    orderCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    urgentCard: {
        borderColor: '#dc3545',
        backgroundColor: '#fff5f5',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    serviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    serviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
    },
    serviceType: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    urgentTimer: {
        borderColor: '#dc3545',
        backgroundColor: '#fee',
    },
    timerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6c757d',
        marginLeft: 4,
    },
    urgentTimerText: {
        color: '#dc3545',
    },
    routeContainer: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 4,
    },
    pickupDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#dc3545',
        marginRight: 12,
        marginTop: 6,
    },
    deliveryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#28a745',
        marginRight: 12,
        marginTop: 6,
    },
    routeLine: {
        flex: 1,
    },
    routeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 2,
    },
    addressText: {
        fontSize: 12,
        color: '#6c757d',
        lineHeight: 16,
    },
    routeDivider: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: '#6c757d',
    },
    priceAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#28a745',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    disabledButton: {
        backgroundColor: '#6c757d',
    },
    acceptButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
        marginTop: 12,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#adb5bd',
        marginTop: 4,
        textAlign: 'center',
    },
    debugButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 16,
    },
    debugButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default RealtimeOrderList;