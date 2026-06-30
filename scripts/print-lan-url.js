#!/usr/bin/env node
const os = require("os");

const port = process.env.PORT || "8787";

function lanIp() {
  for (const entries of Object.values(os.networkInterfaces())) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return null;
}

function bonjourHost() {
  const raw = os.hostname();
  if (!raw || raw === "localhost") return null;
  return `${raw.replace(/\.local$/i, "")}.local`;
}

const ip = lanIp();
const bonjour = bonjourHost();

console.log("");
console.log("  finalREV PR Dashboard");
console.log("  ─────────────────────────────────");
console.log(`  On this Mac:          http://localhost:${port}`);
if (bonjour) {
  console.log(`  Same Wi‑Fi (stable):  http://${bonjour}:${port}`);
  console.log("  Pin this in the app header → Team link");
} else if (ip) {
  console.log(`  Same Wi‑Fi:           http://${ip}:${port}`);
}
console.log("  ─────────────────────────────────");
console.log("");
