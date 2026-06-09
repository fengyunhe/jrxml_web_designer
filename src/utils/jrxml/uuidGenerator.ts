/**
 * UUID Generator for JRXML Elements
 * 
 * Generates RFC-4122 compliant UUIDs for JasperReports elements.
 * UUIDs are required for strict validation mode in JasperReports.
 */

/**
 * Generate a UUID v4
 * @returns UUID string in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate multiple UUIDs at once
 * @param count Number of UUIDs to generate
 * @returns Array of UUID strings
 */
export function generateMultipleUUIDs(count: number): string[] {
  const uuids: string[] = [];
  for (let i = 0; i < count; i++) {
    uuids.push(generateUUID());
  }
  return uuids;
}

/**
 * Validate UUID format
 * @param uuid UUID string to validate
 * @returns true if valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return uuidRegex.test(uuid.toLowerCase());
}
