"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      router.push("/booking/calendar");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError("root", { message: e?.message || "Email atau password salah" });
    }
  };

  return (
    <main className="min-h-screen bg-[#fbf8f4] md:flex md:items-center md:justify-center md:p-6">
      <div className="grid min-h-screen w-full overflow-hidden bg-background shadow-xl md:min-h-0 md:max-w-5xl md:grid-cols-[1.1fr_0.9fr] md:rounded-3xl">
        <section className="relative hidden min-h-[640px] overflow-hidden bg-[#303a35] md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/altar-bg.jpg" alt="Interior Gereja Santo Albertus Agung" className="absolute inset-0 h-full w-full object-cover opacity-55 saturate-[0.65]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#25312d]/90 via-[#303a35]/75 to-[#252b28]/90" />
          <div className="absolute inset-y-0 left-0 w-1 bg-[#c7a96b]/80" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white lg:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/albertus-logo.png" alt="Logo AlbertusKU" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">AlbertusKU</p>
                <p className="text-sm text-white/70">Gereja Santo Albertus Agung</p>
              </div>
            </div>
            <div className="max-w-md">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#ddc58f]">Gereja Santo Albertus Agung</p>
              <h1 className="max-w-sm text-4xl font-semibold leading-[1.12] tracking-tight lg:text-[3.25rem]">Pelayanan paroki, lebih dekat.</h1>
              <div className="mt-5 h-px w-12 bg-[#c7a96b]" />
              <p className="mt-5 max-w-sm text-base leading-relaxed text-white/80">
                Kelola peminjaman ruangan dan pelayanan umat dalam satu aplikasi yang sederhana, jelas, dan terhubung.
              </p>
            </div>
            <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} Gereja Santo Albertus Agung</p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 md:min-h-[640px] md:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center md:text-left">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-primary/10 md:hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/albertus-logo.png" alt="Logo AlbertusKU" className="h-full w-full object-contain" />
              </div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#526158] md:text-[#526158]">Selamat datang</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Masuk ke AlbertusKU</h1>
              <p className="mt-2 text-sm text-muted-foreground">Gunakan akun Anda untuk melanjutkan.</p>
            </div>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="sr-only">
                <CardTitle>Masuk</CardTitle>
                <CardDescription>Masukkan email dan password Anda</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {errors.root.message}
                </div>
              )}

              <div>
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-sm text-primary transition-colors hover:text-primary/80 md:text-[#526158] md:hover:text-[#303a35]">
                  Lupa password?
                </Link>
              </div>

              <Button type="submit" loading={isSubmitting} className="h-12 w-full rounded-xl text-base shadow-md shadow-primary/20 md:bg-[#34443d] md:text-white md:shadow-[#34443d]/15 md:hover:bg-[#293831]">
                <ShieldCheck className="mr-2 h-4 w-4" /> Masuk dengan aman
              </Button>
            </form>
              </CardContent>
            </Card>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline md:text-[#526158]">Daftar sekarang</Link>
            </p>

            <p className="mt-8 text-center text-xs text-muted-foreground/60 md:hidden">
              &copy; {new Date().getFullYear()} Gereja Santo Albertus Agung
            </p>

            <PwaInstallBanner compact />
          </div>
        </section>
      </div>
    </main>
  );
}
