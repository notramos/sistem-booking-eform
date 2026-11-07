const UMAT_SERVICES = ['intensi_misa', 'konsultasi_romo'];
const KETUA_SERVICES = [...UMAT_SERVICES, 'permohonan_misa', 'sakramen_minyak_suci'];

export function canRequestService(roles: string[], serviceType: string): boolean {
  if (roles.some((role) => ['it_admin', 'p2', 'pastor', 'sekretariat', 'ketua_lingkungan'].includes(role))) {
    return KETUA_SERVICES.includes(serviceType);
  }
  return roles.includes('umat') && UMAT_SERVICES.includes(serviceType);
}
