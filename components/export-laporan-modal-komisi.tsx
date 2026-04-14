import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { memo, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DetailKomisi {
    tanggal: string;
    tipe: 'credit' | 'debit';
    type: string;
    amount: number;
    saldo: number;
    created_at: string;
}

interface RekapKomisiDetail {
    saldo_awal: number;
    detail: DetailKomisi[];
    saldo_akhir: number;
    summary: {
        total_credit: number;
        total_debit: number;
        net_total: number;
    };
    period: {
        start_date: string;
        end_date: string;
    };
}

interface ExportLaporanKomisiModalProps {
    visible: boolean;
    onClose: () => void;
    id_konsumen: string | number;
    startDate: string;  // format Y-m-d
    endDate: string;    // format Y-m-d
    courierName?: string;
}

// Helpers
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDateShort(dateString: string): string {
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}

// CSV Builder untuk Komisi Detail
function buildKomisiDetailCsv(data: RekapKomisiDetail, courierName?: string): string {
    const { detail, saldo_awal, saldo_akhir, summary, period } = data;

    const headers = [
        'Tanggal',
        'Keterangan',
        'Debit (IDR)',
        'Credit (IDR)',
        'Saldo (IDR)',
    ].join(';');

    const escapeCell = (val: string | number | undefined) => {
        const s = String(val ?? '-').replace(/"/g, '""');
        return `"${s}"`;
    };

    // Detail rows
    const dataRows = detail
        .map((r) => [
            escapeCell(r.tanggal),
            escapeCell(r.type),
            r.tipe === 'debit' ? r.amount : 0,
            r.tipe === 'credit' ? r.amount : 0,
            r.saldo,
        ].join(';'))
        .join('\n');

    // Summary section
    const summaryRows = [
        `${escapeCell('SALDO AWAL')};;;;${saldo_awal}`,
        '',
        headers,
        dataRows,
        '',
        escapeCell('SUMMARY'),
        `${escapeCell('Total Credit')};;;;${summary.total_credit}`,
        `${escapeCell('Total Debit')};;;;${summary.total_debit}`,
        `${escapeCell('Net Total')};;;;${summary.net_total}`,
        `${escapeCell('Saldo Akhir')};;;;${saldo_akhir}`,
    ].join('\n');

    return `sep=;\n${summaryRows}`;
}

// PDF Builder untuk Komisi Detail
async function buildKomisiDetailPdf(
    data: RekapKomisiDetail,
    startDate: string,
    endDate: string,
    courierName?: string,
    logoDataUri?: string
): Promise<string> {
    const { jsPDF } = await import('jspdf') as any;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const W = 210;
    const H = 297;
    const ml = 14;
    const cw = W - ml * 2;
    let y = 0;

    const TEAL: [number, number, number] = [0, 151, 167];
    const LIGHT_TEAL: [number, number, number] = [240, 253, 250];
    const GRAY: [number, number, number] = [100, 116, 139];
    const DARK: [number, number, number] = [30, 41, 59];

    const checkBreak = (h: number) => {
        if (y + h > H - 14) {
            doc.addPage();
            y = 14;
        }
    };

    // Header
    doc.setFillColor(...TEAL);
    doc.rect(0, 0, W, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('KlikQuick', ml, 13);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Platform Kurir Digital', ml, 19);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN MUTASI KOMISI', W - ml, 11, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const pd = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    doc.text(`Dicetak: ${pd}`, W - ml, 17, { align: 'right' });

    y = 30;

    // Meta box
    doc.setFillColor(...LIGHT_TEAL);
    doc.roundedRect(ml, y, cw, 20, 2, 2, 'F');
    doc.setFillColor(...TEAL);
    doc.rect(ml, y, 2, 20, 'F');

    const metas = [
        { label: 'NAMA KURIR', value: courierName || '-' },
        { label: 'PERIODE', value: `${startDate} s/d ${endDate}` },
        { label: 'SALDO AWAL', value: formatCurrency(data.saldo_awal) },
        { label: 'SALDO AKHIR', value: formatCurrency(data.saldo_akhir) },
    ];

    const qw = cw / 4;
    metas.forEach((m, i) => {
        const mx = ml + 5 + i * qw;
        doc.setTextColor(...GRAY);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(m.label, mx, y + 7);
        doc.setTextColor(...DARK);
        doc.setFontSize(9);
        doc.text(m.value, mx, y + 14);
    });

    y += 26;

    // Section title
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL MUTASI', ml, y);
    y += 5;

    // Table header
    const colW = [25, 30, 25, 25, 25];
    const colTitles = ['Tanggal', 'Keterangan', 'Debit', 'Credit', 'Saldo'];

    doc.setFillColor(...TEAL);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    let x = ml;
    colTitles.forEach((title, i) => {
        const align = i === 0 ? 'left' : 'right';
        doc.text(title, x + colW[i] / 2, y + 5, { align });
        x += colW[i];
    });

    y += 7;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.3);
    doc.line(ml, y, ml + cw, y);

    y += 2;

    // Table rows
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    const rowColor1: [number, number, number] = [255, 255, 255];
    const rowColor2: [number, number, number] = [248, 250, 252];

    data.detail.forEach((row, idx) => {
        checkBreak(5);

        // Alternating row background
        const rowColor = idx % 2 === 0 ? rowColor1 : rowColor2;
        doc.setFillColor(...rowColor);
        doc.rect(ml, y, cw, 5, 'F');

        x = ml + 1;

        // Tanggal
        doc.text(row.tanggal, x, y + 3.5, { align: 'left', maxWidth: colW[0] - 2 });
        x += colW[0];

        // Keterangan
        doc.text(row.type, x, y + 3.5, { align: 'left', maxWidth: colW[1] - 2 });
        x += colW[1];

        // Debit
        const debitVal = row.tipe === 'debit' ? formatCurrency(row.amount) : '-';
        doc.text(debitVal, x + colW[2] - 1, y + 3.5, { align: 'right' });
        x += colW[2];

        // Credit
        const creditVal = row.tipe === 'credit' ? formatCurrency(row.amount) : '-';
        doc.text(creditVal, x + colW[3] - 1, y + 3.5, { align: 'right' });
        x += colW[3];

        // Saldo
        doc.setTextColor(0, 151, 167);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(row.saldo), x + colW[4] - 1, y + 3.5, { align: 'right' });
        doc.setTextColor(...DARK);
        doc.setFont('helvetica', 'normal');

        y += 5;
    });

    // Summary section
    y += 3;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.5);
    doc.line(ml, y, ml + cw, y);
    y += 4;

    doc.setFillColor(...LIGHT_TEAL);
    doc.rect(ml, y, cw, 4, 'F');
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    x = ml + 1;
    doc.text('SUMMARY', x, y + 2.5);
    x += colW[0] + colW[1];

    // Total Debit
    doc.text(formatCurrency(data.summary.total_debit), x + colW[2] - 1, y + 2.5, { align: 'right' });
    x += colW[2];

    // Total Credit
    doc.text(formatCurrency(data.summary.total_credit), x + colW[3] - 1, y + 2.5, { align: 'right' });
    x += colW[3];

    // Net Total
    doc.setTextColor(0, 151, 167);
    doc.text(formatCurrency(data.summary.net_total), x + colW[4] - 1, y + 2.5, { align: 'right' });

    return 'pdf-generated';
}

