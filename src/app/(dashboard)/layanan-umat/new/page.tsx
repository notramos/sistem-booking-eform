'use client';

import { useState, useMemo, useCallback, type ComponentType } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCreateCongregationService } from '@/hooks/useCongregationServices';
import { useWilayah } from '@/hooks/useParish';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormSection } from '@/components/ui/form-section';
import { DynamicFormFields } from '@/components/ui/dynamic-form-fields';
import { DetailFields } from '@/components/detail/DetailFields';
import { WizardProgress } from '@/components/ui/wizard-progress';
import { WizardFooter } from '@/components/ui/wizard-footer';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Heart, Droplets, Bird, Flame, Church, FileText, FileCheck, Cross, FlaskConical, DoorOpen, Radio, HelpCircle, Info, BookOpen, CalendarPlus, MessagesSquare } from 'lucide-react';
import Link from 'next/link';
import { SERVICE_TYPES, SERVICE_TYPE_MAP, computeMisaScheduleOptions } from '@/lib/service-types';
import { angkaKeTerbilang } from '@/lib/terbilang';
import type { ServiceTypeConfig, ServiceFieldConfig } from '@/types';
import { cn } from '@/lib/utils';

type FormData = Record<string, string>;

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Droplets, Bird, Flame, Church, Heart, FileText, FileCheck, Cross, FlaskConical, DoorOpen, Radio, HelpCircle, BookOpen,
  CalendarPlus, MessagesSquare,
};

function getServiceTypeIcon(icon: string) {
  return ICON_MAP[icon] || HelpCircle;
}

const WIZARD_STEPS_BASE = [{ title: 'Pilih Pelayanan' }];

/** Samakan dengan logika kunci di DynamicFormFields — field.name bisa sudah mengandung prefix `dynamic_fields.` sendiri. */
function fieldKeyOf(field: ServiceFieldConfig): string {
  return field.dynamicField && !field.name.startsWith('dynamic_fields.') ? `dynamic_fields.${field.name}` : field.name;
}

function buildStepSchema(stepIndex: number, config: ServiceTypeConfig) {
  const stepConfig = config.steps[stepIndex];
  if (!stepConfig) return null;

  const requiredFields: string[] = [];
  for (const section of stepConfig.sections) {
    for (const field of section.fields) {
      if (field.required) {
        requiredFields.push(fieldKeyOf(field));
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
        .map((f) => ({ label: f.label, value: formData[fieldKeyOf(f)] || null }))
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
    // Daftar lingkungan disajikan datar lintas wilayah, jadi nama saja
    // ("St. Alfonsus 2") sulit dikenali — sertakan perumahan/wilayahnya.
    const lingkunganOptions = (wilayahList ?? []).flatMap((w) =>
      w.lingkungan.map((l) => ({
        value: l.name,
        label: l.area ? `${l.name} — ${l.area}` : `${l.name} — ${w.name}`,
      }))
    );
    return { wilayahOptions, lingkunganOptions };
  }, [wilayahList]);

  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({ service_type: '' });

  const injectAreaOptions = useCallback(
    (fields: ServiceFieldConfig[]): ServiceFieldConfig[] =>
      fields.map((f) => {
        if (f.type === 'select') {
          if (f.name === 'neighborhood') return { ...f, options: areaOptions.lingkunganOptions };
          if (f.name === 'region') return { ...f, options: areaOptions.wilayahOptions };
          return f;
        }
        if (f.name === 'dynamic_fields.jadwal_misa' && f.type === 'radio') {
          const tanggalMisa = formData['dynamic_fields.tanggal_misa'];
          if (tanggalMisa) return { ...f, options: computeMisaScheduleOptions(tanggalMisa) };
        }
        return f;
      }),
    [areaOptions, formData]
  );
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [consentChecked, setConsentChecked] = useState(false);

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
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      // Jadwal misa cuma punya 1 opsi (Sabtu/Jumat pertama) — auto-pilih tanpa perlu diklik user.
      if (key === 'dynamic_fields.tanggal_misa' && value) {
        const options = computeMisaScheduleOptions(value);
        if (options.length === 1) next['dynamic_fields.jadwal_misa'] = options[0].value;
      }

      // Hitung terbilang otomatis dari jumlah stipendium.
      if (key === 'dynamic_fields.stipendium_amount') {
        const n = Number(value);
        next['dynamic_fields.stipendium_terbilang'] = value && n > 0 ? `${angkaKeTerbilang(n)} Rupiah` : '';
      }

      return next;
    });
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const updateDateField = useCallback((key: string, date: Date | undefined) => {
    updateField(key, date ? format(date, 'yyyy-MM-dd') : '');
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

    try {
      await createService.mutateAsync(payload as unknown as Parameters<typeof createService.mutateAsync>[0]);
      router.push('/layanan-umat');
    } catch {
      // handled by hook
    }
  }, [config, formData, createService, router]);

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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                      <Icon className={cn('w-8 h-8', t.theme)} />
                      <span className="font-semibold text-xs leading-tight line-clamp-2">
                        {t.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                        {t.description}
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

              <WizardFooter onNext={handleNext} nextDisabled={!hasServiceType} />
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
              {config.steps[currentStep - 1]?.sections.map((section, idx) => (
                <FormSection
                  key={section.id}
                  title={section.title}
                  defaultOpen={idx === 0}
                >
                  <DynamicFormFields
                    fields={injectAreaOptions(section.fields)}
                    formData={formData}
                    errors={stepErrors}
                    onChange={updateField}
                    onDateChange={updateDateField}
                  />
                </FormSection>
              ))}

              <WizardFooter onPrev={handlePrev} onNext={handleNext} />
            </div>
          )}

          {/* Review & Submit */}
          {config && currentStep === config.steps.length + 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Periksa kembali data yang akan Anda kirimkan. Pastikan semua data sudah benar.
              </p>
              <div className="rounded-lg border p-4">
                <DetailFields groups={getReviewFields(config, formData)} />
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  <span className="font-medium text-foreground">Perhatian: </span>
                  Data yang sudah dikirim akan diverifikasi oleh sekretariat. Pastikan semua data
                  yang diisi sudah benar dan lengkap.
                </p>
              </div>

              <Checkbox
                id="consent-layanan-umat"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                label="Saya menyatakan bahwa data yang diisi sudah benar dan bersedia bertanggung jawab atas pengajuan ini."
              />

              <WizardFooter
                onPrev={handlePrev}
                onNext={handleSubmit}
                nextLabel="Ajukan Pelayanan"
                nextLoading={createService.isPending}
                nextDisabled={!consentChecked}
                nextIcon={Heart}
              />
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
