import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { LogOut, UserCircle, MonitorSmartphone, Play, CheckCircle, Clock, BookOpen, Users, Video, Search, X, Eye } from "lucide-react";
import { supabase } from "./supabaseClient"; // Pastikan path ini benar
import React from "react";

// Definisi tipe data yang akan ditarik dari database
type StudentRecording = {
  id: string;
  studentName: string;
  username: string;
  surah: string;
  duration: number;
  sentAt: Date;
  videoURL: string;
  status: "baru" | "sudah_ditinjau";
};

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// Modal Video yang otomatis menandai video sebagai ditinjau
function VideoModal({ rec, onClose, onRefresh }: { rec: StudentRecording; onClose: () => void, onRefresh: () => void }) {
  useEffect(() => {
    const markAsReviewed = async () => {
      if (rec.status === "baru") {
        await supabase
          .from("recordings")
          .update({ status: "sudah_ditinjau" })
          .eq("id", rec.id);
        
        onRefresh(); // Memperbarui daftar utama setelah berhasil mengubah status
      }
    };
    
    markAsReviewed();

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rec.id, rec.status, onClose, onRefresh]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: 520,
          background: "#0d2820",
          border: "1.5px solid rgba(201,168,76,0.3)",
          boxShadow: "0 0 80px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "#f0ede6" }}>{rec.studentName}</p>
            <p className="text-xs" style={{ color: "#8aab9e" }}>{rec.surah} · {formatDuration(rec.duration)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: "#8aab9e" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Video or placeholder */}
        <div
          className="w-full flex items-center justify-center"
          style={{ aspectRatio: "3/4", background: "#091a15" }}
        >
          {rec.videoURL ? (
            <video src={rec.videoURL} controls autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(201,168,76,0.1)", border: "1.5px solid rgba(201,168,76,0.3)" }}
              >
                <Video size={28} style={{ color: "#c9a84c" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#f0ede6" }}>Data Dummy</p>
              <p className="text-xs leading-relaxed" style={{ color: "#8aab9e" }}>
                Video ini adalah data contoh. Video nyata akan tampil setelah siswa mengirim rekaman sesungguhnya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuruPage() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username") ?? "Guru";
  const role = sessionStorage.getItem("role") ?? "";

  const [recordings, setRecordings] = useState<StudentRecording[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "baru" | "sudah_ditinjau">("semua");
  const [selectedRec, setSelectedRec] = useState<StudentRecording | null>(null);

  // Fungsi untuk menarik data dari Supabase
  const fetchRecordings = async () => {
    const { data, error } = await supabase
      .from("recordings")
      .select("*")
      .order("sent_at", { ascending: false });

    if (!error && data) {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        studentName: item.student_name,
        username: item.username,
        surah: item.surah,
        duration: item.duration,
        sentAt: new Date(item.sent_at),
        videoURL: item.video_url,
        status: item.status
      }));
      setRecordings(formattedData);
    } else if (error) {
      console.error("Gagal menarik data rekaman:", error);
    }
  };

  useEffect(() => {
    fetchRecordings();
    
    // Auto-refresh data setiap 10 detik agar guru melihat setoran baru tanpa perlu reload browser
    const interval = setInterval(fetchRecordings, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const filtered = recordings.filter((r) => {
    const matchSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.surah.toLowerCase().includes(search.toLowerCase()) ||
      r.username.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalBaru = recordings.filter((r) => r.status === "baru").length;
  const totalDitinjau = recordings.filter((r) => r.status === "sudah_ditinjau").length;

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0b1f1a" }}
    >
      {/* Header */}
      <header
        className="w-full flex items-center justify-between px-5 md:px-10 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <MonitorSmartphone size={15} style={{ color: "#c9a84c" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: "#f0ede6" }}>Murottal Watch</p>
            <p className="text-xs leading-tight" style={{ color: "#8aab9e" }}>Dashboard Guru</p>
          </div>
        </div>

        <p
          className="text-lg hidden md:block"
          style={{ fontFamily: "'Noto Naskh Arabic', serif", color: "#c9a84c", lineHeight: 2 }}
        >
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>

        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <UserCircle size={14} style={{ color: "#c9a84c" }} />
            <span className="text-xs font-semibold" style={{ color: "#f0ede6" }}>{username}</span>
            {role && <span className="text-xs" style={{ color: "#8aab9e" }}>· {role}</span>}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
            style={{ background: "rgba(192,57,43,0.1)", color: "#e0857d", border: "1px solid rgba(192,57,43,0.25)" }}
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full px-5 md:px-10 py-6 md:py-8 flex flex-col gap-6">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f0ede6" }}>Rekaman Siswa</h1>
          <p className="text-sm mt-0.5" style={{ color: "#8aab9e" }}>
            Pantau dan tinjau tilawah Al-Qur'an yang dikirim oleh siswa.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <Users size={18} />, label: "Total Rekaman", value: recordings.length, color: "#c9a84c" },
            { icon: <BookOpen size={18} />, label: "Belum Ditinjau", value: totalBaru, color: "#e74c3c" },
            { icon: <CheckCircle size={18} />, label: "Sudah Ditinjau", value: totalDitinjau, color: "#4caf87" },
            { icon: <Clock size={18} />, label: "Total Durasi", value: formatDuration(recordings.reduce((a, r) => a + r.duration, 0)), color: "#8aab9e" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-4 flex flex-col gap-2"
              style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.13)" }}
            >
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <p className="text-xs" style={{ color: "#8aab9e" }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color, fontVariantNumeric: "tabular-nums" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8aab9e" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa atau surah..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1.5px solid rgba(201,168,76,0.18)",
                color: "#f0ede6",
                caretColor: "#c9a84c",
              }}
            />
          </div>

          {/* Status filter */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(201,168,76,0.18)" }}>
            {(["semua", "baru", "sudah_ditinjau"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-4 py-2.5 text-xs font-semibold transition-all"
                style={{
                  background: filterStatus === s ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.04)",
                  color: filterStatus === s ? "#c9a84c" : "#8aab9e",
                  borderRight: s !== "sudah_ditinjau" ? "1px solid rgba(201,168,76,0.18)" : "none",
                }}
              >
                {s === "semua" ? "Semua" : s === "baru" ? "Belum Ditinjau" : "Sudah Ditinjau"}
              </button>
            ))}
          </div>
        </div>

        {/* Recording list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Video size={36} style={{ color: "#4a7a6a" }} />
            <p className="text-sm" style={{ color: "#8aab9e" }}>Tidak ada rekaman ditemukan.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.15)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
                    {["Siswa", "Surah", "Durasi", "Dikirim", "Status", "Aksi"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#8aab9e" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, i) => (
                    <tr
                      key={rec.id}
                      style={{
                        background: i % 2 === 0 ? "rgba(201,168,76,0.02)" : "transparent",
                        borderBottom: "1px solid rgba(201,168,76,0.08)",
                      }}
                    >
                      {/* Siswa */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}
                          >
                            {rec.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: "#f0ede6" }}>{rec.studentName}</p>
                            <p className="text-xs" style={{ color: "#8aab9e" }}>@{rec.username}</p>
                          </div>
                        </div>
                      </td>
                      {/* Surah */}
                      <td className="px-5 py-4">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}
                        >
                          {rec.surah}
                        </span>
                      </td>
                      {/* Durasi */}
                      <td className="px-5 py-4">
                        <span style={{ color: "#f0ede6", fontVariantNumeric: "tabular-nums" }}>
                          {formatDuration(rec.duration)}
                        </span>
                      </td>
                      {/* Dikirim */}
                      <td className="px-5 py-4">
                        <span style={{ color: "#8aab9e" }}>{timeAgo(rec.sentAt)}</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={
                            rec.status === "baru"
                              ? { background: "rgba(231,76,60,0.12)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.25)" }
                              : { background: "rgba(76,175,135,0.12)", color: "#4caf87", border: "1px solid rgba(76,175,135,0.25)" }
                          }
                        >
                          {rec.status === "baru" ? "Belum Ditinjau" : "Sudah Ditinjau"}
                        </span>
                      </td>
                      {/* Aksi */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedRec(rec)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                          style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}
                        >
                          <Eye size={13} />
                          Tinjau
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex md:hidden flex-col gap-3">
              {filtered.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl px-4 py-4 flex flex-col gap-3"
                  style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}
                      >
                        {rec.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#f0ede6" }}>{rec.studentName}</p>
                        <p className="text-xs" style={{ color: "#8aab9e" }}>@{rec.username}</p>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                      style={
                        rec.status === "baru"
                          ? { background: "rgba(231,76,60,0.12)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.25)" }
                          : { background: "rgba(76,175,135,0.12)", color: "#4caf87", border: "1px solid rgba(76,175,135,0.25)" }
                      }
                    >
                      {rec.status === "baru" ? "Baru" : "Ditinjau"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c" }}
                    >
                      {rec.surah}
                    </span>
                    <span className="text-xs" style={{ color: "#8aab9e" }}>
                      <Clock size={11} className="inline mr-1" />{formatDuration(rec.duration)}
                    </span>
                    <span className="text-xs" style={{ color: "#8aab9e" }}>{timeAgo(rec.sentAt)}</span>
                  </div>

                  <button
                    onClick={() => setSelectedRec(rec)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}
                  >
                    <Play size={13} />
                    Putar & Tinjau Rekaman
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Video modal */}
      {selectedRec && <VideoModal rec={selectedRec} onClose={() => setSelectedRec(null)} onRefresh={fetchRecordings} />}

      <style>{`
        input::placeholder { color: rgba(138,171,158,0.4); }
      `}</style>
    </div>
  );
}