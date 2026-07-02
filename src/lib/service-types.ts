import type { ServiceTypeConfig } from '@/types';

export const RELIGION_OPTIONS = [
  { value: 'Katolik', label: 'Katolik' },
  { value: 'Kristen', label: 'Kristen' },
  { value: 'Islam', label: 'Islam' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Buddha', label: 'Buddha' },
  { value: 'Khonghucu', label: 'Khonghucu' },
];

export const GENDER_OPTIONS = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: 'Kawin', label: 'Kawin' },
  { value: 'Belum Kawin', label: 'Belum Kawin' },
  { value: 'Cerai Hidup', label: 'Cerai Hidup' },
  { value: 'Cerai Mati', label: 'Cerai Mati' },
];

export const EQUIPMENT_OPTIONS = [
  { value: 'TOA', label: 'TOA' },
  { value: 'LCD', label: 'LCD' },
  { value: 'NEC', label: 'NEC' },
  { value: 'ACER', label: 'ACER' },
];

const pribadiFields = (type: 'lengkap' | 'dasar') => {
  const fields: ServiceTypeConfig['steps'][0]['sections'][0]['fields'] = [
    { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama lengkap sesuai KTP', colSpan: 2 },
    { name: 'applicant_gender', label: 'Jenis Kelamin', type: 'radio', required: true, options: GENDER_OPTIONS },
    { name: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true, placeholder: 'Kota kelahiran' },
    { name: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
  ];
  if (type === 'lengkap') {
    fields.splice(1, 0, { name: 'baptismal_name', label: 'Nama Baptis', type: 'text', required: true, placeholder: 'Nama baptis (santo/santa)' });
  }
  return fields;
};

const orangTuaFields: ServiceTypeConfig['steps'][0]['sections'][0]['fields'] = [
  { name: 'father_name', label: 'Nama Ayah', type: 'text', required: true, colSpan: 2 },
  { name: 'father_religion', label: 'Agama Ayah', type: 'select', required: true, options: RELIGION_OPTIONS },
  { name: 'mother_name', label: 'Nama Ibu', type: 'text', required: true, colSpan: 2 },
  { name: 'mother_religion', label: 'Agama Ibu', type: 'select', required: true, options: RELIGION_OPTIONS },
];

const kontakFields: ServiceTypeConfig['steps'][0]['sections'][0]['fields'] = [
  { name: 'address', label: 'Alamat', type: 'textarea', required: true, placeholder: 'Alamat lengkap', colSpan: 2 },
  { name: 'contact', label: 'Kontak (HP/Telepon)', type: 'tel', required: true, placeholder: 'Nomor yang bisa dihubungi' },
  { name: 'phone', label: 'Telepon', type: 'tel', required: false, placeholder: 'Nomor telepon rumah' },
  { name: 'mobile_phone', label: 'HP', type: 'tel', required: false, placeholder: 'Nomor HP' },
  { name: 'neighborhood', label: 'Lingkungan', type: 'select', required: true, options: [] as { value: string; label: string }[], placeholder: 'Pilih lingkungan' },
  { name: 'region', label: 'Wilayah', type: 'select', required: false, options: [] as { value: string; label: string }[], placeholder: 'Pilih wilayah' },
  { name: 'parish', label: 'Paroki', type: 'text', required: false, placeholder: 'Nama paroki' },
];

const pendidikanFields: ServiceTypeConfig['steps'][0]['sections'][0]['fields'] = [
  { name: 'school', label: 'Sekolah', type: 'text', required: false, placeholder: 'Nama sekolah' },
  { name: 'grade', label: 'Kelas', type: 'text', required: false, placeholder: 'Kelas / tingkat' },
];

function personaFields(prefix: string): ServiceTypeConfig['steps'][0]['sections'][0]['fields'] {
  return [
    { name: `${prefix}_name`, label: 'Nama Lengkap', type: 'text', required: true, colSpan: 2, dynamicField: true },
    { name: `${prefix}_birth_place`, label: 'Tempat Lahir', type: 'text', required: true, dynamicField: true },
    { name: `${prefix}_birth_date`, label: 'Tanggal Lahir', type: 'date', required: true, dynamicField: true },
    { name: `${prefix}_address`, label: 'Alamat', type: 'textarea', required: true, colSpan: 2, dynamicField: true },
    { name: `${prefix}_contact`, label: 'Telepon/HP', type: 'tel', required: true, dynamicField: true },
    { name: `${prefix}_father_name`, label: 'Nama Ayah', type: 'text', required: true, colSpan: 2, dynamicField: true },
    { name: `${prefix}_father_religion`, label: 'Agama Ayah', type: 'select', required: true, options: RELIGION_OPTIONS, dynamicField: true },
    { name: `${prefix}_mother_name`, label: 'Nama Ibu', type: 'text', required: true, colSpan: 2, dynamicField: true },
    { name: `${prefix}_mother_religion`, label: 'Agama Ibu', type: 'select', required: true, options: RELIGION_OPTIONS, dynamicField: true },
  ];
}

export const SERVICE_TYPES: ServiceTypeConfig[] = [
  {
    value: 'baptis_balita',
    label: 'Baptis Balita',
    description: 'Pendaftaran baptis untuk anak usia 0–7 tahun',
    icon: 'Droplets',
    theme: 'text-blue-600',
    steps: [
      {
        title: 'Data Pemohon',
        description: 'Data pribadi anak yang akan dibaptis',
        sections: [
          { id: 'data_pribadi', title: 'Data Pribadi', fields: pribadiFields('lengkap') },
          { id: 'data_orang_tua', title: 'Data Orang Tua', fields: orangTuaFields },
          { id: 'data_kontak', title: 'Kontak & Domisili', fields: kontakFields },
        ],
      },
      {
        title: 'Detail Baptis',
        description: 'Data sakramen baptis',
        sections: [
          {
            id: 'detail_sakramen',
            title: 'Data Sakramen Baptis',
            fields: [
              { name: 'dynamic_fields.godparent_name', label: 'Nama Wali Baptis', type: 'text', required: true, placeholder: 'Nama lengkap wali baptis', dynamicField: true },
              { name: 'dynamic_fields.parent_marriage_church_date', label: 'Tanggal Nikah Gereja', type: 'date', required: false, dynamicField: true },
              { name: 'dynamic_fields.parent_marriage_church', label: 'Gereja Nikah', type: 'text', required: false, placeholder: 'Nama gereja tempat pemberkatan', dynamicField: true },
              { name: 'dynamic_fields.parent_civil_registry_date', label: 'Tanggal Catatan Sipil', type: 'date', required: false, dynamicField: true },
              { name: 'dynamic_fields.priest_name', label: 'Pastor Pembaptis', type: 'text', required: false, placeholder: 'Nama pastor', dynamicField: true },
              { name: 'dynamic_fields.baptism_date', label: 'Tanggal Baptis', type: 'date', required: false, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'baptis_dewasa',
    label: 'Baptis Dewasa',
    description: 'Pendaftaran baptis untuk usia 8 tahun ke atas',
    icon: 'Droplets',
    theme: 'text-blue-700',
    steps: [
      {
        title: 'Data Pemohon',
        description: 'Data pribadi calon baptis',
        sections: [
          { id: 'data_pribadi', title: 'Data Pribadi', fields: pribadiFields('lengkap') },
          { id: 'data_orang_tua', title: 'Data Orang Tua', fields: orangTuaFields },
          { id: 'data_kontak', title: 'Kontak & Domisili', fields: kontakFields },
        ],
      },
      {
        title: 'Detail Baptis',
        description: 'Data katekumen dan baptis',
        sections: [
          {
            id: 'detail_katekumen',
            title: 'Data Katekumen',
            fields: [
              { name: 'dynamic_fields.godparent_name', label: 'Nama Wali Baptis', type: 'text', required: true, placeholder: 'Nama lengkap wali baptis', dynamicField: true },
              { name: 'dynamic_fields.catechumen_duration', label: 'Lama Katekumen', type: 'text', required: false, placeholder: 'Contoh: 6 bulan', dynamicField: true },
              { name: 'dynamic_fields.mentor_name', label: 'Nama Pembimbing', type: 'text', required: false, placeholder: 'Nama pembimbing katekumen', dynamicField: true },
              { name: 'dynamic_fields.guidance_place', label: 'Tempat Bimbingan', type: 'text', required: false, placeholder: 'Paroki / komunitas', dynamicField: true },
            ],
          },
          {
            id: 'riwayat_baptis_kristen',
            title: 'Riwayat Baptis Kristen (jika ada)',
            fields: [
              { name: 'dynamic_fields.previous_baptism_date', label: 'Tanggal Baptis', type: 'date', required: false, dynamicField: true },
              { name: 'dynamic_fields.previous_baptism_church', label: 'Gereja', type: 'text', required: false, placeholder: 'Nama gereja', dynamicField: true },
              { name: 'dynamic_fields.previous_baptism_pastor', label: 'Pendeta', type: 'text', required: false, placeholder: 'Nama pendeta', dynamicField: true },
            ],
          },
          {
            id: 'data_pernikahan',
            title: 'Data Pernikahan (jika sudah menikah)',
            fields: [
              { name: 'dynamic_fields.marriage_partner_name', label: 'Nama Pasangan', type: 'text', required: false, placeholder: 'Nama lengkap pasangan', dynamicField: true },
              { name: 'dynamic_fields.marriage_date', label: 'Tanggal Nikah', type: 'date', required: false, dynamicField: true },
              { name: 'dynamic_fields.marriage_status', label: 'Status Pernikahan', type: 'select', required: false, options: MARITAL_STATUS_OPTIONS, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'komuni_pertama',
    label: 'Komuni Pertama',
    description: 'Pendaftaran penerimaan komuni pertama',
    icon: 'Bird',
    theme: 'text-emerald-600',
    steps: [
      {
        title: 'Data Pemohon',
        sections: [
          {
            id: 'data_pribadi',
            title: 'Data Pribadi',
            fields: [
              { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, colSpan: 2 },
              { name: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
              { name: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
            ],
          },
          {
            id: 'data_orang_tua',
            title: 'Data Orang Tua',
            fields: [
              { name: 'father_name', label: 'Nama Ayah', type: 'text', required: true, colSpan: 2 },
              { name: 'mother_name', label: 'Nama Ibu', type: 'text', required: true, colSpan: 2 },
            ],
          },
          {
            id: 'data_kontak',
            title: 'Kontak & Domisili',
            fields: kontakFields.filter(f => ['address', 'contact', 'phone', 'mobile_phone', 'neighborhood', 'parish'].includes(f.name)),
          },
          { id: 'data_pendidikan', title: 'Pendidikan', fields: pendidikanFields },
        ],
      },
      {
        title: 'Detail Sakramen',
        description: 'Data baptis dan komuni',
        sections: [
          {
            id: 'data_baptis',
            title: 'Data Baptis',
            fields: [
              { name: 'dynamic_fields.baptism_date', label: 'Tanggal Baptis', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.baptism_church', label: 'Gereja Baptis', type: 'text', required: true, placeholder: 'Nama gereja tempat baptis', dynamicField: true },
              { name: 'dynamic_fields.baptism_book_volume', label: 'Buku Baptis - Jilid', type: 'text', required: false, placeholder: 'Jilid', dynamicField: true },
              { name: 'dynamic_fields.baptism_book_page', label: 'Buku Baptis - Halaman', type: 'text', required: false, placeholder: 'Halaman', dynamicField: true },
              { name: 'dynamic_fields.baptism_book_number', label: 'Buku Baptis - Nomor', type: 'text', required: false, placeholder: 'Nomor', dynamicField: true },
              { name: 'dynamic_fields.baptism_parish_name', label: 'Nama Paroki Baptis', type: 'text', required: false, placeholder: 'Nama paroki', dynamicField: true },
              { name: 'dynamic_fields.baptism_parish_address', label: 'Alamat Paroki Baptis', type: 'textarea', required: false, colSpan: 2, dynamicField: true },
            ],
          },
          {
            id: 'data_komuni',
            title: 'Data Komuni Pertama',
            fields: [
              { name: 'dynamic_fields.communion_date', label: 'Tanggal Komuni Pertama', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.communion_parish', label: 'Paroki Komuni', type: 'text', required: false, placeholder: 'Nama paroki', dynamicField: true },
              { name: 'dynamic_fields.readiness_status', label: 'Status Kesiapan', type: 'select', required: false, options: [
                { value: 'siap', label: 'Siap' },
                { value: 'perlu_pembinaan', label: 'Perlu Pembinaan Lanjutan' },
              ], dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'krisma',
    label: 'Krisma',
    description: 'Pendaftaran penerimaan sakramen krisma',
    icon: 'Flame',
    theme: 'text-orange-600',
    steps: [
      {
        title: 'Data Pemohon',
        sections: [
          { id: 'data_pribadi', title: 'Data Pribadi', fields: pribadiFields('lengkap') },
          { id: 'data_orang_tua', title: 'Data Orang Tua', fields: orangTuaFields },
          {
            id: 'data_kontak',
            title: 'Kontak & Domisili',
            fields: kontakFields.filter(f => ['address', 'contact', 'phone', 'mobile_phone', 'neighborhood', 'region', 'parish'].includes(f.name)),
          },
        ],
      },
      {
        title: 'Detail Sakramen',
        description: 'Riwayat sakramen untuk krisma',
        sections: [
          {
            id: 'riwayat_baptis',
            title: 'Data Baptis',
            fields: [
              { name: 'dynamic_fields.baptism_date', label: 'Tanggal Baptis', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.baptism_place', label: 'Tempat Baptis', type: 'text', required: true, placeholder: 'Kota / paroki', dynamicField: true },
              { name: 'dynamic_fields.baptism_church', label: 'Nama Gereja', type: 'text', required: false, placeholder: 'Nama gereja', dynamicField: true },
              { name: 'dynamic_fields.baptism_book_volume', label: 'Buku Baptis - Jilid', type: 'text', required: false, placeholder: 'Jilid', dynamicField: true },
              { name: 'dynamic_fields.baptism_book_page', label: 'Buku Baptis - Halaman', type: 'text', required: false, placeholder: 'Halaman', dynamicField: true },
              { name: 'dynamic_fields.baptism_book_number', label: 'Buku Baptis - Nomor', type: 'text', required: false, placeholder: 'Nomor', dynamicField: true },
            ],
          },
          {
            id: 'riwayat_komuni',
            title: 'Data Komuni Pertama',
            fields: [
              { name: 'dynamic_fields.communion_date', label: 'Tanggal Komuni Pertama', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.communion_place', label: 'Tempat Komuni', type: 'text', required: false, placeholder: 'Paroki / gereja', dynamicField: true },
            ],
          },
          {
            id: 'data_krisma',
            title: 'Data Krisma',
            fields: [
              { name: 'dynamic_fields.confirmation_date', label: 'Tanggal Krisma', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.confirmation_priest', label: 'Pastor Pemberi Krisma', type: 'text', required: true, placeholder: 'Nama pastor', dynamicField: true },
              { name: 'dynamic_fields.confirmation_name', label: 'Nama Krisma', type: 'text', required: true, placeholder: 'Nama santo/santa untuk krisma', dynamicField: true },
              { name: 'dynamic_fields.confirmation_book_volume', label: 'Buku Krisma - Jilid', type: 'text', required: false, placeholder: 'Jilid', dynamicField: true },
              { name: 'dynamic_fields.confirmation_book_page', label: 'Buku Krisma - Halaman', type: 'text', required: false, placeholder: 'Halaman', dynamicField: true },
              { name: 'dynamic_fields.confirmation_book_number', label: 'Buku Krisma - Nomor', type: 'text', required: false, placeholder: 'Nomor', dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'putra_putri_altar',
    label: 'Putra Putri Altar',
    description: 'Pendaftaran menjadi putra/putri altar (misdinar)',
    icon: 'Church',
    theme: 'text-violet-600',
    steps: [
      {
        title: 'Data Pemohon',
        sections: [
          {
            id: 'data_pribadi',
            title: 'Data Pribadi',
            fields: [
              { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, colSpan: 2 },
              { name: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
              { name: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
            ],
          },
          { id: 'data_orang_tua', title: 'Data Orang Tua', fields: orangTuaFields },
          {
            id: 'data_kontak',
            title: 'Kontak & Domisili',
            fields: kontakFields.filter(f => ['address', 'contact', 'phone', 'mobile_phone', 'neighborhood', 'region'].includes(f.name)),
          },
          { id: 'data_pendidikan', title: 'Pendidikan', fields: pendidikanFields },
        ],
      },
      {
        title: 'Detail',
        description: 'Riwayat sakramen',
        sections: [
          {
            id: 'riwayat_sakramen',
            title: 'Riwayat Sakramen',
            fields: [
              { name: 'dynamic_fields.baptism_date', label: 'Tanggal Baptis', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.baptism_place', label: 'Tempat Baptis', type: 'text', required: true, placeholder: 'Kota / paroki', dynamicField: true },
              { name: 'dynamic_fields.communion_date', label: 'Tanggal Komuni Pertama', type: 'date', required: false, dynamicField: true },
              { name: 'dynamic_fields.communion_place', label: 'Tempat Komuni Pertama', type: 'text', required: false, placeholder: 'Kota / paroki', dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'surat_keterangan_perkawinan',
    label: 'Surat Ket. Lingkungan\nuntuk Perkawinan',
    description: 'Permohonan surat keterangan untuk pemberkatan nikah',
    icon: 'Heart',
    theme: 'text-rose-600',
    steps: [
      {
        title: 'Data Pasangan',
        description: 'Data kedua calon pasangan',
        sections: [
          {
            id: 'data_pasangan',
            title: 'Data Calon Pasangan',
            fields: [
              { name: 'applicant_name', label: 'Nama Pemohon', type: 'text', required: true, placeholder: 'Nama yang mengajukan', colSpan: 2 },
              { name: 'address', label: 'Alamat', type: 'textarea', required: true, colSpan: 2 },
              { name: 'contact', label: 'Kontak', type: 'tel', required: true },
              { name: 'dynamic_fields.marital_status', label: 'Status Perkawinan', type: 'select', required: true, options: MARITAL_STATUS_OPTIONS, dynamicField: true },
            ],
          },
        ],
      },
      {
        title: 'Detail Pasangan',
        description: 'Lengkapi data masing-masing calon',
        sections: [
          {
            id: 'calon_1',
            title: 'Data Calon 1',
            fields: personaFields('couple_1'),
          },
          {
            id: 'calon_2',
            title: 'Data Calon 2',
            fields: personaFields('couple_2'),
          },
        ],
      },
    ],
  },
  {
    value: 'surat_keterangan_warga',
    label: 'Surat Keterangan Warga',
    description: 'Permohonan surat keterangan warga paroki',
    icon: 'FileText',
    theme: 'text-slate-600',
    steps: [
      {
        title: 'Data Pemohon',
        sections: [
          {
            id: 'data_pribadi',
            title: 'Data Pribadi',
            fields: [
              { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, colSpan: 2 },
              { name: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
              { name: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
              { name: 'occupation', label: 'Pekerjaan', type: 'text', required: true, placeholder: 'Pekerjaan saat ini' },
            ],
          },
          { id: 'data_kontak', title: 'Kontak & Domisili', fields: kontakFields.filter(f => ['address', 'contact', 'phone', 'mobile_phone'].includes(f.name)) },
          {
            id: 'keperluan',
            title: 'Keperluan Surat',
            fields: [
              { name: 'dynamic_fields.purpose', label: 'Keperluan Surat', type: 'textarea', required: true, placeholder: 'Jelaskan keperluan surat keterangan warga', colSpan: 2, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'surat_rekomendasi',
    label: 'Surat Rekomendasi',
    description: 'Permohonan surat rekomendasi',
    icon: 'FileCheck',
    theme: 'text-teal-600',
    steps: [
      {
        title: 'Data Pemohon',
        sections: [
          {
            id: 'data_pribadi',
            title: 'Data Pribadi',
            fields: [
              { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, colSpan: 2 },
              { name: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
              { name: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
            ],
          },
          { id: 'data_kontak', title: 'Kontak & Domisili', fields: kontakFields.filter(f => ['address', 'contact', 'phone', 'mobile_phone'].includes(f.name)) },
          {
            id: 'detail_rekomendasi',
            title: 'Detail Rekomendasi',
            fields: [
              { name: 'dynamic_fields.parent_name', label: 'Nama Orang Tua', type: 'text', required: true, placeholder: 'Nama orang tua / wali', colSpan: 2, dynamicField: true },
              { name: 'dynamic_fields.recommendation_purpose', label: 'Tujuan Rekomendasi', type: 'textarea', required: true, placeholder: 'Jelaskan tujuan surat rekomendasi', colSpan: 2, dynamicField: true },
              { name: 'dynamic_fields.consideration', label: 'Pertimbangan', type: 'textarea', required: false, placeholder: 'Pertimbangan khusus (jika ada)', colSpan: 2, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'laporan_kematian',
    label: 'Laporan Kematian',
    description: 'Laporan kematian untuk pelayanan pemakaman',
    icon: 'Cross',
    theme: 'text-red-700',
    steps: [
      {
        title: 'Data Almarhum',
        sections: [
          {
            id: 'data_almarhum',
            title: 'Data Almarhum/Almarhumah',
            fields: [
              { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama almarhum/almarhumah', colSpan: 2 },
              { name: 'address', label: 'Alamat', type: 'textarea', required: true, colSpan: 2 },
              { name: 'contact', label: 'Kontak Pelapor', type: 'tel', required: true, placeholder: 'Nomor yang bisa dihubungi' },
              { name: 'phone', label: 'Telepon', type: 'tel', required: false },
              { name: 'mobile_phone', label: 'HP', type: 'tel', required: false },
            ],
          },
          {
            id: 'detail_kematian',
            title: 'Detail Kematian',
            fields: [
              { name: 'dynamic_fields.death_day', label: 'Hari Meninggal', type: 'select', required: true, options: [
                { value: 'Senin', label: 'Senin' }, { value: 'Selasa', label: 'Selasa' },
                { value: 'Rabu', label: 'Rabu' }, { value: 'Kamis', label: 'Kamis' },
                { value: "Jum'at", label: "Jum'at" }, { value: 'Sabtu', label: 'Sabtu' },
                { value: 'Minggu', label: 'Minggu' },
              ], dynamicField: true },
              { name: 'dynamic_fields.death_date', label: 'Tanggal Meninggal', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.death_time', label: 'Jam Meninggal', type: 'time', required: true, dynamicField: true },
              { name: 'dynamic_fields.death_place', label: 'Tempat Meninggal', type: 'text', required: true, placeholder: 'Rumah / RS / dll', dynamicField: true },
              { name: 'dynamic_fields.death_cause', label: 'Sebab Kematian', type: 'text', required: false, placeholder: 'Penyebab (jika diketahui)', colSpan: 2, dynamicField: true },
            ],
          },
          {
            id: 'pemakaman',
            title: 'Data Pemakaman',
            fields: [
              { name: 'dynamic_fields.burial_date', label: 'Tanggal Pemakaman', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.burial_place', label: 'Tempat Pemakaman', type: 'text', required: true, placeholder: 'Nama makam / TPU', dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'laporan_kematian_yusup',
    label: 'Laporan Kematian\n(Pem. S. Yusup)',
    description: 'Laporan kematian dengan detail pemakaman Santo Yusup',
    icon: 'Cross',
    theme: 'text-gray-700',
    steps: [
      {
        title: 'Data Almarhum',
        sections: [
          {
            id: 'data_almarhum',
            title: 'Data Almarhum/Almarhumah',
            fields: [
              { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, colSpan: 2 },
              { name: 'dynamic_fields.baptismal_name', label: 'Nama Baptis', type: 'text', required: true, placeholder: 'Nama baptis', dynamicField: true },
              { name: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
              { name: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
              { name: 'address', label: 'Alamat', type: 'textarea', required: true, colSpan: 2 },
              { name: 'contact', label: 'Kontak Pelapor', type: 'tel', required: true },
              { name: 'phone', label: 'Telepon', type: 'tel', required: false },
              { name: 'mobile_phone', label: 'HP', type: 'tel', required: false },
              { name: 'neighborhood', label: 'Lingkungan', type: 'select', required: true, options: [] as { value: string; label: string }[] },
              { name: 'region', label: 'Wilayah', type: 'select', required: false, options: [] as { value: string; label: string }[] },
            ],
          },
          {
            id: 'detail_kematian',
            title: 'Detail Kematian & Pemakaman',
            fields: [
              { name: 'dynamic_fields.death_day', label: 'Hari Meninggal', type: 'select', required: true, options: [
                { value: 'Senin', label: 'Senin' }, { value: 'Selasa', label: 'Selasa' },
                { value: 'Rabu', label: 'Rabu' }, { value: 'Kamis', label: 'Kamis' },
                { value: "Jum'at", label: "Jum'at" }, { value: 'Sabtu', label: 'Sabtu' },
                { value: 'Minggu', label: 'Minggu' },
              ], dynamicField: true },
              { name: 'dynamic_fields.death_date', label: 'Tanggal Meninggal', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.death_time', label: 'Jam Meninggal', type: 'time', required: true, dynamicField: true },
              { name: 'dynamic_fields.death_place', label: 'Tempat Duka', type: 'text', required: true, placeholder: 'Alamat rumah duka', colSpan: 2, dynamicField: true },
              { name: 'dynamic_fields.coffin_size', label: 'Ukuran Peti', type: 'text', required: true, placeholder: 'Contoh: 180 x 50 cm', dynamicField: true },
              { name: 'dynamic_fields.burial_schedule', label: 'Jadwal Pengiriman Peti', type: 'text', required: false, placeholder: 'Hari, tanggal, jam', colSpan: 2, dynamicField: true },
              { name: 'dynamic_fields.additional_notes', label: 'Keterangan Tambahan', type: 'textarea', required: false, placeholder: 'Catatan penting lainnya', colSpan: 2, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'sakramen_minyak_suci',
    label: 'Sakramen Minyak Suci',
    description: 'Pendaftaran penerimaan sakramen minyak suci',
    icon: 'FlaskConical',
    theme: 'text-amber-600',
    steps: [
      {
        title: 'Data Pemohon',
        sections: [
          {
            id: 'data_pribadi',
            title: 'Data Pribadi',
            fields: [
              { name: 'applicant_name', label: 'Nama Lengkap', type: 'text', required: true, colSpan: 2 },
              { name: 'dynamic_fields.baptismal_name', label: 'Nama Baptis', type: 'text', required: true, placeholder: 'Nama baptis', dynamicField: true },
              { name: 'birth_place', label: 'Tempat Lahir', type: 'text', required: true },
              { name: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
              { name: 'address', label: 'Alamat', type: 'textarea', required: true, colSpan: 2 },
              { name: 'contact', label: 'Kontak', type: 'tel', required: true },
              { name: 'phone', label: 'Telepon', type: 'tel', required: false },
              { name: 'mobile_phone', label: 'HP', type: 'tel', required: false },
            ],
          },
          {
            id: 'riwayat_baptis',
            title: 'Data Baptis',
            fields: [
              { name: 'dynamic_fields.baptism_date', label: 'Tanggal Baptis', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.baptism_place', label: 'Tempat Baptis', type: 'text', required: true, placeholder: 'Kota / paroki', dynamicField: true },
              { name: 'dynamic_fields.baptism_church', label: 'Nama Gereja', type: 'text', required: true, placeholder: 'Nama gereja baptis', dynamicField: true },
            ],
          },
          {
            id: 'penerimaan',
            title: 'Penerimaan Sakramen',
            fields: [
              { name: 'dynamic_fields.reception_date', label: 'Tanggal Penerimaan', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.reception_time', label: 'Jam', type: 'time', required: true, dynamicField: true },
              { name: 'dynamic_fields.reception_place', label: 'Tempat', type: 'text', required: true, placeholder: 'Gereja / rumah / RS', dynamicField: true },
              { name: 'dynamic_fields.priest_name', label: 'Pastor', type: 'text', required: true, placeholder: 'Nama pastor', colSpan: 2, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'peminjaman_ruangan',
    label: 'Peminjaman Ruangan',
    description: 'Permohonan peminjaman ruangan gereja',
    icon: 'DoorOpen',
    theme: 'text-cyan-600',
    steps: [
      {
        title: 'Data Peminjaman',
        sections: [
          {
            id: 'data_peminjam',
            title: 'Data Peminjam',
            fields: [
              { name: 'applicant_name', label: 'Nama Pengguna', type: 'text', required: true, colSpan: 2 },
              { name: 'dynamic_fields.neighborhood_group', label: 'Lingkungan/Kelompok', type: 'text', required: true, placeholder: 'Nama lingkungan atau kelompok', dynamicField: true },
              { name: 'contact', label: 'Nomor Telepon', type: 'tel', required: true },
            ],
          },
          {
            id: 'detail_peminjaman',
            title: 'Detail Peminjaman',
            fields: [
              { name: 'dynamic_fields.room_name', label: 'Ruangan', type: 'text', required: true, placeholder: 'Nama ruangan yang dipinjam', dynamicField: true },
              { name: 'dynamic_fields.date', label: 'Hari/Tanggal', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.start_time', label: 'Jam Mulai', type: 'time', required: true, dynamicField: true },
              { name: 'dynamic_fields.end_time', label: 'Jam Selesai', type: 'time', required: true, dynamicField: true },
              { name: 'dynamic_fields.purpose', label: 'Tujuan Penggunaan', type: 'textarea', required: true, placeholder: 'Jelaskan tujuan penggunaan ruangan', colSpan: 2, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'peminjaman_alat',
    label: 'Peminjaman Alat Elektronik',
    description: 'Permohonan peminjaman alat elektronik gereja',
    icon: 'Radio',
    theme: 'text-indigo-600',
    steps: [
      {
        title: 'Data Peminjaman',
        sections: [
          {
            id: 'data_peminjam',
            title: 'Data Peminjam',
            fields: [
              { name: 'applicant_name', label: 'Nama Pengguna', type: 'text', required: true, colSpan: 2 },
              { name: 'dynamic_fields.neighborhood_group', label: 'Lingkungan/Kelompok', type: 'text', required: true, placeholder: 'Nama lingkungan atau kelompok', dynamicField: true },
              { name: 'contact', label: 'Nomor Telepon', type: 'tel', required: true },
              { name: 'dynamic_fields.equipment_type', label: 'Jenis Alat', type: 'select', required: true, options: EQUIPMENT_OPTIONS, dynamicField: true },
            ],
          },
          {
            id: 'detail_peminjaman',
            title: 'Detail Peminjaman',
            fields: [
              { name: 'dynamic_fields.date', label: 'Hari/Tanggal', type: 'date', required: true, dynamicField: true },
              { name: 'dynamic_fields.start_time', label: 'Jam Mulai', type: 'time', required: true, dynamicField: true },
              { name: 'dynamic_fields.end_time', label: 'Jam Selesai', type: 'time', required: true, dynamicField: true },
              { name: 'dynamic_fields.purpose', label: 'Tujuan Penggunaan', type: 'textarea', required: true, placeholder: 'Jelaskan tujuan peminjaman alat', colSpan: 2, dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
  {
    value: 'intensi_misa',
    label: 'Intensi Misa',
    description: 'Permohonan intensi misa: ucapan syukur, doa arwah, atau permohonan lainnya',
    icon: 'BookOpen',
    theme: 'text-yellow-700',
    steps: [
      {
        title: 'Data Pemohon',
        sections: [
          {
            id: 'data_pemohon',
            title: 'Data Pemohon',
            fields: [
              { name: 'applicant_name', label: 'Nama Pemohon', type: 'text', required: true, colSpan: 2 },
              { name: 'neighborhood', label: 'Lingkungan', type: 'text', required: true },
              { name: 'contact', label: 'Nomor Telepon/HP', type: 'tel', required: true },
            ],
          },
        ],
      },
      {
        title: 'Jadwal Misa',
        description: 'Pilih salah satu jadwal misa untuk pengumuman intensi',
        sections: [
          {
            id: 'jadwal_misa',
            title: 'Jadwal Pengumuman',
            fields: [
              {
                name: 'dynamic_fields.jadwal_misa',
                label: 'Jadwal Misa',
                type: 'radio',
                required: true,
                dynamicField: true,
                options: [
                  { value: 'sabtu_1730', label: 'Sabtu, 17.30' },
                  { value: 'minggu_0600', label: 'Minggu, 06.00' },
                  { value: 'minggu_0830', label: 'Minggu, 08.30' },
                  { value: 'minggu_1730', label: 'Minggu, 17.30' },
                ],
              },
              { name: 'dynamic_fields.tanggal_misa', label: 'Tanggal Misa', type: 'date', required: true, dynamicField: true },
            ],
          },
        ],
      },
      {
        title: 'Intensi Misa',
        description: 'Isi salah satu atau lebih sesuai intensi permohonan Anda',
        sections: [
          {
            id: 'intensi_misa',
            title: 'Intensi Misa',
            fields: [
              { name: 'dynamic_fields.ucapan_syukur', label: 'Ucapan Syukur atas', type: 'textarea', required: false, colSpan: 2, dynamicField: true },
              { name: 'dynamic_fields.doa_arwah', label: 'Mohon Istirahat Kekal Bagi', type: 'textarea', required: false, colSpan: 2, dynamicField: true },
              { name: 'dynamic_fields.permohonan_lainnya', label: 'Permohonan Lainnya', type: 'textarea', required: false, colSpan: 2, dynamicField: true },
            ],
          },
        ],
      },
      {
        title: 'Stipendium',
        sections: [
          {
            id: 'stipendium',
            title: 'Stipendium',
            fields: [
              { name: 'dynamic_fields.stipendium_amount', label: 'Jumlah Stipendium (Rp)', type: 'text', required: true, placeholder: 'Contoh: 50000', dynamicField: true },
              { name: 'dynamic_fields.stipendium_terbilang', label: 'Terbilang', type: 'text', required: false, colSpan: 2, placeholder: 'Contoh: lima puluh ribu rupiah', dynamicField: true },
            ],
          },
        ],
      },
    ],
  },
];

export const SERVICE_TYPE_MAP = Object.fromEntries(
  SERVICE_TYPES.map((t) => [t.value, t])
);
