'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWilayah } from '@/hooks/useParish';
import { useRegisterStart, useRegisterVerify, useRegisterComplete } from '@/hooks/useRegister';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});
type EmailForm = z.infer<typeof emailSchema>;

const codeSchema = z.object({
  code: z.string().length(6, 'Kode verifikasi harus 6 digit').regex(/^\d+$/, 'Kode verifikasi harus berupa angka'),
});
type CodeForm = z.infer<typeof codeSchema>;

const profileSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  passwordConfirmation: z.string(),
  wilayahId: z.string().optional(),
  lingkunganId: z.string().optional(),
  parish: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Konfirmasi password tidak cocok',
  path: ['passwordConfirmation'],
});
type ProfileForm = z.infer<typeof profileSchema>;

const RESEND_COOLDOWN_SECONDS = 30;

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { data: wilayahList } = useWilayah();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const registerStart = useRegisterStart();
  const registerVerify = useRegisterVerify();
  const registerComplete = useRegisterComplete();

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const watchedWilayahId = profileForm.watch('wilayahId');
  const lingkunganOptions = useMemo(
    () => wilayahList?.find((w) => w.id === watchedWilayahId)?.lingkungan ?? [],
    [wilayahList, watchedWilayahId]
  );

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const onSubmitEmail = async (data: EmailForm) => {
    try {
      await registerStart.mutateAsync(data.email);
      setEmail(data.email);
      startCooldown();
      setStep(2);
    } catch (err: unknown) {
      const e = err as { message?: string };
      emailForm.setError('root', { message: e?.message || 'Gagal mengirim kode verifikasi' });
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await registerStart.mutateAsync(email);
      startCooldown();
    } catch {
      // toast sudah ditampilkan oleh hook
    }
  };

  const onSubmitCode = async (data: CodeForm) => {
    try {
      const res = await registerVerify.mutateAsync({ email, code: data.code });
      setVerificationToken(res.data.data.verification_token);
      setStep(3);
    } catch (err: unknown) {
      const e = err as { message?: string };
      codeForm.setError('root', { message: e?.message || 'Kode verifikasi salah' });
    }
  };

  const onSubmitProfile = async (data: ProfileForm) => {
    try {
      await registerComplete.mutateAsync({
        email,
        verification_token: verificationToken,
        name: data.name,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
        wilayah_id: data.wilayahId || undefined,
        lingkungan_id: data.lingkunganId || undefined,
        parish: data.parish || undefined,
      });
      await refreshUser();
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string };
      profileForm.setError('root', { message: e?.message || 'Gagal menyelesaikan registrasi' });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/altar-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/60" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/albertus-logo.png" alt="Logo Paroki Santo Albertus Agung" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow">E-Albertus</h1>
          <p className="text-white/80 mt-1 drop-shadow">Daftar Akun Jemaat</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 && 'Daftar dengan Email'}
              {step === 2 && 'Verifikasi Email'}
              {step === 3 && 'Lengkapi Profil'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 && 'Masukkan email Anda untuk memulai pendaftaran'}
              {step === 2 && `Kode verifikasi telah dikirim ke ${email}`}
              {step === 3 && 'Isi data diri untuk menyelesaikan pendaftaran'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                {emailForm.formState.errors.root && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {emailForm.formState.errors.root.message}
                  </div>
                )}
                <div>
                  <Input id="email" label="Email" type="email" placeholder="nama@email.com" {...emailForm.register('email')} />
                  {emailForm.formState.errors.email && (
                    <p className="text-destructive text-xs mt-1">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" loading={registerStart.isPending} className="w-full">
                  Kirim Kode Verifikasi
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-4">
                {codeForm.formState.errors.root && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {codeForm.formState.errors.root.message}
                  </div>
                )}
                <div>
                  <Input
                    id="code"
                    label="Kode Verifikasi (6 digit)"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    {...codeForm.register('code')}
                  />
                  {codeForm.formState.errors.code && (
                    <p className="text-destructive text-xs mt-1">{codeForm.formState.errors.code.message}</p>
                  )}
                </div>
                <Button type="submit" loading={registerVerify.isPending} className="w-full">
                  Verifikasi
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || registerStart.isPending}
                  className="w-full text-center text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Kirim ulang kode (${resendCooldown}s)` : 'Kirim ulang kode'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Ganti email
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                {profileForm.formState.errors.root && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {profileForm.formState.errors.root.message}
                  </div>
                )}
                <div>
                  <Input id="name" label="Nama Lengkap" placeholder="Nama Anda" {...profileForm.register('name')} />
                  {profileForm.formState.errors.name && (
                    <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    {...profileForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {profileForm.formState.errors.password && (
                    <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    id="passwordConfirmation"
                    label="Konfirmasi Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ulangi password"
                    {...profileForm.register('passwordConfirmation')}
                  />
                  {profileForm.formState.errors.passwordConfirmation && (
                    <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.passwordConfirmation.message}</p>
                  )}
                </div>

                <Select label="Wilayah" {...profileForm.register('wilayahId')}
                  onChange={(e) => {
                    profileForm.setValue('wilayahId', e.target.value);
                    profileForm.setValue('lingkunganId', '');
                  }}
                >
                  <option value="">Pilih wilayah</option>
                  {(wilayahList ?? []).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Select>

                <Select label="Lingkungan" {...profileForm.register('lingkunganId')} disabled={!watchedWilayahId}>
                  <option value="">{watchedWilayahId ? 'Pilih lingkungan' : 'Pilih wilayah terlebih dahulu'}</option>
                  {lingkunganOptions.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>

                <Input id="parish" label="Paroki (opsional)" placeholder="Contoh: Paroki Santo Albertus Agung" {...profileForm.register('parish')} />

                <Button type="submit" loading={registerComplete.isPending} className="w-full">
                  Selesaikan Pendaftaran
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/80 mt-6 drop-shadow">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-white font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