// Row Card Component
const RowCard = memo(({ item, index }: { item: DetailKomisi; index: number }) => {
    const isCredit = item.tipe === 'credit';

    return (
        <View style={styles.rowCard}>
            <View style={styles.rowContent}>
                <Text style={[styles.cellTanggal, styles.cellText]}>{item.tanggal}</Text>

                <Text style={[styles.cellKeterangan, styles.cellText]}>{item.type}</Text>

                <Text
                    style={[
                        styles.cellDebit,
                        styles.cellText,
                        !isCredit && styles.cellValueActive,
                    ]}
                >
                    {isCredit ? '-' : formatCurrency(item.amount)}
                </Text>

                <Text
                    style={[
                        styles.cellCredit,
                        styles.cellText,
                        isCredit && styles.cellValueActive,
                    ]}
                >
                    {isCredit ? formatCurrency(item.amount) : '-'}
                </Text>

                <Text style={[styles.cellSaldo, styles.cellText, styles.cellSaldoActive]}>
                    {formatCurrency(item.saldo)}
                </Text>
            </View>
        </View>
    );
});

RowCard.displayName = 'RowCard';

// Main Component
export default function ExportLaporanKomisiModal({
    visible,
    onClose,
    id_konsumen,
    startDate,
    endDate,
    courierName,
}: ExportLaporanKomisiModalProps) {
    const insets = useSafeAreaInsets();

    const [data, setData] = useState<RekapKomisiDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);

    // Fetch data dari API
    const fetchKomisiDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getRekapKomisiDetail(
                id_konsumen,
                startDate,
                endDate
            );

            if (response.success && response.data) {
                setData(response.data);
            } else {
                Alert.alert('Error', response.message || 'Gagal mengambil data komisi');
            }
        } catch (error: any) {
            console.error('Fetch komisi detail error:', error);
            Alert.alert('Error', 'Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    }, [id_konsumen, startDate, endDate]);

    useEffect(() => {
        if (visible) {
            fetchKomisiDetail();
        }
    }, [visible, fetchKomisiDetail]);

    const handleExportPdf = async () => {
        if (!data) return;

        try {
            setIsExportingPdf(true);

            // Try to load logo
            let logoDataUri: string | undefined;
            try {
                const asset = await Asset.fromModule(require('../assets/images/logo.png')).downloadAsync();
                if (asset.localUri) {
                    const b64 = await FileSystem.readAsStringAsync(asset.localUri, {
                        encoding: 'base64' as any,
                    });
                    logoDataUri = `data:image/png;base64,${b64}`;
                }
            } catch (_) {
                /* logo tidak tersedia */
            }

            await buildKomisiDetailPdf(data, startDate, endDate, courierName, logoDataUri);

            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { color: #0097A7; text-align: center; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                            th { background-color: #0097A7; color: white; font-weight: bold; }
                            .summary { background-color: #f0f0f0; font-weight: bold; }
                            .saldo-akhir { background-color: #e8f5e9; font-weight: bold; color: #0097A7; }
                            .debit { color: #d32f2f; }
                            .credit { color: #388e3c; }
                            .meta { margin: 10px 0; }
                            .meta-label { font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <h1>Laporan Mutasi Komisi</h1>
                        <div class="meta">
                            <span class="meta-label">Nama Kurir:</span> ${courierName || '-'}
                        </div>
                        <div class="meta">
                            <span class="meta-label">Periode:</span> ${startDate} s/d ${endDate}
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Keterangan</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.detail
                                    .map(
                                        (d) => `
                                    <tr>
                                        <td>${d.tanggal}</td>
                                        <td>${d.type}</td>
                                        <td class="debit">${d.tipe === 'debit' ? formatCurrency(d.amount) : '-'}</td>
                                        <td class="credit">${d.tipe === 'credit' ? formatCurrency(d.amount) : '-'}</td>
                                        <td><strong>${formatCurrency(d.saldo)}</strong></td>
                                    </tr>
                                `
                                    )
                                    .join('')}
                                <tr class="summary">
                                    <td colspan="2">SUMMARY</td>
                                    <td class="debit">${formatCurrency(data.summary.total_debit)}</td>
                                    <td class="credit">${formatCurrency(data.summary.total_credit)}</td>
                                    <td class="saldo-akhir">${formatCurrency(data.summary.net_total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Simpan / Bagikan Laporan PDF',
                });
            } else {
                Alert.alert('Info', 'Berbagi file tidak tersedia di perangkat ini');
            }
        } catch (e: any) {
            if (e?.message?.includes('User did not share') || e?.message?.includes('canceled')) return;
            console.error('Export PDF error:', e);
            Alert.alert('Gagal', 'Terjadi kesalahan saat membuat PDF.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportExcel = async () => {
        if (!data) return;

        try {
            setIsExportingExcel(true);
            const csv = buildKomisiDetailCsv(data, courierName);
            const fileName = `laporan-komisi-${Date.now()}.csv`;
            const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, csv, {
                encoding: 'utf8' as any,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Simpan / Buka di Excel',
                });
            } else {
                Alert.alert('Info', 'Berbagi file tidak tersedia di perangkat ini');
            }
        } catch (e: any) {
            if (e?.message?.includes('User did not share') || e?.message?.includes('canceled')) return;
            console.error('Export Excel error:', e);
            Alert.alert('Gagal', 'Terjadi kesalahan saat membuat file Excel.');
        } finally {
            setIsExportingExcel(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="chevron-down" size={24} color="#0097A7" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Export Laporan Komisi</Text>

                    <View style={styles.headerRight} />
                </View>

                {/* Loading State */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0097A7" />
                        <Text style={styles.loadingText}>Memuat data komisi...</Text>
                    </View>
                )}

                {/* Content */}
                {!loading && data && (
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={{
                            paddingBottom: Math.max(insets.bottom, 20) + 100,
                        }}
                    >
                        {/* Saldo Summary */}
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Saldo Awal</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(data.saldo_awal)}</Text>
                            </View>

                            <View style={[styles.summaryCard, styles.summaryCardActive]}>
                                <Text style={styles.summaryLabel}>Saldo Akhir</Text>
                                <Text style={[styles.summaryValue, styles.summaryValueActive]}>
                                    {formatCurrency(data.saldo_akhir)}
                                </Text>
                            </View>
                        </View>

                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.cellTanggal, styles.headerText]}>Tanggal</Text>
                            <Text style={[styles.cellKeterangan, styles.headerText]}>Keterangan</Text>
                            <Text style={[styles.cellDebit, styles.headerText]}>Debit</Text>
                            <Text style={[styles.cellCredit, styles.headerText]}>Credit</Text>
                            <Text style={[styles.cellSaldo, styles.headerText]}>Saldo</Text>
                        </View>

                        {/* Table Data */}
                        <FlatList
                            data={data.detail}
                            renderItem={({ item, index }) => <RowCard item={item} index={index} />}
                            keyExtractor={(_, i) => i.toString()}
                            scrollEnabled={false}
                        />

                        {/* Summary Footer */}
                        <View style={styles.footerSummary}>
                            <View style={styles.footerRow}>
                                <Text style={styles.footerLabel}>Total Credit</Text>
                                <Text style={styles.footerValue}>
                                    {formatCurrency(data.summary.total_credit)}
                                </Text>
                            </View>
                            <View style={styles.footerRow}>
                                <Text style={styles.footerLabel}>Total Debit</Text>
                                <Text style={styles.footerValue}>
                                    {formatCurrency(data.summary.total_debit)}
                                </Text>
                            </View>
                            <View style={[styles.footerRow, styles.footerRowNet]}>
                                <Text style={styles.footerLabelNet}>Net Total</Text>
                                <Text style={styles.footerValueNet}>
                                    {formatCurrency(data.summary.net_total)}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                )}

                {/* Export Buttons */}
                <View style={[styles.exportButtons, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={[styles.exportBtn, styles.exportBtnPdf]}
                        onPress={handleExportPdf}
                        disabled={isExportingPdf || loading}
                    >
                        {isExportingPdf ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="document-outline" size={18} color="#fff" />
                        )}
                        <Text style={styles.exportBtnText}>
                            {isExportingPdf ? 'Membuat PDF...' : 'Export PDF'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.exportBtn, styles.exportBtnExcel]}
                        onPress={handleExportExcel}
                        disabled={isExportingExcel || loading}
                    >
                        {isExportingExcel ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="grid-outline" size={18} color="#fff" />
                        )}
                        <Text style={styles.exportBtnText}>
                            {isExportingExcel ? 'Membuat Excel...' : 'Export Excel'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 16 : 12,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0097A7',
    },
    headerRight: {
        width: 32,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6c757d',
    },

    // Summary
    summaryBox: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0097A7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryCardActive: {
        borderLeftColor: '#28a745',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '500',
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    summaryValueActive: {
        color: '#28a745',
    },

    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0097A7',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 1,
    },
    headerText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 12,
    },

    rowCard: {
        backgroundColor: '#ffffff',
        marginBottom: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    rowContent: {
        flexDirection: 'row',
    },

    cellTanggal: {
        width: '15%',
    },
    cellKeterangan: {
        width: '25%',
    },
    cellDebit: {
        width: '20%',
        textAlign: 'right',
    },
    cellCredit: {
        width: '20%',
        textAlign: 'right',
    },
    cellSaldo: {
        width: '20%',
        textAlign: 'right',
    },

    cellText: {
        fontSize: 13,
        color: '#6c757d',
    },
    cellValueActive: {
        color: '#212529',
        fontWeight: '600',
    },
    cellSaldoActive: {
        color: '#0097A7',
        fontWeight: 'bold',
    },

    // Footer Summary
    footerSummary: {
        marginTop: 12,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    footerRowNet: {
        borderBottomWidth: 0,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#dee2e6',
        marginTop: 8,
        paddingBottom: 0,
    },
    footerLabel: {
        fontSize: 13,
        color: '#6c757d',
        fontWeight: '500',
    },
    footerLabelNet: {
        fontSize: 13,
        color: '#212529',
        fontWeight: '600',
    },
    footerValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#212529',
    },
    footerValueNet: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0097A7',
    },

    // Export Buttons
    exportButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
        backgroundColor: '#ffffff',
    },
    exportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        paddingVertical: 12,
        gap: 8,
    },
    exportBtnPdf: {
        backgroundColor: '#dc3545',
    },
    exportBtnExcel: {
        backgroundColor: '#28a745',
    },
    exportBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },
});
