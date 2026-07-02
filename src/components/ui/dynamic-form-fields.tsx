'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { FormRadioGroup } from '@/components/ui/form-radio-group';
import type { ServiceFieldConfig } from '@/types';

interface DynamicFormFieldsProps {
  fields: ServiceFieldConfig[];
  formData: Record<string, string>;
  errors: Record<string, string | undefined>;
  onChange: (name: string, value: string) => void;
  onDateChange: (name: string, date: Date | undefined) => void;
  isDynamic?: boolean;
}

export function DynamicFormFields({
  fields,
  formData,
  errors,
  onChange,
  onDateChange,
  isDynamic = false,
}: DynamicFormFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {fields.map((field) => {
        const fieldKey = isDynamic ? `dynamic_fields.${field.name}` : field.name;
        const value = formData[fieldKey] ?? '';
        const error = errors[fieldKey];

        const style = field.colSpan === 2 ? 'lg:col-span-2' : field.colSpan === 3 ? 'lg:col-span-3' : '';

        switch (field.type) {
          case 'textarea':
            return (
              <div key={fieldKey} className={style}>
                <Textarea
                  id={fieldKey}
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  placeholder={field.placeholder}
                  value={value}
                  onChange={(e) => onChange(fieldKey, e.target.value)}
                  error={error}
                  rows={3}
                />
              </div>
            );

          case 'select':
            return (
              <div key={fieldKey} className={style}>
                <Select
                  id={fieldKey}
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  value={value}
                  onChange={(e) => onChange(fieldKey, e.target.value)}
                  error={error}
                >
                  <option value="">{field.placeholder || `Pilih ${field.label.toLowerCase()}`}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            );

          case 'radio':
            return (
              <div key={fieldKey} className={style}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {field.label}{field.required ? ' *' : ''}
                </label>
                <FormRadioGroup
                  options={field.options ?? []}
                  value={value}
                  onChange={(v) => onChange(fieldKey, v)}
                  name={fieldKey}
                  error={error}
                />
              </div>
            );

          case 'date':
            return (
              <div key={fieldKey} className={style}>
                <DatePicker
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  value={value ? new Date(value + 'T00:00:00') : undefined}
                  onChange={(date) => onDateChange(fieldKey, date)}
                  error={error}
                />
              </div>
            );

          case 'date_range':
            return (
              <div key={fieldKey} className={style}>
                <DateRangePicker
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  value={value ? JSON.parse(value) as DateRange : undefined}
                  onChange={(range) => onChange(fieldKey, range ? JSON.stringify(range) : '')}
                  error={error}
                />
              </div>
            );

          default:
            return (
              <div key={fieldKey} className={style}>
                <Input
                  id={fieldKey}
                  type={field.type}
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  placeholder={field.placeholder}
                  value={value}
                  onChange={(e) => onChange(fieldKey, e.target.value)}
                  error={error}
                />
              </div>
            );
        }
      })}
    </div>
  );
}
