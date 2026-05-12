/**
 * Import script for "The Brew York Era (2020-2024)" sheet.
 *
 * Sheet layout (all data at col D / index 3):
 *   2020                     ← year row: col 3 is a 4-digit year string
 *   September 2020           ← event row: col 3 starts with a month name, col 5 is null
 *   Beer Name | ABV | 1 | Dan | John | Jules | Alex ...  ← beer row: col 5 has a value
 *   Birthday Beers 2022      ← special event row: col 5 is null, not a year, not a month
 *   Juice | 8 | BDAY | 6 | 5 ...  ← beer under special event
 *
 * Usage:
 *   npx tsx scripts/import-brew-york-era.ts --year 2020
 *   npx tsx scripts/import-brew-york-era.ts --year 2020 --dry-run
 *
 * Production:
 *   MONGODB_URI="mongodb+srv://..." npx tsx scripts/import-brew-york-era.ts --year 2020
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose, { Schema } from "mongoose";
import * as XLSX from "xlsx";
import path from "path";

// --- CLI args ---
const args = process.argv.slice(2);
const yearArg = (() => {
  const idx = args.indexOf("--year");
  if (idx === -1 || !args[idx + 1]) { console.error("Usage: npx tsx scripts/import-brew-york-era.ts --year YYYY [--dry-run]"); process.exit(1); }
  return parseInt(args[idx + 1]);
})();
const DRY_RUN = args.includes("--dry-run");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/beernight";
const XLSX_FILE = path.resolve("import/Brew York Beer Analysis 2020-24.xlsx");
const SHEET_NAME = "The Brew York Era (2020-2024)";

interface Reviewer { column: string; userEmail: string; userName: string; }
const REVIEWERS: Reviewer[] = JSON.parse(process.env.REVIEWERS || "[]");
if (REVIEWERS.length === 0) { console.error("REVIEWERS env var is not set."); process.exit(1); }

// --- Inline Mongoose schemas ---
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
    notes: String,
  },
  { timestamps: true }
);
const ReviewSchema = new Schema(
  {
    beerId: { type: Schema.Types.ObjectId, ref: "Beer", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userEmail: { type: String, required: true, lowercase: true },
    userName: String,
    rating: Number, // no min/max — historical data has outliers (e.g. protest votes of -5)
    description: String,
  },
  { timestamps: true }
);
const EventModel = mongoose.models.Event || mongoose.model("Event", EventSchema);
const BeerModel = mongoose.models.Beer || mongoose.model("Beer", BeerSchema);
const ReviewModel = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

// --- Helpers ---
const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];

function isYearRow(val: unknown): number | null {
  const s = String(val ?? "").trim();
  if (/^20\d{2}$/.test(s)) return parseInt(s);
  return null;
}

const MONTH_ABBREVS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseMonthFromText(text: string): { monthIndex: number; year: number | null } | null {
  const lower = text.toLowerCase().trim();
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Full month name match
  const fullIdx = MONTH_NAMES.findIndex((m) => lower.startsWith(m));
  if (fullIdx !== -1) return { monthIndex: fullIdx, year };

  // 3-letter abbreviation match
  const abbrev = lower.slice(0, 3);
  if (abbrev in MONTH_ABBREVS) return { monthIndex: MONTH_ABBREVS[abbrev], year };

  return null;
}

function inferDateForSpecialEvent(title: string, currentYear: number, lastMonthIndex: number): Date {
  // Extract explicit year from title if present
  const titleYear = (() => { const m = title.match(/\b(20\d{2})\b/); return m ? parseInt(m[1]) : currentYear; })();

  // Ordinal date: "25th June", "14th May 2021", "Friday 9 July"
  const ordinal = title.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(20\d{2}))?/i);
  if (ordinal) {
    const day = parseInt(ordinal[1]);
    const mi = MONTH_NAMES.indexOf(ordinal[2].toLowerCase());
    const y = ordinal[3] ? parseInt(ordinal[3]) : titleYear;
    return new Date(Date.UTC(y, mi, day));
  }

  // Month name anywhere in title: "July Special", "Christmas 2021" etc.
  const lower = title.toLowerCase();
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (lower.includes(MONTH_NAMES[i])) return new Date(Date.UTC(titleYear, i, 15));
  }

  // Advent → Dec 1, Christmas/Xmas → Dec 24
  if (lower.includes("advent")) return new Date(Date.UTC(titleYear, 11, 1));
  if (lower.includes("christmas") || lower.includes("xmas")) return new Date(Date.UTC(titleYear, 11, 24));

  // Fallback: mid-point of the most recently seen regular month
  return new Date(Date.UTC(titleYear, lastMonthIndex, 15));
}

// Robust rating parser: handles numbers, "3*", "4", "-", "?", "COVID", "fuck off", etc.
function parseRating(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const match = String(val).trim().match(/^(\d+\.?\d*)/);
  if (!match) return null;
  return parseFloat(match[1]);
}

interface BeerRow {
  name: string;
  abv: number | undefined;
  notes: string;
  ratings: { reviewer: Reviewer; rating: number }[];
}

interface EventGroup {
  year: number;
  title: string;
  date: Date;
  beers: BeerRow[];
}

// --- Parse sheet ---
async function main() {
  const workbook = XLSX.readFile(XLSX_FILE);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found. Available: ${workbook.SheetNames.join(", ")}`);
    process.exit(1);
  }
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Find header row (contains all reviewer column names)
  const reviewerNames = REVIEWERS.map((r) => r.column.toLowerCase());
  let headerRowIdx = -1;
  let nameCol = -1, abvCol = -1, monthNumCol = -1;
  let reviewerCols: { col: number; reviewer: Reviewer }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((c) => String(c ?? "").trim().toLowerCase());
    if (reviewerNames.every((rn) => cells.includes(rn))) {
      headerRowIdx = i;
      nameCol = cells.findIndex((c) => c === "beer" || c === "name");
      abvCol = cells.findIndex((c) => c === "abv" || c === "abv%");
      monthNumCol = cells.findIndex((c) => c === "month");
      reviewerCols = REVIEWERS.map((r) => ({
        col: cells.findIndex((c) => c === r.column.toLowerCase()),
        reviewer: r,
      })).filter((rc) => rc.col !== -1);
      break;
    }
  }

  if (headerRowIdx === -1 || nameCol === -1 || monthNumCol === -1) {
    console.error("Could not find header row. Expected columns: Beer, ABV, Month,", REVIEWERS.map((r) => r.column).join(", "));
    process.exit(1);
  }

  // Scan rows and build event groups
  const allEvents: EventGroup[] = [];
  let currentYear = 0;
  let lastMonthIndex = 0;
  let currentEvent: EventGroup | null = null;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const keyCell = row[nameCol];
    const monthNumCell = row[monthNumCol];

    if (keyCell === null || keyCell === undefined || String(keyCell).trim() === "") continue;

    // Year row
    const year = isYearRow(keyCell);
    if (year !== null) {
      currentYear = year;
      currentEvent = null;
      continue;
    }

    // If monthNumCol is null, it's an event row UNLESS the row already has reviewer
    // ratings in it (e.g. "Katy Berry" in July Special which has a null month column).
    const hasRatings = reviewerCols.some(({ col }) => parseRating(row[col]) !== null);

    if ((monthNumCell === null || monthNumCell === undefined) && !hasRatings) {
      const title = String(keyCell).trim();
      const monthResult = parseMonthFromText(title);
      let date: Date;

      if (monthResult) {
        const y = monthResult.year ?? currentYear;
        date = new Date(Date.UTC(y, monthResult.monthIndex, 1));
        lastMonthIndex = monthResult.monthIndex;
      } else {
        date = inferDateForSpecialEvent(title, currentYear, lastMonthIndex);
      }

      currentEvent = { year: currentYear, title, date, beers: [] };
      allEvents.push(currentEvent);
      lastMonthIndex = date.getUTCMonth(); // keep cursor in sync for subsequent inferences
      continue;
    }

    // Beer row (monthNumCol has a value, or row has ratings despite null month col)
    if (currentEvent) {
      const name = String(keyCell).trim();
      if (!name) continue;
      const abvRaw = row[abvCol];
      const abv = (abvRaw != null && abvRaw !== "") ? Number(abvRaw) : undefined;

      const noteL = row[11] != null && String(row[11]).trim() !== "" ? String(row[11]).trim() : "";
      const noteM = row[12] != null && String(row[12]).trim() !== "" ? String(row[12]).trim() : "";
      const notes = [noteL, noteM].filter(Boolean).join(" / ");

      const ratings = reviewerCols.flatMap(({ col, reviewer }) => {
        const r = parseRating(row[col]);
        return r !== null ? [{ reviewer, rating: r }] : [];
      });

      currentEvent.beers.push({ name, abv, notes, ratings });
    }
  }

  // Filter to target year
  const targetEvents = allEvents.filter((e) => e.year === yearArg);
  if (targetEvents.length === 0) {
    console.log(`No events found for year ${yearArg}.`);
    return;
  }

  // Print summary
  console.log(`Parsed ${targetEvents.length} events for ${yearArg} from "${SHEET_NAME}":\n`);
  for (const ev of targetEvents) {
    const reviewCount = ev.beers.reduce((s, b) => s + b.ratings.length, 0);
    console.log(`  [${ev.date.toISOString().slice(0, 10)}] ${ev.title} — ${ev.beers.length} beers, ${reviewCount} reviews`);
  }

  if (DRY_RUN) {
    console.log("\nDry run — no changes written.");
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log("\nConnected to MongoDB");

  for (const ev of targetEvents) {
    // Duplicate check: event with same date (±1 day) or same title+year
    const dayStart = new Date(ev.date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(ev.date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const existing = await EventModel.findOne({
      $or: [
        { date: { $gte: dayStart, $lte: dayEnd } },
        { title: ev.title, date: { $gte: new Date(Date.UTC(ev.year, 0, 1)), $lte: new Date(Date.UTC(ev.year, 11, 31)) } },
      ],
    });

    if (existing) {
      if (existing.title !== ev.title) {
        await EventModel.updateOne({ _id: existing._id }, { title: ev.title });
        console.log(`  ~ Updated title: "${existing.title}" → "${ev.title}"`);
      } else {
        console.log(`  - Skipping "${ev.title}" — already imported`);
      }
      continue;
    }

    const newEvent = await EventModel.create({
      title: ev.title,
      date: ev.date,
      createdBy: "import",
    });

    let order = 1;
    for (const beer of ev.beers) {
      const newBeer = await BeerModel.create({
        eventId: newEvent._id,
        name: beer.name,
        brewery: "Brew York",
        breweries: ["Brew York"],
        abv: beer.abv,
        notes: beer.notes,
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
    console.log(`  ✓ ${ev.title} — ${ev.beers.length} beers, ${totalReviews} reviews`);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch(console.error);
