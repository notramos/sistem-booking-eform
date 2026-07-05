'use client';

import { useState, useMemo, useCallback, useRef, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCongregationService } from '@/hooks/useCongregationServices';
import { useWilayah } from '@/hooks/useParish';
import { useAuth } from '@/hooks/useAuth';
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/signature-pad';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSection } from '@/components/ui/form-section';
import { DynamicFormFields } from '@/components/ui/dynamic-form-fields';
import { OfficialDocumentPreview } from '@/components/ui/official-document-preview';
import { WizardProgress } from '@/components/ui/wizard-progress';
import { ArrowLeft, Search, Heart, Droplets, Bird, Flame, Church, FileText, FileCheck, Cross, FlaskConical, DoorOpen, Radio, HelpCircle, Info, BookOpen, PenLine } from 'lucide-react';
import Link from 'next/link';
import { SERVICE_TYPES, SERVICE_TYPE_MAP } from '@/lib/service-types';
import type { ServiceTypeConfig, ServiceFieldConfig } from '@/types';
import { cn } from '@/lib/utils';

type FormData = Record<string, string>;

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Droplets, Bird, Flame, Church, Heart, FileText, FileCheck, Cross, FlaskConical, DoorOpen, Radio, HelpCircle, BookOpen,
};

function getServiceTypeIcon(icon: string) {
  return ICON_MAP[icon] || HelpCircle;
}

const WIZARD_STEPS_BASE = [{ title: 'Pilih Pelayanan' }];

function buildStepSchema(stepIndex: number, config: ServiceTypeConfig) {
  const stepConfig = config.steps[stepIndex];
  if (!stepConfig) return null;

  const requiredFields: string[] = [];
  for (const section of stepConfig.sections) {
    for (const field of section.fields) {
      if (field.required) {
        const key = field.dynamicField ? `dynamic_fields.${field.name}` : field.name;
        requiredFields.push(key);
      }
    }
  }
  return requiredFields;
}

function getStepErrors(requiredFields: string[], data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === '') {
      errors[field] = 'Field ini wajib diisi';
    }
  }
  return errors;
}

function getStepFields(config: ServiceTypeConfig, stepIndex: number) {
  const stepConfig = config.steps[stepIndex];
  if (!stepConfig) return [];
  return stepConfig.sections.flatMap((s) => s.fields);
}

function getReviewFields(config: ServiceTypeConfig, formData: FormData) {
  const sections: { title: string; fields: { label: string; value: string | null | undefined }[] }[] = [];

  for (const step of config.steps) {
    for (const section of step.sections) {
      const fields = section.fields
        .map((f) => {
          const key = f.dynamicField ? `dynamic_fields.${f.name}` : f.name;
          return { label: f.label, value: formData[key] || null };
        })
        .filter((f) => f.value !== null);
      if (fields.length > 0) {
        sections.push({ title: section.title, fields });
      }
    }
  }
  return sections;
}

