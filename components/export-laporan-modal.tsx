import { apiService } from '@/services/api';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PDF_LOGO_BASE64 } from '@/constants/pdf-logo-base64';
import { memo, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DetailKomisi {
    tanggal: string;
    tipe: 'credit' | 'debit';
    type: string;
    amount: number;
    saldo: number;
    created_at: string;
    kode_order?: string | number;
    source_id?: string | number;
}

interface OrderGroup {
    kode_order: string | number;
    items: DetailKomisi[];
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

interface ExportLaporanModalProps {
    visible: boolean;
    onClose: () => void;
    id_konsumen: string | number;
    startDate: string;
    endDate: string;
    courierName?: string;
}


// ─── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseInt(amount) || 0 : amount || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);
}

function formatDate(dateString: string): string {
    if (!dateString) return '-';
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

function groupByKodeOrder(details: DetailKomisi[]): OrderGroup[] {
    const grouped: { [key: string | number]: DetailKomisi[] } = {};

    details.forEach((item) => {
        const key = item.kode_order || 'unknown';
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });

    return Object.entries(grouped).map(([kode_order, items]) => ({
        kode_order: kode_order === 'unknown' ? kode_order : kode_order,
        items,
    }));
}

function getUiPendapatan(item: DetailKomisi): number {
    return item.tipe === 'debit' ? item.amount : 0;
}

function getUiPotongan(item: DetailKomisi): number {
    return item.tipe === 'credit' ? item.amount : 0;
}

function getPdfLogoSrc(): string {
    return `data:image/png;base64,${PDF_LOGO_BASE64}`;
}

// ─── CSV Builder ────────────────────────────────────────────────────────────
function buildKomisiDetailCsv(data: RekapKomisiDetail, courierName?: string): string {
    const { detail, summary, period } = data;
    const netTotalUi = (summary.total_debit || 0) - (summary.total_credit || 0);
    const grouped = groupByKodeOrder(detail);

    const headers = [
        'Tanggal',
        'Keterangan',
        'Pendapatan (IDR)',
        'Potongan (IDR)',
    ].join(';');

    const escapeCell = (val: string | number | undefined) => {
        const s = String(val ?? '-').replace(/"/g, '""');
        return `"${s}"`;
    };

    const groupRows = grouped
        .map((group) => {
            const totalPendapatan = group.items.reduce((sum, item) => sum + getUiPendapatan(item), 0);
            const totalPotongan = group.items.reduce((sum, item) => sum + getUiPotongan(item), 0);
            const selisihGroup = totalPendapatan - totalPotongan;

            const detailRows = group.items
                .map((r) => [
                    escapeCell(r.tanggal),
                    escapeCell(r.type),
                    getUiPendapatan(r),
                    getUiPotongan(r),
                ].join(';'))
                .join('\n');

            return [
                `${escapeCell('Kode Transaksi')};${escapeCell(group.kode_order)};${escapeCell('Selisih')};${selisihGroup}`,
                headers,
                detailRows,
                '',
            ].join('\n');
        })
        .join('\n');

    // Summary section
    const summaryRows = [
        escapeCell('LAPORAN MUTASI PENDAPATAN'),
        `${escapeCell('Nama Kurir')};${escapeCell(courierName || '-')}`,
        `${escapeCell('Periode')};${escapeCell(`${period.start_date} s/d ${period.end_date}`)}`,
        '',
        groupRows,
        '',
        escapeCell('SUMMARY'),
        `${escapeCell('Total Pendapatan')};${summary.total_debit}`,
        `${escapeCell('Total Potongan')};${summary.total_credit}`,
        `${escapeCell('Selisih')};${netTotalUi}`,
    ].join('\n');

    return `sep=;\n${summaryRows}`;
}

// ─── PDF Builder ────────────────────────────────────────────────────────────
async function buildKomisiDetailPdf(
    data: RekapKomisiDetail,
    startDate: string,
    endDate: string,
    courierName?: string,
): Promise<void> {
    const periodLabel = `${startDate} s/d ${endDate}`;
    const netTotalUi = (data.summary.total_debit || 0) - (data.summary.total_credit || 0);
    const logoSrc = getPdfLogoSrc();
    const grouped = groupByKodeOrder(data.detail);

    const tableRows = grouped.map((group) => {
        const totalPendapatan = group.items.reduce((sum, item) => sum + getUiPendapatan(item), 0);
        const totalPotongan = group.items.reduce((sum, item) => sum + getUiPotongan(item), 0);
        const selisihGroup = totalPendapatan - totalPotongan;

        const rows = group.items.map((d) => `
            <tr>
                <td>${d.tanggal}</td>
                <td>${d.type}</td>
                <td class="debit">${getUiPendapatan(d) > 0 ? formatCurrency(getUiPendapatan(d)) : '-'}</td>
                <td class="credit">${getUiPotongan(d) > 0 ? formatCurrency(getUiPotongan(d)) : '-'}</td>
            </tr>
        `).join('');

        return `
            <tr class="group-header-row">
                <td colspan="4">
                    <span><strong>Kode Transaksi:</strong> ${group.kode_order}</span>
                    <span><strong>Selisih:</strong> ${formatCurrency(selisihGroup)}</span>
                </td>
            </tr>
            ${rows}
        `;
    }).join('');

    const html = `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #212529;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #0097A7;
                        padding-bottom: 15px;
                    }
                    .header h1 {
                        color: #0097A7;
                        margin: 0 0 10px 0;
                    }
                    .logo {
                        width: 220px;
                        height: auto;
                        display: block;
                        margin: 0 auto 10px auto;
                    }
                    .meta {
                        margin: 5px 0;
                        font-size: 13px;
                    }
                    .meta-label {
                        font-weight: bold;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        margin-bottom: 20px;
                    }
                    th {
                        background-color: #0097A7;
                        color: white;
                        padding: 10px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #0097A7;
                    }
                    td {
                        padding: 10px;
                        border: 1px solid #dee2e6;
                    }
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    .debit {
                        text-align: right;
                        color: #388e3c;
                        font-weight: 600;
                    }
                    .credit {
                        text-align: right;
                        color: #d32f2f;
                        font-weight: 600;
                    }
                    tr:last-child td {
                        background-color: #e8f5e9;
                        font-weight: bold;
                        color: #0097A7;
                    }
                    .summary {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        margin-top: 20px;
                        padding: 15px;
                        border: 1px solid #dee2e6;
                        border-radius: 5px;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .group-header-row td {
                        background-color: #eef6ff;
                        border-left: 4px solid #0097A7;
                        font-size: 12px;
                        font-weight: 700;
                        color: #0b5e6b;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="Logo" />` : ''}
                    <h1>Laporan Mutasi Pendapatan</h1>
                    <div class="meta"><span class="meta-label">Nama Kurir:</span> ${courierName || '-'}</div>
                    <div class="meta"><span class="meta-label">Periode:</span> ${periodLabel}</div>
                    <div class="meta"><span class="meta-label">Saldo Awal:</span> ${formatCurrency(data.saldo_awal)}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Keterangan</th>
                            <th>Pendapatan</th>
                            <th>Potongan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-row">
                        <span>Total Pendapatan:</span>
                        <span>${formatCurrency(data.summary.total_credit)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Potongan:</span>
                        <span>${formatCurrency(data.summary.total_debit)}</span>
                    </div>
                    <div class="summary-row">
                        <span style="color: #0097A7; font-size: 16px;">Selisih:</span>
                        <span style="color: #0097A7; font-size: 16px;">${formatCurrency(netTotalUi)}</span>
                    </div>
                </div>
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
}


// ─── Order Group Header Component ───────────────────────────────────────────
const OrderGroupHeader = memo(({ kodeOrder }: { kodeOrder: string | number }) => (
    <View style={styles.orderGroupHeader}>
        <Text style={styles.orderGroupHeaderText}>Order #{kodeOrder}</Text>
    </View>
));

OrderGroupHeader.displayName = 'OrderGroupHeader';

// ─── Order Group Rows Component ─────────────────────────────────────────────
const OrderGroupRows = memo(({ group }: { group: OrderGroup }) => (
    <>
        <OrderGroupHeader kodeOrder={group.kode_order} />
        {group.items.map((item, idx) => (
            <RowCard key={`${group.kode_order}-${idx}`} item={item} index={idx} />
        ))}
    </>
));

OrderGroupRows.displayName = 'OrderGroupRows';

// ─── Row Card Component ──────────────────────────────────────────────────────
const RowCard = memo(({ item, index }: { item: DetailKomisi; index: number }) => {
    const isUiCredit = item.tipe === 'debit';

    return (
        <View style={styles.rowCard}>
            <View style={styles.rowContent}>
                <Text style={[styles.cellTanggal, styles.cellText]}>{item.tanggal}</Text>

                <Text style={[styles.cellKeterangan, styles.cellText]} numberOfLines={1}>
                    {item.type}
                </Text>

                <Text style={[styles.cellDebit, styles.cellText, isUiCredit && styles.debitValueActive]}>
                    {isUiCredit ? formatCurrency(item.amount) : '-'}
                </Text>

                <Text style={[styles.cellCredit, styles.cellText, !isUiCredit && styles.creditValueActive]}>
                    {!isUiCredit ? formatCurrency(item.amount) : '-'}
                </Text>
            </View>
        </View>
    );
});

RowCard.displayName = 'RowCard';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ExportLaporanModal({
    visible,
    onClose,
    id_konsumen,
    startDate,
    endDate,
    courierName,
}: ExportLaporanModalProps) {
    const insets = useSafeAreaInsets();

    const [data, setData] = useState<RekapKomisiDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const totalUiDebit = data?.summary?.total_credit || 0;
    const totalUiCredit = data?.summary?.total_debit || 0;
    const totalSelisih = totalUiDebit - totalUiCredit;

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
            await buildKomisiDetailPdf(data, startDate, endDate, courierName);
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
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#000000aa' }}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Laporan Komisi</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.content}>
                            <View style={styles.centeredView}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Mengambil data...</Text>
                            </View>
                        </View>
                    ) : !data || !data.detail || data.detail.length === 0 ? (
                        <View style={styles.content}>
                            <View style={styles.centeredView}>
                                <Text style={styles.emptyText}>Tidak ada data komisi</Text>
                            </View>
                        </View>
                    ) : (
                        <ScrollView style={styles.content} contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator>
                            {/* Summary Info */}
                            <View style={styles.summaryContainer}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Total Pendapatan</Text>
                                    <Text style={[styles.summaryValue, styles.debitValue]}>
                                        {formatCurrency(totalUiDebit)}
                                    </Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Total Potongan</Text>
                                    <Text style={[styles.summaryValue, styles.creditValue]}>
                                        {formatCurrency(totalUiCredit)}
                                    </Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Selisih</Text>
                                    <Text style={[styles.summaryValue, styles.saldoValue]}>
                                        {formatCurrency(totalSelisih)}
                                    </Text>
                                </View>
                            </View>

                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.headerCell, styles.cellTanggal]}>Tanggal</Text>
                                <Text style={[styles.headerCell, styles.cellKeterangan]}>Keterangan</Text>
                                <Text style={[styles.headerCell, styles.cellDebit]}>Pendapatan</Text>
                                <Text style={[styles.headerCell, styles.cellCredit]}>Potongan</Text>
                            </View>

                            {/* Table Body */}
                            <View>
                                {groupByKodeOrder(data.detail).map((group) => (
                                    <OrderGroupRows key={String(group.kode_order)} group={group} />
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {/* Footer Buttons */}
                    {data && data.detail && data.detail.length > 0 && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary, isExportingPdf && styles.buttonDisabled]}
                                onPress={handleExportPdf}
                                disabled={isExportingPdf || isExportingExcel || loading}
                                activeOpacity={0.7}
                            >
                                {isExportingPdf ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>📄 Export PDF</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.buttonSuccess, isExportingExcel && styles.buttonDisabled]}
                                onPress={handleExportExcel}
                                disabled={isExportingPdf || isExportingExcel || loading}
                                activeOpacity={0.7}
                            >
                                {isExportingExcel ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>📊 Export Excel</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#666666',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    contentScroll: {
        paddingBottom: 12,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666666',
    },

    // Summary
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    summaryItem: {
        flexGrow: 1,
        flexBasis: '30%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#666666',
        fontWeight: '500',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#212529',
    },
    debitValue: {
        color: '#28a745',
    },
    creditValue: {
        color: '#dc3545',
    },
    saldoValue: {
        color: '#0097A7',
    },

    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0097A7',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginBottom: 1,
    },
    headerCell: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 11,
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
        width: '20%',
    },
    cellKeterangan: {
        width: '30%',
    },
    cellDebit: {
        width: '25%',
        textAlign: 'right',
    },
    cellCredit: {
        width: '25%',
        textAlign: 'right',
    },

    cellText: {
        fontSize: 12,
        color: '#666666',
    },
    debitValueActive: {
        color: '#28a745',
        fontWeight: '600',
    },
    creditValueActive: {
        color: '#dc3545',
        fontWeight: '600',
    },
    cellSaldoActive: {
        color: '#0097A7',
        fontWeight: 'bold',
    },

    // Order Group
    orderGroupHeader: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#0097A7',
        marginTop: 8,
        marginBottom: 1,
    },
    orderGroupHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0097A7',
    },

    // Footer Buttons
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        backgroundColor: '#ffffff',
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#dc3545',
    },
    buttonSuccess: {
        backgroundColor: '#28a745',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },

    // Empty state
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#999999',
    },
});
