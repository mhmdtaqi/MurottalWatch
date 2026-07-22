import { createBrowserRouter, Navigate } from "react-router";
import Root, { isAuthenticated } from "./Root";
import LoginPage from "./pages/LoginPage";
import RecordPage from "./pages/RecordPage";
import GuruPage from "./pages/GuruPage";
import React from "react";

// Fungsi kecil untuk mengambil Role dari Session
const getRole = () => sessionStorage.getItem("role");

// --- KOMPONEN PELINDUNG (GUARDS) ---

// A. Pelindung untuk halaman Publik (Login)
// Jika sudah login, lempar ke halamannya masing-masing
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  if (isAuthenticated()) {
    return <Navigate to={getRole() === "Guru" ? "/guru" : "/record"} replace />;
  }
  return <>{children}</>;
};

// B. Pelindung khusus untuk Siswa
const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />; // Belum login? Ke login
  if (getRole() === "Guru") return <Navigate to="/guru" replace />; // Guru kesasar? Lempar ke /guru
  return <>{children}</>;
};

// C. Pelindung khusus untuk Guru
const GuruRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />; // Belum login? Ke login
  if (getRole() !== "Guru") return <Navigate to="/record" replace />; // Siswa kesasar? Lempar ke /record
  return <>{children}</>;
};


// --- DAFTAR RUTE (ROUTER) ---
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { 
        index: true, 
        element: <PublicRoute><LoginPage /></PublicRoute> 
      },
      { 
        path: "login", 
        element: <PublicRoute><LoginPage /></PublicRoute> 
      },
      { 
        path: "record", 
        // Dibungkus dengan pelindung Siswa
        element: <StudentRoute><RecordPage /></StudentRoute> 
      },
      { 
        path: "guru", 
        // Dibungkus dengan pelindung Guru
        element: <GuruRoute><GuruPage /></GuruRoute> 
      },
    ],
  },
]);