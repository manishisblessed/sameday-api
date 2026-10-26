/**
 * payout-db.ts
 *
 * SQLite persistence layer for Same Day Solution payout transactions.
 * Uses the built-in `node:sqlite` module (available unflagged in Node ≥ 22.12).
 * Zero native-compilation dependencies — deploys cleanly on any Node 22+ server.
 *
 * DB file: <project-root>/data/payout.db
 *
 * NOTE — Deployment:
 *   • Self-hosted / VPS (Node ≥ 22.12): works as-is.
 *   • Vercel / serverless: replace with a cloud DB (Neon, Turso, PlanetScale)
 *     and swap out this module while keeping the same exported interface.
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// ─── DB bootstrap ─────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "payout.db");

let _db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    // WAL mode: better concurrent read performance
    _db.exec("PRAGMA journal_mode = WAL;");
    _db.exec("PRAGMA foreign_keys = ON;");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS payout_transactions (
      transaction_id         TEXT PRIMARY KEY,
      partner_trans_id       TEXT,
      utr                    TEXT,
      account_number         TEXT    NOT NULL,
      ifsc_code              TEXT    NOT NULL,
      account_holder_name    TEXT    NOT NULL,
      bank_name              TEXT    NOT NULL,
      mobile                 TEXT    NOT NULL,
      amount                 REAL    NOT NULL,
      payment_mode           TEXT    NOT NULL DEFAULT 'IMPS',
      status                 TEXT    NOT NULL DEFAULT 'UNKNOWN',
      idempotency_key        TEXT    UNIQUE,
      created_at             TEXT    NOT NULL,
      updated_at             TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pt_status      ON payout_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_pt_created_at  ON payout_transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_pt_idempotency ON payout_transactions(idempotency_key);
  `);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayoutRecord {
  transaction_id: string;
  partner_trans_id: string | null;
  utr: string | null;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  bank_name: string;
  mobile: string;
  amount: number;
  payment_mode: string;
  /** SUCCESS | PENDING | FAILED | UNKNOWN */
  status: string;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Write helpers ─────────────────────────────────────────────────────────────

/**
 * Insert a new payout transaction row.
 * Uses INSERT OR IGNORE so duplicate transaction_ids are silently skipped
 * (idempotency re-use is handled separately by findByIdempotencyKey).
 */
export function insertTransaction(
  record: Omit<PayoutRecord, "updated_at"> & { updated_at?: string },
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO payout_transactions
      (transaction_id, partner_trans_id, utr,
       account_number, ifsc_code, account_holder_name, bank_name,
       mobile, amount, payment_mode, status,
       idempotency_key, created_at, updated_at)
    VALUES
      (@transaction_id, @partner_trans_id, @utr,
       @account_number, @ifsc_code, @account_holder_name, @bank_name,
       @mobile, @amount, @payment_mode, @status,
       @idempotency_key, @created_at, @updated_at)
  `).run({ updated_at: now, ...record });
}

/**
 * Update status + UTR + partner_trans_id for an existing row.
 * COALESCE keeps the current DB value when the new value is NULL
 * (so a real UTR is never overwritten with null during PENDING polling).
 */
export function updateTransactionStatus(
  transactionId: string,
  status: string,
  utr?: string | null,
  partnerTransId?: string | null,
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE payout_transactions
    SET
      status           = @status,
      utr              = COALESCE(@utr, utr),
      partner_trans_id = COALESCE(@partner_trans_id, partner_trans_id),
      updated_at       = @updated_at
    WHERE transaction_id = @transaction_id
  `).run({
    transaction_id: transactionId,
    status,
    utr: utr ?? null,
    partner_trans_id: partnerTransId ?? null,
    updated_at: now,
  });
}

// ─── Read helpers ──────────────────────────────────────────────────────────────

export function findByIdempotencyKey(key: string): PayoutRecord | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM payout_transactions WHERE idempotency_key = ?")
      .get(key) as PayoutRecord | undefined) ?? null
  );
}

export function findByTransactionId(id: string): PayoutRecord | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM payout_transactions WHERE transaction_id = ?")
      .get(id) as PayoutRecord | undefined) ?? null
  );
}

/**
 * Return rows in PENDING or UNKNOWN status whose `created_at` is older than
 * `olderThanMinutes` minutes — candidates for the background polling job.
 */
export function findPendingTransactions(
  olderThanMinutes = 2,
): PayoutRecord[] {
  const db = getDb();
  const cutoff = new Date(
    Date.now() - olderThanMinutes * 60 * 1_000,
  ).toISOString();
  return db
    .prepare(`
      SELECT * FROM payout_transactions
      WHERE  status IN ('PENDING', 'UNKNOWN')
      AND    created_at < @cutoff
      ORDER  BY created_at ASC
      LIMIT  50
    `)
    .all({ cutoff }) as unknown as PayoutRecord[];
}

/** Return the N most recent transactions (capped at 50). */
export function listTransactions(limit = 20): PayoutRecord[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT * FROM payout_transactions
      ORDER  BY created_at DESC
      LIMIT  ?
    `)
    .all(Math.min(limit, 50)) as unknown as PayoutRecord[];
}
