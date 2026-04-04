/**
 * Quick check: GET {{base_url}}/pos-health (no auth).
 * Usage: node scripts/smoke-pos-health.mjs
 *        BASE_URL=http://localhost:8080 node scripts/smoke-pos-health.mjs
 */

import http from "node:http";
import https from "node:https";

const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const url = new URL(`${base}/pos-health`);
const client = url.protocol === "https:" ? https : http;

const res = await new Promise((resolve, reject) => {
  const req = client.get(url, (r) => resolve(r));
  req.on("error", reject);
  req.end();
});

const chunks = [];
for await (const chunk of res) chunks.push(chunk);
const text = Buffer.concat(chunks).toString("utf8");
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

console.log(`${res.statusCode} ${res.statusMessage}  ${url.href}`);
console.log(typeof body === "string" ? body : JSON.stringify(body, null, 2));
process.exit(res.statusCode && res.statusCode < 400 ? 0 : 1);
