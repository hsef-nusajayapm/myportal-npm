import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const getVal = (fields, labelName) => {
  if (!fields || !Array.isArray(fields)) return null;
  const field = fields.find((f) => f.label === labelName);
  if (!field) return null;

  if (Array.isArray(field.value) && field.value[0]?.url) {
    return field.value[0].url;
  }
  return field.value;
};

export async function POST(request) {
  try {
    const body = await request.json();

    // Validasi struktur data dari Tally
    if (!body || !body.data || !body.data.fields) {
      return NextResponse.json(
        { success: false, error: "Format data Tally tidak valid" },
        { status: 400 },
      );
    }

    const fields = body.data.fields;
    const submissionId = body.data.submissionId;

    // Ambil data dasar (Diberikan proteksi "|| ''" agar tidak bernilai null)
    const nikKtp = getVal(fields, "NIK KTP");
    const namaDepan = getVal(fields, "Nama Depan") || "";
    const namaBelakang = getVal(fields, "Nama Belakang") || "";

    // Penggabungan nama yang aman dari error .trim()
    const namaLengkap = `${namaDepan} ${namaBelakang}`.trim() || "TANPA NAMA";

    if (!nikKtp) {
      console.error("Peringatan: NIK KTP Kosong!");
      return NextResponse.json(
        { success: false, error: "NIK KTP wajib diisi" },
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
      upload_foto: getVal(fields, "Upload Foto") || null,
      upload_ktp: getVal(fields, "Upload KTP") || null,
      submitted_at: body.data.createdAt || new Date().toISOString(),
    });

    if (errPengajuan)
      throw new Error(`Gagal ke tabel pengajuan: ${errPengajuan.message}`);

    // 3. Proses Otoritas Alat (P, I, R, F)
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

    for (const status of daftarStatusOtoritas) {
      for (const alat of daftarJenisAlat) {
        const namaLabelTally = `Otoritas (${status.kode}) (${alat})`;
        const fieldTally = fields.find((f) => f.label === namaLabelTally);

        if (fieldTally && Array.isArray(fieldTally.value)) {
          for (const merkYangDicentang of fieldTally.value) {
            if (merkYangDicentang) {
              await supabase.from("pengajuan_unit").insert({
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

    return NextResponse.json(
      { success: true, message: "Data berhasil diproses tanpa error!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fatal Webhook Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
