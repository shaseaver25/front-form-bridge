export const PREMIUM_ALLOWED_DOMAINS = [
  'creatempls.org',
  'tailoredu.org',
  'kamenimpactconsulting.com'
] as const;

export type PremiumDomain = typeof PREMIUM_ALLOWED_DOMAINS[number];

export function isPremiumDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? PREMIUM_ALLOWED_DOMAINS.includes(domain as PremiumDomain) : false;
}