export default function NewCongregationServicePage() {
  const router = useRouter();
  const createService = useCreateCongregationService();
  const { data: wilayahList } = useWilayah();
  const [currentStep, setCurrentStep] = useState(0);

  // Opsi dropdown Lingkungan (neighborhood) & Wilayah (region) dari data master.
  const areaOptions = useMemo(() => {
    const wilayahOptions = (wilayahList ?? []).map((w) => ({ value: w.name, label: w.name }));
    const lingkunganOptions = (wilayahList ?? []).flatMap((w) =>
      w.lingkungan.map((l) => ({ value: l.name, label: l.name }))
    );
    return { wilayahOptions, lingkunganOptions };
  }, [wilayahList]);

  const injectAreaOptions = useCallback(
    (fields: ServiceFieldConfig[]): ServiceFieldConfig[] =>
      fields.map((f) => {
        if (f.type !== 'select') return f;
        if (f.name === 'neighborhood') return { ...f, options: areaOptions.lingkunganOptions };
        if (f.name === 'region') return { ...f, options: areaOptions.wilayahOptions };
        return f;
      }),
    [areaOptions]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({ service_type: '' });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Tanda tangan pemohon yang dibubuhkan langsung di form (default: dari profil bila ada).
  const { user } = useAuth();
  const profileSignature = user?.signature ?? null;
  const [useProfileSignature, setUseProfileSignature] = useState(true);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const signaturePadRef = useRef<SignaturePadHandle>(null);
  const signature = useProfileSignature ? profileSignature : drawnSignature;

  const selectedType = formData.service_type;
  const config = selectedType ? SERVICE_TYPE_MAP[selectedType] : null;

  const wizardSteps = useMemo(() => {
    if (!config) return WIZARD_STEPS_BASE;
    return [
      { title: 'Pilih Pelayanan' },
      ...config.steps.map((s) => ({ title: s.title })),
      { title: 'Review & Kirim' },
    ];
  }, [config]);

  const updateField = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const updateDateField = useCallback((key: string, date: Date | undefined) => {
    updateField(key, date ? date.toISOString().split('T')[0] : '');
  }, [updateField]);

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return SERVICE_TYPES;
    const q = searchQuery.toLowerCase();
    return SERVICE_TYPES.filter(
      (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const validateCurrentStep = useCallback(
    (step: number) => {
      if (!config) return true;
      const stepConfigIndex = step - 1;
      if (stepConfigIndex < 0 || stepConfigIndex >= config.steps.length) return true;

      const requiredFields = buildStepSchema(stepConfigIndex, config);
      if (!requiredFields) return true;

      const errors = getStepErrors(requiredFields, formData);
      setStepErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [config, formData]
  );

  const handleNext = useCallback(() => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
    }
  }, [currentStep, validateCurrentStep, wizardSteps.length]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!config) return;

    let allRequiredFields: string[] = [];
    for (let i = 0; i < config.steps.length; i++) {
      const fields = buildStepSchema(i, config);
      if (fields) allRequiredFields = [...allRequiredFields, ...fields];
    }
    const allErrors = getStepErrors(allRequiredFields, formData);
    setStepErrors(allErrors);

    if (Object.keys(allErrors).length > 0) return;

    const payload: Record<string, unknown> = {
      service_type: formData.service_type,
      applicant_name: formData.applicant_name || '',
      contact: formData.contact || '',
    };

    const directFields = [
      'applicant_gender', 'baptismal_name', 'birth_place', 'birth_date',
      'address', 'phone', 'mobile_phone', 'neighborhood', 'region', 'parish',
      'father_name', 'father_religion', 'mother_name', 'mother_religion',
      'school', 'grade', 'occupation', 'family_card_number', 'service_date', 'description',
    ];
    for (const field of directFields) {
      if (formData[field]) payload[field] = formData[field];
    }

    const dynamicFields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      if (key.startsWith('dynamic_fields.') && formData[key]) {
        dynamicFields[key.replace('dynamic_fields.', '')] = formData[key];
      }
    }
    if (Object.keys(dynamicFields).length > 0) payload.dynamic_fields = dynamicFields;

    // Tanda tangan pemohon: gambar dari pad (mode gambar) atau tanda tangan profil.
    const signatureToSend = useProfileSignature
      ? profileSignature
      : (signaturePadRef.current?.getDataUrl() ?? null);
    if (signatureToSend) payload.signature_pemohon = signatureToSend;

    try {
      await createService.mutateAsync(payload as unknown as Parameters<typeof createService.mutateAsync>[0]);
      router.push('/layanan-umat');
    } catch {
      // handled by hook
    }
  }, [config, formData, createService, router, useProfileSignature, profileSignature]);

  const hasServiceType = !!selectedType;

  return (
    <div className="space-y-6">
      <Link
        href="/layanan-umat"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Pelayanan Umat</h1>
        <p className="text-muted-foreground mt-1">Ajukan permohonan pelayanan untuk jemaat</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Form Permohonan Pelayanan Umat</CardTitle>
          <CardDescription>
            {config
              ? `${config.label} — ${config.description}`
              : 'Pilih jenis pelayanan terlebih dahulu'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <WizardProgress steps={wizardSteps} currentStep={currentStep} onStepClick={setCurrentStep} />
          </div>

          {/* Step 0: Pilih Pelayanan */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Cari jenis pelayanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredTypes.map((t) => {
                  const selected = selectedType === t.value;
                  const Icon = getServiceTypeIcon(t.icon);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setFormData({ service_type: t.value });
                        setStepErrors({});
                        setCurrentStep(1);
                      }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border text-sm transition-all text-center',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        selected
                          ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:shadow-sm'
                      )}
                    >
                      <Icon className={cn('w-7 h-7', t.theme)} />
                      <span className="font-medium text-xs leading-tight whitespace-pre-line">
                        {t.label}
                      </span>
                    </button>
                  );
                })}
                {filteredTypes.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    Tidak ada pelayanan yang sesuai dengan pencarian &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasServiceType}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}

          {/* Step 1..N: Form steps */}
          {config && currentStep > 0 && currentStep <= config.steps.length && (
            <div className="space-y-4">
              {config.steps[currentStep - 1]?.description && (
                <p className="text-sm text-muted-foreground">
                  {config.steps[currentStep - 1].description}
                </p>
              )}
              {config.steps[currentStep - 1]?.sections.map((section) => (
                <FormSection
                  key={section.id}
                  title={section.title}
                  defaultOpen={section.id === 'data_pribadi' || section.id === 'data_pemohon' || currentStep === 1}
                >
                  <DynamicFormFields
                    fields={injectAreaOptions(section.fields)}
                    formData={formData}
                    errors={stepErrors}
                    onChange={updateField}
                    onDateChange={updateDateField}
                    isDynamic={section.fields.some((f) => f.dynamicField)}
                  />
                </FormSection>
              ))}

              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={handlePrev}>
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}

          {/* Review & Submit */}
          {config && currentStep === config.steps.length + 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Periksa kembali data yang akan Anda kirimkan. Pastikan semua data sudah benar.
              </p>
              <OfficialDocumentPreview
                title={config.label}
                sections={getReviewFields(config, formData)}
                applicantName={formData.applicant_name}
                signaturePemohonUrl={useProfileSignature ? profileSignature : undefined}
              />

              {/* Tanda tangan pemohon */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">Tanda Tangan Pemohon</h3>
                </div>

                {profileSignature && useProfileSignature ? (
                  <div className="space-y-2">
                    <div className="rounded-md border bg-white p-3 flex items-center justify-center max-w-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profileSignature} alt="Tanda tangan tersimpan" className="h-20 object-contain" />
                    </div>
                    <p className="text-xs text-muted-foreground">Memakai tanda tangan tersimpan dari profil Anda.</p>
                    <button
                      type="button"
                      onClick={() => setUseProfileSignature(false)}
                      className="text-sm text-primary hover:underline"
                    >
                      Gambar tanda tangan baru
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-md">
                    <SignaturePad ref={signaturePadRef} onChange={(has) => setDrawnSignature(has ? 'drawn' : null)} />
                    {profileSignature && (
                      <button
                        type="button"
                        onClick={() => { setUseProfileSignature(true); setDrawnSignature(null); }}
                        className="text-sm text-primary hover:underline"
                      >
                        Gunakan tanda tangan tersimpan
                      </button>
                    )}
                  </div>
                )}
                {!signature && (
                  <p className="text-xs text-muted-foreground">
                    Opsional — jika dikosongkan, dokumen tetap menampilkan nama Anda sebagai pemohon.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  <span className="font-medium text-foreground">Perhatian: </span>
                  Data yang sudah dikirim akan diverifikasi oleh sekretariat. Pastikan semua data
                  yang diisi sudah benar dan lengkap.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={handlePrev}>
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={createService.isPending}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Ajukan Pelayanan
                </Button>
              </div>
            </div>
          )}

          {/* No service type selected yet */}
          {!config && currentStep === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Pilih jenis pelayanan di atas untuk memulai
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
