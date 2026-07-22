import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

// 1. IMPORT SUPABASE CLIENT
import { supabase } from "./supabaseClient"; 
import React from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password harus diisi.");
      return;
    }

    setLoading(true);

    // 2. PROSES LOGIN EMAIL & PASSWORD
    const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (supabaseError) {
      setError(
        supabaseError.message === "Invalid login credentials" 
          ? "Email atau password salah. Silakan coba lagi." 
          : supabaseError.message
      );
      setLoading(false);
    } else if (data.user) {
      
      // 3. JIKA LOGIN SUKSES, TARIK DATA PROFIL (NAMA & ROLE) DARI DATABASE
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', data.user.id)
        .single(); // Ambil 1 baris data saja

      if (profileError) {
        console.error("Gagal mengambil data profil:", profileError.message);
        setError("Profil tidak ditemukan. Hubungi administrator.");
        setLoading(false);
        return; // Hentikan proses jika profil tidak ada
      }

      // 4. SIMPAN DATA KE SESSION BROWSER
      sessionStorage.setItem("auth", "true");
      sessionStorage.setItem("email", data.user.email || "");
      sessionStorage.setItem("username", profileData.full_name); // Menggunakan nama asli dari database
      sessionStorage.setItem("role", profileData.role); 
      
      // 5. PENGALIHAN HALAMAN (ROUTING) BERDASARKAN ROLE
      if (profileData.role === "Guru") {
        navigate("/guru", { replace: true });
      } else {
        // Jika Siswa, arahkan ke halaman rekam
        navigate("/record", { replace: true });
      }
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0b1f1a" }}
    >
      {/* ── Left decorative panel (desktop only) ── */}
      <div
        className="hidden md:flex flex-col items-center justify-center flex-1 px-12 py-16 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d2820 0%, #0b1f1a 60%, #081912 100%)" }}
      >
        {/* Background ornament circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent)" }} />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent)" }} />

        {/* Geometric Islamic pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)`,
          backgroundSize: "24px 24px"
        }} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Logo mark */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.05) 100%)",
              border: "1.5px solid rgba(201,168,76,0.4)",
              boxShadow: "0 0 40px rgba(201,168,76,0.12)",
            }}
          >
            <BookOpen size={36} style={{ color: "#c9a84c" }} />
          </div>

          {/* Bismillah */}
          <p
            className="text-4xl mb-6"
            style={{ fontFamily: "'Noto Naskh Arabic', serif", color: "#c9a84c", lineHeight: 2 }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>

          <h1 className="text-3xl font-bold mb-3" style={{ color: "#f0ede6", letterSpacing: "-0.02em" }}>
            Murottal Watch
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#8aab9e" }}>
            Sistem penilaian dan rekaman tilawah Al-Qur'an untuk siswa. Pantau kemajuan bacaan dengan mudah dan terstruktur.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full mt-10 mb-6">
            <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.2)" }} />
            <span style={{ color: "#c9a84c", fontSize: 14 }}>✦</span>
            <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.2)" }} />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {["Rekam Tilawah", "Penilaian Langsung", "Multi Pengguna"].map((f) => (
              <span
                key={f}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div
        className="flex flex-col items-center justify-center w-full md:w-[420px] lg:w-[460px] px-6 py-12 md:px-10 flex-shrink-0"
        style={{ borderLeft: "1px solid rgba(201,168,76,0.12)" }}
      >
        {/* Mobile header */}
        <div className="flex flex-col items-center mb-8 md:hidden">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(201,168,76,0.1)", border: "1.5px solid rgba(201,168,76,0.35)" }}
          >
            <BookOpen size={28} style={{ color: "#c9a84c" }} />
          </div>
          <p
            className="text-2xl mb-1"
            style={{ fontFamily: "'Noto Naskh Arabic', serif", color: "#c9a84c", lineHeight: 2 }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
          <h1 className="text-xl font-bold" style={{ color: "#f0ede6" }}>Murottal Watch</h1>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-6">
          {/* Form card */}
          <div
            className="rounded-2xl px-6 py-7"
            style={{
              background: "rgba(201,168,76,0.04)",
              border: "1.5px solid rgba(201,168,76,0.15)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1" style={{ color: "#f0ede6" }}>Masuk ke Akun</h2>
              <p className="text-sm" style={{ color: "#8aab9e" }}>
                Gunakan kredensial yang didaftarkan di sistem.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: "#c9a84c" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "rgba(201,168,76,0.06)",
                    border: "1.5px solid rgba(201,168,76,0.2)",
                    color: "#f0ede6",
                    caretColor: "#c9a84c",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: "#c9a84c" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(201,168,76,0.06)",
                      border: "1.5px solid rgba(201,168,76,0.2)",
                      color: "#f0ede6",
                      caretColor: "#c9a84c",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-opacity hover:opacity-70"
                    style={{ color: "#8aab9e" }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                  style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)" }}
                >
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#e74c3c" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "#e0857d" }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95 mt-1"
                style={{
                  background: "linear-gradient(135deg, #d4a843 0%, #b8892e 100%)",
                  color: "#0b1f1a",
                  boxShadow: "0 4px 24px rgba(201,168,76,0.3)",
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "#0b1f1a", borderTopColor: "transparent" }} />
                    Memproses...
                  </>
                ) : (
                  <><LogIn size={18} />Masuk</>
                )}
              </button>
            </form>
          </div>

          {/* Info note */}
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
            style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.13)" }}
          >
            <span className="flex-shrink-0 mt-0.5" style={{ color: "#c9a84c", fontSize: 15 }}>ℹ</span>
            <p className="text-xs leading-relaxed" style={{ color: "#8aab9e" }}>
              Hubungi administrator sekolah jika Anda belum memiliki akun atau lupa kredensial masuk.
            </p>
          </div>
        </div>

        <p className="text-xs mt-8" style={{ color: "#4a7a6a" }}>
          Murottal Watch &mdash; Semoga Allah memberkahi
        </p>
      </div>

      <style>{`
        input::placeholder { color: rgba(138,171,158,0.5); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}