// app/home/forms/mine-permit/page.jsx
"use client";

import React, { useEffect } from "react";

export default function MinePermitFormPage() {
  // Script otomatis dari Tally untuk resize tinggi iframe secara dinamis
  useEffect(() => {
    const scriptId = "tally-embed-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://tally.so/widgets/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="px-4 lg:px-6">
      <div className="w-full rounded-xl border bg-card p-4 md:p-6 shadow-sm text-card-foreground">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight">
            Formulir Pengajuan Mine Permit & SIMPER
          </h2>
          <p className="text-sm text-muted-foreground">
            Silakan lengkapi seluruh data formulir di bawah ini.
          </p>
        </div>

        <div className="w-full overflow-hidden rounded-lg bg-background px-40">
          <iframe
            // ⚠️ SILAKAN Ganti teks di bawah dengan ID FORM TALLY Anda yang asli
            src="https://tally.so/embed/Gxr8R2?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="1600"
            title="Formulir Mine Permit & SIMPER"
            className="w-full border-none"
            data-tally-embed
            data-tally-dynamic-height="1"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
