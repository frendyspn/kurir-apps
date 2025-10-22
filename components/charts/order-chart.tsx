import { Ionicons } from '@expo/vector-icons';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

type OrderMode = 'hourly' | 'daily' | 'monthly' | 'yearly';

interface OrderChartProps {
    data: {
        labels: string[];
        datasets: {
            data: number[];
        }[];
    };
    width?: number;
    mode?: OrderMode;
    title?: string;
    subtitle?: string;
    date?: string; // Format: 'YYYY-MM-DD' untuk daily, 'YYYY-MM' untuk monthly, 'YYYY' untuk yearly
}

export default function OrderChart({ 
    data, 
    width,
    mode = 'hourly',
    title,
    subtitle,
    date
}: OrderChartProps) {
    // Generate dynamic title and subtitle based on mode
    const getTitle = () => {
        if (title) return title;
        
        switch (mode) {
            case 'hourly':
                return date ? `Total Order ${formatDate(date)}` : 'Total Order Hari Ini';
            case 'daily':
                return date ? `Total Order Bulan ${formatMonth(date)}` : 'Total Order Bulanan';
            case 'monthly':
                return date ? `Total Order Tahun ${formatYear(date)}` : 'Total Order Tahunan';
            case 'yearly':
                return 'Total Order per Tahun';
            default:
                return 'Total Order';
        }
    };

    const getSubtitle = () => {
        if (subtitle) return subtitle;
        
        switch (mode) {
            case 'hourly':
                return 'Jumlah order per jam';
            case 'daily':
                return 'Jumlah order per hari';
            case 'monthly':
                return 'Jumlah order per bulan';
            case 'yearly':
                return 'Jumlah order per tahun';
            default:
                return 'Jumlah order';
        }
    };

    const getEmptyMessage = () => {
        switch (mode) {
            case 'hourly':
                return date ? `Belum ada order pada ${formatDate(date)}` : 'Belum ada order hari ini';
            case 'daily':
                return date ? `Belum ada order di bulan ${formatMonth(date)}` : 'Belum ada order bulan ini';
            case 'monthly':
                return date ? `Belum ada order di tahun ${formatYear(date)}` : 'Belum ada order tahun ini';
            case 'yearly':
                return 'Belum ada order';
            default:
                return 'Belum ada order';
        }
    };

    // Helper function untuk format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatMonth = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    const formatYear = (dateString: string) => {
        return dateString.substring(0, 4);
    };

    // Check if data is empty
    const isEmpty = !data.datasets[0]?.data || data.datasets[0].data.length === 0 || 
                    data.datasets[0].data.every(value => value === 0);

    // Hitung width berdasarkan jumlah data points
    const minWidthPerBar = 60;
    const calculatedWidth = Math.max(
        width || screenWidth - 64,
        data.labels.length * minWidthPerBar
    );
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
        },
        barPercentage: 0.7,
        barRadius: 4,
    };

    return (
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{getTitle()}</Text>
            <Text style={styles.chartSubtitle}>{getSubtitle()}</Text>
            
            {isEmpty ? (
                <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={64} color="#dee2e6" />
                    <Text style={styles.emptyStateText}>{getEmptyMessage()}</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Order akan muncul setelah ada orderan masuk
                    </Text>
                </View>
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={styles.chartScrollView}
                    contentContainerStyle={styles.chartScrollContent}
                >
                    <BarChart
                        data={data}
                        width={calculatedWidth}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chart}
                        yAxisLabel=""
                        yAxisSuffix=""
                        fromZero
                        showValuesOnTopOfBars
                    />
                </ScrollView>
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
    chartScrollView: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    chartScrollContent: {
        paddingRight: 20,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        minHeight: 220,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6c757d',
        marginTop: 16,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 12,
        color: '#adb5bd',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
