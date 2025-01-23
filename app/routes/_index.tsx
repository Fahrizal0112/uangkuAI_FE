import { Link } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { createCookieSessionStorage } from "@remix-run/node";

// Definisikan sessionStorage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET as string],
    secure: process.env.NODE_ENV === "production",
  },
});

type ActionData = {
  status: string;
  message: string;
  error?: string;
};

type PopupProps = {
  message: string;
  status: string;
  isVisible: boolean;
  onClose: () => void;
};

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    console.log("Attempting login with:", { username });

    const response = await fetch("http://8.215.199.5:3001/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
      credentials: 'include',
    });

    console.log("Login response status:", response.status);
    const data = await response.json();
    console.log("Login response data:", data);

    if (data.status === "success") {
      const session = await sessionStorage.getSession();
      
      // Ambil token dari header Authorization
      const authHeader = response.headers.get('Authorization');
      const token = authHeader ? authHeader.replace('Bearer ', '') : null;

      if (!token) {
        console.error('Token tidak ditemukan di header');
        // Coba ambil token dari cookie jika ada
        const cookies = response.headers.get('set-cookie');
        const tokenMatch = cookies?.match(/token=([^;]+)/);
        const cookieToken = tokenMatch ? tokenMatch[1] : null;

        if (!cookieToken) {
          throw new Error('Token tidak ditemukan');
        }
        session.set("token", cookieToken);
      } else {
        session.set("token", token);
      }

      // Simpan user data di session
      session.set("userId", data.data.id);
      session.set("username", data.data.username);

      return redirect("/dashboard", {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session)
        }
      });
    } else {
      return json(
        { 
          status: "error",
          message: "Username atau password salah"
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return json(
      { 
        status: "error",
        message: "Terjadi kesalahan. Silakan coba lagi."
      },
      { status: 500 }
    );
  }
}

function Popup({ message, status, isVisible, onClose }: PopupProps) {
  return (
    <div className={`fixed inset-0 flex items-center justify-center transition-opacity duration-300 ${
      isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      <button className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></button>
      <div className={`relative bg-white rounded-lg p-6 shadow-xl transform transition-all duration-300 ${
        isVisible ? "scale-100" : "scale-95"
      } ${status === "success" ? "border-l-4 border-green-500" : "border-l-4 border-red-500"}`}>
        <div className="flex items-center space-x-3">
          {status === "success" ? (
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
          <p className="text-gray-800">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (actionData?.status === "success") {
      setShowPopup(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } else if (actionData?.status === "error") {
      setShowPopup(true);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold">UangKuAI</h1>
      </div>

      {/* Judul */}
      <h1 className="text-2xl font-bold mb-8">Login ke Akun Anda</h1>

      {/* Error Message */}
      {actionData?.error && (
        <div className="w-full max-w-md mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {actionData.error}
        </div>
      )}

      {/* Form */}
      <div className="w-full max-w-md">
        <Form method="post" className="space-y-6">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <Link
              to="/forgot-password"
              className="absolute right-0 top-0 text-sm text-black hover:underline"
            >
              Lupa password?
            </Link>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Login
          </button>
        </Form>

        {/* Link ke Register */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link to="/register" className="text-black font-semibold hover:underline">
            Daftar sekarang
          </Link>
        </div>
      </div>

      {/* Popup Notifikasi */}
      <Popup
        message={actionData?.message || ""}
        status={actionData?.status || ""}
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
}
