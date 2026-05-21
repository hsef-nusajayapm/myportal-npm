import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Client menggunakan Service Role Key agar bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Helper fungsi untuk mencari dan mengambil nilai berdasarkan Label di Tally Form
const getVal = (fields, labelName) => {
  const field = fields.find((f) => f.label === labelName);
  if (!field) return null;

  // Jika field berupa array (seperti komponen file upload Tally), ambil URL file pertama
  if (Array.isArray(field.value) && field.value[0]?.url) {
    return field.value[0].url;
  }
  return field.value;
};

export async function POST(request) {
  try {
    // 1. Ambil data JSON kiriman dari Webhook Tally
    const body = await request.json();
    const fields = body.data.fields;
    const submissionId = body.data.submissionId;

    // 2. Ekstrak data dasar untuk Karyawan & Pengajuan
    const nikKtp = getVal(fields, "NIK KTP");
    const namaDepan = getVal(fields, "Nama Depan") || "";
    const namaBelakang = getVal(fields, "Nama Belakang") || "";
    const namaLengkap = `${namaDepan} ${namaBelakang}`.trim();

    // Validasi pencegahan jika NIK kosong agar database tidak error
    if (!nikKtp) {
      return NextResponse.json(
        { success: false, error: "NIK KTP tidak ditemukan pada form" },
        { status: 400 },
      );
    }

    // 3. PROSES TABEL 1: UPSERT DATA KARYAWAN
    // Jika NIK belum terdaftar akan membuat baris baru, jika sudah ada akan memperbarui profil terbaru
    const { error: errKaryawan } = await supabase.from("karyawan").upsert({
      nik_ktp: nikKtp,
      nama_lengkap: namaLengkap,
      perusahaan: getVal(fields, "Perusahaan"),
      jabatan: getVal(fields, "Jabatan"),
      departemen: getVal(fields, "Departemen"),
      no_hp: getVal(fields, "WA for Feedback (Active)"),
    });

    if (errKaryawan)
      throw new Error(
        `Gagal menyimpan ke tabel karyawan: ${errKaryawan.message}`,
      );

    // 4. PROSES TABEL 2: INSERT DATA UTAMA PENGAJUAN
    const { error: errPengajuan } = await supabase.from("pengajuan").insert({
      submission_id: submissionId,
      nik_ktp: nikKtp,
      status_pengajuan: getVal(fields, "Status Pengajuan"), // Baru / Perpanjangan / Penambahan
      jenis_pengajuan: getVal(fields, "Jenis Pengajuan"), // SIMPER / MINE PERMIT
      status_mcu: getVal(fields, "Status MCU"), // FIT TO WORK / UNFIT
      tanggal_mcu: getVal(fields, "Tanggal MCU") || null,
      upload_foto: getVal(fields, "Upload Foto"),
      upload_ktp: getVal(fields, "Upload KTP"),
      submitted_at: body.data.createdAt,
    });

    if (errPengajuan)
      throw new Error(
        `Gagal menyimpan ke tabel pengajuan: ${errPengajuan.message}`,
      );

    // 5. PROSES TABEL 3: DETEKSI & EKSTRAKSI VERTIKAL UNTUK P, I, R, F
    // Daftar semua jenis alat/kendaraan yang ada pada form Tally Anda
    const daftarJenisAlat = [
      "Light Vehicle",
      "Dump Truck",
      "Water Truck",
      "Lube Truck",
      "Fuel Truck",
      "Bulldozer",
      "Compactor",
      "Motor Grader",
      "Excavator",
      "Bus",
      "Minibus",
      "Manhaul",
      "Crane Truck",
      "Service Truck",
    ];

    // Daftar status otoritas beserta kode yang digunakan di dalam label Tally Anda
    const daftarStatusOtoritas = [
      { kode: "P", nama: "PROBATION" },
      { kode: "I", nama: "INSTRUCTOR" },
      { kode: "R", nama: "RESTRICTED" },
      { kode: "F", nama: "FULL" },
    ];

    // Melakukan pengecekan silang otomatis untuk seluruh kombinasi label
    for (const status of daftarStatusOtoritas) {
      for (const alat of daftarJenisAlat) {
        // Membentuk nama label dinamis, misal: "Otoritas (P) (Excavator)" atau "Otoritas (I) (Dump Truck)"
        const namaLabelTally = `Otoritas (${status.kode}) (${alat})`;
        const fieldTally = fields.find((f) => f.label === namaLabelTally);

        // Jika pertanyaan tersebut ditemukan dan user mencentang pilihan (berupa Array data)
        if (fieldTally && Array.isArray(fieldTally.value)) {
          for (const merkYangDicentang of fieldTally.value) {
            // Simpan setiap pilihan centang ke bawah secara vertikal ke tabel pengajuan_unit
            const { error: errUnit } = await supabase
              .from("pengajuan_unit")
              .insert({
                submission_id: submissionId,
                status_otoritas: status.nama, // Menyimpan string: PROBATION / INSTRUCTOR / dll
                jenis_kategori: alat.toUpperCase(), // Menyimpan string: EXCAVATOR / DUMP TRUCK / dll
                merk_tipe: merkYangDicentang, // Menyimpan pilihan merk, misal: "Komatsu", "Hino"
              });

            if (errUnit) {
              console.error(
                `Gagal menyimpan unit ${alat} (${status.nama}):`,
                errUnit.message,
              );
            }
          }
        }
      }
    }

    // 6. Kirim respon sukses kembali ke Tally
    return NextResponse.json(
      {
        success: true,
        message: "Data webhook diproses dan diurai ke 3 tabel dengan sukses!",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Proses Webhook Tally Gagal:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
