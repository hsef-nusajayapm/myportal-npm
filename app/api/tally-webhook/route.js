// app/api/tally-webhook/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, // ──> 🔑 Pastikan env URL benar
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// 🛠️ FUNGSI HELPER YANG SUDAH DIOPTIMALKAN & SANGAT AMAN
const getVal = (fields, labelName) => {
  if (!fields || !Array.isArray(fields)) return null;

  // Pencocokan label yang kebal dari spasi tidak sengaja & huruf besar-kecil
  const field = fields.find(
    (f) => f.label.trim().toLowerCase() === labelName.trim().toLowerCase(),
  );
  if (!field || field.value === undefined || field.value === null) return null;

  // 1. Jika tipenya FILE_UPLOAD (Mengambil string URL langsung)
  if (field.type === "FILE_UPLOAD" && Array.isArray(field.value)) {
    return field.value[0]?.url || null;
  }

  // 2. 🔑 KUNCI UTAMA: Jika tipenya DROPDOWN / MULTIPLE_CHOICE / RADIO
  // Fungsi ini akan mencari teks asli di dalam array 'options' berdasarkan ID yang dicentang user
  if (
    (field.type === "DROPDOWN" ||
      field.type === "MULTIPLE_CHOICE" ||
      field.type === "RADIO") &&
    Array.isArray(field.value)
  ) {
    const selectedId = field.value[0];
    if (field.options && Array.isArray(field.options)) {
      const optionMatched = field.options.find((opt) => opt.id === selectedId);
      return optionMatched ? optionMatched.text : selectedId; // Mengembalikan teks asli (Contoh: "Nusa Jaya", "BARU", "FIT")
    }
  }

  return field.value;
};

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || !body.data || !body.data.fields) {
      return NextResponse.json(
        { success: false, error: "Format data Tally tidak valid" },
        { status: 400 },
      );
    }

    const fields = body.data.fields;
    const submissionId = body.data.submissionId;

    // Ambil data (Gunakan nama label yang 100% sama dengan di dashboard Tally Anda!)
    const nikKtp = getVal(fields, "NIK KTP");
    const namaDepan = getVal(fields, "Nama Depan") || "";
    const namaBelakang = getVal(fields, "Nama Belakang") || "";
    const namaLengkap = `${namaDepan} ${namaBelakang}`.trim() || "TANPA NAMA";

    // Mencegah eror database jika NIK kosong
    if (!nikKtp) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gagal memproses: Kolom NIK KTP tidak ditemukan di form atau kosong!",
        },
        { status: 400 },
      );
    }

    // 1. Simpan/Update Karyawan
    const { error: errKaryawan } = await supabase.from("karyawan").upsert({
      nik_ktp: nikKtp,
      nama_lengkap: namaLengkap,
      perusahaan: getVal(fields, "Perusahaan") || "-",
      jabatan: getVal(fields, "Jabatan") || "-",
      departemen: getVal(fields, "Departemen") || "-",
      no_hp: getVal(fields, "WA for Feedback (Active)") || "-",
    });

    if (errKaryawan)
      throw new Error(`Gagal ke tabel karyawan: ${errKaryawan.message}`);

    // 2. Simpan Transaksi Pengajuan
    const { error: errPengajuan } = await supabase.from("pengajuan").insert({
      submission_id: submissionId,
      nik_ktp: nikKtp,
      status_pengajuan: getVal(fields, "Status Pengajuan") || "BARU",
      jenis_pengajuan: getVal(fields, "Jenis Pengajuan") || "SIMPER",
      status_mcu: getVal(fields, "Status MCU") || "UNFIT",
      tanggal_mcu: getVal(fields, "Tanggal MCU") || null,
      upload_foto: getVal(fields, "Upload Foto"), // Otomatis berupa string URL / null dari helper baru
      upload_ktp: getVal(fields, "Upload KTP"), // Otomatis berupa string URL / null dari helper baru
      submitted_at: body.data.createdAt || new Date().toISOString(),
    });

    if (errPengajuan)
      throw new Error(`Gagal ke tabel pengajuan: ${errPengajuan.message}`);

    // 3. Proses Otoritas Alat (Menggunakan Bulk Insert agar anti-timeout)
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

    const daftarStatusOtoritas = [
      { kode: "P", nama: "PROBATION" },
      { kode: "I", nama: "INSTRUCTOR" },
      { kode: "R", nama: "RESTRICTED" },
      { kode: "F", nama: "FULL" },
    ];

    const bulkUnitData = [];

    for (const status of daftarStatusOtoritas) {
      for (const alat of daftarJenisAlat) {
        const namaLabelTally = `Otoritas (${status.kode}) (${alat})`;
        const fieldTally = fields.find((f) => f.label === namaLabelTally);

        if (fieldTally && Array.isArray(fieldTally.value)) {
          for (const merkYangDicentang of fieldTally.value) {
            if (merkYangDicentang) {
              bulkUnitData.push({
                submission_id: submissionId,
                status_otoritas: status.nama,
                jenis_kategori: alat.toUpperCase(),
                merk_tipe: merkYangDicentang,
              });
            }
          }
        }
      }
    }

    if (bulkUnitData.length > 0) {
      const { error: errBulkUnit } = await supabase
        .from("pengajuan_unit")
        .insert(bulkUnitData);
      if (errBulkUnit)
        throw new Error(
          `Gagal ke tabel pengajuan_unit: ${errBulkUnit.message}`,
        );
    }

    return NextResponse.json(
      { success: true, message: "Data berhasil diproses!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fatal Webhook Error:", error.message);
    // Kembalikan error message asli ke log Tally agar Anda bisa membacanya dengan mudah di dashboard Tally
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
