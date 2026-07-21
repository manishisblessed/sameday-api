/**
 * Shared validation for RechargeKit CC-2 payments. Used on both the client
 * (fast feedback before submit) and the server route (authoritative guard).
 */

/** Exactly 10 digits. */
export function isValidMobile(mobile: string): boolean {
  return /^\d{10}$/.test(mobile.trim());
}

/**
 * Card number validation: 13–19 digits passing the Luhn checksum.
 * The API expects the full card number (typically 16 digits).
 */
export function isValidCardNumber(cardRaw: string): boolean {
  const card = cardRaw.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(card)) return false;
  return luhnCheck(card);
}

/** Standard Luhn (mod-10) checksum used by all major card networks. */
export function luhnCheck(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48; // '0' === 48
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
