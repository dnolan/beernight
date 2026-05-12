import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as XLSX from "xlsx";

const wb = XLSX.readFile("import/Brew York Beer Analysis 2020-24.xlsx");
const sheet = wb.Sheets["The Brew York Era (2020-2024)"];
const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
console.log(`Total rows: ${rows.length}`);
const limit = parseInt(process.argv[2] ?? "60");
const offset = parseInt(process.argv[3] ?? "0");
rows.slice(offset, offset + limit).forEach((row, i) => {
  if ((row as unknown[]).some((c) => c !== null)) {
    console.log(offset + i, JSON.stringify((row as unknown[]).slice(0, 14)));
  }
});
