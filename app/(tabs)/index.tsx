import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Clipboard, Image, Linking, Share as NativeShare, PermissionsAndroid, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Badge from '../../components/badge';
import JenisOrderChart from '../../components/charts/jenis-order-chart';
import OrderChart from '../../components/charts/order-chart';
import PendapatanChart from '../../components/charts/pendapatan-chart';
import DatePickerInput from '../../components/date-picker-input';
import FilterChip from '../../components/filter-chip';
import GlassBackground from '../../components/glass-background';
import InfoCard from '../../components/info-card';
import { APP_NAME } from '../../constant';
import { AuthColors } from '../../constants/theme';
import { apiService } from '../../services/api';
import socketService from '../../services/socket';
import { notificationEvents } from '../../utils/notificationEvents'; // sesuaikan path



function HomeScreen() {
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [listNotif, setListNotif] = useState<any[]>([]);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const insets = useSafeAreaInsets();
    const [saldo, setSaldo] = useState(0);
    const [showSaldo, setShowSaldo] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [acceptedOrders, setAcceptedOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('semua');
    const [statsSummary, setStatsSummary] = useState({
        pesananToday: 0,
        pesananMonth: 0,
        pesananAllDates: 0,
        omsetToday: 0,
        omsetMonth: 0,
        omsetAllDates: 0,
        pendapatanToday: 0,
        pendapatanMonth: 0,
        pendapatanAllDates: 0,
        komisiToday: 0,
        komisiMonth: 0,
        komisiAllDates: 0,
        pelangganBaruToday: 0,
        pelangganBaruMonth: 0,
        pelangganBaruAllDates: 0,
        waktuOnlineMinutesToday: 0,
        waktuOnlineMinutesMonth: 0,
        waktuOnlineMinutesAllDates: 0,
    });
    const [showExportModal, setShowExportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isCopyingDailyRecap, setIsCopyingDailyRecap] = useState(false);

    const getStartOfMonth = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    };

    const [exportStartDate, setExportStartDate] = useState<Date>(getStartOfMonth());
    const [exportEndDate, setExportEndDate] = useState<Date>(new Date());
    const [shareStartDate, setShareStartDate] = useState<Date>(getStartOfMonth());
    const [shareEndDate, setShareEndDate] = useState<Date>(new Date());

    const [isOnline, setIsOnline] = useState(false);
    const [togglingOnline, setTogglingOnline] = useState(false);
    const toggleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Animate toggle knob
    useEffect(() => {
        Animated.spring(toggleAnim, {
            toValue: isOnline ? 1 : 0,
            useNativeDriver: false,
            speed: 20,
            bounciness: 6,
        }).start();
    }, [isOnline]);

    // Pulse animation when online
    useEffect(() => {
        let loop: Animated.CompositeAnimation;
        if (isOnline) {
            loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.35, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            );
            loop.start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => loop?.stop();
    }, [isOnline]);

    const handleToggleOnline = useCallback(async () => {
        if (togglingOnline || !userData?.no_hp) return;
        const next = !isOnline;
        setTogglingOnline(true);
        try {
            await apiService.updateStatusOnline(userData.no_hp, next ? 1 : 0);
            setIsOnline(next);
            const stored = await AsyncStorage.getItem('userData');
            if (stored) {
                const parsed = JSON.parse(stored);
                await AsyncStorage.setItem('userData', JSON.stringify({ ...parsed, is_online: next ? 1 : 0 }));
            }
        } catch (_) {
            // Tetap toggle UI walau API belum ada
            setIsOnline(next);
        } finally {
            setTogglingOnline(false);
        }
    }, [isOnline, togglingOnline, userData]);

    // Data grafik pendapatan per jam (TODO: Get from API)
    const [pendapatanData, setPendapatanData] = useState({
        labels: [],
        datasets: [{
            data: []
        }]
    });

    // Data grafik total order per jam (TODO: Get from API)
    const [orderData, setOrderData] = useState({
        labels: [],
        datasets: [{
            data: []
        }]
    });

    // Fetch jumlah notifikasi belum dibaca
    const fetchUnreadNotifCount = async (id_konsumen: string) => {
        try {
            // Pastikan userData sudah ada dan punya id_konsumen
            // if (!userData?.id_konsumen) {console.log('userData or id_konsumen is missing'); return;}
            console.log('Fetching unread notification count for user ID:', id_konsumen);
            const response = await apiService.getNotification(id_konsumen);
            console.log('INI NOTIF')
            console.log(response.data)
            if (response.success && response.data) {
                // Asumsikan response.data.unread_count adalah jumlah notif belum dibaca
                setUnreadNotifCount(response.data?.data?.notifications_new || 0);
                setListNotif(response.data?.data?.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching unread notification count:', error);
        }
    };

    useEffect(() => {
        // fetchUnreadNotifCount();
    }, []);

    // Data grafik pie jenis order
    const [jenisOrderData, setJenisOrderData] = useState([]);

    // Fetch user data from AsyncStorage
    const fetchUserData = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                let parsedData = JSON.parse(data);
                console.log('🔍 USER DATA FROM ASYNCSTORAGE:', parsedData);
                console.log('🔍 USER ROLE:', parsedData.role);
                console.log('🔍 USER AGEN:', parsedData.agen);
                console.log('🔍 USER NO_HP:', parsedData.no_hp);
                console.log('🔍 USER NAME:', parsedData.name);

                // Fetch latest sopir status from API
                try {
                    const statusRes = await apiService.cekStatusSopir(parsedData.no_hp);
                    if (statusRes.success && statusRes.data) {
                        // Merge status data into userData
                        parsedData = { ...parsedData, ...statusRes.data.data };
                        // Save updated userData to AsyncStorage
                        await AsyncStorage.setItem('userData', JSON.stringify(parsedData));
                        console.log('✅ Updated userData with sopir status:', parsedData);
                    }
                } catch (err) {
                    console.error('❌ Error fetching sopir status:', err);
                }

                setUserData(parsedData);
                // Set initial online status from stored/api data
                setIsOnline(parsedData.is_online === 1 || parsedData.is_online === '1' || parsedData.is_online === true);
                // Fetch balance after getting user data
                await fetchBalance(parsedData.no_hp);
                await fetchPendapatan(parsedData.no_hp);
                await fetchStatsSummary(parsedData.no_hp, selectedFilter);
                await fetchUnreadNotifCount(parsedData.id_konsumen);
            } else {
                console.log('❌ NO USER DATA FOUND IN ASYNCSTORAGE');
            }
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
        }
    };    // Fetch balance from API
    const fetchBalance = async (phoneNumber: string) => {
        try {
            const response = await apiService.getBalance(phoneNumber);
            if (response.success && response.data) {
                setSaldo(response.data.balance || 0);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const fetchPendapatan = async (phoneNumber: string, type?: string) => {
        const date = new Date();
        try {
            const response = await apiService.getPendapatanDaily(phoneNumber, date.toLocaleDateString('sv-SE'), type);
            if (response.success && response.data) {
                console.log(response.data?.data?.pendapatan);
                setPendapatanData(response.data?.data?.pendapatan);
                setOrderData(response.data?.data?.orders);

                // Set jenis order data from API
                if (response.data?.data?.jenis_order) {
                    setJenisOrderData(response.data.data.jenis_order);
                }
            }
        } catch (error) {
            console.error('Error fetching pendapatan:', error);
        }
    };

    const toNumber = useCallback((value: any): number => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const normalized = value.replace(/[^0-9,-.]/g, '').replace(',', '.');
            const parsed = Number(normalized);
            return Number.isFinite(parsed) ? parsed : 0;
        }

        return 0;
    }, []);

    const getPendapatanFromPayload = useCallback((payload: any): number => {
        const directCandidates = [
            payload?.data?.pendapatan_total,
            payload?.data?.total_pendapatan,
            payload?.data?.omset,
            payload?.data?.total_omset,
            payload?.data?.summary?.pendapatan,
            payload?.data?.summary?.total_pendapatan,
            payload?.data?.summary?.omset,
            payload?.data?.summary?.total_omset,
            payload?.pendapatan_total,
            payload?.total_pendapatan,
            payload?.omset,
            payload?.total_omset,
        ];

        for (const candidate of directCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return value;
            }
        }

        const points = payload?.data?.pendapatan?.datasets?.[0]?.data || payload?.pendapatan?.datasets?.[0]?.data;
        if (Array.isArray(points)) {
            return points.reduce((sum: number, point: any) => sum + toNumber(point), 0);
        }

        return 0;
    }, [toNumber]);

    const getFeeFromPayload = useCallback((payload: any): number => {
        const directCandidates = [
            payload?.data?.fee,
            payload?.data?.total_fee,
            payload?.data?.potongan,
            payload?.data?.potongan_admin,
            payload?.data?.summary?.fee,
            payload?.data?.summary?.total_fee,
            payload?.fee,
            payload?.total_fee,
            payload?.potongan,
        ];

        for (const candidate of directCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return value;
            }
        }

        return 0;
    }, [toNumber]);

    const getPendapatanBersihFromPayload = useCallback((payload: any): number => {
        const directCandidates = [
            payload?.data?.pendapatan_bersih,
            payload?.data?.total_pendapatan_bersih,
            payload?.data?.pendapatan_net,
            payload?.data?.total_pendapatan_net,
            payload?.data?.summary?.pendapatan_bersih,
            payload?.data?.summary?.pendapatan_net,
            payload?.pendapatan_bersih,
            payload?.total_pendapatan_bersih,
            payload?.pendapatan_net,
            payload?.total_pendapatan_net,
        ];

        for (const candidate of directCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return value;
            }
        }

        const omset = getPendapatanFromPayload(payload);
        const fee = getFeeFromPayload(payload);

        if (fee > 0) {
            return Math.max(0, omset - fee);
        }

        const komisiFallbackCandidates = [
            payload?.data?.komisi,
            payload?.data?.total_komisi,
            payload?.data?.komisi_total,
            payload?.data?.summary?.komisi,
            payload?.data?.summary?.total_komisi,
            payload?.komisi,
            payload?.total_komisi,
            payload?.komisi_total,
        ];

        for (const candidate of komisiFallbackCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return value;
            }
        }

        return omset;
    }, [getFeeFromPayload, getPendapatanFromPayload, toNumber]);

    const getKomisiFromPayload = useCallback((payload: any): number => {
        const directCandidates = [
            payload?.data?.komisi,
            payload?.data?.total_komisi,
            payload?.data?.komisi_total,
            payload?.data?.summary?.komisi,
            payload?.data?.summary?.total_komisi,
            payload?.komisi,
            payload?.total_komisi,
            payload?.komisi_total,
        ];

        for (const candidate of directCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return value;
            }
        }

        return 0;
    }, [toNumber]);

    const getPelangganBaruFromPayload = useCallback((payload: any): number => {
        const directCandidates = [
            payload?.data?.pelanggan_baru,
            payload?.data?.total_pelanggan_baru,
            payload?.data?.jumlah_pelanggan_baru,
            payload?.data?.new_customers,
            payload?.data?.summary?.pelanggan_baru,
            payload?.data?.summary?.new_customers,
            payload?.pelanggan_baru,
            payload?.total_pelanggan_baru,
            payload?.new_customers,
        ];

        for (const candidate of directCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return Math.round(value);
            }
        }

        return 0;
    }, [toNumber]);

    const getOrderCountFromPayload = useCallback((payload: any): number => {
        const directCandidates = [
            payload?.data?.orders_count,
            payload?.data?.total_orders,
            payload?.data?.total_order,
            payload?.data?.jumlah_order,
            payload?.data?.summary?.orders_count,
            payload?.data?.summary?.total_orders,
            payload?.orders_count,
            payload?.total_orders,
            payload?.total_order,
        ];

        for (const candidate of directCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return Math.round(value);
            }
        }

        const points = payload?.data?.orders?.datasets?.[0]?.data || payload?.orders?.datasets?.[0]?.data;
        if (Array.isArray(points)) {
            return Math.round(points.reduce((sum: number, point: any) => sum + toNumber(point), 0));
        }

        return 0;
    }, [toNumber]);

    const parseDurationStringToMinutes = useCallback((value: string): number => {
        if (!value) return 0;

        const hhmmss = value.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
        if (hhmmss) {
            const hours = toNumber(hhmmss[1]);
            const minutes = toNumber(hhmmss[2]);
            const seconds = toNumber(hhmmss[3] || 0);
            return Math.round((hours * 60) + minutes + (seconds / 60));
        }

        return 0;
    }, [toNumber]);

    const getOnlineMinutesFromPayload = useCallback((payload: any): number => {
        const minutesCandidates = [
            payload?.online_minutes,
            payload?.total_online_minutes,
            payload?.waktu_online_menit,
            payload?.duration_minutes,
            payload?.summary?.online_minutes,
            payload?.summary?.total_online_minutes,
            payload?.data?.online_minutes,
            payload?.data?.total_online_minutes,
            payload?.data?.waktu_online_menit,
            payload?.data?.duration_minutes,
        ];

        for (const candidate of minutesCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return Math.round(value);
            }
        }

        const secondsCandidates = [
            payload?.online_seconds,
            payload?.total_online_seconds,
            payload?.duration_seconds,
            payload?.data?.online_seconds,
            payload?.data?.total_online_seconds,
            payload?.data?.duration_seconds,
        ];

        for (const candidate of secondsCandidates) {
            const value = toNumber(candidate);
            if (value > 0) {
                return Math.round(value / 60);
            }
        }

        const durationTextCandidates = [
            payload?.durasi,
            payload?.duration,
            payload?.waktu_online,
            payload?.data?.durasi,
            payload?.data?.duration,
            payload?.data?.waktu_online,
        ];

        for (const candidate of durationTextCandidates) {
            if (typeof candidate === 'string') {
                const parsed = parseDurationStringToMinutes(candidate);
                if (parsed > 0) {
                    return parsed;
                }
            }
        }

        return 0;
    }, [parseDurationStringToMinutes, toNumber]);

    const fetchStatsSummary = useCallback(async (phoneNumber: string, type: string = 'semua') => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yearStr = today.getFullYear().toString();
        const monthStr = String(today.getMonth() + 1).padStart(2, '0');

        const emptySummary = {
            pesananToday: 0,
            pesananMonth: 0,
            pesananAllDates: 0,
            omsetToday: 0,
            omsetMonth: 0,
            omsetAllDates: 0,
            pendapatanToday: 0,
            pendapatanMonth: 0,
            pendapatanAllDates: 0,
            komisiToday: 0,
            komisiMonth: 0,
            komisiAllDates: 0,
            pelangganBaruToday: 0,
            pelangganBaruMonth: 0,
            pelangganBaruAllDates: 0,
            waktuOnlineMinutesToday: 0,
            waktuOnlineMinutesMonth: 0,
            waktuOnlineMinutesAllDates: 0,
        };

        try {
            const statistikRes = await apiService.getStatistikRingkas(phoneNumber, type);
            const summaryData = statistikRes?.data?.data || statistikRes?.data?.summary || null;

            if (statistikRes?.success && summaryData) {
                const mappedSummary = {
                    pesananToday: Math.round(toNumber(summaryData.pesananToday ?? summaryData.ordersToday ?? summaryData.orders_today)),
                    pesananMonth: Math.round(toNumber(summaryData.pesananMonth ?? summaryData.ordersMonth ?? summaryData.orders_month)),
                    pesananAllDates: Math.round(toNumber(summaryData.pesananAllDates ?? summaryData.ordersAllDates ?? summaryData.orders_total)),
                    omsetToday: toNumber(summaryData.omsetToday ?? summaryData.pendapatanToday ?? summaryData.pendapatan_today),
                    omsetMonth: toNumber(summaryData.omsetMonth ?? summaryData.pendapatanMonth ?? summaryData.pendapatan_month),
                    omsetAllDates: toNumber(summaryData.omsetAllDates ?? summaryData.pendapatanAllDates ?? summaryData.pendapatan_total),
                    pendapatanToday: toNumber(summaryData.pendapatanToday ?? summaryData.pendapatanBersihToday ?? summaryData.pendapatan_bersih_today),
                    pendapatanMonth: toNumber(summaryData.pendapatanMonth ?? summaryData.pendapatanBersihMonth ?? summaryData.pendapatan_bersih_month),
                    pendapatanAllDates: toNumber(summaryData.pendapatanAllDates ?? summaryData.pendapatanBersihAllDates ?? summaryData.pendapatan_bersih_total),
                    komisiToday: toNumber(summaryData.komisiToday ?? summaryData.komisi_today),
                    komisiMonth: toNumber(summaryData.komisiMonth ?? summaryData.komisi_month),
                    komisiAllDates: toNumber(summaryData.komisiAllDates ?? summaryData.komisi_total),
                    pelangganBaruToday: Math.round(toNumber(summaryData.pelangganBaruToday ?? summaryData.pelangganToday ?? summaryData.pelanggan_today)),
                    pelangganBaruMonth: Math.round(toNumber(summaryData.pelangganBaruMonth ?? summaryData.pelangganMonth ?? summaryData.pelanggan_month)),
                    pelangganBaruAllDates: Math.round(toNumber(summaryData.pelangganBaruAllDates ?? summaryData.pelangganAllDates ?? summaryData.pelanggan_total)),
                    waktuOnlineMinutesToday: Math.round(toNumber(summaryData.waktuOnlineMinutesToday ?? summaryData.online_minutes_today)),
                    waktuOnlineMinutesMonth: Math.round(toNumber(summaryData.waktuOnlineMinutesMonth ?? summaryData.online_minutes_month)),
                    waktuOnlineMinutesAllDates: Math.round(toNumber(summaryData.waktuOnlineMinutesAllDates ?? summaryData.online_minutes_total)),
                };

                const hasStatValue = Object.values(mappedSummary).some(value => value > 0);
                if (hasStatValue) {
                    setStatsSummary(mappedSummary);
                    return;
                }
            }
        } catch (error) {
            console.log('Statistik ringkas endpoint belum siap, fallback ke endpoint lama');
        }

        try {
            const [dailySettle, monthlySettle, allSettle] = await Promise.allSettled([
                apiService.getPendapatanDaily(phoneNumber, todayStr, type),
                apiService.getPendapatanMonthly(phoneNumber, yearStr, monthStr, type),
                apiService.getPendapatanCustom(phoneNumber, '2000-01-01', todayStr, type),
            ]);

            const dailyRes = dailySettle.status === 'fulfilled' ? dailySettle.value : null;
            const monthlyRes = monthlySettle.status === 'fulfilled' ? monthlySettle.value : null;
            const allRes = allSettle.status === 'fulfilled' ? allSettle.value : null;
            const todayOnlineMinutes = dailyRes?.success ? getOnlineMinutesFromPayload(dailyRes) : 0;
            const monthOnlineMinutes = monthlyRes?.success ? getOnlineMinutesFromPayload(monthlyRes) : 0;
            const allOnlineMinutes = allRes?.success ? getOnlineMinutesFromPayload(allRes) : 0;

            setStatsSummary({
                pesananToday: dailyRes?.success ? getOrderCountFromPayload(dailyRes) : 0,
                pesananMonth: monthlyRes?.success ? getOrderCountFromPayload(monthlyRes) : 0,
                pesananAllDates: allRes?.success ? getOrderCountFromPayload(allRes) : 0,
                omsetToday: dailyRes?.success ? getPendapatanFromPayload(dailyRes) : 0,
                omsetMonth: monthlyRes?.success ? getPendapatanFromPayload(monthlyRes) : 0,
                omsetAllDates: allRes?.success ? getPendapatanFromPayload(allRes) : 0,
                pendapatanToday: dailyRes?.success ? getPendapatanBersihFromPayload(dailyRes) : 0,
                pendapatanMonth: monthlyRes?.success ? getPendapatanBersihFromPayload(monthlyRes) : 0,
                pendapatanAllDates: allRes?.success ? getPendapatanBersihFromPayload(allRes) : 0,
                komisiToday: dailyRes?.success ? getKomisiFromPayload(dailyRes) : 0,
                komisiMonth: monthlyRes?.success ? getKomisiFromPayload(monthlyRes) : 0,
                komisiAllDates: allRes?.success ? getKomisiFromPayload(allRes) : 0,
                pelangganBaruToday: dailyRes?.success ? getPelangganBaruFromPayload(dailyRes) : 0,
                pelangganBaruMonth: monthlyRes?.success ? getPelangganBaruFromPayload(monthlyRes) : 0,
                pelangganBaruAllDates: allRes?.success ? getPelangganBaruFromPayload(allRes) : 0,
                waktuOnlineMinutesToday: todayOnlineMinutes,
                waktuOnlineMinutesMonth: monthOnlineMinutes,
                waktuOnlineMinutesAllDates: allOnlineMinutes,
            });
        } catch (error) {
            console.error('Error fetching stats summary:', error);
            setStatsSummary(emptySummary);
        }
    }, [
        getKomisiFromPayload,
        getPendapatanBersihFromPayload,
        getOrderCountFromPayload,
        getOnlineMinutesFromPayload,
        getPelangganBaruFromPayload,
        getPendapatanFromPayload,
        toNumber,
    ]);



    // Toggle show/hide saldo
    const handleToggleSaldo = useCallback(() => {
        setShowSaldo(prev => !prev);
    }, []);



    // Update data based on selected filter
    // MOVED TO handleFilterChange for immediate UI feedback

    // Fetch user data on mount
    // Initialize socket connection
    const initializeSocket = async () => {
        try {
            console.log('🔌 Initializing socket connection...');
            await socketService.connect();
            console.log('✅ Socket connected successfully');

            // Test socket connection immediately
            console.log('🧪 Testing socket connection...');
            const testResult = socketService.getConnectionStatus();
            console.log('🧪 Socket connection status:', testResult);

        } catch (error) {
            console.error('❌ Socket connection failed:', error);
            Alert.alert('Connection Error', 'Failed to connect to real-time service');
        }
    };

    useEffect(() => {
        initializeSocket();
        fetchUserData();
    }, []);

    // Handle hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Exit app when back button is pressed on home screen
            BackHandler.exitApp();
            return true; // Prevent default behavior
        });

        return () => backHandler.remove();
    }, []);

    // Memoize format currency function
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    }, []);

    const formatCurrencyCompact = useCallback((amount: number) => {
        const absAmount = Math.abs(amount);

        if (absAmount >= 1_000_000_000) {
            return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
        }

        if (absAmount >= 1_000_000) {
            return `Rp ${(amount / 1_000_000).toFixed(1).replace('.0', '')} Jt`;
        }

        if (absAmount >= 1_000) {
            return `Rp ${(amount / 1_000).toFixed(1).replace('.0', '')} Rb`;
        }

        return formatCurrency(amount);
    }, [formatCurrency]);

    const formatOnlineDuration = useCallback((minutes: number) => {
        if (!minutes || minutes <= 0) {
            return '0 mnt';
        }

        const totalMinutes = Math.round(minutes);
        if (totalMinutes < 60) {
            return `${totalMinutes} mnt`;
        }

        const totalHours = totalMinutes / 60;
        if (totalHours < 24) {
            return `${totalHours.toFixed(1).replace('.0', '')} jam`;
        }

        const totalDays = totalHours / 24;
        if (totalDays < 30) {
            return `${totalDays.toFixed(1).replace('.0', '')} hr`;
        }

        const totalMonths = totalDays / 30;
        if (totalMonths < 12) {
            return `${totalMonths.toFixed(1).replace('.0', '')} bln`;
        }

        const totalYears = totalMonths / 12;
        return `${totalYears.toFixed(1).replace('.0', '')} thn`;
    }, []);

    useEffect(() => {
        console.log('Setting up notification event listener');
        const handler = () => fetchUnreadNotifCount(userData?.id_konsumen || '');
        notificationEvents.on('refreshUnreadNotif', handler);
        return () => {
            notificationEvents.off('refreshUnreadNotif', handler);
        };
    }, [userData]);

    // Handle pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            if (userData?.no_hp) {
                // Fetch balance from API
                await fetchBalance(userData.no_hp);
                await fetchPendapatan(userData.no_hp);
                await fetchStatsSummary(userData.no_hp, selectedFilter);
                await fetchUnreadNotifCount(userData.id_konsumen);

                // TODO: Fetch other data from API
                // await fetchPendapatanData();
                // await fetchOrderData();
                // await fetchJenisOrderData();
            }

            console.log('Data refreshed');
        } catch (error) {
            console.error('Error refreshing data:', error);

        } finally {
            setRefreshing(false);
        }
    }, [userData, selectedFilter, fetchStatsSummary]);

    // Handle filter change
    const handleFilterChange = useCallback(async (filterId: string) => {
        console.log(`Filter changed to: ${filterId}`);
        setSelectedFilter(filterId);

        // Fetch data immediately for better UX
        if (userData?.no_hp) {
            if (filterId === 'live_order') {
                console.log('Fetching live order data...');
                await fetchPendapatan(userData.no_hp, 'live_order');
                await fetchStatsSummary(userData.no_hp, 'live_order');
            } else if (filterId === 'pasca_order') {
                console.log('Fetching pasca order data...');
                await fetchPendapatan(userData.no_hp, 'pasca_order');
                await fetchStatsSummary(userData.no_hp, 'pasca_order');
            } else {
                console.log('Fetching all data...');
                await fetchPendapatan(userData.no_hp, 'semua');
                await fetchStatsSummary(userData.no_hp, 'semua');
            }
        }
    }, [userData?.no_hp, fetchStatsSummary]);

    const parseNotifPayload = useCallback((raw: any) => {
        if (!raw) return null;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
            return null;
        }
    }, []);

    const formatDateForApi = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const formatDateForText = useCallback((date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }, []);

    const formatDateTimeForText = useCallback((value?: string | null) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }, []);

    const toArrayData = useCallback((res: any) => {
        if (Array.isArray(res?.data?.data)) return res.data.data;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res)) return res;
        return [];
    }, []);

    const isDateRangeValid = useCallback((startDate: Date, endDate: Date) => {
        if (startDate > endDate) {
            Alert.alert('Rentang tanggal tidak valid', 'Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir.');
            return false;
        }

        return true;
    }, []);

    const ensureSharePermission = useCallback(async () => {
        if (Platform.OS !== 'android') {
            return true;
        }

        const sdkVersion = typeof Platform.Version === 'number'
            ? Platform.Version
            : Number(Platform.Version || 0);

        // Android 13+ uses scoped storage, and sharing from app cache does not require legacy storage permission.
        if (sdkVersion >= 33) {
            return true;
        }

        const writePermission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
        const hasPermission = await PermissionsAndroid.check(writePermission);

        if (hasPermission) {
            return true;
        }

        const granted = await PermissionsAndroid.request(writePermission, {
            title: 'Izin Penyimpanan',
            message: 'Aplikasi membutuhkan izin penyimpanan untuk menyiapkan file PDF sebelum dibagikan.',
            buttonPositive: 'Izinkan',
            buttonNegative: 'Tolak',
            buttonNeutral: 'Nanti',
        });

        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }, []);

    const openExportUrl = useCallback(async (response: any, format: 'excel' | 'pdf') => {
        const urlCandidates = [
            response?.data?.data?.url,
            response?.data?.data?.file_url,
            response?.data?.url,
            response?.data?.file_url,
            response?.url,
        ];

        const fileUrl = urlCandidates.find((candidate) => typeof candidate === 'string' && candidate.startsWith('http'));

        if (!fileUrl) {
            Alert.alert('Export gagal', 'File export belum tersedia dari server.');
            return;
        }

        const canOpen = await Linking.canOpenURL(fileUrl);
        if (!canOpen) {
            Alert.alert('Export gagal', 'Tidak bisa membuka file hasil export.');
            return;
        }

        await Linking.openURL(fileUrl);
        Alert.alert('Export diproses', `File ${format.toUpperCase()} sedang dibuka.`);
    }, []);

    const handleExportExcel = useCallback(async () => {
        if (!userData?.no_hp) {
            Alert.alert('Gagal', 'Data pengguna belum siap.');
            return;
        }

        if (!isDateRangeValid(exportStartDate, exportEndDate)) {
            return;
        }

        setIsExporting(true);

        try {
            const res = await apiService.exportStatistikExcel(
                userData.no_hp,
                selectedFilter,
                formatDateForApi(exportStartDate),
                formatDateForApi(exportEndDate)
            );

            if (!res?.success) {
                Alert.alert('Export gagal', res?.message || 'Endpoint export Excel belum tersedia.');
                return;
            }

            await openExportUrl(res, 'excel');
            setShowExportModal(false);
        } catch (error) {
            Alert.alert('Export gagal', 'Terjadi kesalahan saat export Excel.');
        } finally {
            setIsExporting(false);
        }
    }, [exportEndDate, exportStartDate, formatDateForApi, isDateRangeValid, openExportUrl, selectedFilter, userData?.no_hp]);

    const handleExportPdf = useCallback(async () => {
        if (!userData?.no_hp) {
            Alert.alert('Gagal', 'Data pengguna belum siap.');
            return;
        }

        if (!isDateRangeValid(exportStartDate, exportEndDate)) {
            return;
        }

        setIsExporting(true);

        try {
            const courierName = userData?.name || userData?.nama_lengkap || userData?.nama_sopir || userData?.nm_sopir;
            const res = await apiService.exportStatistikPdf(
                userData.no_hp,
                selectedFilter,
                formatDateForApi(exportStartDate),
                formatDateForApi(exportEndDate),
                courierName
            );
            if (!res?.success) {
                Alert.alert('Export gagal', res?.message || 'Endpoint export PDF belum tersedia.');
                return;
            }

            await openExportUrl(res, 'pdf');
            setShowExportModal(false);
        } catch (error) {
            Alert.alert('Export gagal', 'Terjadi kesalahan saat export PDF.');
        } finally {
            setIsExporting(false);
        }
    }, [exportEndDate, exportStartDate, formatDateForApi, isDateRangeValid, openExportUrl, selectedFilter, userData?.name, userData?.nama, userData?.nama_sopir, userData?.nm_sopir, userData?.no_hp]);

    const handleShareTextCopy = useCallback(async () => {
        if (!userData?.no_hp) {
            Alert.alert('Gagal', 'Data pengguna belum siap.');
            return;
        }

        if (!isDateRangeValid(shareStartDate, shareEndDate)) {
            return;
        }

        setIsSharing(true);
        try {
            console.log(userData?.nama_lengkap)
            const startDate = formatDateForApi(shareStartDate);
            const endDate = formatDateForApi(shareEndDate);
            const courierName = userData?.name || userData?.nama_lengkap || userData?.nama_sopir || userData?.nm_sopir;
            const res = await apiService.exportStatistikPdf(userData.no_hp, selectedFilter, startDate, endDate, courierName);

            if (!res?.success) {
                Alert.alert('Share gagal', res?.message || 'Gagal mengambil data statistik untuk text share.');
                return;
            }

            const summaryCandidates = [
                res?.data?.data?.summary,
                res?.data?.summary,
                res?.data?.data?.data?.summary,
                res?.data?.data,
                res?.data,
            ].filter(Boolean);

            const pickSummaryValue = (keys: string[]): number => {
                for (const candidate of summaryCandidates) {
                    for (const key of keys) {
                        const value = toNumber(candidate?.[key]);
                        if (value > 0) {
                            return value;
                        }
                    }
                }
                return 0;
            };

            let pesanan = Math.round(pickSummaryValue(['pesanan', 'orders_total', 'orders', 'pesanan_total']));
            let omset = pickSummaryValue(['omset', 'omset_total', 'total_omset']);
            let pendapatan = pickSummaryValue(['pendapatan', 'pendapatan_total', 'pendapatan_bersih', 'total_pendapatan']);
            let komisi = pickSummaryValue(['komisi', 'komisi_total', 'total_komisi']);
            let pelanggan = Math.round(pickSummaryValue(['pelanggan', 'pelanggan_baru', 'pelanggan_total', 'total_pelanggan']));
            let onlineMinutes = Math.round(pickSummaryValue(['online_minutes', 'waktu_online_menit', 'total_online_minutes']));

            if (pesanan === 0 && omset === 0 && pendapatan === 0 && komisi === 0 && pelanggan === 0) {
                const fallbackRes = await apiService.getPendapatanCustom(userData.no_hp, startDate, endDate, selectedFilter);
                pesanan = getOrderCountFromPayload(fallbackRes) || getOrderCountFromPayload(fallbackRes?.data) || 0;
                omset = getPendapatanFromPayload(fallbackRes) || getPendapatanFromPayload(fallbackRes?.data) || 0;
                pendapatan = getPendapatanBersihFromPayload(fallbackRes) || getPendapatanBersihFromPayload(fallbackRes?.data) || 0;
                komisi = getKomisiFromPayload(fallbackRes) || getKomisiFromPayload(fallbackRes?.data) || 0;
                pelanggan = getPelangganBaruFromPayload(fallbackRes) || getPelangganBaruFromPayload(fallbackRes?.data) || 0;
                onlineMinutes = getOnlineMinutesFromPayload(fallbackRes) || getOnlineMinutesFromPayload(fallbackRes?.data) || 0;
            }

            const kurirName =
                userData?.name ||
                userData?.nama ||
                userData?.nama_sopir ||
                userData?.nm_sopir ||
                '-';
            const kurirPhone = userData?.no_hp || '-';

            const message = [
                'Laporan Statistik Kurir',
                `Nama Kurir: ${kurirName}`,
                `No HP Kurir: ${kurirPhone}`,
                `Periode: ${formatDateForText(shareStartDate)} - ${formatDateForText(shareEndDate)}`,
                `Filter: ${selectedFilter}`,
                '',
                `Pesanan: ${pesanan}`,
                `Omset: ${formatCurrency(omset)}`,
                `Pendapatan: ${formatCurrency(pendapatan)}`,
                `Komisi: ${formatCurrency(komisi)}`,
                `Pelanggan: ${pelanggan}`,
                `Waktu Online: ${formatOnlineDuration(onlineMinutes)}`,
            ].join('\n');

            Clipboard.setString(message);
            Alert.alert('Berhasil', 'Text statistik berhasil disalin ke clipboard.');
            setShowShareModal(false);
        } catch (error) {
            Alert.alert('Share gagal', 'Terjadi kesalahan saat menyalin text statistik.');
        } finally {
            setIsSharing(false);
        }
    }, [formatCurrency, formatDateForApi, formatDateForText, formatOnlineDuration, getKomisiFromPayload, getOnlineMinutesFromPayload, getOrderCountFromPayload, getPelangganBaruFromPayload, getPendapatanBersihFromPayload, getPendapatanFromPayload, isDateRangeValid, selectedFilter, shareEndDate, shareStartDate, toNumber, userData?.name, userData?.nama, userData?.nama_sopir, userData?.nm_sopir, userData?.no_hp]);

    const handleSharePdf = useCallback(async () => {
        if (!userData?.no_hp) {
            Alert.alert('Gagal', 'Data pengguna belum siap.');
            return;
        }

        if (!isDateRangeValid(shareStartDate, shareEndDate)) {
            return;
        }

        setIsSharing(true);
        try {
            const hasSharePermission = await ensureSharePermission();
            if (!hasSharePermission) {
                Alert.alert('Izin diperlukan', 'Izin penyimpanan belum diberikan.');
                return;
            }

            const courierName = userData?.name || userData?.nama || userData?.nama_sopir || userData?.nm_sopir;
            const res = await apiService.exportStatistikPdf(
                userData.no_hp,
                selectedFilter,
                formatDateForApi(shareStartDate),
                formatDateForApi(shareEndDate),
                courierName
            );

            if (!res?.success) {
                Alert.alert('Share gagal', res?.message || 'Gagal generate PDF untuk share.');
                return;
            }

            const fileUrl = res?.data?.data?.url || res?.data?.url;
            if (!fileUrl) {
                Alert.alert('Share gagal', 'URL file PDF tidak tersedia.');
                return;
            }

            const remoteFileName = res?.data?.data?.filename || `statistik-kurir-${Date.now()}.pdf`;
            const localFileUri = `${FileSystem.Paths.cache.uri}${remoteFileName}`;

            await LegacyFileSystem.downloadAsync(fileUrl, localFileUri);

            try {
                const ShareFile = require('react-native-share').default;
                await ShareFile.open({
                    title: 'Share Laporan Statistik Kurir',
                    url: localFileUri,
                    type: 'application/pdf',
                    filename: remoteFileName,
                    failOnCancel: false,
                });
            } catch (_) {
                await NativeShare.share({
                    title: 'Laporan Statistik Kurir',
                    message: `Laporan Statistik Kurir\nPeriode: ${formatDateForText(shareStartDate)} - ${formatDateForText(shareEndDate)}\n${fileUrl}`,
                });

                Alert.alert(
                    'Info Share',
                    'Share file PDF langsung gagal dijalankan. Aplikasi mengirim text + link sebagai fallback.'
                );
            }

            setShowShareModal(false);
        } catch (error) {
            Alert.alert('Share gagal', 'Terjadi kesalahan saat share PDF.');
        } finally {
            setIsSharing(false);
        }
    }, [ensureSharePermission, formatDateForApi, formatDateForText, isDateRangeValid, selectedFilter, shareEndDate, shareStartDate, userData?.no_hp]);

    const handleCopyDailyRecap = useCallback(async () => {
        if (!userData?.no_hp) {
            Alert.alert('Gagal', 'Data pengguna belum siap.');
            return;
        }

        setIsCopyingDailyRecap(true);
        try {
            const kurirName =
                userData?.name ||
                userData?.nama_lengkap ||
                userData?.nama ||
                userData?.nama_sopir ||
                userData?.nm_sopir ||
                '-';
            const kurirPhone = userData?.no_hp || '-';

            const rekapRes = await apiService.getRekapOnline(userData.no_hp);
            const rekapData = rekapRes?.data || {};
            const rekapDetail = Array.isArray(rekapData?.detail) ? rekapData.detail : [];
            const firstOnline = rekapDetail.length > 0 ? (rekapDetail[0]?.online_at || '') : '';
            const offlineEntries = rekapDetail.filter((item: any) => !!item?.offline_at);
            const lastOfflineRaw = offlineEntries.length > 0 ? offlineEntries[offlineEntries.length - 1]?.offline_at : '';
            const isOnlineNow = Boolean(rekapData?.is_online_now);
            const waktuOn = formatDateTimeForText(firstOnline);
            const waktuOff = isOnlineNow ? '' : formatDateTimeForText(lastOfflineRaw);
            const totalOnlineMinutes = Number(rekapData?.total_minutes || 0);
            const totalDurasiOn = formatOnlineDuration(totalOnlineMinutes);

            const todayDate = formatDateForApi(new Date());
            const [liveOrderRes, manualOrderRes, agentRes] = await Promise.all([
                apiService.getListLiveOrder(userData.no_hp, todayDate, todayDate),
                apiService.getListTransaksiManual(userData.no_hp, todayDate, todayDate),
                apiService.getListAgent(userData.no_hp),
            ]);

            const liveOrdersRaw = toArrayData(liveOrderRes);
            const manualOrdersRaw = toArrayData(manualOrderRes);
            const agentListRaw = toArrayData(agentRes);

            const agentNameMap = new Map<string, string>();
            for (const agent of agentListRaw) {
                const id = String(agent?.id_konsumen ?? '').trim();
                if (!id) continue;
                const name =
                    String(agent?.nama_lengkap ?? '').trim() ||
                    String(agent?.nama ?? '').trim() ||
                    String(agent?.name ?? '').trim();
                if (name) {
                    agentNameMap.set(id, name);
                }
            }

            const liveOrders = liveOrdersRaw.filter((item: any) => {
                const source = String(item?.source ?? '').toUpperCase();
                return source === '' || source === 'LIVE_ORDER';
            });

            const manualOrders = manualOrdersRaw.filter((item: any) => {
                const source = String(item?.source ?? '').toUpperCase();
                return source === '' || source === 'MANUAL_KURIR';
            });

            const getAgentKey = (item: any) => {
                const raw =
                    item?.id_agen ??
                    item?.agen_kurir ??
                    item?.id_konsumen_agen ??
                    item?.id_konsumen_referral ??
                    item?.id_konsumen ??
                    '';
                return String(raw).trim();
            };

            const getCustomerName = (item: any) => {
                const name =
                    item?.nama_pelanggan ||
                    item?.nama_customer ||
                    item?.nama_pemesan ||
                    item?.penerima_barang ||
                    item?.pemberi_barang ||
                    item?.nama_lengkap ||
                    '-';
                return String(name).trim() || '-';
            };

            const getDestination = (item: any) => {
                const dest = item?.alamat_antar || item?.alamat_tujuan || item?.tujuan || '-';
                return String(dest).trim() || '-';
            };

            const getOrderValue = (item: any) => Number(item?.tarif ?? item?.total ?? item?.nominal ?? 0) || 0;

            const agentGrouped = new Map<string, any[]>();
            for (const item of liveOrders) {
                const key = getAgentKey(item) || 'unknown';
                const current = agentGrouped.get(key) || [];
                current.push(item);
                agentGrouped.set(key, current);
            }

            const agenLines: string[] = [];
            if (agentGrouped.size === 0) {
                agenLines.push('Tidak ada data pesanan dari agen lain.');
            } else {
                let agenIndex = 0;
                for (const [agentKey, items] of agentGrouped.entries()) {
                    agenIndex += 1;
                    const agentName =
                        agentNameMap.get(agentKey) ||
                        String(items?.[0]?.nama_agen ?? '').trim() ||
                        String(items?.[0]?.nama_lengkap_agen ?? '').trim() ||
                        (agentKey === 'unknown' ? `Agen ${agenIndex}` : `Agen ${agentKey}`);

                    agenLines.push(`Nama Agen: ${agentName}`);
                    agenLines.push(`Jumlah: ${items.length}`);
                    items.forEach((item, index) => {
                        agenLines.push(
                            `${index + 1}. ${getCustomerName(item)} : ${getDestination(item)} : ${formatCurrency(getOrderValue(item))}`
                        );
                    });
                    agenLines.push('');
                }
                if (agenLines[agenLines.length - 1] === '') {
                    agenLines.pop();
                }
            }

            const pelangganLines: string[] = [];
            pelangganLines.push(`Jumlah: ${manualOrders.length}`);
            pelangganLines.push('');
            if (manualOrders.length === 0) {
                pelangganLines.push('Tidak ada data pesanan pelanggan sendiri.');
            } else {
                manualOrders.forEach((item: any, index: number) => {
                    pelangganLines.push(
                        `${index + 1}. ${getCustomerName(item)} : ${getDestination(item)} : ${formatCurrency(getOrderValue(item))}`
                    );
                });
            }

            const message = [
                `Nama: ${kurirName}`,
                `No HP: ${kurirPhone}`,
                `Tanggal: ${formatDateForText(new Date())}`,
                `Waktu On: ${waktuOn}`,
                `Waktu Off: ${waktuOff}`,
                `Total Durasi ON: ${totalDurasiOn}`,
                '',
                '----------------------------------',
                '',
                `Jumlah Pesanan Hari Ini: ${statsSummary.pesananToday}`,
                `Total Omset Hari Ini: ${formatCurrency(statsSummary.omsetToday)}`,
                `Pendapatan Hari Ini: ${formatCurrency(statsSummary.pendapatanToday)}`,
                `Komisi Hari Ini: ${formatCurrency(statsSummary.komisiToday)}`,
                '',
                '--------------------------------',
                '',
                '*Data Pesanan dari Agen lain:*',
                '',
                ...agenLines,
                '',
                '*Data Pesanan Pelanggan sendiri*',
                '',
                ...pelangganLines,
            ].join('\n');

            Clipboard.setString(message);
            Alert.alert('Berhasil', 'Rekap harian berhasil disalin ke clipboard.');
        } catch (error) {
            Alert.alert('Gagal', 'Terjadi kesalahan saat menyalin rekap harian.');
        } finally {
            setIsCopyingDailyRecap(false);
        }
    }, [formatCurrency, formatDateForApi, formatDateForText, formatDateTimeForText, formatOnlineDuration, statsSummary.komisiToday, statsSummary.omsetToday, statsSummary.pendapatanToday, statsSummary.pesananToday, toArrayData, userData?.name, userData?.nama_lengkap, userData?.nama, userData?.nama_sopir, userData?.nm_sopir, userData?.no_hp]);

    // Menu items data
    const menuItems: any[] = [
        // { id: 1, name: 'Transaksi\nManual', icon: 'create-outline' },
        // { id: 2, name: 'Riwayat', icon: 'time-outline' },
        // { id: 3, name: 'Pengaturan', icon: 'settings-outline' },
        // { id: 4, name: 'Bantuan', icon: 'help-circle-outline' },
    ];

    // Handle menu press
    const handleMenuPress = useCallback((item: any) => {
        console.log(`Menu pressed: ${item.name}`);

        // Navigate based on menu id
        switch (item.id) {
            case 1:
                router.push('/transaksi-manual');
                break;
            case 2:
                // TODO: Navigate to Riwayat screen
                break;
            case 3:
                // TODO: Navigate to Pengaturan screen
                break;
            case 4:
                // TODO: Navigate to Bantuan screen
                break;
        }
    }, []);

    // Memoize charts untuk prevent re-render yang tidak perlu
    const memoizedPendapatanChart = useMemo(() => (
        <PendapatanChart
            data={pendapatanData}
            mode="hourly"
        // date="2025-10-01" 
        />
    ), [pendapatanData]);

    const memoizedOrderChart = useMemo(() => (
        <OrderChart
            data={orderData}
            mode="hourly"
        // date="2025-10-01" 
        />
    ), [orderData]);

    const memoizedJenisOrderChart = useMemo(() => (
        <JenisOrderChart data={jenisOrderData} />
    ), [jenisOrderData]);

    return (
        <View style={styles.container}>
            <GlassBackground />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 42) }]}>
                <TouchableOpacity style={styles.notificationButton} onPress={() => setShowNotifModal(true)}>
                    <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                    <Badge count={unreadNotifCount} variant="danger" size="medium" style={styles.notificationBadge} />
                </TouchableOpacity>

                <Text style={styles.logo}>{APP_NAME}</Text>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/akun')}>
                        <View style={styles.profileImage}>
                            {userData?.foto ? (
                                <Image
                                    source={{ uri: userData.foto }}
                                    style={styles.profileImageContent}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons name="person" size={24} color="#ffffff" />
                            )}
                        </View>
                        {/* <View style={styles.profileBadge}>
                            <Text style={styles.profileBadgeText}>6</Text>
                        </View> */}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content with Pull to Refresh */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0097A7']} // Android
                        tintColor="#0097A7" // iOS
                    />
                }
            >
                {/* Online / Offline Toggle */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleToggleOnline}
                    disabled={togglingOnline}
                    style={[
                        styles.onlineToggleCard,
                        isOnline ? styles.onlineToggleCardOn : styles.onlineToggleCardOff,
                    ]}
                >
                    {/* Pulse ring */}
                    {isOnline && (
                        <Animated.View
                            style={[
                                styles.pulseRing,
                                { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.35], outputRange: [0.55, 0] }) },
                            ]}
                        />
                    )}

                    {/* Status dot */}
                    <View style={[styles.statusDot, isOnline ? styles.statusDotOn : styles.statusDotOff]} />

                    {/* Text */}
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.onlineToggleTitle, !isOnline && styles.onlineToggleTitleOff]}>
                            {isOnline ? 'Kamu Sedang Online' : 'Kamu Sedang Offline'}
                        </Text>
                        <Text style={[styles.onlineToggleSubtitle, !isOnline && styles.onlineToggleSubtitleOff]}>
                            {isOnline ? 'Siap menerima order masuk' : 'Aktifkan untuk terima order'}
                        </Text>
                    </View>

                    {/* Toggle pill */}
                    <View style={[styles.togglePill, isOnline ? styles.togglePillOn : styles.togglePillOff]}>
                        <Animated.View
                            style={[
                                styles.toggleKnob,
                                {
                                    transform: [{
                                        translateX: toggleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [2, 22],
                                        }),
                                    }],
                                },
                            ]}
                        />
                    </View>
                </TouchableOpacity>

                {/* Saldo Card */}
                <View style={styles.compactSection}>
                    <InfoCard
                        title="Saldo Anda"
                        value={showSaldo ? formatCurrency(saldo) : 'Rp ******'}
                        variant="default"
                        rightElement={
                            <TouchableOpacity onPress={handleToggleSaldo}>
                                <Ionicons
                                    name={showSaldo ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#6c757d"
                                />
                            </TouchableOpacity>
                        }
                    />
                </View>

                {/* Horizontal Menu */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.menuScroll}
                    contentContainerStyle={styles.menuContainer}
                >
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => handleMenuPress(item)}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon as any} size={24} color="#0097A7" />
                            </View>
                            <Text style={styles.menuText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>


                {/* MENU KHUSUS AGEN */}
                {
                    userData?.agen === '1' && (
                        <View style={styles.compactSection}>
                            <View style={styles.agentMenuCard}>
                                <View style={styles.agentMenuInline}>
                                    <Text style={styles.agentMenuTitle}>Menu Agen</Text>
                                    <TouchableOpacity
                                        style={styles.agentQuickAction}
                                        onPress={() => router.push('/live-order')}
                                    >
                                        <View style={styles.agentQuickIconWrap}>
                                            <Ionicons name="flash-outline" size={14} color="#0097A7" />
                                        </View>
                                        <Text style={styles.agentQuickLabel}>Live Order</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )
                }

                <View style={[styles.orderStatsSection, styles.compactSection]}>
                    <View style={styles.statsHeaderRow}>
                        <Text style={styles.statsHeaderTitle}>Statistik Kinerja</Text>
                        <Text style={styles.statsHeaderSub}>Ringkasan performa utama</Text>
                    </View>

                    <View style={styles.orderStatsGrid}>
                        <View style={[styles.orderStatCard, styles.orderStatCardToday]}>
                            <Text style={styles.orderStatLabel}>Pesanan Hari Ini</Text>
                            <Text style={styles.orderStatValue}>
                                {statsSummary.pesananToday}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardMonth]}>
                            <Text style={styles.orderStatLabel}>Pesanan Bulan Ini</Text>
                            <Text style={styles.orderStatValue}>
                                {statsSummary.pesananMonth}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardAll]}>
                            <Text style={styles.orderStatLabel}>Pesanan Total</Text>
                            <Text style={styles.orderStatValue}>
                                {statsSummary.pesananAllDates}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.orderStatsGrid, styles.orderStatsGridSecondRow]}>
                        <View style={[styles.orderStatCard, styles.orderStatCardToday]}>
                            <Text style={styles.orderStatLabel}>Omset Hari Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.omsetToday)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardMonth]}>
                            <Text style={styles.orderStatLabel}>Omset Bulan Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.omsetMonth)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardAll]}>
                            <Text style={styles.orderStatLabel}>Omset Total</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.omsetAllDates)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.orderStatsGrid, styles.orderStatsGridSecondRow]}>
                        <View style={[styles.orderStatCard, styles.orderStatCardToday]}>
                            <Text style={styles.orderStatLabel}>Pendapatan Hari Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.pendapatanToday)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardMonth]}>
                            <Text style={styles.orderStatLabel}>Pendapatan Bulan Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.pendapatanMonth)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardAll]}>
                            <Text style={styles.orderStatLabel}>Pendapatan Total</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.pendapatanAllDates)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.orderStatsGrid, styles.orderStatsGridSecondRow]}>
                        <View style={[styles.orderStatCard, styles.orderStatCardToday]}>
                            <Text style={styles.orderStatLabel}>Komisi Hari Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.komisiToday)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardMonth]}>
                            <Text style={styles.orderStatLabel}>Komisi Bulan Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.komisiMonth)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardAll]}>
                            <Text style={styles.orderStatLabel}>Komisi Total</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueCurrency]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrencyCompact(statsSummary.komisiAllDates)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.orderStatsGrid, styles.orderStatsGridSecondRow]}>
                        <View style={[styles.orderStatCard, styles.orderStatCardToday]}>
                            <Text style={styles.orderStatLabel}>Pelanggan Hari Ini</Text>
                            <Text style={styles.orderStatValue}>{statsSummary.pelangganBaruToday}</Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardMonth]}>
                            <Text style={styles.orderStatLabel}>Pelanggan Bulan Ini</Text>
                            <Text style={styles.orderStatValue}>{statsSummary.pelangganBaruMonth}</Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardAll]}>
                            <Text style={styles.orderStatLabel}>Pelanggan Total</Text>
                            <Text style={styles.orderStatValue}>{statsSummary.pelangganBaruAllDates}</Text>
                        </View>
                    </View>

                    <View style={[styles.orderStatsGrid, styles.orderStatsGridSecondRow]}>
                        <View style={[styles.orderStatCard, styles.orderStatCardToday]}>
                            <Text style={styles.orderStatLabel}>Waktu Online Hari Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueDuration]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatOnlineDuration(statsSummary.waktuOnlineMinutesToday)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardMonth]}>
                            <Text style={styles.orderStatLabel}>Waktu Online Bulan Ini</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueDuration]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatOnlineDuration(statsSummary.waktuOnlineMinutesMonth)}
                            </Text>
                        </View>

                        <View style={[styles.orderStatCard, styles.orderStatCardAll]}>
                            <Text style={styles.orderStatLabel}>Waktu Online Total</Text>
                            <Text style={[styles.orderStatValue, styles.orderStatValueDuration]} numberOfLines={1} adjustsFontSizeToFit>
                                {formatOnlineDuration(statsSummary.waktuOnlineMinutesAllDates)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsExportRow}>
                        <TouchableOpacity style={styles.statsExportBtn} onPress={() => setShowExportModal(true)}>
                            <Ionicons name="document-outline" size={14} color="#1d4f7a" />
                            <Text style={styles.statsExportBtnText}>Export</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statsExportBtn} onPress={() => setShowShareModal(true)}>
                            <Ionicons name="share-social-outline" size={14} color="#1d4f7a" />
                            <Text style={styles.statsExportBtnText}>Share</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.statsExportBtn, styles.statsExportBtnFullWidth]}
                        onPress={handleCopyDailyRecap}
                        disabled={isCopyingDailyRecap}
                    >
                        <Ionicons name="copy-outline" size={14} color="#1d4f7a" />
                        <Text style={styles.statsExportBtnText}>{isCopyingDailyRecap ? 'Proses...' : 'Copy Rekap Harian'}</Text>
                    </TouchableOpacity>

                    <View style={styles.sectionDivider} />
                </View>

                

                {/* Filter Pills */}
                <View style={[styles.filterContainer, styles.compactSection]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScrollContent}
                    >
                        {[
                            { id: 'semua', label: 'Semua' },
                            { id: 'pasca_order', label: 'Pasca Order' },
                            { id: 'live_order', label: 'Live Order' }
                        ].map((pill) => (
                            <FilterChip
                                key={pill.id}
                                label={pill.label}
                                selected={selectedFilter === pill.id}
                                variant="primary"
                                size="medium"
                                onPress={() => handleFilterChange(pill.id)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Grafik Pendapatan */}
                <View style={styles.compactSection}>{memoizedPendapatanChart}</View>

                {/* Grafik Total Order */}
                <View style={styles.compactSection}>{memoizedOrderChart}</View>

                {/* Grafik Jenis Order */}
                <View style={styles.compactSection}>{memoizedJenisOrderChart}</View>

                {/* Bottom Spacing for Tab Bar */}
                <View style={{ height: Platform.OS === 'android' ? Math.max(insets.bottom, 16) + 110 : Math.max(insets.bottom, 16) + 80 }} />
            </ScrollView>
            {/* Floating Live Order button for agent, always visible */}

            {showExportModal && (
                <View style={styles.actionModalOverlay}>
                    <View style={styles.actionModalCard}>
                        <Text style={styles.actionModalTitle}>Konfirmasi Export</Text>
                        <Text style={styles.actionModalSubtitle}>Pilih range tanggal lalu pilih format export.</Text>

                        <DatePickerInput
                            label="Tanggal Mulai"
                            value={exportStartDate}
                            onChange={setExportStartDate}
                        />
                        <DatePickerInput
                            label="Tanggal Akhir"
                            value={exportEndDate}
                            onChange={setExportEndDate}
                        />

                        <View style={styles.actionModalButtonsRow}>
                            <TouchableOpacity
                                style={[styles.actionModalBtn, styles.actionModalBtnPrimary]}
                                onPress={handleExportExcel}
                                disabled={isExporting}
                            >
                                <Ionicons name="document-text-outline" size={16} color="#fff" />
                                <Text style={styles.actionModalBtnPrimaryText}>{isExporting ? 'Proses...' : 'Export Excel'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionModalBtn, styles.actionModalBtnSecondary]}
                                onPress={handleExportPdf}
                                disabled={isExporting}
                            >
                                <Ionicons name="print-outline" size={16} color="#1d4f7a" />
                                <Text style={styles.actionModalBtnSecondaryText}>{isExporting ? 'Proses...' : 'Export PDF'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.actionModalCloseBtn} onPress={() => setShowExportModal(false)}>
                            <Text style={styles.actionModalCloseText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showShareModal && (
                <View style={styles.actionModalOverlay}>
                    <View style={styles.actionModalCard}>
                        <Text style={styles.actionModalTitle}>Konfirmasi Share</Text>
                        <Text style={styles.actionModalSubtitle}>Pilih range tanggal lalu pilih metode share.</Text>

                        <DatePickerInput
                            label="Tanggal Mulai"
                            value={shareStartDate}
                            onChange={setShareStartDate}
                        />
                        <DatePickerInput
                            label="Tanggal Akhir"
                            value={shareEndDate}
                            onChange={setShareEndDate}
                        />

                        <Text style={styles.actionModalActionLabel}>Pilih Konfirmasi Share</Text>

                        <View style={styles.actionModalButtonsColumn}>
                            <TouchableOpacity
                                style={[styles.actionModalBtn, styles.actionModalBtnPrimary]}
                                onPress={handleShareTextCopy}
                                disabled={isSharing}
                            >
                                <Ionicons name="copy-outline" size={16} color="#fff" />
                                <Text style={styles.actionModalBtnPrimaryText}>{isSharing ? 'Proses...' : 'Share via Text (Copy)'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionModalBtn, styles.actionModalBtnSecondary]}
                                onPress={handleSharePdf}
                                disabled={isSharing}
                            >
                                <Ionicons name="share-social-outline" size={16} color="#1d4f7a" />
                                <Text style={styles.actionModalBtnSecondaryText}>{isSharing ? 'Proses...' : 'Share PDF'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.actionModalCloseBtn} onPress={() => setShowShareModal(false)}>
                            <Text style={styles.actionModalCloseText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Modal Notifikasi */}
            {showNotifModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999,
                }}>
                    <View style={{
                        width: '90%',
                        maxHeight: '75%',
                        backgroundColor: '#fff',
                        borderRadius: 14,
                        padding: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 8,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#0097A7', textAlign: 'center' }}>Notifikasi</Text>

                        <ScrollView style={{ maxHeight: 380 }}>

                            {listNotif.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#6c757d', marginTop: 32 }}>Tidak ada notifikasi</Text>
                            ) : (
                                listNotif.map((notif, idx) => {
                                    const parsedNotif = parseNotifPayload(notif?.data);
                                    const notifData = parsedNotif?.message?.data;

                                    return (
                                        <View key={notif.id || idx} style={styles.notifItem}>
                                            <Text style={styles.notifTitle}>{notif.title || notif.judul || 'Notifikasi'}</Text>
                                            <Text style={styles.notifBody}>{notif.body || notif.pesan || notif.text || '-'}</Text>
                                            {notif.created_at && (
                                                <Text style={styles.notifDate}>{notif.created_at}</Text>
                                            )}

                                            {notifData && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        notifData?.navigate_to === 'live-order' &&
                                                            router.push({
                                                                pathname: '/live-order/detail',
                                                                params: { id: notifData?.transaction_id }
                                                            });
                                                    }}
                                                    style={styles.notifDetailButton}>
                                                    <Text style={styles.notifDetailButtonText}>Lihat Detail</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={{ marginTop: 18, backgroundColor: '#0097A7', paddingVertical: 12, borderRadius: 8 }}
                            onPress={() => setShowNotifModal(false)}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    fabLiveOrder: {
        position: 'absolute',
        right: 15,
        bottom: Platform.OS === 'android' ? 130 : 135,
        borderRadius: 32,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
        zIndex: 100,
    },
    fabPascaOrder: {
        position: 'absolute',
        right: 15,
        bottom: Platform.OS === 'android' ? 60 : 64,
        borderRadius: 32,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
        zIndex: 100,
    },
    fabIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0097A7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        fontWeight: 'bold',
        fontSize: 10,
        color: 'rgba(0,151,167,0.95)',
    },
    container: {
        flex: 1,
        backgroundColor: AuthColors.backgroundEnd,
    },
    header: {
        // backgroundColor: 'rgba(0, 151, 167, 0.7)',
        // backgroundColor: '#2AA7A1',
        paddingBottom: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    logo: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationButton: {
        position: 'relative',
        padding: 4,
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    profileButton: {
        position: 'relative',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6c757d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageContent: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#dc3545',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#0097A7',
    },
    profileBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    compactSection: {
        marginBottom: 10,
    },
    menuScroll: {
        marginTop: 4,
        marginHorizontal: -12,
    },
    menuRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 10,
    },
    menuContainer: {
        paddingHorizontal: 0,
        paddingLeft: 12,
        gap: 12,
    },
    menuItem: {
        alignItems: 'center',
        width: 72,
    },
    menuIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 24,
        backgroundColor: '#e7f1ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuText: {
        fontSize: 10,
        color: '#212529',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 14,
    },
    agentMenuCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        // elevation: 4,
    },
    agentMenuHeader: {
        marginBottom: 8,
    },
    agentMenuInline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    agentMenuTitle: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '600',
    },
    agentQuickAction: {
        minWidth: 0,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d7ecff',
        backgroundColor: '#f5faff',
        flexDirection: 'row',
        alignItems: 'center',
    },
    agentQuickIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#e7f1ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
        marginRight: 6,
    },
    agentQuickLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1d4f7a',
    },
    orderStatsSection: {
        marginTop: 8,
    },
    statsHeaderRow: {
        marginBottom: 8,
    },
    statsHeaderTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#23415f',
    },
    statsHeaderSub: {
        marginTop: 1,
        fontSize: 10,
        color: '#6f8498',
    },
    orderStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    orderStatsGridSecondRow: {
        marginTop: 8,
    },
    orderStatCard: {
        width: '31.5%',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderWidth: 1,
    },
    orderStatTopRow: {
        minHeight: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 2,
    },
    orderStatCardToday: {
        backgroundColor: '#f3fbff',
        borderColor: '#d3eeff',
    },
    orderStatCardMonth: {
        backgroundColor: '#f5fff8',
        borderColor: '#d4f7df',
    },
    orderStatCardAll: {
        backgroundColor: '#fffaf1',
        borderColor: '#ffe7be',
    },
    orderStatLabel: {
        fontSize: 9,
        color: '#5f6b76',
        lineHeight: 12,
        minHeight: 14,
        flex: 1,
        paddingRight: 4,
    },
    orderStatValue: {
        marginTop: 2,
        fontSize: 18,
        fontWeight: '700',
        color: '#1b4e75',
    },
    orderStatValueCurrency: {
        fontSize: 14,
        marginTop: 6,
    },
    orderStatValueDuration: {
        fontSize: 13,
        marginTop: 6,
    },
    orderStatValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    trendDot: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    trendUp: {
        backgroundColor: '#dcfce7',
    },
    trendDown: {
        backgroundColor: '#fee2e2',
    },
    statsExportRow: {
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    statsExportBtn: {
        width: '48.5%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d7ecff',
        backgroundColor: '#f6fbff',
        paddingVertical: 7,
    },
    statsExportBtnFullWidth: {
        width: '100%',
        marginTop: 8,
    },
    statsExportBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1d4f7a',
    },
    sectionDivider: {
        marginTop: 10,
        height: 1,
        backgroundColor: 'rgba(130, 153, 176, 0.35)',
    },
    filterContainer: {
        marginTop: 8,
        marginBottom: 2,
    },
    filterScrollContent: {
        paddingHorizontal: 2,
        gap: 8,
    },
    onlineToggleCard: {
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
        position: 'relative',
    },
    onlineToggleCardOn: {
        backgroundColor: '#00897B',
        shadowColor: '#00897B',
    },
    onlineToggleCardOff: {
        backgroundColor: 'rgba(255,255,255,0.82)',
        shadowColor: '#000',
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusDotOn: {
        backgroundColor: '#A5F3A0',
    },
    statusDotOff: {
        backgroundColor: '#9E9E9E',
    },
    pulseRing: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#A5F3A0',
        left: 20,
    },
    onlineToggleTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
    onlineToggleTitleOff: {
        color: '#212529',
    },
    onlineToggleSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    onlineToggleSubtitleOff: {
        color: '#6c757d',
    },
    togglePill: {
        width: 48,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
    },
    togglePillOn: {
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    togglePillOff: {
        backgroundColor: '#CFD8DC',
    },
    toggleKnob: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    actionModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1200,
    },
    actionModalCard: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    actionModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0097A7',
        textAlign: 'center',
    },
    actionModalSubtitle: {
        marginTop: 4,
        marginBottom: 12,
        textAlign: 'center',
        color: '#6c757d',
        fontSize: 12,
    },
    actionModalButtonsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionModalButtonsColumn: {
        gap: 8,
    },
    actionModalActionLabel: {
        fontSize: 12,
        color: '#5f6b76',
        fontWeight: '600',
        marginBottom: 6,
    },
    actionModalBtn: {
        minHeight: 42,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 11,
    },
    actionModalBtnPrimary: {
        backgroundColor: '#0097A7',
    },
    actionModalBtnSecondary: {
        backgroundColor: '#f6fbff',
        borderWidth: 1,
        borderColor: '#d7ecff',
    },
    actionModalBtnPrimaryText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
        flexShrink: 1,
        textAlign: 'center',
    },
    actionModalBtnSecondaryText: {
        color: '#1d4f7a',
        fontWeight: '700',
        fontSize: 12,
        flexShrink: 1,
        textAlign: 'center',
    },
    actionModalCloseBtn: {
        marginTop: 10,
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 14,
    },
    actionModalCloseText: {
        color: '#6c757d',
        fontWeight: '600',
        fontSize: 12,
    },
    notifItem: {
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 12,
    },
    notifTitle: {
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 6,
        lineHeight: 20,
    },
    notifBody: {
        color: '#6c757d',
        marginBottom: 6,
        lineHeight: 20,
        flexWrap: 'wrap',
        maxWidth: '100%',
        flexShrink: 1,
    },
    notifDate: {
        fontSize: 12,
        color: '#adb5bd',
        lineHeight: 16,
    },
    notifDetailButton: {
        marginTop: 10,
        backgroundColor: '#f1f3f5',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    notifDetailButtonText: {
        fontSize: 12,
        color: '#495057',
    },
});

export default memo(HomeScreen);
