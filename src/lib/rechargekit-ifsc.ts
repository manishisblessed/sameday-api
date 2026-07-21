/**
 * Credit-card IFSC lookup for RechargeKit CC-2.
 *
 * The RechargeKit operators endpoint returns only operator_id/name/code, so we
 * resolve the card-issuing bank's *credit-card* IFSC from the operator name.
 * These are the standard CC IFSC codes used for credit-card bill payments.
 *
 * This is a best-effort convenience: the value is pre-filled but stays editable,
 * and an API-provided `ifsc` on the operator always takes precedence.
 */

type IfscRule = { ifsc: string; keywords: string[] };

// Order matters: more specific issuers first (e.g. "SBI Card" before generic).
const CC_IFSC_RULES: IfscRule[] = [
  { ifsc: "HDFC0000128", keywords: ["hdfc"] },
  { ifsc: "ICIC0000103", keywords: ["icici"] },
  { ifsc: "SBIN0CARDS", keywords: ["sbi card", "sbi credit", "sbi", "state bank"] },
  { ifsc: "UTIB0000103", keywords: ["axis"] },
  { ifsc: "KKBK0000958", keywords: ["kotak"] },
  { ifsc: "INDB0000018", keywords: ["indusind"] },
  { ifsc: "YESB0000001", keywords: ["yes bank", "yes"] },
  { ifsc: "RATN0000156", keywords: ["rbl"] },
  { ifsc: "IDFB0080101", keywords: ["idfc"] },
  { ifsc: "SCBL0036001", keywords: ["standard chartered", "stanchart"] },
  { ifsc: "CITI0000003", keywords: ["citi"] },
  { ifsc: "HSBC0110002", keywords: ["hsbc"] },
  { ifsc: "AUBL0002166", keywords: ["au small", "au bank"] },
  { ifsc: "BARB0CARDSS", keywords: ["baroda", "bob"] },
  { ifsc: "PUNB0CARDSS", keywords: ["punjab national", "pnb"] },
  { ifsc: "CNRB0CARDSS", keywords: ["canara"] },
  { ifsc: "IBKL0000CRD", keywords: ["idbi"] },
  { ifsc: "FDRL0001111", keywords: ["federal"] },
];

/** Resolve a credit-card IFSC from a bank/operator display name. Returns "" if unknown. */
export function lookupCcIfsc(name: string | undefined | null): string {
  if (!name) return "";
  const n = name.toLowerCase();
  for (const rule of CC_IFSC_RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.ifsc;
  }
  return "";
}
