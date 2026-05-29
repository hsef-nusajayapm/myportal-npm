"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { GalleryVerticalEndIcon } from "lucide-react";

// URL Web App Google Apps Script Anda
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzY-TAseFX3VWfH4wbu7N9oKcE6h0CyKHWXYluHVxcHm_s704kECE1sAE6aQFslP-kF/exec";

export default function IndexPage() {
  const router = useRouter();

  // Cek jika user sudah pernah login sebelumnya via Cookie → langsung arahkan ke dashboard internal (/home)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 🔑 OLEH-OLEH PEMBERSIH: Hancurkan cookie & sessionStorage lama saat halaman login dibuka
      // Ini menjamin saat dev-server mati/nyala, Anda akan selalu tertahan di halaman login.
      document.cookie =
        "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict;";
      sessionStorage.clear();

      // Hapus logika 'if (isLoggedIn) { router.push("/home") }' yang lama
      // agar browser tidak melakukan redirect otomatis ke /home di awal.
    }
  }, [router]);
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Kolom Kiri: Formulir Login */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            Nusajaya Persadatama Mandiri
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm webAppUrl={WEB_APP_URL} />
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Gambar Latar Belakang Desain (Hanya muncul di Layar Lebar/PC) */}
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/img/img1.jpg"
          alt="Portal Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
