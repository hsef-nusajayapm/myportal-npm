"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { GalleryVerticalEndIcon } from "lucide-react";

// ⬇️ Ganti dengan URL Web App Google Apps Script kamu
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzY-TAseFX3VWfH4wbu7N9oKcE6h0CyKHWXYluHVxcHm_s704kECE1sAE6aQFslP-kF/exec";

export default function LoginPage() {
  const router = useRouter();

  // Cek jika sudah login → langsung redirect ke /home
  useEffect(() => {
    if (sessionStorage.getItem("isLoggedIn")) {
      router.push("/home");
    }
  }, [router]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Kiri: Form */}
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

      {/* Kanan: Background image (hanya tampil di layar besar) */}
      <div className="relative hidden bg-muted lg:block">
        <img
          src="img/img1.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
