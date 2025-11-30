import CryptoJS from 'crypto-js';

// Generate token berdasarkan tanggal hari ini
const generateToken = () => {
    const today = new Date();
    const dateString = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');
    const rawString = dateString + '#SATUKASIR';
    
    // Gunakan SHA256 atau hash method yang sesuai dengan backend
    // Pastikan ini sesuai dengan method hash di backend
    return CryptoJS.SHA256(rawString).toString();
};

export const API_BASE_URL = 'https://api.satutoko.my.id/api';
export const BROADCAST_URL = 'http://api.satutoko.my.id:6001';
export const SOCKET_URL = 'http://api.satutoko.my.id:6001';
export const API_TOKEN = generateToken();
export const APP_NAME = 'Mitra KlikQuick';

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/kurir/login`,
    VERIFY_OTP: `${API_BASE_URL}/kurir/verifikasi_otp`,
    BALANCE: `${API_BASE_URL}/kurir/v1/getBalance`,
    ORDER_DAILY: `${API_BASE_URL}/kurir/v1/orders/daily`,
    ORDER_MONTHLY: `${API_BASE_URL}/kurir/v1/orders/monthly`,
    JENIS_LAYANAN: `${API_BASE_URL}/kurir/v1/jenis-layanan`,
    LIST_TRANSAKSI_MANUAL: `${API_BASE_URL}/kurir/v1/transaksi-manual`,
    LIST_TRANSAKSI_MANUAL_KONSUMEN: `${API_BASE_URL}/kurir/v1/transaksi-manual-konsumen`,
    LIST_AGENT: `${API_BASE_URL}/kurir/v1/list-agen`,
    LIST_PELANGGAN: `${API_BASE_URL}/kurir/v1/list-pelanggan`,
    TAMBAH_TRANSAKSI_MANUAL: `${API_BASE_URL}/kurir/v1/save-transaksi-manual`,
    APPROVE_TRANSAKSI_MANUAL: `${API_BASE_URL}/kurir/v1/approve-transaksi-manual`,
    CEK_NO_HP_REGISTRATION: `${API_BASE_URL}/kurir/register/cek-no-hp`,
    GET_PROVINSI: `${API_BASE_URL}/kurir/register/get-provinsi`,
    GET_KOTA: `${API_BASE_URL}/kurir/register/get-kota`,
    GET_KECAMATAN: `${API_BASE_URL}/kurir/register/get-kecamatan`,
    SEND_OTP_REGISTER: `${API_BASE_URL}/kurir/register/send-otp`,
    VERIFY_OTP_REGISTER: `${API_BASE_URL}/kurir/register/verify-otp`,
    CEK_STATUS_SOPIR: `${API_BASE_URL}/kurir/register/cek-status-sopir`,
    UPDATE_KELENGKAPAN_DATA: `${API_BASE_URL}/kurir/register/update-kelengkapan-data`,
    UPDATE_PROFILE_FOTO: `${API_BASE_URL}/kurir/v1/update-profile-foto`,
    UPDATE_KONSUMEN: `${API_BASE_URL}/kurir/v1/update-konsumen`,
    UPDATE_KONSUMEN_SIMPLE: `${API_BASE_URL}/kurir/v1/update-konsumen-simple`,
    GET_KONSUMEN: `${API_BASE_URL}/kurir/v1/get-pelanggan`,
    ADD_KONSUMEN: `${API_BASE_URL}/kurir/v1/add-pelanggan`,
    DELETE_KONSUMEN: `${API_BASE_URL}/kurir/v1/delete-konsumen`,
    GET_TRANSACTION_HISTORY: `${API_BASE_URL}/v1/get_transaction_history`,
    GET_TOP_UP_METHODS: `${API_BASE_URL}/v1/get_top_up_methods`,
    CREATE_TOP_UP_REQUEST: `${API_BASE_URL}/v1/create_top_up_request`,
    UPLOAD_TOP_UP_PROOF: `${API_BASE_URL}/v1/upload_top_up_proof`,
    CREATE_WITHDRAW_REQUEST: `${API_BASE_URL}/v1/create_withdraw_request`,
    GET_BANK_LIST: `${API_BASE_URL}/v1/get_bank_list`,
    CREATE_TRANSFER_REQUEST: `${API_BASE_URL}/kurir/v1/create_transfer_request`,
    CHECK_USER_BY_PHONE: `${API_BASE_URL}/kurir/v1/check_user_by_phone`,

    LOGOUT: `${API_BASE_URL}/kurir/logout`,
    LIST_FAVORITE_KONSUMEN: `${API_BASE_URL}/kurir/v1/list-favorite-pelanggan`,
    // Kurir Orders
    GET_AVAILABLE_KURIR_ORDERS: `${API_BASE_URL}/kurir/v1/kurir-orders/available`,
    GET_NOTIFICATION_ENDPOINT: `${API_BASE_URL}/kurir/v1/notifications`,
    ACCEPT_KURIR_ORDER: `${API_BASE_URL}/kurir/v1/kurir-orders`,
    CREATE_KURIR_ORDER: `${API_BASE_URL}/kurir/v1/kurir-orders`,
    GET_MY_KURIR_ORDERS: `${API_BASE_URL}/kurir/v1/kurir-orders/my-orders`,
    UPDATE_KURIR_ORDER_STATUS: `${API_BASE_URL}/kurir/v1/kurir-orders`,

    // Live Order
    LIST_LIVE_ORDER: `${API_BASE_URL}/kurir/v1/live-order`,
    CREATE_LIVE_ORDER: `${API_BASE_URL}/kurir/v1/live-order/create`,
    UPDATE_LIVE_ORDER: `${API_BASE_URL}/kurir/v1/live-order/update`,
    GET_DETAIL_PENJUALAN: `${API_BASE_URL}/kurir/v1/live-order/detail-penjualan`,
    GET_KOMISI: `${API_BASE_URL}/kurir/v1/komisi`,
    GET_ADMIN_KURIR: `${API_BASE_URL}/kurir/v1/admin-kurir`,
    AMBIL_ORDER: `${API_BASE_URL}/kurir/v1/live-order/ambil`,
    PICKUP_ORDER: `${API_BASE_URL}/kurir/v1/live-order/pickup`,
    COMPLETE_ORDER: `${API_BASE_URL}/kurir/v1/live-order/complete`,
    SOCKET_URL: SOCKET_URL,
};