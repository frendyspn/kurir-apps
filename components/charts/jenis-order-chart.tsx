import { Ionicons } from '@expo/vector-icons';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface JenisOrderData {
    name: string;
    orders: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
}

interface JenisOrderChartProps {
    data: JenisOrderData[];
    width?: number;
}

export default function JenisOrderChart({ data, width = screenWidth - 64 }: JenisOrderChartProps) {
    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(13, 110, 253, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForLabels: {
            fontSize: 10
        }
    };

    // Check if data is empty or all orders are 0
    const isEmpty = !data || data.length === 0 || data.every(item => item.orders === 0);

    return (
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Jenis Order Hari Ini</Text>
            <Text style={styles.chartSubtitle}>Distribusi berdasarkan kategori</Text>
            
            {isEmpty ? (
                <View style={styles.emptyState}>
                    <Ionicons name="pie-chart-outline" size={64} color="#dee2e6" />
                    <Text style={styles.emptyText}>Belum ada data order</Text>
                    <Text style={styles.emptySubtext}>
                        Data akan muncul setelah ada order yang selesai
                    </Text>
                </View>
            ) : (
                <PieChart
                    data={data}
                    width={width}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="orders"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={styles.chart}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    chartCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6c757d',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 12,
        color: '#adb5bd',
        marginTop: 4,
        textAlign: 'center',
    },
});
