import fs from "fs";
import path from "path";
import { importMetricoolPdfBuffer } from "../src/lib/metricool/pdf-import";
import { getMetricoolPdfMeta } from "../src/lib/db";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx --env-file=.env.local scripts/import-metricool-pdf.ts <path-to.pdf>");
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const filename = path.basename(resolved);
  const buffer = fs.readFileSync(resolved);
  console.log(`Importing ${filename} (${buffer.length} bytes)...`);

  const result = await importMetricoolPdfBuffer(buffer, filename);
  if (!result.ok) {
    console.error("Import failed:", result.error);
    process.exit(1);
  }

  const meta = await getMetricoolPdfMeta(result.weekStart);
  console.log(JSON.stringify({ ...result, pdfStored: Boolean(meta), pdfMeta: meta }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
