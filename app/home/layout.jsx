// app/home/layout.jsx
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function HomeLayout({ children }) {
  return (
    <SidebarProvider
      // 🔑 KUNCI: Style ini harus ada di sini agar lebar sidebar tidak rusak/menyusut!
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      {/* Sidebar Utama */}
      <AppSidebar variant="inset" />

      <SidebarInset>
        {/* Header Utama */}
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* 📊 4 CARD UTAMA: Menetap permanen untuk semua halaman di dalam /home */}
              <SectionCards />

              {/* 🔄 AREA DINAMIS: Tempat masuknya isi page.jsx (Grafik/Tabel) ATAU Form Mine Permit */}
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
