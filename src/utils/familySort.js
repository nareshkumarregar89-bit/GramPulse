/**
 * Family ID Sorting Utility
 * 
 * Provides natural numerical sorting for Family IDs such as:
 * "FAM-0001", "FAM-0002", "FAM-0010", "FAM-0142", etc.
 * 
 * Ensures that even if a record like FAM-0002 is restored after deletion,
 * updated, or loaded asynchronously from Firestore, it is always inserted
 * in its correct numerical sequence (001, then 002, then 003...).
 */

/**
 * Extracts the integer numeric portion from a Family ID.
 * Examples:
 *   "FAM-0001" -> 1
 *   "FAM-002"  -> 2
 *   "003"      -> 3
 *   "F-45"     -> 45
 */
export function parseFamilyIdNumber(id) {
  if (id === null || id === undefined) return Number.MAX_SAFE_INTEGER;
  const str = String(id).trim();
  const match = str.match(/(\d+)/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    return isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  }
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Comparator function to sort family objects or raw ID strings naturally by their ID.
 */
export function compareFamilyIds(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const idA = String(a.id || a || '').trim();
  const idB = String(b.id || b || '').trim();

  const numA = parseFamilyIdNumber(idA);
  const numB = parseFamilyIdNumber(idB);

  if (numA !== numB) {
    return numA - numB;
  }

  // Fallback to natural locale comparison if numeric parts match or are missing
  return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Sorts an array of families ascending by Family ID.
 * Returns a new sorted array.
 */
export function sortFamiliesById(families) {
  if (!Array.isArray(families)) return [];
  return [...families].sort(compareFamilyIds);
}
