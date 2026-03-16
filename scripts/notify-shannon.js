#!/usr/bin/env node

import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { values } = parseArgs({
  options: {
    issue: { type: "string" },
    files: { type: "string" },
    details: { type: "string" },
    "triggered-by": { type: "string" },
    severity: { type: "string", default: "needs-review" },
  },
});

const WEBHOOK_URL = process.env.CHIP_ESCALATION_WEBHOOK;
const SHANNON_EMAIL = process.env.SHANNON_EMAIL;

if (!WEBHOOK_URL) {
  console.error("ERROR: CHIP_ESCALATION_WEBHOOK is not set");
  process.exit(1);
}

const payload = {
  issue: values.issue,
  files: values.files,
  details: values.details,
  triggeredBy: values["triggered-by"],
  severity: values.severity,
  shannonEmail: SHANNON_EMAIL || null,
  timestamp: new Date().toISOString(),
};

async function main() {
  console.log("Sending escalation to Chip webhook...");
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(`HTTP response code: ${res.status}`);

    let body;
    try {
      body = await res.text();
    } catch {
      body = "(no body)";
    }

    if (res.ok) {
      console.log("SUCCESS: Webhook accepted the payload.");
      if (body) console.log("Response body:", body);
    } else {
      console.warn(`WARN: Webhook returned ${res.status}. Falling back to log file.`);
      if (body) console.log("Response body:", body);
      fallbackToLog(payload);
    }
  } catch (err) {
    console.error(`ERROR: Webhook request failed — ${err.message}`);
    console.log("Falling back to log file.");
    fallbackToLog(payload);
  }
}

function fallbackToLog(data) {
  const logDir = path.join(__dirname, "..", "logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logFile = path.join(logDir, "escalation-fallback.log");
  const entry = `[${data.timestamp}] ${JSON.stringify(data)}\n`;
  fs.appendFileSync(logFile, entry);
  console.log(`FALLBACK: Logged to ${logFile}`);
}

main();
