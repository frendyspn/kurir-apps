/**
 * CONTOH IMPLEMENTASI UI - Rekap Komisi Detail
 * 
 * File ini adalah contoh component React Native yang menampilkan
 * detail komisi mirip dengan mutasi rekening bank
 */

import { apiService } from '@/services/api';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface DetailTransaksi {
  tanggal: string;
  tipe: 'credit' | 'debit';
  type: string;
  amount: number;
  saldo: number;
  created_at: string;
}

interface RekapKomisiDetailResponse {
  success: boolean;
  message: string;
  saldo_awal: number;
  detail: DetailTransaksi[];
  saldo_akhir: number;
  summary: {
    total_credit: number;
    total_debit: number;
    net_total: number;
  };
  jumlah_transaksi: number;
  period: {
    start_date: string;
    end_date: string;
  };
}

interface Props {
  id_konsumen: string | number;
  startDate: string;  // format Y-m-d
  endDate: string;    // format Y-m-d
}

export default function RekapKomisiDetailScreen({ id_konsumen, startDate, endDate }: Props) {
  const [data, setData] = useState<RekapKomisiDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getRekapKomisiDetail(
        id_konsumen,
        startDate,
        endDate
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Gagal mengambil data');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [id_konsumen, startDate, endDate]);

  // Load data saat screen muncul
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await apiService.getRekapKomisiDetail(
        id_konsumen,
        startDate,
        endDate
      );
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [id_konsumen, startDate, endDate]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Render detail item
  const renderDetailItem = ({ item }: { item: DetailTransaksi }) => (
    <View style={styles.detailRow}>
      {/* Tanggal */}
      <View style={styles.columnTanggal}>
        <Text style={styles.tanggalText}>{item.tanggal}</Text>
      </View>

      {/* Type */}
      <View style={styles.columnType}>
        <Text style={styles.typeText}>{item.type}</Text>
      </View>

      {/* Amount */}
      <View
        style={[
          styles.columnAmount,
          item.tipe === 'credit' ? styles.creditBg : styles.debitBg,
        ]}
      >
        <Text
          style={[
            styles.amountText,
            item.tipe === 'credit' ? styles.creditText : styles.debitText,
          ]}
        >
          {item.tipe === 'credit' ? '+' : '-'} {formatCurrency(item.amount)}
        </Text>
      </View>

      {/* Saldo Running */}
      <View style={styles.columnSaldo}>
        <Text style={styles.saldoText}>{formatCurrency(item.saldo)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0097A7" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Tidak ada data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Mutasi Komisi</Text>
        <Text style={styles.periodText}>
          {data.period.start_date} s/d {data.period.end_date}
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Saldo Section */}
        <View style={styles.saldoSection}>
          {/* Saldo Awal */}
          <View style={styles.saldoCard}>
            <Text style={styles.saldoLabel}>Saldo Awal</Text>
            <Text style={styles.saldoValue}>
              {formatCurrency(data.saldo_awal)}
            </Text>
          </View>

          {/* Saldo Akhir */}
          <View style={[styles.saldoCard, styles.saldoAkhir]}>
            <Text style={styles.saldoLabel}>Saldo Akhir</Text>
            <Text style={styles.saldoValue}>
              {formatCurrency(data.saldo_akhir)}
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Masuk (Credit)</Text>
            <Text style={[styles.summaryValue, styles.creditText]}>
              +{formatCurrency(data.summary.total_credit)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Keluar (Debit)</Text>
            <Text style={[styles.summaryValue, styles.debitText]}>
              -{formatCurrency(data.summary.total_debit)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowNet]}>
            <Text style={styles.summaryLabelNet}>Net Total</Text>
            <Text style={[styles.summaryValueNet]}>
              {data.summary.net_total >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(data.summary.net_total))}
            </Text>
          </View>
        </View>

        {/* Detail List Header */}
        <View style={styles.tableHeader}>
          <View style={styles.columnTanggal}>
            <Text style={styles.headerText}>Tanggal</Text>
          </View>
          <View style={styles.columnType}>
            <Text style={styles.headerText}>Kategori</Text>
          </View>
          <View style={styles.columnAmount}>
            <Text style={styles.headerText}>Jumlah</Text>
          </View>
          <View style={styles.columnSaldo}>
            <Text style={styles.headerText}>Saldo</Text>
          </View>
        </View>

        {/* Detail List */}
        <FlatList
          data={data.detail}
          renderItem={renderDetailItem}
          keyExtractor={(item, index) => `${item.tanggal}-${index}`}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />

        {/* Empty State */}
        {data.detail.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Tidak ada transaksi pada periode ini
            </Text>
          </View>
        )}

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Total Transaksi: {data.jumlah_transaksi}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },

  // Header
  headerSection: {
    backgroundColor: '#0097A7',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  periodText: {
    fontSize: 13,
    color: '#b3e5fc',
  },

  // Saldo Section
  saldoSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  saldoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#0097A7',
  },
  saldoAkhir: {
    borderLeftColor: '#28a745',
  },
  saldoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 8,
  },
  saldoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },

  // Summary Section
  summarySection: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryRowNet: {
    borderBottomWidth: 0,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#dee2e6',
    marginTop: 4,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    marginHorizontal: -8,
    paddingRight: 16,
    paddingLeft: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  summaryLabelNet: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryValueNet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },

  // Detail Row
  detailRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },

  columnTanggal: {
    width: '20%',
  },
  tanggalText: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '500',
  },

  columnType: {
    width: '20%',
  },
  typeText: {
    fontSize: 12,
    color: '#6c757d',
  },

  columnAmount: {
    width: '30%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  creditBg: {
    backgroundColor: '#d1e7dd',
  },
  debitBg: {
    backgroundColor: '#f8d7da',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  creditText: {
    color: '#0f5132',
  },
  debitText: {
    color: '#842029',
  },

  columnSaldo: {
    width: '30%',
    alignItems: 'flex-end',
  },
  saldoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0097A7',
  },

  // Empty State
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },

  // Footer
  footerInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
});
