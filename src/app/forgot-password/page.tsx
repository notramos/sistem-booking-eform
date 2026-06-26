"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess("Link reset password telah dikirim ke email Anda.");
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      setError(error?.message || "Gagal mengirim link reset. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">E-Albertus</h1>
          <p className="text-gray-500 mt-1">Sistem Peminjaman Ruangan Gereja</p>
          <p className="text-sm text-gray-400">Gereja Albertus Agung</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Lupa Password</CardTitle>
            <CardDescription className="text-center">
              Masukkan email Anda untuk menerima link reset password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" loading={loading} className="w-full">
                {!loading && <Mail className="w-4 h-4" />}
                Kirim Link Reset
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke halaman masuk
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} Gereja Albertus Agung
        </p>
      </div>
    </div>
  );
}
