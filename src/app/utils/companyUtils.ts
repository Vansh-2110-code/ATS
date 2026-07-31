export interface CompanyItem {
  _id?: string;
  id?: string;
  companyName?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Deduplicates a list of companies/customers by companyName (case-insensitive & trimmed)
 * and sorts them alphabetically A to Z (case-insensitive & numeric-aware).
 */
export function dedupeCompanies<T extends CompanyItem | string>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of list) {
    const rawName = typeof item === 'string' ? item : item?.companyName || item?.name || '';
    const name = rawName.trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item);
    }
  }

  return result.sort((a, b) => {
    const nameA = (typeof a === 'string' ? a : a?.companyName || a?.name || '').trim();
    const nameB = (typeof b === 'string' ? b : b?.companyName || b?.name || '').trim();
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  });
}
