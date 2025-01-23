import { Link } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // Validasi dasar
  if (password !== confirmPassword) {
    return json(
      { error: "Password dan konfirmasi password tidak cocok" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("http://8.215.199.5:3001/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      return redirect("/login");
    } else {
      return json(
        { error: "Gagal mendaftar. Silakan coba lagi." },
        { status: 400 }
      );
    }
  } catch (error) {
    return json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

export default function Register() {
  const actionData = useActionData();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <img src="/logo.png" alt="Logo" className="w-20 h-20" />
      </div>

      {/* Judul */}
      <h1 className="text-2xl font-bold mb-8">Daftar Akun Baru</h1>

      {/* Error Message */}
      {actionData?.error && (
        <div className="w-full max-w-md mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {actionData.error}
        </div>
      )}

      {/* Form */}
      <div className="w-full max-w-md">
        <Form method="post" className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
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
            to="/login"
            className="text-black font-semibold hover:underline"
          >
            Login sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
