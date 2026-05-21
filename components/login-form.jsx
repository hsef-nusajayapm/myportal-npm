"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

export function LoginForm({ webAppUrl }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Format email tidak valid!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${webAppUrl}?action=login&email=${encodeURIComponent(
          email.toLowerCase().trim(),
        )}&password=${encodeURIComponent(password.trim())}`,
      );
      const result = await res.json();

      if (result.success) {
        // Simpan sesi login
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userEmail", email.toLowerCase().trim());
        // Simpan data tambahan jika Apps Script mengembalikannya
        if (result.name) sessionStorage.setItem("userName", result.name);
        if (result.role) sessionStorage.setItem("userRole", result.role);

        router.push("/home");
      } else {
        setErrorMsg(result.message || "Email atau password salah!");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Hello! 👋</h1>
        <p className="text-sm text-muted-foreground">
          Masuk ke akun kamu untuk melanjutkan
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              placeholder="nama@email.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2.5 pl-10 pr-4 text-sm
                         placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring
                         disabled:opacity-50"
              disabled={loading}
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2.5 pl-10 pr-10 text-sm
                         placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring
                         disabled:opacity-50"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Tombol Login */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5
                     text-sm font-semibold text-primary-foreground
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring
                     disabled:opacity-70 disabled:cursor-not-allowed
                     transition-colors duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}
