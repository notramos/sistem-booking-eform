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

const phoneSchema = z.object({
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor WhatsApp tidak valid. Gunakan format 08xxx atau +62xxx.'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

const codeSchema = z.object({
  code: z.string().length(6, 'Kode verifikasi harus 6 digit').regex(/^\d+$/, 'Kode verifikasi harus berupa angka'),
});
type CodeForm = z.infer<typeof codeSchema>;

const profileSchema = z.object({
  email: z.string().email('Format email tidak valid'),
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
  const [phone, setPhone] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const registerStart = useRegisterStart();
  const registerVerify = useRegisterVerify();
  const registerComplete = useRegisterComplete();

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const watchedWilayahId = profileForm.watch('wilayahId');
  const lingkunganOptions = useMemo(() => {
    const wilayah = wilayahList?.find((w) => w.id === watchedWilayahId);
    // Daftar ini sudah tersaring per wilayah, jadi area cuma ditampilkan bila
    // memang menambah informasi (mis. "St. Alfonsus 2 — Alindra"), bukan saat
    // area-nya sekadar mengulang nama wilayah yang barusan dipilih.
    return (wilayah?.lingkungan ?? []).map((l) => ({
      id: l.id,
      label: l.area && l.area !== wilayah?.name ? `${l.name} — ${l.area}` : l.name,
    }));
  }, [wilayahList, watchedWilayahId]);

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

  const onSubmitPhone = async (data: PhoneForm) => {
    try {
      await registerStart.mutateAsync(data.phone);
      setPhone(data.phone);
      startCooldown();
      setStep(2);
    } catch (err: unknown) {
      const e = err as { message?: string };
      phoneForm.setError('root', { message: e?.message || 'Gagal mengirim kode verifikasi' });
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await registerStart.mutateAsync(phone);
      startCooldown();
    } catch {
      // toast sudah ditampilkan oleh hook
    }
  };

  const onSubmitCode = async (data: CodeForm) => {
    try {
      const res = await registerVerify.mutateAsync({ phone, code: data.code });
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
        phone,
        verification_token: verificationToken,
        email: data.email,
        name: data.name,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
        wilayah_id: data.wilayahId || undefined,
        lingkungan_id: data.lingkunganId || undefined,
        parish: data.parish || undefined,
      });
      await refreshUser();
      router.push('/booking/calendar');
    } catch (err: unknown) {
      const e = err as { message?: string };
      profileForm.setError('root', { message: e?.message || 'Gagal menyelesaikan registrasi' });
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f6f4ef] px-4 py-8 md:px-6 md:py-6">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/altar-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover md:hidden"
        />
        <div className="absolute inset-0 bg-slate-900/60 md:hidden" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl items-center md:grid-cols-[0.82fr_1.18fr] md:overflow-hidden md:rounded-3xl md:bg-white md:shadow-xl">
        <section className="relative hidden min-h-[720px] self-stretch overflow-hidden bg-[#303a35] md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/altar-bg.jpg" alt="Interior Gereja Santo Albertus Agung" className="absolute inset-0 h-full w-full object-cover opacity-55 saturate-[0.65]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#25312d]/90 via-[#303a35]/75 to-[#252b28]/90" />
          <div className="absolute inset-y-0 left-0 w-1 bg-[#c7a96b]/80" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/albertus-logo.png" alt="Logo AlbertusKU" className="h-full w-full object-contain" />
              </div>
              <div><p className="text-xl font-bold tracking-tight">AlbertusKU</p><p className="text-sm text-white/70">Gereja Santo Albertus Agung</p></div>
            </div>
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#ddc58f]">Bergabung dengan kami</p>
              <h2 className="max-w-xs text-4xl font-semibold leading-tight tracking-tight">Satu akun untuk pelayanan paroki.</h2>
              <div className="mt-5 h-px w-12 bg-[#c7a96b]" />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80">Daftar dengan nomor WhatsApp, verifikasi akun, lalu lengkapi data keanggotaan Anda.</p>
            </div>
            <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} Gereja Santo Albertus Agung</p>
          </div>
        </section>

      <div className="relative z-10 mx-auto w-full max-w-md md:max-w-[30rem] md:px-10 md:py-9">
        <div className="mb-6 text-center md:hidden">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/albertus-logo.png" alt="Logo Paroki Santo Albertus Agung" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow">AlbertusKU</h1>
          <p className="text-white/80 mt-1 drop-shadow">Daftar Akun Jemaat</p>
        </div>

        <div className="mb-6 hidden text-center md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#526158]">Pendaftaran umat</p>
          <p className="mt-2 text-sm text-muted-foreground">Buat akun AlbertusKU dalam tiga langkah.</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 && 'Daftar dengan Nomor WhatsApp'}
              {step === 2 && 'Verifikasi WhatsApp'}
              {step === 3 && 'Lengkapi Profil'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 && 'Masukkan nomor WhatsApp Anda untuk memulai pendaftaran'}
              {step === 2 && `Kode verifikasi telah dikirim ke WhatsApp ${phone}`}
              {step === 3 && 'Isi data diri untuk menyelesaikan pendaftaran'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4">
                {phoneForm.formState.errors.root && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {phoneForm.formState.errors.root.message}
                  </div>
                )}
                <div>
                  <Input id="phone" label="Nomor WhatsApp" type="tel" placeholder="08xxxxxxxxxx" {...phoneForm.register('phone')} />
                  {phoneForm.formState.errors.phone && (
                    <p className="text-destructive text-xs mt-1">{phoneForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <Button type="submit" loading={registerStart.isPending} className="w-full md:bg-[#34443d] md:text-white md:hover:bg-[#293831]">
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
                <Button type="submit" loading={registerVerify.isPending} className="w-full md:bg-[#34443d] md:text-white md:hover:bg-[#293831]">
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
                  <ArrowLeft className="w-3.5 h-3.5" /> Ganti nomor
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
                  <Input id="email" label="Email" type="email" placeholder="nama@email.com" {...profileForm.register('email')} />
                  {profileForm.formState.errors.email && (
                    <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>

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
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </Select>

                <Input id="parish" label="Paroki (opsional)" placeholder="Contoh: Paroki Santo Albertus Agung" {...profileForm.register('parish')} />

                <Button type="submit" loading={registerComplete.isPending} className="w-full md:bg-[#34443d] md:text-white md:hover:bg-[#293831]">
                  Selesaikan Pendaftaran
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-white/80 drop-shadow md:text-muted-foreground md:drop-shadow-none">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-white hover:underline md:text-[#526158]">
            Masuk
          </Link>
        </p>
      </div>
      </div>
    </main>
  );
}
