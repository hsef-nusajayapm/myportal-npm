// app/home/page.jsx
"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import data from "./data.json";

export default function HomePage() {
  return (
    <>
      {/* 1. Bagian Grafik Gelombang Interaktif */}
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      {/* 2. Bagian Tabel Data Utama */}
      <DataTable data={data} />
    </>
  );
}
