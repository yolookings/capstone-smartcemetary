/**
 * Generate a user-friendly reference number from a UUID pengajuan ID.
 *
 * Format: EKM-XXXX-XXXX
 * Uses a deterministic hash of the UUID to produce a readable code,
 * shorter and more scannable than raw UUIDs.
 */
export function generateReferenceNumber(id: string): string {
  if (!id || id.length < 8) return id;

  // Take the first 8 hex chars and split into two groups of 4
  const raw = id.replace(/-/g, "").toUpperCase();
  const part1 = raw.slice(0, 4);
  const part2 = raw.slice(4, 8);

  return `EKM-${part1}-${part2}`;
}
