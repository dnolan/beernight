/**
 * Import script for "A New Hop" sheet from Brew York Beer Analysis 2020-24.xlsx
 *
 * Sheet layout:
 *   2025                     ← year header row (col A = 4-digit year)
 *   January (Dan)            ← month/event row (optional "(Chooser)" suffix)
 *   Beer Name | Brewery | Style | ABV | Dan | Alex | John | Jules
 *   ...beer rows...
 *   February (Alex)
 *   ...
 *
 * Usage:
 *   npx tsx scripts/import-a-new-hop.ts
 *   npx tsx scripts/import-a-new-hop.ts --dry-run
 *
 * Production (MONGODB_URI overrides .env.local):
 *   MONGODB_URI="mongodb+srv://..." npx tsx scripts/import-a-new-hop.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose, { Schema } from "mongoose";
import * as XLSX from "xlsx";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/beernight";
const XLSX_FILE = path.resolve("import/Brew York Beer Analysis 2020-24.xlsx");
const SHEET_NAME = "A New Hop (2025-)";
const DRY_RUN = process.argv.includes("--dry-run");

interface Reviewer {
  column: string;
  userEmail: string;
  userName: string;
}

const REVIEWERS: Reviewer[] = JSON.parse(process.env.REVIEWERS || "[]");

if (REVIEWERS.length === 0) {
  console.error("REVIEWERS env var is not set or empty.");
  process.exit(1);
}

// Inline schemas — avoids Next.js module side-effects
const EventSchema = new Schema(
  { title: String, date: { type: Date, required: true }, chooser: String, notes: String, createdBy: String },
  { timestamps: true }
);
const BeerSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    name: { type: String, required: true, trim: true },
    brewery: String,
    breweries: [String],
    style: String,
    abv: Number,
    order: Number,
  },
  { timestamps: true }
);
const ReviewSchema = new Schema(
  {
    beerId: { type: Schema.Types.ObjectId, ref: "Beer", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userEmail: { type: String, required: true, lowercase: true },
    userName: String,
    rating: { type: Number, min: 0.5, max: 5 },
    description: String,
  },
  { timestamps: true }
);

const EventModel = mongoose.models.Event || mongoose.model("Event", EventSchema);
const BeerModel = mongoose.models.Beer || mongoose.model("Beer", BeerSchema);
const ReviewModel = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function parseYearCell(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n >= 2000 && n <= 2099 ? n : null;
}

function parseMonthCell(val: unknown): { monthIndex: number; chooser: string } | null {
  const s = String(val ?? "").trim();
  const lower = s.toLowerCase();
  const monthIndex = MONTH_NAMES.findIndex((m) => lower.startsWith(m));
  if (monthIndex === -1) return null;
  const match = s.match(/\(([^)]+)\)/);
  return { monthIndex, chooser: match ? match[1].trim() : "" };
}

interface BeerRow {
  name: string;
  brewery: string;
  style: string;
  abv: number | undefined;
  ratings: { reviewer: Reviewer; rating: number }[];
}

interface EventGroup {
  year: number;
  monthIndex: number;
  chooser: string;
  beers: BeerRow[];
}

function buildColMap(headerRow: unknown[]) {
  const cells = headerRow.map((c) => String(c ?? "").trim().toLowerCase());

  const nameCol = cells.findIndex((c) => c === "beer" || c === "name" || c.includes("beer"));
  const breweryCol = cells.findIndex((c) => c === "brewery" || c === "breweries" || c.includes("brew"));
  const styleCol = cells.findIndex((c) => c === "style" || c.includes("style"));
  const abvCol = cells.findIndex((c) => c === "abv" || c === "abv%" || c.includes("abv"));
  const reviewerCols = REVIEWERS.map((r) => ({
    col: cells.findIndex((c) => c === r.column.toLowerCase()),
    reviewer: r,
  })).filter((rc) => rc.col !== -1);

  return { nameCol: nameCol === -1 ? 0 : nameCol, breweryCol, styleCol, abvCol, reviewerCols };
}

type ColMap = ReturnType<typeof buildColMap>;

function parseBeerRow(row: unknown[], colMap: ColMap): BeerRow | null {
  const name = String(row[colMap.nameCol] ?? "").trim();
  if (!name) return null;

  const brewery = colMap.breweryCol !== -1 ? String(row[colMap.breweryCol] ?? "").trim() : "";
  const style = colMap.styleCol !== -1 ? String(row[colMap.styleCol] ?? "").trim() : "";
  const abvRaw = colMap.abvCol !== -1 ? row[colMap.abvCol] : undefined;
  const abv = abvRaw != null && abvRaw !== "" ? Number(abvRaw) : undefined;

  const ratings = colMap.reviewerCols
    .flatMap(({ col, reviewer }) => {
      const val = row[col];
      const rating = typeof val === "number" ? val : parseFloat(String(val ?? ""));
      return isNaN(rating) ? [] : [{ reviewer, rating }];
    });

  return { name, brewery, style, abv, ratings };
}

async function main() {
  const workbook = XLSX.readFile(XLSX_FILE);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found. Available: ${workbook.SheetNames.join(", ")}`);
    process.exit(1);
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Find header row — the one that contains all reviewer column names
  const reviewerNames = REVIEWERS.map((r) => r.column.toLowerCase());
  let headerRowIdx = -1;
  let colMap: ColMap | null = null;

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((c) => String(c ?? "").trim().toLowerCase());
    if (reviewerNames.every((rn) => cells.includes(rn))) {
      headerRowIdx = i;
      colMap = buildColMap(rows[i]);
      break;
    }
  }

  if (!colMap || headerRowIdx === -1) {
    console.error("Could not find header row containing reviewer columns:", REVIEWERS.map((r) => r.column).join(", "));
    process.exit(1);
  }

  // colMap is guaranteed non-null here (we exited above if null)
  const cm = colMap;

  // Parse events by scanning rows after the header
  const events: EventGroup[] = [];
  let currentYear = 0;
  let currentEvent: EventGroup | null = null;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    // All data lives in the name column (col A is always empty in this sheet)
    const keyCell = row[cm.nameCol];

    if (keyCell === null || keyCell === undefined || String(keyCell).trim() === "") continue;

    const year = parseYearCell(keyCell);
    if (year !== null) {
      currentYear = year;
      continue;
    }

    const month = parseMonthCell(keyCell);
    if (month) {
      currentEvent = { year: currentYear, monthIndex: month.monthIndex, chooser: month.chooser, beers: [] };
      events.push(currentEvent);
      continue;
    }

    if (currentEvent) {
      const beer = parseBeerRow(row, cm);
      if (beer) currentEvent.beers.push(beer);
    }
  }

  // Print summary
  console.log(`Parsed ${events.length} events from "${SHEET_NAME}":\n`);
  for (const ev of events) {
    const label = `${MONTH_NAMES[ev.monthIndex].charAt(0).toUpperCase() + MONTH_NAMES[ev.monthIndex].slice(1)} ${ev.year}`;
    const reviewCount = ev.beers.reduce((s, b) => s + b.ratings.length, 0);
    console.log(`  [${ev.year}-${String(ev.monthIndex + 1).padStart(2, "0")}] ${label} (${ev.chooser || "?"}) — ${ev.beers.length} beers, ${reviewCount} reviews`);
  }

  if (DRY_RUN) {
    console.log("\nDry run — no changes written.");
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log("\nConnected to MongoDB");

  for (const ev of events) {
    const monthName = MONTH_NAMES[ev.monthIndex];
    const monthLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${ev.year}`;
    const monthStart = new Date(Date.UTC(ev.year, ev.monthIndex, 1));
    const monthEnd = new Date(Date.UTC(ev.year, ev.monthIndex + 1, 1) - 1);

    const eventTitle = `A New Hop ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;

    const existing = await EventModel.findOne({ date: { $gte: monthStart, $lte: monthEnd } });
    if (existing) {
      if (existing.title !== eventTitle) {
        await EventModel.updateOne({ _id: existing._id }, { title: eventTitle });
        console.log(`  ~ Updated title: ${monthLabel} → "${eventTitle}"`);
      } else {
        console.log(`  - Skipping ${monthLabel} — already imported`);
      }
      continue;
    }

    const newEvent = await EventModel.create({
      title: eventTitle,
      date: monthStart,
      chooser: ev.chooser,
      createdBy: "import",
    });

    let order = 1;
    for (const beer of ev.beers) {
      const breweries = beer.brewery ? [beer.brewery] : [];
      const newBeer = await BeerModel.create({
        eventId: newEvent._id,
        name: beer.name,
        brewery: beer.brewery,
        breweries,
        style: beer.style,
        abv: beer.abv,
        order: order++,
      });

      for (const { reviewer, rating } of beer.ratings) {
        await ReviewModel.create({
          beerId: newBeer._id,
          eventId: newEvent._id,
          userEmail: reviewer.userEmail,
          userName: reviewer.userName,
          rating,
        });
      }
    }

    const totalReviews = ev.beers.reduce((s, b) => s + b.ratings.length, 0);
    console.log(`  ✓ ${monthLabel} (${ev.chooser || "?"}) — ${ev.beers.length} beers, ${totalReviews} reviews`);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch(console.error);
