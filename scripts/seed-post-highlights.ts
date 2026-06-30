import { getCurrentWeekKey } from "../src/lib/weeks";
import { updatePostHighlights, getWeeklyReport } from "../src/lib/db";
import { type PostHighlight, serializePostHighlights } from "../src/lib/post-highlights";

const WEEK = process.argv[2] ?? getCurrentWeekKey();

const POSTS: PostHighlight[] = [
  {
    id: "robots-youtube",
    platform: "youtube",
    format: "short",
    title: "Robots meet Machinery",
    views: 1759,
    likes: 9,
    publishedAt: "2026-06-26",
    product: "finalrev",
    groupId: "robots-machinery",
    notes: "pure mechanical precision · software-first CNC machine shop in Berkeley · #CNC #Manufacturing",
  },
  {
    id: "robots-instagram",
    platform: "instagram",
    format: "reel",
    title: "Robots meet Machinery",
    views: 177,
    likes: 3,
    publishedAt: "2026-06-26",
    product: "finalrev",
    groupId: "robots-machinery",
    notes: "Same short as YouTube · cross-posted as Reel",
  },
  {
    id: "beauty-instagram",
    platform: "instagram",
    format: "reel",
    title: "The Beauty of CNC Machinery",
    views: 712,
    likes: 25,
    publishedAt: "2026-06-24",
    product: "finalrev",
  },
  {
    id: "datron-instagram",
    platform: "instagram",
    format: "reel",
    title: "Meet the Datron Neo with Luke",
    views: 255,
    likes: 4,
    publishedAt: "2026-06-23",
    product: "finalrev",
    notes: "Shop machinist intro · Datron Neo",
  },
];

async function main() {
  console.log(`Saving ${POSTS.length} post highlights for week ${WEEK}...`);
  await updatePostHighlights(WEEK, serializePostHighlights(POSTS));

  const report = await getWeeklyReport(WEEK);
  const learning =
    "Robots meet Machinery Short hit 1,759 on YouTube vs 177 on IG (10× gap) — shop-floor CNC wins on Shorts first. IG best: Beauty of CNC (712 views, 3.5% likes).";

  if (report && !report.learning?.trim()) {
    const { upsertWeeklyReport } = await import("../src/lib/db");
    await upsertWeeklyReport({
      ...report,
      learning,
    });
    console.log("Added learning line to report.");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
