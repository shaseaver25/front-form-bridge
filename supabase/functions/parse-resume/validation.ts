export function hasResumeParseAccess(roles: string[]): boolean {
  return !roles.includes("client") && roles.some(role => ["admin", "moderator", "staff", "project"].includes(role));
}
export function isSupportedResume(name: string): boolean {
  return /\.(pdf|docx|txt)$/i.test(name);
}