import { Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Form, useActionData, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";

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
  const confirmPassword = formData.get("confirmPassword");

  // Validasi input
  if (!username || !password || !confirmPassword) {
    return json({ 
      status: "error",
      message: "Semua field harus diisi" 
    }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return json({ 
      status: "error",
      message: "Password dan konfirmasi password tidak cocok" 
    }, { status: 400 });
  }

  try {
    console.log('Attempting to register with:', { username }); // Logging untuk debug

    const response = await fetch("http://8.215.199.5:3001/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      mode: 'cors',
      body: JSON.stringify({
        username,
        password,
      }),
    });

    console.log('Response status:', response.status); // Logging untuk debug

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server error response:', errorData);
      return json({ 
        status: "error",
        message: "Registrasi gagal. Silakan coba lagi." 
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Response data:', data); // Logging untuk debug

    if (data.status === "success") {
      return json({ 
        status: "success",
        message: "Registrasi berhasil! Silakan login." 
      });
    } else {
      return json({ 
        status: "error",
        message: data.message || "Registrasi gagal. Silakan coba lagi." 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return json({ 
      status: "error",
      message: "Terjadi kesalahan. Silakan coba lagi." 
    }, { status: 500 });
  }
}

// Komponen Popup
function Popup({ message, status, isVisible, onClose }: { message: string, status: string, isVisible: boolean, onClose: () => void }) {
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

export default function Register() {
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (actionData) {
      setShowPopup(true);
      if (actionData.status === "success") {
        const timer = setTimeout(() => {
          navigate("/");
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [actionData, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold">UangKuAI</h1>
      </div>

      {/* Judul */}
      <h1 className="text-2xl font-bold mb-8">Daftar Akun Baru</h1>

      {/* Error Message */}
      {actionData?.error && (
        <div className="w-full max-w-md mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          (actionData.error)
        </div>
      )}

      {/* Form */}
      <div className="w-full max-w-md">
        <Form method="post" className="space-y-6">
          {/* username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              username
            </label>
            <input
              type="username"
              id="username"
              name="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Konfirmasi Password Input */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-2"
            >
              Konfirmasi Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Tombol Daftar */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Daftar
          </button>
        </Form>

        {/* Link ke Login */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link
            to="/"
            className="text-black font-semibold hover:underline"
          >
            Login sekarang
          </Link>
        </div>
      </div>

      {/* Popup Notifikasi */}
      <Popup
        message={actionData?.message || "s"}
        status={actionData?.status || ""}
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
}
