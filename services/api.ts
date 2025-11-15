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
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'X-Authorization': `Bearer ${API_TOKEN}`,
                    ...options.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('=== API REQUEST ===');
            console.log('URL:', url);
            console.log('Method:', options.method || 'GET');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            console.log('Content-Type:', response.headers.get('content-type'));

            const responseText = await response.text();
            console.log('Response:', responseText.substring(0, 500));
            // console.log('Response:', responseText);

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
                } else if (response.status === 400 || response.status === 401 || response.status === 429 || response.status === 404) {
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
                        message: data.Message || data.message || `HTTP ${response.status}: ${response.statusText}`,
                    };
                }
            } else {
                console.error('Server returned non-JSON response');
                return {
                    success: false,
                    message: `Server error (${response.status}): ${responseText.substring(0, 100)}`,
                };
            }
        } catch (error: any) {
            console.error('API Error:', error);
            
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Server tidak merespons dalam 30 detik.',
                };
            }
            
            if (error.message?.includes('Network request failed')) {
                return {
                    success: false,
                    message: 'Koneksi jaringan gagal. Periksa koneksi internet Anda.',
                };
            }
            
            return {
                success: false,
                message: `Terjadi kesalahan: ${error.message || 'Unknown error'}`,
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


    async getPendapatanDaily(phoneNumber: string, date?: string, type?: string): Promise<ApiResponse> {
        console.log('getPendapatanDaily called with date:', type);
        const formData = new FormData();
        formData.append('no_hp', phoneNumber);
        formData.append('date', date || new Date().toISOString().split('T')[0]);
        if (type) {
            formData.append('type', type);
        } else {
            formData.append('type', 'all');
        }

        return this.request(API_ENDPOINTS.ORDER_DAILY, {
            method: 'POST',
            body: formData,
        });
    }

    async getPendapatanMonthly(phoneNumber: string, year?: string, month?: string, type?: string): Promise<ApiResponse> {
        console.log(type)
        const formData = new FormData();
        const today = new Date();

        formData.append('no_hp', phoneNumber);
        formData.append('year', year || today.getFullYear().toString());
        formData.append('month', month || (today.getMonth() + 1).toString().padStart(2, '0'));
        if (type) {
            formData.append('type', type);
        } else {
            formData.append('type', 'all');
        }

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


    async getListTransaksiManualKonsumen(
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

        return this.request(API_ENDPOINTS.LIST_TRANSAKSI_MANUAL_KONSUMEN, {
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

    async cekStatusSopir(no_hp: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp', no_hp);

        return this.request(API_ENDPOINTS.CEK_STATUS_SOPIR, {
            method: 'POST',
            body: formData,
        });
    }


    // Cek No HP Registration
    async cekNoHpRegistration(phoneNumber: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp', phoneNumber);

        return this.request(API_ENDPOINTS.CEK_NO_HP_REGISTRATION, {
            method: 'POST',
            body: formData,
        });
    }

    
    async updateKonsumen(data: {
        id_konsumen: string;
        no_hp: string;
        nama_lengkap: string;
        email: string;
        jenis_kelamin: string;
        tanggal_lahir: string;
        tempat_lahir: string;
        provinsi_id: string;
        kota_id: string;
        kecamatan_id: string;
        alamat: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('id_konsumen', data.id_konsumen);
        formData.append('no_hp', data.no_hp);
        formData.append('nama_lengkap', data.nama_lengkap);
        formData.append('email', data.email);
        formData.append('jenis_kelamin', data.jenis_kelamin);
        formData.append('tanggal_lahir', data.tanggal_lahir);
        formData.append('tempat_lahir', data.tempat_lahir);
        formData.append('provinsi_id', data.provinsi_id);
        formData.append('kota_id', data.kota_id);
        formData.append('kecamatan_id', data.kecamatan_id);
        formData.append('alamat', data.alamat);

        return this.request(API_ENDPOINTS.UPDATE_KONSUMEN, {
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

    // Get Provinsi
    async getProvinsi(): Promise<ApiResponse> {
        return this.request(API_ENDPOINTS.GET_PROVINSI, {
            method: 'GET',
        });
    }

    // Get Kota by Provinsi ID
    async getKota(provinsiId: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('provinsi_id', provinsiId);

        return this.request(API_ENDPOINTS.GET_KOTA, {
            method: 'POST',
            body: formData,
        });
    }

    // Get Kecamatan by Kota ID
    async getKecamatan(kotaId: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('kota_id', kotaId);

        return this.request(API_ENDPOINTS.GET_KECAMATAN, {
            method: 'POST',
            body: formData,
        });
    }

    async sendOtpRegister(phoneNumber: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp', phoneNumber);

        return this.request(API_ENDPOINTS.SEND_OTP_REGISTER, {
            method: 'POST',
            body: formData,
        });
    }

    // Verify OTP and Register User
    async verifyOtpRegister(data: {
        no_hp: string;
        nama_lengkap: string;
        email: string;
        jenis_kelamin: string;
        tanggal_lahir: string;
        tempat_lahir: string;
        provinsi_id: string;
        kota_id: string;
        kecamatan_id: string;
        alamat: string;
        otp: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('no_hp', data.no_hp);
        formData.append('nama_lengkap', data.nama_lengkap);
        formData.append('email', data.email);
        formData.append('jenis_kelamin', data.jenis_kelamin);
        formData.append('tanggal_lahir', data.tanggal_lahir);
        formData.append('tempat_lahir', data.tempat_lahir);
        formData.append('provinsi_id', data.provinsi_id);
        formData.append('kota_id', data.kota_id);
        formData.append('kecamatan_id', data.kecamatan_id);
        formData.append('alamat', data.alamat);
        formData.append('otp', data.otp);

        return this.request(API_ENDPOINTS.VERIFY_OTP_REGISTER, {
            method: 'POST',
            body: formData,
        });
    }

    async updateKelengkapanData(data: {
        no_hp: string;
        type_kendaraan: string;
        merek: string;
        plat_nomor: string;
        foto_sim_uri?: string; // File URI from device (optional)
        foto_stnk_uri?: string; // File URI from device (optional)
        foto_diri_uri?: string; // File URI from device (optional)
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('no_hp', data.no_hp);
        
        // Map type_kendaraan string to id_jenis_kendaraan integer
        const idJenisKendaraan = data.type_kendaraan === 'Motor' ? 1 : data.type_kendaraan === 'Mobil' ? 2 : 1;
        formData.append('id_jenis_kendaraan', idJenisKendaraan.toString());
        formData.append('type_kendaraan', data.type_kendaraan);
        formData.append('merek', data.merek);
        formData.append('plat_nomor', data.plat_nomor);

        // Upload file sebagai multipart/form-data hanya jika URI ada
        if (data.foto_sim_uri && data.foto_sim_uri.trim() !== '') {
            const uriParts = data.foto_sim_uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('foto_sim', {
                uri: data.foto_sim_uri,
                name: `sim_${data.no_hp}_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }

        if (data.foto_stnk_uri && data.foto_stnk_uri.trim() !== '') {
            const uriPartsStnk = data.foto_stnk_uri.split('.');
            const fileTypeStnk = uriPartsStnk[uriPartsStnk.length - 1];
            
            formData.append('foto_stnk', {
                uri: data.foto_stnk_uri,
                name: `stnk_${data.no_hp}_${Date.now()}.${fileTypeStnk}`,
                type: `image/${fileTypeStnk}`,
            } as any);
        }

        if (data.foto_diri_uri && data.foto_diri_uri.trim() !== '') {
            const uriPartsDiri = data.foto_diri_uri.split('.');
            const fileTypeDiri = uriPartsDiri[uriPartsDiri.length - 1];
            
            formData.append('foto_diri', {
                uri: data.foto_diri_uri,
                name: `diri_${data.no_hp}_${Date.now()}.${fileTypeDiri}`,
                type: `image/${fileTypeDiri}`,
            } as any);
        }

        console.log('FormData contents:');
        // Log FormData contents (this is tricky with FormData, but we can try)
        for (let pair of (formData as any)._parts) {
            console.log(pair[0] + ': ' + (typeof pair[1] === 'object' ? 'File object' : pair[1]));
        }

        return this.request(API_ENDPOINTS.UPDATE_KELENGKAPAN_DATA, {
            method: 'POST',
            body: formData,
        });
    }

    async updateProfileFoto(data: {
        no_hp: string;
        foto_diri_uri?: string; // File URI from device (optional)
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('no_hp', data.no_hp);
        
        if (data.foto_diri_uri && data.foto_diri_uri.trim() !== '') {
            const uriPartsDiri = data.foto_diri_uri.split('.');
            const fileTypeDiri = uriPartsDiri[uriPartsDiri.length - 1];
            
            formData.append('foto_diri', {
                uri: data.foto_diri_uri,
                name: `diri_${data.no_hp}_${Date.now()}.${fileTypeDiri}`,
                type: `image/${fileTypeDiri}`,
            } as any);
        }

        for (let pair of (formData as any)._parts) {
            console.log(pair[0] + ': ' + (typeof pair[1] === 'object' ? 'File object' : pair[1]));
        }

        return this.request(API_ENDPOINTS.UPDATE_PROFILE_FOTO, {
            method: 'POST',
            body: formData,
        });
    }


    // Get Konsumen
    async getKonsumen(idKonsumen: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('id_konsumen', idKonsumen);

        return this.request(API_ENDPOINTS.GET_KONSUMEN, {
            method: 'POST',
            body: formData,
        });
    }

    async addKonsumen(data: {
        id_konsumen: string;
        nama_lengkap: string;
        no_hp: string;
        alamat_lengkap: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('referral_id', data.id_konsumen);
        formData.append('nama_lengkap', data.nama_lengkap);
        formData.append('no_hp', data.no_hp);
        formData.append('alamat_lengkap', data.alamat_lengkap);

        return this.request(API_ENDPOINTS.ADD_KONSUMEN, {
            method: 'POST',
            body: formData,
        });
    }

        // Update Kontak (untuk edit kontak sederhana)
    async updateKontak(data: {
        id_konsumen: string;
        nama_lengkap: string;
        no_hp: string;
        alamat_lengkap: string;
        no_hp_user: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('id_konsumen', data.id_konsumen);
        formData.append('nama_lengkap', data.nama_lengkap);
        formData.append('no_hp', data.no_hp);
        formData.append('alamat', data.alamat_lengkap);
        formData.append('no_hp_user', data.no_hp_user);

        return this.request(API_ENDPOINTS.UPDATE_KONSUMEN, {
            method: 'POST',
            body: formData,
        });
    }

    // Delete Kontak (update referral_id untuk soft delete)
    async deleteKontak(data: {
        token: string;
        id_konsumen: string;
        no_hp_user: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('id_konsumen', data.id_konsumen);
        formData.append('no_hp', data.no_hp_user);
        formData.append('token', data.token);

        return this.request(API_ENDPOINTS.DELETE_KONSUMEN, {
            method: 'POST',
            body: formData,
        });
    }

    // Get Transaction History
    async getTransactionHistory(
        phoneNumber: string,
        startDate?: string,
        endDate?: string
    ): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp', phoneNumber);

        if (startDate) {
            formData.append('start_date', startDate);
        }

        if (endDate) {
            formData.append('end_date', endDate);
        }

        return this.request(API_ENDPOINTS.GET_TRANSACTION_HISTORY, {
            method: 'POST',
            body: formData,
        });
    }

    // Get Top Up Methods
    async getTopUpMethods(): Promise<ApiResponse> {
        return this.request(API_ENDPOINTS.GET_TOP_UP_METHODS, {
            method: 'GET',
        });
    }

    // Create Top Up Request
    async createTopUpRequest(data: {
        no_hp: string;
        amount: string;
        bank_id: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp', data.no_hp);
        formData.append('amount', data.amount);
        formData.append('bank_id', data.bank_id);

        return this.request(API_ENDPOINTS.CREATE_TOP_UP_REQUEST, {
            method: 'POST',
            body: formData,
        });
    }

    // Upload Top Up Proof
    async uploadTopUpProof(data: {
        top_up_id: string;
        bukti_transfer_uri: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('top_up_id', data.top_up_id);

        if (data.bukti_transfer_uri && data.bukti_transfer_uri.trim() !== '') {
            const uriParts = data.bukti_transfer_uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('bukti_transfer', {
                uri: data.bukti_transfer_uri,
                name: `bukti_transfer_${data.top_up_id}_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }
        console.log(JSON.stringify(formData))
        return this.request(API_ENDPOINTS.UPLOAD_TOP_UP_PROOF, {
            method: 'POST',
            body: formData,
        });
    }

    // Create Withdraw Request
    async createWithdrawRequest(data: {
        no_hp: string;
        amount: string;
        bank_name: string;
        account_name: string;
        account_number: string;
        bank_id?: string | null;
    }): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp', data.no_hp);
        formData.append('amount', data.amount);
        formData.append('bank_name', data.bank_name);
        formData.append('account_name', data.account_name);
        formData.append('account_number', data.account_number);
        
        if (data.bank_id) {
            formData.append('bank_id', data.bank_id);
        }

        return this.request(API_ENDPOINTS.CREATE_WITHDRAW_REQUEST, {
            method: 'POST',
            body: formData,
        });
    }

    // Get Bank List
    async getBankList(): Promise<ApiResponse> {
        return this.request(API_ENDPOINTS.GET_BANK_LIST, {
            method: 'GET',
        });
    }

    // Create Transfer Request
    async createTransferRequest(data: {
        no_hp_sender: string;
        no_hp_receiver: string;
        amount: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp_sender', data.no_hp_sender);
        formData.append('no_hp_receiver', data.no_hp_receiver);
        formData.append('amount', data.amount);

        return this.request(API_ENDPOINTS.CREATE_TRANSFER_REQUEST, {
            method: 'POST',
            body: formData,
        });
    }

    // Check User by Phone Number
    async checkUserByPhone(phoneNumber: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('no_hp', phoneNumber);

        return this.request(API_ENDPOINTS.CHECK_USER_BY_PHONE, {
            method: 'POST',
            body: formData,
        });
    }


    async getAvailableKurirOrders(): Promise<ApiResponse> {
        return this.request(API_ENDPOINTS.GET_AVAILABLE_KURIR_ORDERS);
    }

    async acceptKurirOrder(orderId: number, kurirId: number): Promise<ApiResponse> {
        return this.request(`${API_ENDPOINTS.ACCEPT_KURIR_ORDER}/${orderId}/accept`, {
            method: 'POST',
            body: JSON.stringify({ kurir_id: kurirId }),
        });
    }

    async createKurirOrder(orderData: any): Promise<ApiResponse> {
        return this.request(API_ENDPOINTS.CREATE_KURIR_ORDER, {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async getMyKurirOrders(): Promise<ApiResponse> {
        return this.request(API_ENDPOINTS.GET_MY_KURIR_ORDERS);
    }

    async updateKurirOrderStatus(orderId: number, statusData: any): Promise<ApiResponse> {
        return this.request(`${API_ENDPOINTS.UPDATE_KURIR_ORDER_STATUS}/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(statusData),
        });
    }


    // Create Live Order
    async createLiveOrder(data: {
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
        produk?: Array<{
            nama_barang: string;
            qty: string;
            satuan: string;
            harga: string;
        }>;
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

        // Add produk data for FOOD/SHOP services
        if (data.produk && data.produk.length > 0) {
            // Convert produk array to JSON string
            formData.append('produk', JSON.stringify(data.produk));
        }

        return this.request(API_ENDPOINTS.CREATE_LIVE_ORDER, {
            method: 'POST',
            body: formData,
        });
    }

    async getListLiveOrder(
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

        return this.request(API_ENDPOINTS.LIST_LIVE_ORDER, {
            method: 'POST',
            body: formData,
        });
    }

    // Ambil Order (for Kurir)
    async ambilOrder(data: {
        id_transaksi: string;
        btn_simpan: string;
        no_hp: string;
        id_sopir: string;
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('id_transaksi', data.id_transaksi);
        formData.append('btn_simpan', data.btn_simpan);
        formData.append('no_hp', data.no_hp);
        formData.append('id_sopir', data.id_sopir);

        return this.request(API_ENDPOINTS.AMBIL_ORDER, {
            method: 'POST',
            body: formData,
        });
    }

    // Pickup Order (for Kurir)
    async pickupOrder(data: {
        id_transaksi: string;
        btn_simpan: string;
        no_hp: string;
        id_sopir: string;
        customer_ready?: boolean; // For RIDE service
        foto_pickup_uri?: string; // For FOOD/SHOP/SEND services
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('id_transaksi', data.id_transaksi);
        formData.append('btn_simpan', data.btn_simpan);
        formData.append('no_hp', data.no_hp);
        formData.append('id_sopir', data.id_sopir);

        // Add customer ready status for RIDE service
        if (data.customer_ready !== undefined) {
            formData.append('customer_ready', data.customer_ready ? '1' : '0');
        }

        // Add pickup photo for FOOD/SHOP/SEND services
        if (data.foto_pickup_uri && data.foto_pickup_uri.trim() !== '') {
            const uriParts = data.foto_pickup_uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('foto_pickup', {
                uri: data.foto_pickup_uri,
                name: `pickup_${data.id_transaksi}_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }

        return this.request(API_ENDPOINTS.PICKUP_ORDER, {
            method: 'POST',
            body: formData,
        });
    }

    // Complete Order (for Kurir)
    async completeOrder(data: {
        id_transaksi: string;
        btn_simpan: string;
        no_hp: string;
        id_sopir: string;
        customer_received?: boolean; // For RIDE service
        foto_complete_uri?: string; // For FOOD/SHOP/SEND services
    }): Promise<ApiResponse> {
        const formData = new FormData();

        formData.append('id_transaksi', data.id_transaksi);
        formData.append('btn_simpan', data.btn_simpan);
        formData.append('no_hp', data.no_hp);
        formData.append('id_sopir', data.id_sopir);

        // Add customer received status for RIDE service
        if (data.customer_received !== undefined) {
            formData.append('customer_received', data.customer_received ? '1' : '0');
        }

        // Add complete photo for FOOD/SHOP/SEND services
        if (data.foto_complete_uri && data.foto_complete_uri.trim() !== '') {
            const uriParts = data.foto_complete_uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('foto_complete', {
                uri: data.foto_complete_uri,
                name: `complete_${data.id_transaksi}_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }

        return this.request(API_ENDPOINTS.COMPLETE_ORDER, {
            method: 'POST',
            body: formData,
        });
    }

    // Update Live Order
    async updateLiveOrder(orderId: string, data: any): Promise<ApiResponse> {
        const formData = new FormData();

        // Add order ID
        formData.append('id', orderId);

        // Add all data fields
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                // Special handling for produk array - convert to JSON string
                if (key === 'produk' && Array.isArray(data[key])) {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key].toString());
                }
            }
        });
        console.log('Updating Live Order with data:', formData);

        return this.request(API_ENDPOINTS.UPDATE_LIVE_ORDER, {
            method: 'POST',
            body: formData,
        });
    }

    // Get Detail Penjualan (untuk mendapatkan produk dari live order)
    async getDetailPenjualan(idPenjualan: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('id_penjualan', idPenjualan);

        return this.request(API_ENDPOINTS.GET_DETAIL_PENJUALAN, {
            method: 'POST',
            body: formData,
        });
    }

    // Get Komisi data untuk transaksi yang sudah FINISH
    async getKomisi(idTransaksi: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('id_transaksi', idTransaksi);

        return this.request(API_ENDPOINTS.GET_KOMISI, {
            method: 'POST',
            body: formData,
        });
    }

    // Get Potongan Admin data untuk transaksi yang sudah FINISH
    async getAdminKurir(idTransaksi: string): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('id_transaksi', idTransaksi);

        return this.request(API_ENDPOINTS.GET_ADMIN_KURIR, {
            method: 'POST',
            body: formData,
        });
    }
}

export const apiService = new ApiService();