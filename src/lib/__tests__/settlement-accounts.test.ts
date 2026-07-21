import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { addTrustedAccount, addShadvalAccount } from "../client-api";

beforeEach(() => {
  mockFetch.mockReset();
});

describe("addTrustedAccount", () => {
  const validBody = {
    account_number: "50100104420821",
    ifsc_code: "HDFC0003756",
    account_holder_name: "Manish Kumar Shah",
    contact_name: "Manish",
    contact_email: "manish@example.com",
    contact_mobile: "9971969046",
  };

  it("rejects invalid mobile (not 10 digits)", async () => {
    const result = await addTrustedAccount({ ...validBody, contact_mobile: "12345" });
    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/10-digit/);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects non-numeric mobile", async () => {
    const result = await addTrustedAccount({ ...validBody, contact_mobile: "99719690ab" });
    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/10-digit/);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends skip_verification:true and returns SKIPPED status on success", async () => {
    const mockResponse = {
      success: true,
      verified: false,
      verification_status: "SKIPPED",
      verification_label: "Account not verified",
      account: {
        id: "acc_test123",
        account_number: "50100104420821",
        ifsc_code: "HDFC0003756",
        account_holder_name: "Manish Kumar Shah",
        is_verified: false,
        verified_name: null,
      },
      charge_deducted: 0,
      skip_verification: true,
      message: "Account added without verification. Transfers to this account are at your own risk.",
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await addTrustedAccount(validBody);
    expect(result.success).toBe(true);
    expect(result.verification_status).toBe("SKIPPED");
    expect(result.skip_verification).toBe(true);
    expect(result.charge_deducted).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.account?.id).toBe("acc_test123");

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.skip_verification).toBe(true);
    expect(sentBody.contact_mobile).toBe("9971969046");
  });
});

describe("addShadvalAccount (existing verify flow)", () => {
  it("sends account for verification without skip_verification flag", async () => {
    const mockResponse = {
      success: true,
      verified: true,
      verification_status: "SUCCESS",
      verified_name: "MANISH KUMAR SHAH",
      account: {
        id: "acc_verified456",
        account_number: "50100104420821",
        ifsc_code: "HDFC0003756",
        account_holder_name: "Manish Kumar Shah",
        is_verified: true,
        verified_name: "MANISH KUMAR SHAH",
      },
      charge_deducted: 4,
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await addShadvalAccount({
      account_number: "50100104420821",
      ifsc_code: "HDFC0003756",
      account_holder_name: "Manish Kumar Shah",
      contact_email: "manish@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.verification_status).toBe("SUCCESS");
    expect(result.charge_deducted).toBe(4);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.skip_verification).toBeUndefined();
  });
});

describe("transfer to trusted account", () => {
  it("does not block transfer to unverified account (no client-side is_verified check)", async () => {
    const mockResponse = {
      success: true,
      transaction: {
        id: "txn_001",
        reference_id: "ref_001",
        amount: 5000,
        status: "SUCCESS",
      },
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const { initiateShadvalTransfer } = await import("../client-api");

    const result = await initiateShadvalTransfer({
      account_id: "acc_trusted_unverified",
      amount: 5000,
      mode: "IMPS",
      narration: "Test transfer to trusted account",
    });

    expect(result.success).toBe(true);
    expect(result.transaction?.status).toBe("SUCCESS");

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("/transfer");
  });
});
