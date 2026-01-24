/**
 * Format a welcome name for display
 * For Gmail addresses, extracts the local part and formats it nicely
 * For other addresses/names, returns as-is
 */
export function formatWelcomeName(raw: string): string {
  if (!raw) return "";
  if (/^[^@]+@gmail\.com$/i.test(raw)) {
    const local = raw.split("@")[0];
    const pretty = local.replace(/[._-]+/g, " ").trim();
    return pretty
      .split(/\s+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return raw;
}
