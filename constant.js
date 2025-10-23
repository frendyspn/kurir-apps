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
};