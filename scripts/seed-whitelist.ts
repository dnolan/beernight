/**
 * Seed script to add whitelisted emails to MongoDB.
 *
 * Usage:
 *   npx tsx scripts/seed-whitelist.ts user@example.com another@example.com
 *
 * Or set SEED_EMAILS env var:
 *   SEED_EMAILS="user@example.com,another@example.com" npx tsx scripts/seed-whitelist.ts
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/beernight";

const WhitelistedEmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  addedAt: { type: Date, default: Date.now },
});

const WhitelistedEmail =
  mongoose.models.WhitelistedEmail ||
  mongoose.model("WhitelistedEmail", WhitelistedEmailSchema);

async function main() {
  let emails: string[] = [];

  // From CLI args
  const args = process.argv.slice(2);
  if (args.length > 0) {
    emails = args;
  }

  // From env var
  if (process.env.SEED_EMAILS) {
    emails = [
      ...emails,
      ...process.env.SEED_EMAILS.split(",").map((e) => e.trim()),
    ];
  }

  if (emails.length === 0) {
    console.log("Usage: npx tsx scripts/seed-whitelist.ts email1@example.com email2@example.com");
    console.log('Or: SEED_EMAILS="email1,email2" npx tsx scripts/seed-whitelist.ts');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const email of emails) {
    try {
      await WhitelistedEmail.create({ email: email.toLowerCase().trim() });
      console.log(`  ✓ Added: ${email}`);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
        console.log(`  - Already exists: ${email}`);
      } else {
        console.error(`  ✗ Error adding ${email}:`, err);
      }
    }
  }

  await mongoose.disconnect();
  console.log("Done!");
}

main().catch(console.error);
