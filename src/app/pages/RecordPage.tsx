import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Video, Square, RotateCcw, Download, AlertCircle, Mic, Shield, MonitorSmartphone, LogOut, UserCircle } from "lucide-react";

type RecordingState = "idle" | "recording" | "stopped";
type PermissionState = "prompt" | "requesting" | "granted" | "denied";

export default function RecordPage() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem("username") ?? "Pengguna";
  const role = sessionStorage.getItem("role") ?? "";

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const handleLogout = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: "camera" as PermissionName }).then((status) => {
      if (status.state === "granted") setPermissionState("granted");
      else if (status.state === "denied") setPermissionState("denied");
      status.onchange = () => {
        if (status.state === "granted") setPermissionState("granted");
        else if (status.state === "denied") setPermissionState("denied");
        else setPermissionState("prompt");
      };
    }).catch(() => {});
  }, []);

  const requestPermission = useCallback(async () => {
    setPermissionState("requesting");
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setPermissionState("granted");
      setCameraReady(true);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionState("denied");
        setCameraError("Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser Anda, lalu muat ulang halaman.");
      } else if (error.name === "NotFoundError") {
        setPermissionState("denied");
        setCameraError("Kamera tidak ditemukan pada perangkat ini.");
      } else {
        setPermissionState("denied");
        setCameraError("Kamera tidak dapat diakses. Pastikan perangkat Anda memiliki kamera.");
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraReady(true);
    } catch {
      setCameraError("Kamera tidak dapat diakses. Silakan izinkan akses kamera dan coba lagi.");
    }
  }, []);

  useEffect(() => {
    if (permissionState === "granted" && !cameraReady) startCamera();
  }, [permissionState, cameraReady, startCamera]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setVideoURL(null);
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm",
    });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoURL(URL.createObjectURL(blob));
    };
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setElapsed(0);
    setRecordingState("recording");
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecordingState("stopped");
  }, []);

  const reset = useCallback(() => {
    setRecordingState("idle");
    setElapsed(0);
    setVideoURL(null);
    startCamera();
  }, [startCamera]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const downloadVideo = () => {
    if (!videoURL) return;
    const a = document.createElement("a");
    a.href = videoURL;
    a.download = `rekaman-quran-${Date.now()}.webm`;
    a.click();
  };

  // ── Permission screen ──────────────────────────────────────────────
  if (permissionState === "prompt" || permissionState === "requesting" || permissionState === "denied") {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0b1f1a" }}
      >
        <div className="w-full flex flex-col items-center" style={{ maxWidth: 480 }}>
          <p
            className="text-3xl mb-5 text-center"
            style={{ fontFamily: "'Noto Naskh Arabic', serif", color: "#c9a84c", lineHeight: 2 }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>

          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{
              background: permissionState === "denied" ? "rgba(192,57,43,0.12)" : "rgba(201,168,76,0.1)",
              border: `2px solid ${permissionState === "denied" ? "rgba(192,57,43,0.4)" : "rgba(201,168,76,0.35)"}`,
            }}
          >
            {permissionState === "denied"
              ? <AlertCircle size={36} style={{ color: "#e74c3c" }} />
              : <Video size={36} style={{ color: "#c9a84c" }} />}
          </div>

          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "#f0ede6" }}>
            {permissionState === "denied" ? "Izin Kamera Ditolak" : "Izin Akses Kamera & Mikrofon"}
          </h1>
          <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: "#8aab9e", maxWidth: 360 }}>
            {permissionState === "denied"
              ? cameraError ?? "Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser lalu muat ulang halaman."
              : "Aplikasi ini membutuhkan akses kamera depan dan mikrofon untuk merekam tilawah Al-Qur'an siswa."}
          </p>

          {permissionState !== "denied" && (
            <div className="w-full grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: <Video size={18} />, label: "Kamera Depan", desc: "Merekam video siswa" },
                { icon: <Mic size={18} />, label: "Mikrofon", desc: "Merekam suara bacaan" },
                { icon: <Shield size={18} />, label: "Privasi Aman", desc: "Data tersimpan lokal" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center"
                  style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)" }}
                >
                  <span style={{ color: "#c9a84c" }}>{item.icon}</span>
                  <p className="text-xs font-semibold" style={{ color: "#f0ede6" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "#8aab9e" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {permissionState === "denied" && (
            <div
              className="w-full rounded-xl px-4 py-4 mb-6 flex flex-col gap-2"
              style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.2)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "#e0857d" }}>Cara mengaktifkan izin kamera:</p>
              {[
                "Ketuk/klik ikon kunci atau info di address bar browser",
                'Pilih "Izin situs" atau "Site permissions"',
                'Aktifkan izin "Kamera" dan "Mikrofon"',
                "Muat ulang halaman ini",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-xs font-bold flex-shrink-0 mt-0.5" style={{ color: "#e74c3c" }}>{i + 1}.</span>
                  <p className="text-xs leading-relaxed" style={{ color: "#8aab9e" }}>{step}</p>
                </div>
              ))}
            </div>
          )}

          {permissionState !== "denied" ? (
            <button
              onClick={requestPermission}
              disabled={permissionState === "requesting"}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #d4a843 0%, #b8892e 100%)",
                color: "#0b1f1a",
                boxShadow: "0 4px 24px rgba(201,168,76,0.35)",
                opacity: permissionState === "requesting" ? 0.7 : 1,
                cursor: permissionState === "requesting" ? "not-allowed" : "pointer",
              }}
            >
              {permissionState === "requesting" ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: "#0b1f1a", borderTopColor: "transparent" }} />
                  Meminta Izin...
                </>
              ) : (
                <><Video size={18} />Izinkan Akses Kamera</>
              )}
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1.5px solid rgba(201,168,76,0.3)" }}
            >
              <RotateCcw size={16} />Muat Ulang Halaman
            </button>
          )}

          <button
            onClick={handleLogout}
            className="mt-4 text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "#4a7a6a" }}
          >
            Kembali ke halaman login
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Main recording screen ──────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0b1f1a" }}
    >
      {/* Header bar */}
      <header
        className="w-full flex items-center justify-between px-5 md:px-10 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <MonitorSmartphone size={15} style={{ color: "#c9a84c" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: "#f0ede6" }}>Murottal Watch</p>
            <p className="text-xs leading-tight" style={{ color: "#8aab9e" }}>Sistem Penilaian Tilawah</p>
          </div>
        </div>

        {/* Center: Bismillah — desktop only */}
        <p
          className="text-lg hidden md:block"
          style={{ fontFamily: "'Noto Naskh Arabic', serif", color: "#c9a84c", lineHeight: 2 }}
        >
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>

        {/* Right: recording badge + user + logout */}
        <div className="flex items-center gap-3">
          {recordingState === "recording" && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.35)" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: "#e74c3c", animation: "pulse 1.2s ease-in-out infinite" }} />
              <span className="text-xs font-semibold" style={{ color: "#f0ede6", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(elapsed)}
              </span>
            </div>
          )}

          {/* User chip */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <UserCircle size={14} style={{ color: "#c9a84c" }} />
            <span className="text-xs font-semibold" style={{ color: "#f0ede6" }}>{username}</span>
            {role && <span className="text-xs" style={{ color: "#8aab9e" }}>· {role}</span>}
          </div>

          {/* Logout button */}
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

      {/* Body */}
      <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden">

        {/* Camera panel */}
        <div
          className="w-full md:flex-1 flex items-center justify-center p-4 md:p-8"
          style={{ background: "#091a15" }}
        >
          <div
            className="relative rounded-2xl overflow-hidden w-full"
            style={{
              maxWidth: 480,
              aspectRatio: "3/4",
              background: "#0d2820",
              border: "1.5px solid rgba(201,168,76,0.3)",
              boxShadow: "0 0 60px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(201,168,76,0.06)",
            }}
          >
            {recordingState !== "stopped" && (
              <video ref={videoRef} autoPlay muted playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }} />
            )}
            {recordingState === "stopped" && videoURL && (
              <video src={videoURL} controls playsInline
                className="absolute inset-0 w-full h-full object-cover" />
            )}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
                style={{ background: "rgba(11,31,26,0.9)" }}>
                <AlertCircle size={36} style={{ color: "#c9a84c" }} />
                <p className="text-sm" style={{ color: "#f0ede6" }}>{cameraError}</p>
                <button onClick={startCamera} className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "#c9a84c", color: "#0b1f1a" }}>
                  Coba Lagi
                </button>
              </div>
            )}
            {recordingState === "recording" && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(11,31,26,0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <span className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#e74c3c", boxShadow: "0 0 6px #e74c3c", animation: "pulse 1.2s ease-in-out infinite" }} />
                <span className="text-xs font-semibold tracking-widest" style={{ color: "#f0ede6", fontVariantNumeric: "tabular-nums" }}>
                  {formatTime(elapsed)}
                </span>
              </div>
            )}
            {recordingState === "idle" && cameraReady && (
              <>
                {[
                  "top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
                  "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
                  "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
                  "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: "rgba(201,168,76,0.6)" }} />
                ))}
              </>
            )}
            {recordingState === "stopped" && !videoURL && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(11,31,26,0.7)" }}>
                <div className="w-10 h-10 rounded-full border-4 animate-spin"
                  style={{ borderColor: "#c9a84c", borderTopColor: "transparent" }} />
              </div>
            )}
          </div>
        </div>

        {/* Controls panel */}
        <div
          className="w-full md:w-96 lg:w-[420px] flex flex-col justify-between px-5 py-6 md:px-8 md:py-8 flex-shrink-0"
          style={{ borderLeft: "1px solid rgba(201,168,76,0.12)" }}
        >
          <div>
            {/* Mobile bismillah */}
            <p
              className="text-2xl text-center mb-1 md:hidden"
              style={{ fontFamily: "'Noto Naskh Arabic', serif", color: "#c9a84c", lineHeight: 2 }}
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>

            {/* Mobile user info */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <div className="flex items-center gap-2">
                <UserCircle size={16} style={{ color: "#c9a84c" }} />
                <span className="text-sm font-semibold" style={{ color: "#f0ede6" }}>{username}</span>
                {role && <span className="text-xs" style={{ color: "#8aab9e" }}>{role}</span>}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.2)" }} />
              <span style={{ color: "#c9a84c", fontSize: 14 }}>✦</span>
              <div className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.2)" }} />
            </div>

            {/* Status card */}
            <div
              className="rounded-xl px-4 py-4 mb-4"
              style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#8aab9e" }}>Status</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: recordingState === "recording" ? "#e74c3c"
                      : recordingState === "stopped" ? "#4caf87"
                      : cameraReady ? "#c9a84c" : "#8aab9e",
                    boxShadow: recordingState === "recording" ? "0 0 8px #e74c3c" : "none",
                    animation: recordingState === "recording" ? "pulse 1.2s ease-in-out infinite" : "none",
                  }}
                />
                <p className="text-sm font-semibold" style={{ color: "#f0ede6" }}>
                  {recordingState === "recording" ? `Sedang Merekam • ${formatTime(elapsed)}`
                    : recordingState === "stopped" ? `Rekaman Selesai • ${formatTime(elapsed)}`
                    : cameraReady ? "Kamera Siap"
                    : "Menghubungkan Kamera..."}
                </p>
              </div>
            </div>

            {/* Context info box */}
            {recordingState === "idle" && (
              <div
                className="rounded-xl px-4 py-4 mb-4 flex items-start gap-3"
                style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
              >
                <span style={{ color: "#c9a84c", marginTop: 1, flexShrink: 0, fontSize: 16 }}>ℹ</span>
                <p className="text-sm leading-relaxed" style={{ color: "#8aab9e" }}>
                  Arahkan kamera depan ke posisi Anda dengan benar dan tekan tombol{" "}
                  <span style={{ color: "#c9a84c", fontWeight: 600 }}>"Mulai Merekam"</span>{" "}
                  untuk memulai.
                </p>
              </div>
            )}

            {recordingState === "recording" && (
              <div
                className="rounded-xl px-4 py-4 mb-4 flex items-start gap-3"
                style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)" }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: "#e74c3c", animation: "pulse 1.2s ease-in-out infinite" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#e0857d" }}>
                  Sedang merekam... Bacalah dengan tartil dan fasih.
                </p>
              </div>
            )}

            {recordingState === "stopped" && (
              <div
                className="rounded-xl px-4 py-4 mb-4"
                style={{ background: "rgba(46,139,87,0.1)", border: "1px solid rgba(46,139,87,0.25)" }}
              >
                <p className="text-sm font-medium" style={{ color: "#4caf87" }}>
                  ✓ Rekaman selesai dengan durasi {formatTime(elapsed)}. Anda dapat memutar, mengunduh, atau merekam ulang.
                </p>
              </div>
            )}

            {/* Stats */}
            {(recordingState === "recording" || recordingState === "stopped") && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Durasi", value: formatTime(elapsed) },
                  { label: "Format", value: "WebM" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl px-3 py-3 text-center"
                    style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                    <p className="text-xs" style={{ color: "#8aab9e" }}>{stat.label}</p>
                    <p className="text-base font-bold" style={{ color: "#c9a84c", fontVariantNumeric: "tabular-nums" }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-4">
            {recordingState === "idle" && (
              <button
                onClick={startRecording}
                disabled={!cameraReady || !!cameraError}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95"
                style={{
                  background: cameraReady && !cameraError
                    ? "linear-gradient(135deg, #d4a843 0%, #b8892e 100%)"
                    : "rgba(201,168,76,0.2)",
                  color: cameraReady && !cameraError ? "#0b1f1a" : "#8aab9e",
                  boxShadow: cameraReady && !cameraError ? "0 4px 24px rgba(201,168,76,0.3)" : "none",
                  cursor: cameraReady && !cameraError ? "pointer" : "not-allowed",
                }}
              >
                <Video size={20} />Mulai Merekam
              </button>
            )}

            {recordingState === "recording" && (
              <button
                onClick={stopRecording}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #c0392b 0%, #96281b 100%)",
                  color: "#ffffff",
                  boxShadow: "0 4px 24px rgba(192,57,43,0.4)",
                }}
              >
                <Square size={18} fill="currentColor" />Hentikan Rekaman
              </button>
            )}

            {recordingState === "stopped" && (
              <>
                <button
                  onClick={downloadVideo}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #d4a843 0%, #b8892e 100%)",
                    color: "#0b1f1a",
                    boxShadow: "0 4px 24px rgba(201,168,76,0.3)",
                  }}
                >
                  <Download size={18} />Unduh Rekaman
                </button>
                <button
                  onClick={reset}
                  className="w-full py-3.5 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all active:scale-95"
                  style={{ background: "rgba(201,168,76,0.08)", color: "#c9a84c", border: "1.5px solid rgba(201,168,76,0.3)" }}
                >
                  <RotateCcw size={16} />Rekam Ulang
                </button>
              </>
            )}

            <p className="text-xs text-center pt-1" style={{ color: "#4a7a6a" }}>
              Semoga Allah memberkahi tilawah para siswa
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
