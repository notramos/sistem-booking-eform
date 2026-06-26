"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";
import { Lock } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, email, password, passwordConfirmation);
      router.push("/login");
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      setError(error?.message || "Gagal mereset password. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Link Tidak Valid</CardTitle>
              <CardDescription className="text-center">
                Link reset password tidak valid atau telah kedaluwarsa.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">E-Albertus</h1>
          <p className="text-muted-foreground mt-1">Sistem Peminjaman Ruangan Gereja</p>
          <p className="text-sm text-muted-foreground/60">Gereja Albertus Agung</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Buat password baru untuk akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                id="password"
                label="Password Baru"
                type="password"
                placeholder="Masukkan password baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                id="passwordConfirmation"
                label="Konfirmasi Password"
                type="password"
                placeholder="Masukkan ulang password baru"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />

              <Button type="submit" loading={loading} className="w-full">
                {!loading && <Lock className="w-4 h-4" />}
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/40 mt-8">
          &copy; {new Date().getFullYear()} Gereja Albertus Agung
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
