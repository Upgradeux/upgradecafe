/**
 * Secure Receipt Token Generator & Verifier for CAFEFLOW.
 *
 * Requirements:
 * - Opaque and unique reference per completed order
 * - Strictly NO sensitive customer data (NO name, NO phone, NO prices encoded)
 * - Encoded into Code 128 Barcode for staff scanning / verification
 * - Human-readable format matching traditional receipts (e.g. TRB1037A001 or RCP-1037-8F29)
 */

export interface ReceiptTokenInfo {
  token: string;
  orderNumber: string;
  cafePrefix: string;
  checksum: string;
}

/**
 * Extracts a concise 2-4 uppercase letter prefix from café name.
 * e.g., "The Roasted Bean" -> "TRB", "Blue Tokai Coffee" -> "BTC", "Cafe Mocha" -> "CM"
 */
export function getCafeInitials(cafeName?: string): string {
  if (!cafeName) return "CF";
  const words = cafeName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  if (words.length === 2) {
    return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return "CF";
}

/**
 * Computes a short opaque 4-character deterministic verification checksum
 * from the order UUID and createdAt timestamp.
 */
function computeChecksum(orderId: string, createdAt?: string | Date): string {
  const source = `${orderId}:${createdAt ? new Date(createdAt).getTime() : "receipt"}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return hex.substring(0, 4);
}

/**
 * Generates an opaque, professional receipt reference token for Code 128 barcode.
 * Example outputs:
 * "TRB1037A001" or "TRB10378F29"
 */
export function generateReceiptToken(params: {
  orderId: string;
  orderNumber: string | number;
  cafeName?: string;
  createdAt?: string | Date;
}): string {
  const { orderId, orderNumber, cafeName, createdAt } = params;
  const prefix = getCafeInitials(cafeName);
  const cleanOrderNum = String(orderNumber).replace(/[^0-9A-Za-z]/g, "");
  const checksum = computeChecksum(orderId, createdAt);

  // Traditional retail format: [CafePrefix][OrderNumber][Checksum] e.g. TRB1037A001
  return `${prefix}${cleanOrderNum}${checksum}`.toUpperCase();
}

/**
 * Parses and verifies receipt token structure.
 * Supports:
 * - "TRB1037A001" (Cafe initials prefix + order number + 4-char checksum)
 * - "RCP-1037-A001" or "rcp_1037_A001"
 * - "CF1037A001" (2-letter prefix)
 */
export function parseReceiptToken(token: string): ReceiptTokenInfo | null {
  if (!token || typeof token !== "string") return null;
  // Strip leading rcp_ or rcp- if present
  let clean = token.trim().toUpperCase().replace(/^RCP[-_]?/i, "").replace(/[^A-Z0-9]/g, "");

  // Minimal length: prefix(1-4) + order(1-6) + checksum(4) = at least 6 chars
  if (clean.length < 6) return null;

  const checksum = clean.slice(-4);
  const head = clean.slice(0, -4);

  // Match leading alphabetic letters (prefix) and remaining digits/chars (orderNumber)
  const match = head.match(/^([A-Z]+)(\d.*)$/);
  if (match) {
    return {
      token: clean,
      cafePrefix: match[1],
      orderNumber: match[2],
      checksum,
    };
  }

  // Fallback if token consists entirely of numbers or another scheme
  return {
    token: clean,
    cafePrefix: "",
    orderNumber: head,
    checksum,
  };
}
