import { API_ENDPOINTS, API_TOKEN } from '../constant';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiService {
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'X-Authorization': `Bearer ${API_TOKEN}`,
          ...options.headers,
        },
      });

      console.log('=== API REQUEST ===');
      console.log('URL:', url);
      console.log('Method:', options.method || 'GET');
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));

      const responseText = await response.text();
      console.log('Response:', responseText.substring(0, 500));
      console.log('Response:', responseText);

      // Cek apakah response adalah JSON
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = JSON.parse(responseText);

        if (response.ok) {
            console.log('masuk OK')
          return {
            success: true,
            data: data,
            message: data.Message || 'Success',
          };
        } else if (response.status === 400 || response.status === 401) {
            console.log('masuk 400')
          return {
            success: false,
            data: data,
            message: data.Message || data.message || 'Request failed',
          };
        } else {
            console.log('masuk ELSE')
          return {
            success: false,
            message: data.Message || data.message || 'Request failed',
          };
        }
      } else {
        console.error('Server returned non-JSON response');
        return {
          success: false,
          message: 'Server error, silakan coba lagi nanti',
        };
      }
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan jaringan, silakan coba lagi',
      };
    }
  }

  // Login - Kirim OTP
  async login(phoneNumber: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('username', phoneNumber);

    return this.request(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: formData,
    });
  }

  // Verifikasi OTP
  async verifyOtp(phoneNumber: string, otp: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('username', phoneNumber);
    formData.append('otp', otp);

    return this.request(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      body: formData,
    });
  }

  // Resend OTP (sama dengan login)
  async resendOtp(phoneNumber: string): Promise<ApiResponse> {
    return this.login(phoneNumber);
  }

  // Get Balance
  async getBalance(phoneNumber: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('no_hp', phoneNumber);

    return this.request(API_ENDPOINTS.BALANCE, {
      method: 'POST',
      body: formData,
    });
  }


  async getPendapatanDaily(phoneNumber: string, date?: string): Promise<ApiResponse> {
    console.log('getPendapatanDaily called with date:', date);
    const formData = new FormData();
    formData.append('no_hp', phoneNumber);
    formData.append('date', date || new Date().toISOString().split('T')[0]);

    return this.request(API_ENDPOINTS.ORDER_DAILY, {
      method: 'POST',
      body: formData,
    });
  }

  async getPendapatanMonthly(phoneNumber: string, year?: string, month?: string): Promise<ApiResponse> {
    const formData = new FormData();
    const today = new Date();
    
    formData.append('no_hp', phoneNumber);
    formData.append('year', year || today.getFullYear().toString());
    formData.append('month', month || (today.getMonth() + 1).toString().padStart(2, '0'));

    return this.request(API_ENDPOINTS.ORDER_MONTHLY, {
      method: 'POST',
      body: formData,
    });
  }

  // Get Jenis Layanan
  async getJenisLayanan(): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.JENIS_LAYANAN, {
      method: 'GET',
    });
  }

  // Get List Transaksi Manual
  async getListTransaksiManual(
    phoneNumber: string,
    startDate: string,
    endDate: string,
    idKonsumen?: string,
    serviceType?: string,
    searchQuery?: string
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('no_hp', phoneNumber);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    
    if (idKonsumen) {
      formData.append('id_konsumen', idKonsumen);
    }
    
    if (serviceType) {
      formData.append('service_type', serviceType);
    }
    
    if (searchQuery) {
      formData.append('search', searchQuery);
    }

    return this.request(API_ENDPOINTS.LIST_TRANSAKSI_MANUAL, {
      method: 'POST',
      body: formData,
    });
  }

  // Get List Agent
  async getListAgent(phoneNumber: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('no_hp', phoneNumber);

    return this.request(API_ENDPOINTS.LIST_AGENT, {
      method: 'POST',
      body: formData,
    });
  }

  // Get List Pelanggan
  async getListPelanggan(phoneNumber: string, query?: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('no_hp', phoneNumber);
    
    if (query) {
      formData.append('search', query);
    }

    return this.request(API_ENDPOINTS.LIST_PELANGGAN, {
      method: 'POST',
      body: formData,
    });
  }

  // Create Transaksi Manual
  async createTransaksiManual(data: {
    no_hp_pelanggan: string;
    no_hp_pelanggan_baru?: string;
    nama_pelanggan?: string;
    nama_layanan: string;
    alamat_penjemputan: string;
    alamat_tujuan: string;
    biaya_antar: string;
    nama_toko?: string;
    agen_kurir: string;
    tanggal_order: string;
    btn_simpan: string;
    no_hp: string;
  }): Promise<ApiResponse> {
    const formData = new FormData();
    
    formData.append('no_hp_pelanggan', data.no_hp_pelanggan);
    if (data.no_hp_pelanggan_baru) {
      formData.append('no_hp_pelanggan_baru', data.no_hp_pelanggan_baru);
    }
    if (data.nama_pelanggan) {
      formData.append('nama_pelanggan', data.nama_pelanggan);
    }
    formData.append('nama_layanan', data.nama_layanan);
    formData.append('alamat_penjemputan', data.alamat_penjemputan);
    formData.append('alamat_tujuan', data.alamat_tujuan);
    formData.append('biaya_antar', data.biaya_antar);
    if (data.nama_toko) {
      formData.append('nama_toko', data.nama_toko);
    }
    formData.append('agen_kurir', data.agen_kurir);
    formData.append('tanggal_order', data.tanggal_order);
    formData.append('btn_simpan', data.btn_simpan);
    formData.append('no_hp', data.no_hp);

    return this.request(API_ENDPOINTS.TAMBAH_TRANSAKSI_MANUAL, {
      method: 'POST',
      body: formData,
    });
  }

  // Approve Transaksi Manual
  async approveTransaksi(data: {
    id_transaksi: string;
    btn_simpan: string;
    text_approve: string;
    id_sopir: string;
    no_hp: string;
    biaya_antar: string;
  }): Promise<ApiResponse> {
    const formData = new FormData();
    
    formData.append('id_transaksi', data.id_transaksi);
    formData.append('btn_simpan', data.btn_simpan);
    formData.append('text_approve', data.text_approve);
    formData.append('id_sopir', data.id_sopir);
    formData.append('no_hp', data.no_hp);
    formData.append('nama_layanan', '-');
    formData.append('alamat_penjemputan', '-');
    formData.append('alamat_tujuan', '-');
    formData.append('biaya_antar', data.biaya_antar);
    formData.append('agen_kurir', '-');

    return this.request(API_ENDPOINTS.APPROVE_TRANSAKSI_MANUAL, {
      method: 'POST',
      body: formData,
    });
  }
     
}

export const apiService = new ApiService();