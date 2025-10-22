import { Ionicons } from '@expo/vector-icons';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

type PendapatanMode = 'hourly' | 'daily' | 'monthly' | 'yearly';

interface PendapatanChartProps {
    data: {
        labels: string[];
        datasets: {
            data: number[];
        }[];
    };
    width?: number;
    mode?: PendapatanMode;
    title?: string;
    subtitle?: string;
    date?: string; // Format: 'YYYY-MM-DD' untuk daily, 'YYYY-MM' untuk monthly, 'YYYY' untuk yearly
}

export default function PendapatanChart({ 
    data, 
    width, 
    mode = 'hourly',
    title,
    subtitle,
    date
}: PendapatanChartProps) {
    // Generate dynamic title and subtitle based on mode
    const getTitle = () => {
        if (title) return title;
        
        switch (mode) {
            case 'hourly':
                return date ? `Pendapatan ${formatDate(date)}` : 'Pendapatan Hari Ini';
            case 'daily':
                return date ? `Pendapatan Bulan ${formatMonth(date)}` : 'Pendapatan Bulanan';
            case 'monthly':
                return date ? `Pendapatan Tahun ${formatYear(date)}` : 'Pendapatan Tahunan';
            case 'yearly':
                return 'Pendapatan per Tahun';
            default:
                return 'Pendapatan';
        }
    };

    const getSubtitle = () => {
        if (subtitle) return subtitle;
        
        switch (mode) {
            case 'hourly':
                return 'Total pendapatan per jam';
            case 'daily':
                return 'Total pendapatan per hari';
            case 'monthly':
                return 'Total pendapatan per bulan';
            case 'yearly':
                return 'Total pendapatan per tahun';
            default:
                return 'Total pendapatan';
        }
    };

    const getEmptyMessage = () => {
        switch (mode) {
            case 'hourly':
                return date ? `Belum ada pendapatan pada ${formatDate(date)}` : 'Belum ada pendapatan hari ini';
            case 'daily':
                return date ? `Belum ada pendapatan di bulan ${formatMonth(date)}` : 'Belum ada pendapatan bulan ini';
            case 'monthly':
                return date ? `Belum ada pendapatan di tahun ${formatYear(date)}` : 'Belum ada pendapatan tahun ini';
            case 'yearly':
                return 'Belum ada pendapatan';
            default:
                return 'Belum ada pendapatan';
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

    // Transform data untuk y-axis dalam ribuan
    const transformedData = {
        labels: data.labels,
        datasets: [{
            data: data.datasets[0].data.map(value => value / 1000)
        }]
    };

    // Hitung width berdasarkan jumlah data points
    // Minimal 80px per bar untuk readability
    const minWidthPerBar = 60; // Dikurangi dari 80 ke 60
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
        formatTopBarValue: (value: number) => `${value}rb`,
        barPercentage: 0.7, // Lebar bar 70% dari space yang tersedia (default 1.0)
        barRadius: 4, // Rounded corner untuk bar
    };

    return (
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{getTitle()}</Text>
            <Text style={styles.chartSubtitle}>{getSubtitle()}</Text>
            
            {isEmpty ? (
                <View style={styles.emptyState}>
                    <Ionicons name="wallet-outline" size={64} color="#dee2e6" />
                    <Text style={styles.emptyStateText}>{getEmptyMessage()}</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Pendapatan akan muncul setelah Anda menyelesaikan orderan
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
                        data={transformedData}
                        width={calculatedWidth}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chart}
                        yAxisLabel="Rp"
                        yAxisSuffix="rb"
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
        marginHorizontal: -20, // Kompensasi padding card
        paddingHorizontal: 20,
    },
    chartScrollContent: {
        paddingRight: 20, // Margin right untuk bar terakhir
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
