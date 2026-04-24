<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;
use Log;
use Cache;
use Carbon\Carbon;

class TransaksiManualController extends Controller
{
    public function __construct(Request $req)
    {
        if ($req->token == '') {
            return response()->json(['message' => 'Token tidak ditemukan'], 401);
        }
        cekTokenLogin($req->token);
    }

    /**
     * Simpan atau update transaksi manual
     * 
     * Validasi request params:
     * - no_hp: string (required) - nomor HP kurir
     * - nama_layanan: string (required) - RIDE|SEND|FOOD|SHOP
     * - alamat_penjemputan: string (required)
     * - alamat_tujuan: string (required)
     * - biaya_antar: numeric (required)
     * - agen_kurir: string (required) - id_konsumen agen
     * - nama_toko: string (required for SHOP/FOOD)
     * - no_hp_pelanggan: string (pelanggan phone, "-" jika baru)
     * - no_hp_pelanggan_baru: string (jika pelanggan baru)
     * - nama_pelanggan: string (jika pelanggan baru)
     * - btn_simpan: string (create|update|revisi|delete|approve)
     * - id_transaksi: required for update/revisi/delete/approve
     * - alasan_revisi: required for revisi
     * - alasan_pembatalan: required for delete
     * - text_approve: string (must be "SETUJU" for approve)
     * - id_sopir: int (required for approve)
     */
    public function simpanTransaksi(Request $req)
    {
        Log::info('TransaksiManualController::simpanTransaksi', $req->all());

        $messages = [
            'no_hp.required' => 'No HP Kurir Harus Diisi',
            'nama_layanan.required' => 'Nama Layanan Harus Dipilih',
            'alamat_penjemputan.required' => 'Alamat Penjemputan Harus Diisi',
            'alamat_tujuan.required' => 'Alamat Tujuan Harus Diisi',
            'biaya_antar.required' => 'Biaya Antar Harus Diisi',
            'biaya_antar.numeric' => 'Biaya Antar Harus Angka',
            'nama_toko.required' => 'Nama Toko/Resto Harus Diisi',
            'agen_kurir.required' => 'Agen Kurir Harus Diisi',
            'no_hp_pelanggan_baru.required' => 'No HP Pelanggan Harus Diisi',
            'no_hp_pelanggan_baru.numeric' => 'No HP Pelanggan Harus Angka Saja',
        ];

        // Validasi dasar
        $validator = \Validator::make($req->all(), [
            'no_hp' => 'required',
            'nama_layanan' => 'required',
            'alamat_penjemputan' => 'required',
            'alamat_tujuan' => 'required',
            'biaya_antar' => 'required|numeric',
            'agen_kurir' => 'required',
        ], $messages);

        if ($validator->fails()) {
            header('Content-Type: application/json');
            http_response_code(422);
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validasi untuk SHOP dan FOOD
        if ($req->nama_layanan == 'SHOP' || $req->nama_layanan == 'FOOD') {
            $validator_2 = \Validator::make($req->all(), [
                'nama_toko' => 'required',
            ], $messages);

            if ($validator_2->fails()) {
                header('Content-Type: application/json');
                http_response_code(422);
                return response()->json([
                    'success' => false,
                    'message' => 'Nama Toko/Resto Harus Diisi',
                    'errors' => $validator_2->errors()
                ], 422);
            }
        }

        // Validasi pelanggan baru
        if ($req->no_hp_pelanggan == '-' && $req->no_hp_pelanggan_baru == '') {
            header('Content-Type: application/json');
            http_response_code(422);
            return response()->json([
                'success' => false,
                'message' => 'No HP Pelanggan Harus Diisi'
            ], 422);
        }

        // Get kurir data from no_hp
        $getKurir = DB::table('rb_sopir as a')
            ->select('a.*','b.nama_lengkap')
            ->leftJoin('rb_konsumen as b', 'b.id_konsumen', 'a.id_konsumen')
            ->where('b.no_hp', $req->no_hp)
            ->first();

        if (!$getKurir) {
            header('Content-Type: application/json');
            http_response_code(404);
            return response()->json([
                'success' => false,
                'message' => 'Data kurir tidak ditemukan'
            ], 404);
        }

        // Hitung potongan komisi berdasarkan type_kurir dan referral
        $reffKonsumen = DB::table('rb_konsumen')->where('no_hp', $req->no_hp_pelanggan ?? $req->no_hp)->first()->referral_id ?? '';
        if ($getKurir->type_kurir == 'khusus') {
            if($reffKonsumen == $getKurir->id_konsumen){
                $potonganKomisi = $req->biaya_antar * ($this->getConfig('potongan_kurir_khusus_refferal') / 100);
            } else {
                if($getKurir->total_komisi != 0){
                    $potonganKomisi = $req->biaya_antar * ($getKurir->total_komisi / 100);
                } else {
                    $potonganKomisi = $req->biaya_antar * ($this->getConfig('potongan_kurir_khusus') / 100);
                }
            }
        } else if ($getKurir->type_kurir == 'inti') {
            if($reffKonsumen == $getKurir->id_konsumen){
                $potonganKomisi = $req->biaya_antar * ($this->getConfig('potongan_kurir_inti_refferal') / 100);
            } else {
                if($getKurir->total_komisi != 0){
                    $potonganKomisi = $req->biaya_antar * ($getKurir->total_komisi / 100);
                } else {
                    $potonganKomisi = $req->biaya_antar * ($this->getConfig('potongan_kurir_inti') / 100);
                }
            }
        } else {
            if($reffKonsumen == $getKurir->id_konsumen){
                $potonganKomisi = $req->biaya_antar * ($this->getConfig('potongan_kurir_umum_refferal') / 100);
            } else {
                if($getKurir->total_komisi != 0){
                    $potonganKomisi = $req->biaya_antar * ($getKurir->total_komisi / 100);
                } else {
                    $potonganKomisi = $req->biaya_antar * ($this->getConfig('potongan_kurir_umum') / 100);
                }
            }
        }

        try {
            $action = $req->btn_simpan ?? 'create';

            if ($action === 'create') {
                return $this->createTransaction($req, $getKurir, $potonganKomisi);
            } elseif ($action === 'update') {
                return $this->updateTransaction($req, $getKurir, $potonganKomisi);
            } elseif ($action === 'revisi') {
                return $this->revisiTransaction($req);
            } elseif ($action === 'delete') {
                return $this->deleteTransaction($req);
            } elseif ($action === 'approve') {
                return $this->approveTransaction($req, $potonganKomisi);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Action tidak dikenali'
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('TransaksiManualController::simpanTransaksi error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            DB::rollBack();
            header('Content-Type: application/json');
            http_response_code(500);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new transaction
     */
    private function createTransaction(Request $req, $getKurir, $potonganKomisi)
    {
        DB::beginTransaction();
        try {
            $id_pemesan = null;

            // Handle pelanggan
            $pemesan = DB::table('rb_konsumen')->where('no_hp', $req->no_hp_pelanggan ?? $req->no_hp)->first();
            
            if (!$pemesan) {
                // Buat pelanggan baru
                $dtKonsumen = [
                    'username' => $req->no_hp_pelanggan_baru,
                    'nama_lengkap' => $req->nama_pelanggan,
                    'email' => '-',
                    'jenis_kelamin' => 'Laki-laki',
                    'tanggal_lahir' => date('Y-m-d'),
                    'tempat_lahir' => '-',
                    'alamat_lengkap' => $req->alamat_tujuan,
                    'kecamatan_id' => '0',
                    'kota_id' => '0',
                    'provinsi_id' => '0',
                    'no_hp' => $req->no_hp_pelanggan_baru,
                    'foto' => '-',
                    'tanggal_daftar' => date('Y-m-d'),
                    'token' => 'N',
                    'referral_id' => $getKurir->id_konsumen,
                    'verifikasi' => 'N',
                    'password' => rand(1111111111, 9999999999),
                ];

                $id_pemesan = DB::table('rb_konsumen')->insertGetId($dtKonsumen);
            } else {
                $id_pemesan = $pemesan->id_konsumen;
            }
            
            // Prepare data transaksi
            $dtInsert = [
                'source' => 'MANUAL_KURIR',
                'tarif' => $req->biaya_antar,
                'id_agen' => $req->agen_kurir,
                'id_pemesan' => $id_pemesan,
                'alamat_jemput' => $req->alamat_penjemputan,
                'titik_jemput' => $req->titik_jemput,
                'alamat_antar' => $req->alamat_tujuan,
                'titik_antar' => $req->titik_antar,
                'jenis_layanan' => $req->nama_layanan,
                'service' => $req->nama_layanan,
                'metode_pembayaran' => 'CASH',
                'pemberi_barang' => $req->nama_toko ?? '',
                'tanggal_order' => $req->tanggal_order ?? date('Y-m-d H:i:s'),
                'id_sopir' => $getKurir->id_sopir,
                'kode_order' => time() . rand(00, 99),
                'status' => 'FINISH',
            ];

            Log::info($req->is_favorite);
            Log::info($getKurir->id_konsumen .' || '. $id_pemesan);
            
            $id_transaksi = DB::table('kurir_order')->insertGetId($dtInsert);

            // Handle favorite contacts
            if ($req->is_favorite) {
                $cekExist = DB::table('rb_konsumen_favorite')->where('id_user',$getKurir->id_konsumen)->where('id_konsumen', $id_pemesan)->first();
                    
                if ($cekExist) {
                    Log::info('EXIST');
                    if ($req->is_favorite == false) {
                        Log::info('HAPUS FAVORITE');
                        DB::table('rb_konsumen_favorite')->where('id_user',$getKurir->id_konsumen)->where('id_konsumen', $id_pemesan)->delete();
                    } else {
                        Log::info('EXIST NOT ACTION');
                    }
                } else {
                    Log::info('NOT EXIST');
                    if ($req->is_favorite == true) {
                        Log::info('INSERT');
                        DB::table('rb_konsumen_favorite')
                        ->insert([
                            'id_user' => $getKurir->id_konsumen,
                            'id_konsumen' => $id_pemesan
                        ]);
                    } else {
                        Log::info('NOT EXIST NO ACTION');
                    }
                }
            } else {
                $cekExist = DB::table('rb_konsumen_favorite')->where('id_user',$getKurir->id_konsumen)->where('id_konsumen', $id_pemesan)->first();
                if($cekExist){
                    DB::table('rb_konsumen_favorite')->where('id_user',$getKurir->id_konsumen)->where('id_konsumen', $id_pemesan)->delete();
                }
            }

            // Wallet dan komisi hanya jika agen == 1
            if ($getKurir->agen == 1) {
                DB::table('rb_wallet_users')->insert([
                    'id_konsumen' => $getKurir->id_konsumen,
                    'amount' => $potonganKomisi,
                    'trx_type' => 'debit',
                    'note' => 'Potongan admin kurir transaksi manual',
                    'created_at' => date('Y-m-d H:i:s'),
                    'source' => 'KURIR',
                    'source_id' => $id_transaksi,
                    'type' => 'KOMISI',
                ]);

                // Bagi komisi
                $bagiKomisi = $this->pembagianKomisiKurir($potonganKomisi, $getKurir->id_sopir, $id_transaksi);
            } else {
                // Send FCM notification untuk verifikasi
                $dtNavigate = [
                    'transaction_id' => (string) $id_transaksi,
                    'navigate_to' => 'live-order'
                ];
                fcm_notify(
                    $req->agen_kurir,
                    "Perlu Verifikasi",
                    "Halo kak ".$getKurir->nama_lengkap.", silahkan cek ada transaksi yang perlu diverifikasi",
                    $dtNavigate
                );
            }

            DB::commit();

            header('Content-Type: application/json');
            return response()->json([
                'success' => true,
                'message' => 'Sukses Menyimpan Transaksi Manual',
                'data' => [
                    'id_transaksi' => $id_transaksi,
                    'kode_order' => $dtInsert['kode_order']
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create transaksi error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Update existing transaction
     */
    private function updateTransaction(Request $req, $getKurir, $potonganKomisi)
    {
        DB::beginTransaction();
        try {
            $id_transaksi = $req->id_transaksi;
            
            // 1. Pastikan transaksi ada & dalam batas 48 jam
            $transaksi = DB::table('kurir_order')->where('id', $id_transaksi)->first();
            if (!$transaksi) {
                DB::rollBack();
                header('Content-Type: application/json');
                http_response_code(404);
                return response()->json(['success' => false, 'message' => 'ID transaksi tidak ditemukan'], 404);
            }
            $selisihJam = (time() - strtotime($transaksi->tanggal_order)) / 3600;
            if ($selisihJam > 48) {
                DB::rollBack();
                header('Content-Type: application/json');
                http_response_code(400);
                return response()->json(['success' => false, 'message' => 'Transaksi sudah melewati batas waktu edit (48 jam)'], 400);
            }

            // 2. Ambil data kurir untuk hitung ulang komisi
            $getKurirData = DB::table('rb_sopir')->where('id_sopir', $transaksi->id_sopir)->first();

            // 3. Hapus semua wallet entry lama milik transaksi ini
            DB::table('rb_wallet_users')
                ->where('source', 'KURIR')
                ->where('source_id', $id_transaksi)
                ->delete();

            // 4. Update data transaksi
            $biayaAntar = $req->biaya_antar;
            $titikJemput = $req->titik_jemput ?? '';
            $titikAntar = $req->titik_antar ?? '';
            $namaLayanan = $req->nama_layanan;
            $agenKurir = $req->agen_kurir;
            $tanggalOrder = $req->tanggal_order;
            $peritaBarang = $req->nama_toko ?? $transaksi->pemberi_barang ?? '';
            
            Log::info('About to update transaction ID: ' . $id_transaksi);
            
            $affected = DB::table('kurir_order')
                ->where('id', $id_transaksi)
                ->update([
                    'tarif' => $biayaAntar,
                    'alamat_jemput' => $req->alamat_penjemputan,
                    'alamat_antar' => $req->alamat_tujuan,
                    'titik_jemput' => $titikJemput,
                    'titik_antar' => $titikAntar,
                    'jenis_layanan' => $namaLayanan,
                    'service' => $namaLayanan,
                    'id_agen' => $agenKurir,
                    'tanggal_order' => $tanggalOrder,
                    'pemberi_barang' => $peritaBarang,
                    'updated_at' => DB::raw('NOW()')
                ]);

            Log::info('Update executed for transaction ID: ' . $id_transaksi . ' (rows affected: ' . $affected . ')');
            
            // Clear any caches related to this transaction
            if (Cache::has('kurir_order_' . $id_transaksi)) {
                Cache::forget('kurir_order_' . $id_transaksi);
            }
            if (Cache::has('transaksi_' . $id_transaksi)) {
                Cache::forget('transaksi_' . $id_transaksi);
            }

            // 5. Hitung ulang komisi dari tarif baru (optional - commented in original)
            // if ($getKurirData) {
            //     DB::table('rb_wallet_users')->insert([
            //         'id_konsumen' => $getKurirData->id_konsumen,
            //         'amount'      => $potonganKomisi,
            //         'trx_type'    => 'debit',
            //         'note'        => 'Potongan admin kurir transaksi manual (direvisi)',
            //         'created_at'  => date('Y-m-d H:i:s'),
            //         'source'      => 'KURIR',
            //         'source_id'   => $id_transaksi,
            //         'type'        => 'KOMISI',
            //     ]);
            //     $this->pembagianKomisiKurir($potonganKomisi, $getKurirData->id_sopir, $id_transaksi);
            // }

            DB::commit();
            Log::info('Transaksi berhasil diperbarui');
            header('Content-Type: application/json');
            return response()->json(['success' => true, 'message' => 'Transaksi berhasil diperbarui']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update transaksi manual error: ' . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            return response()->json(['success' => false, 'message' => 'Terjadi kesalahan saat memperbarui transaksi'], 500);
        }
    }

    /**
     * Revise transaction
     */
    private function revisiTransaction(Request $req)
    {
        $id_transaksi = $req->id_transaksi;

        if (!$id_transaksi) {
            header('Content-Type: application/json');
            http_response_code(400);
            return response()->json([
                'success' => false,
                'message' => 'ID transaksi tidak ditemukan'
            ], 400);
        }

        $transaksi = DB::table('kurir_order')->where('id', $id_transaksi)->first();
        if (!$transaksi) {
            header('Content-Type: application/json');
            http_response_code(404);
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Mark as revisi (change status to RETURN with reason)
            DB::table('kurir_order')
                ->where('id', $id_transaksi)
                ->update([
                    'status' => 'RETURN',
                    'alasan_pembatalan' => $req->alasan_revisi,
                    'updated_at' => now()
                ]);

            Cache::forget('kurir_order_' . $id_transaksi);

            DB::commit();

            header('Content-Type: application/json');
            return response()->json([
                'success' => true,
                'message' => 'Transaksi dikembalikan untuk revisi',
                'data' => ['id_transaksi' => $id_transaksi]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Revisi transaksi error', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Delete transaction
     */
    public function deleteTransaction(Request $req)
    {
        $id_transaksi = $req->id_transaksi;

        if (!$id_transaksi) {
            header('Content-Type: application/json');
            http_response_code(400);
            return response()->json([
                'success' => false,
                'message' => 'ID transaksi tidak ditemukan'
            ], 400);
        }

        $transaksi = DB::table('kurir_order')->where('id', $id_transaksi)->first();
        if (!$transaksi) {
            header('Content-Type: application/json');
            http_response_code(404);
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Balikkan komisi/fee wallet yang sudah pernah diposting untuk transaksi ini.
            // debit -> credit, credit -> debit
            $walletRows = DB::table('rb_wallet_users')
                ->where('source', 'KURIR')
                ->where('source_id', $id_transaksi)
                ->where(function ($q) {
                    $q->whereNull('note')
                      ->orWhere('note', 'not like', 'Pembatalan transaksi no %');
                })
                ->get();

            $walletPembalik = [];
            $catatanPembatalan = 'Pembatalan transaksi no ' . ($transaksi->kode_order ?? $id_transaksi);

            foreach ($walletRows as $row) {
                $trxTypeAsal = strtolower((string) $row->trx_type);
                $trxTypePembalik = $trxTypeAsal === 'debit' ? 'credit' : 'debit';

                $walletPembalik[] = [
                    'id_konsumen' => $row->id_konsumen,
                    'amount' => $row->amount,
                    'trx_type' => $trxTypePembalik,
                    'note' => $catatanPembatalan,
                    'created_at' => date('Y-m-d H:i:s'),
                    'source' => $row->source,
                    'source_id' => $id_transaksi,
                    'type' => $row->type,
                ];
            }

            if (!empty($walletPembalik)) {
                DB::table('rb_wallet_users')->insert($walletPembalik);
            }

            // Mark as cancel with reason
            DB::table('kurir_order')
                ->where('id', $id_transaksi)
                ->update([
                    'status' => 'CANCEL',
                    'alasan_pembatalan' => $req->alasan_pembatalan,
                    'updated_at' => now()
                ]);

            Cache::forget('kurir_order_' . $id_transaksi);

            DB::commit();

            header('Content-Type: application/json');
            return response()->json([
                'success' => true,
                'message' => 'Transaksi dibatalkan',
                'data' => ['id_transaksi' => $id_transaksi]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete transaksi error', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Approve transaction
     */
    private function approveTransaction(Request $req, $potonganKomisi)
    {
        $id_transaksi = $req->id_transaksi;

        if (!$id_transaksi) {
            header('Content-Type: application/json');
            http_response_code(400);
            return response()->json([
                'success' => false,
                'message' => 'ID transaksi tidak ditemukan'
            ], 400);
        }

        $transaksi = DB::table('kurir_order')->where('id', $id_transaksi)->first();
        if (!$transaksi) {
            header('Content-Type: application/json');
            http_response_code(404);
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }

        // Validasi text_approve harus "SETUJU"
        if ($req->text_approve != 'SETUJU') {
            DB::rollBack();
            header('Content-Type: application/json');
            http_response_code(400);
            return response()->json([
                'success' => false,
                'message' => 'Kata Yang Dimasukan Salah'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Update status to FINISH
            DB::table('kurir_order')
                ->where('id', $id_transaksi)
                ->update([
                    'status' => 'FINISH',
                    'updated_at' => now()
                ]);

            // Get kurir data
            $getKurirOrang = DB::table('rb_sopir as a')
                ->select('a.*', 'b.id_konsumen')
                ->leftJoin('rb_konsumen as b', 'b.id_konsumen', 'a.id_konsumen')
                ->where('a.id_sopir', $req->id_sopir)
                ->first();

            // Insert wallet entry for commission debit
            DB::table('rb_wallet_users')->insert([
                'id_konsumen' => $getKurirOrang->id_konsumen,
                'amount' => $potonganKomisi,
                'trx_type' => 'debit',
                'note' => 'Potongan admin kurir transaksi manual',
                'created_at' => date('Y-m-d H:i:s'),
                'source' => 'KURIR',
                'source_id' => $id_transaksi,
                'type' => 'KOMISI',
            ]);

            // Distribute commission
            $bagiKomisi = $this->pembagianKomisiKurir($potonganKomisi, $req->id_sopir, $id_transaksi);

            if ($bagiKomisi) {
                DB::commit();
                header('Content-Type: application/json');
                return response()->json([
                    'success' => true,
                    'message' => 'Sukses Approve Transaksi Manual, Komisi DiBagikan',
                    'data' => ['id_transaksi' => $id_transaksi]
                ]);
            } else {
                DB::rollBack();
                header('Content-Type: application/json');
                http_response_code(500);
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal Menghitung Komisi'
                ], 500);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Approve transaksi error', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * List transaksi manual for courier
     */
    public function listTransaksi(Request $req)
    {
        Log::info($req->all());
        $validator = \Validator::make($req->all(), [
            'no_hp' => 'required',
        ]);

        if ($validator->fails()) {
            header('Content-Type: application/json');
            http_response_code(422);
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $getAgen = DB::table('rb_sopir as a')
            ->leftJoin('rb_konsumen as b', 'b.id_konsumen', 'a.id_konsumen')
            ->select('a.*', 'b.no_hp')
            ->where('b.no_hp', $req->no_hp)
            ->first();

        if (!$getAgen) {
            header('Content-Type: application/json');
            http_response_code(404);
            return response()->json([
                'success' => false,
                'message' => 'Data agen/kurir tidak ditemukan'
            ], 404);
        }

        if ($req->input('service_type') == 'pasca_order') {
            $type = ['MANUAL_KURIR'];
        } else if ($req->input('service_type') == 'live_order') {
            $type = ['LIVE_ORDER'];
        } else {
            $type = ['MANUAL_KURIR', 'LIVE_ORDER'];
        }

        $query = DB::table('kurir_order as a')
            ->select('a.*', 'b.nama_lengkap as nama_pelanggan', 'b.no_hp as no_hp_pelanggan')
            ->leftJoin('rb_konsumen as b', 'b.id_konsumen', 'a.id_pemesan');

        // only manual kurir entries and belonging to this agent
        $query->whereIn('a.source', $type)
              ->where('a.id_agen', $getAgen->id_konsumen);

        if ($req->filled('status')) {
            $query->where('a.status', $req->status);
        }

        if ($req->filled('start_date')) {
            $query->whereDate('a.tanggal_order', '>=', $req->start_date);
        }
        if ($req->filled('end_date')) {
            $query->whereDate('a.tanggal_order', '<=', $req->end_date);
        }

        $query->orderBy('a.tanggal_order', 'desc');

        $limit = (int)($req->limit ?? 0);
        $page = max(1, (int)($req->page ?? 1));

        if ($limit > 0) {
            $offset = ($page - 1) * $limit;
            $data = $query->offset($offset)->limit($limit)->get();
        } else {
            $data = $query->get();
        }

        header('Content-Type: application/json');
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Daftar transaksi manual berhasil diambil'
        ]);
    }


    public function listTransaksiMemberAgen(Request $req)
    {
        Log::info('listTransaksiMemberAgen', $req->all());

        $validator = \Validator::make($req->all(), [
            'id_agen' => 'required',
        ], [
            'id_agen.required' => 'ID Agen wajib diisi',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $query = DB::table('kurir_order as a')
            ->select(
                'a.*',
                'pemesan.nama_lengkap as nama_pemesan',
                'pemesan.no_hp       as no_hp_pemesan',
                'konsumen_kurir.nama_lengkap as nama_kurir',
                'konsumen_kurir.no_hp        as no_hp_kurir'
            )
            ->leftJoin('rb_konsumen as pemesan',       'pemesan.id_konsumen',       'a.id_pemesan')
            ->leftJoin('rb_sopir as sopir',             'sopir.id_sopir',            'a.id_sopir')
            ->leftJoin('rb_konsumen as konsumen_kurir', 'konsumen_kurir.id_konsumen','sopir.id_konsumen')
            ->where('a.id_agen', $req->id_agen)->where('sopir.id_konsumen', '!=', $req->id_agen);

        // Filter tipe sumber: pasca order, live order, atau semua
        $serviceTypeFilter = $req->input('service_type', '');
        if ($serviceTypeFilter === 'pasca_order') {
            $query->where('a.source', 'MANUAL_KURIR');
        } elseif ($serviceTypeFilter === 'live_order') {
            $query->where('a.source', 'LIVE_ORDER');
        } elseif (!empty($serviceTypeFilter)) {
            // Filter berdasarkan jenis layanan (RIDE, SEND, FOOD, SHOP)
            $query->where('a.service', strtoupper($serviceTypeFilter));
        }

        // Filter tanggal
        if ($req->filled('start_date')) {
            $query->whereDate('a.tanggal_order', '>=', $req->start_date);
        }
        if ($req->filled('end_date')) {
            $query->whereDate('a.tanggal_order', '<=', $req->end_date);
        }

        // Filter status
        if ($req->filled('status')) {
            $query->where('a.status', strtoupper($req->status));
        }

        // Search: kode_order, nama pemesan, no HP, alamat
        if ($req->filled('search')) {
            $search = '%' . $req->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('a.kode_order',   'LIKE', $search)
                  ->orWhere('a.alamat_jemput', 'LIKE', $search)
                  ->orWhere('a.alamat_antar',  'LIKE', $search)
                  ->orWhere('pemesan.nama_lengkap', 'LIKE', $search)
                  ->orWhere('pemesan.no_hp',         'LIKE', $search)
                  ->orWhere('konsumen_kurir.nama_lengkap', 'LIKE', $search);
            });
        }

        $query->orderBy('a.tanggal_order', 'desc');
Log::info('Query built successfully for listTransaksiMemberAgen');
Log::info($query->toSql(), $query->getBindings());
        // Pagination opsional
        $limit = (int)($req->limit ?? 0);
        $page  = max(1, (int)($req->page ?? 1));

        if ($limit > 0) {
            $total  = $query->count();
            $data   = $query->offset(($page - 1) * $limit)->limit($limit)->get();
            return response()->json([
                'success' => true,
                'data'    => ['data' => $data, 'total' => $total, 'page' => $page, 'limit' => $limit],
                'message' => 'Daftar transaksi member berhasil diambil'
            ]);
        }

        $data = $query->get();
Log::info('Data retrieved successfully for listTransaksiMemberAgen', ['count' => count($data)]);
        return response()->json([
            'success' => true,
            'data'    => $data,
            'message' => 'Daftar transaksi member berhasil diambil'
        ]);
    }


    /**
     * Get detail transaksi
     */
    public function detailTransaksi(Request $req)
    {
        $id_transaksi = $req->id_transaksi;

        if (!$id_transaksi) {
            header('Content-Type: application/json');
            http_response_code(400);
            return response()->json([
                'success' => false,
                'message' => 'ID transaksi tidak ditemukan'
            ], 400);
        }

        $transaksi = DB::table('kurir_order as a')
            ->select('a.*', 'b.nama_lengkap as nama_pelanggan', 'b.no_hp as no_hp_pelanggan')
            ->leftJoin('rb_konsumen as b', 'b.id_konsumen', 'a.id_pemesan')
            ->where('a.id', $id_transaksi)
            ->first();

        if (!$transaksi) {
            header('Content-Type: application/json');
            http_response_code(404);
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }

        header('Content-Type: application/json');
        return response()->json([
            'success' => true,
            'data' => $transaksi,
            'message' => 'Detail transaksi berhasil diambil'
        ]);
    }

    
}
