import type { ProductBrand } from "@/lib/product-labels";

export type FaqEntry = {
  q: string;
  a: string;
  product: "tooltrace" | "finalrev" | "both";
};

/** Cross-brand — when someone asks about the relationship or either product in general */
export const SHARED_FAQ: FaqEntry[] = [
  {
    product: "both",
    q: "What's the difference between Tooltrace and finalREV?",
    a: "Tooltrace is free AI software — photo your tools, trace outlines, export inserts for print or laser. finalREV is the CNC job shop in Berkeley — upload STEP files for quotes on machined parts. Same team: organize tools with Tooltrace, get parts cut at finalREV.",
  },
  {
    product: "both",
    q: "Are Tooltrace and finalREV the same company?",
    a: "Yes — both are built by finalREV (Brittle Fluid, Inc.) in Berkeley, CA. Tooltrace is the free tool-organization app; finalREV is the machine shop.",
  },
  {
    product: "both",
    q: "Where are you located?",
    a: "Berkeley, California — 1338 7th Street, Berkeley CA 94710. finalREV offers Bay Area same-day delivery and local pickup; Tooltrace is web-based and works anywhere.",
  },
];

/** From tooltrace.ai home FAQ, pricing, 5S page, and how-to docs */
export const TOOLTRACE_FAQ: FaqEntry[] = [
  {
    product: "tooltrace",
    q: "Is Tooltrace free?",
    a: "Yes — core tracing and exports (STL, 3MF, STEP, DXF, SVG) are free with no watermarks. Pro ($8/mo) adds Detail Mode, custom shapes, tool imports, magnet holes, custom sizes, and unlimited active designs. See tooltrace.ai/pricing.",
  },
  {
    product: "tooltrace",
    q: "How does Tooltrace work?",
    a: "Top-down photo on Letter/A4 → upload at tooltrace.ai/designer → select the paper for scale → click each tool to trace → export for 3D print, laser, or CNC. Most drawers take ~5 minutes.",
  },
  {
    product: "tooltrace",
    q: "What is Gridfinity?",
    a: "Gridfinity is a modular storage system (42mm grid) by Zack Freedman. Tooltrace has a Gridfinity mode that generates custom bin inserts — export STL/3MF and print them.",
  },
  {
    product: "tooltrace",
    q: "Gridfinity vs shadowbox / Kaizen foam?",
    a: "Gridfinity = modular 42mm bin inserts for 3D printers. Shadowbox/Kaizen foam = layered foam cutouts that show missing tools instantly. Tooltrace supports both — pick the mode in the designer.",
  },
  {
    product: "tooltrace",
    q: "How accurate are Tooltrace traces?",
    a: "With a top-down photo, good lighting, and the paper as scale reference, traces are typically within 1–2mm — enough for foam inserts (usually 2–3mm clearance around tools). See tooltrace.ai/how-to for photo tips.",
  },
  {
    product: "tooltrace",
    q: "Which file format should I export?",
    a: "3D print: STL or 3MF. Laser / Cricut / Glowforge: SVG or DXF. CNC or CAD handoff: STEP or DXF.",
  },
  {
    product: "tooltrace",
    q: "What is Detail Mode?",
    a: "Enhanced AI for complex tool shapes — up to ~1 min per tool, more accurate outlines. Free users get limited Detail Mode uses; Pro is unlimited.",
  },
  {
    product: "tooltrace",
    q: "Can I try Pro features before paying?",
    a: "Yes — you can use all Pro features while designing. The check only happens at download, so you can explore everything first. Remove Pro-only features to export on the free tier.",
  },
  {
    product: "tooltrace",
    q: "How many designs can I keep on the free plan?",
    a: "Free accounts can access their 3 most recent active tooltraces (plus any designs created before Jan 2026). Pro unlocks unlimited active designs.",
  },
  {
    product: "tooltrace",
    q: "What is the Tooltrace Community?",
    a: "Free library at tooltrace.ai/community — browse by brand or tool type, download ready-made STL/3MF/STEP/DXF/SVG inserts without tracing. Hit \"Customize This Design\" to fork any listing into your designer.",
  },
  {
    product: "tooltrace",
    q: "How do I publish to the Community?",
    a: "Finish your design in the designer → \"Publish to Community\" → add photos, description, and optional purchase links. Listings go live after a brief content review.",
  },
  {
    product: "tooltrace",
    q: "Does Tooltrace work on mobile?",
    a: "Yes — runs in the browser. Take the photo on your phone, upload, trace, and export. Desktop is better for fine edits and large drawers.",
  },
  {
    product: "tooltrace",
    q: "What foam should I use for 5S inserts?",
    a: "Kaizen foam (layered PE) is the most popular in shops — durable and good for visual management. EVA is softer for delicate tools. Cross-linked PE is the most durable but usually needs CNC cutting. tooltrace.ai/5s has the full guide.",
  },
  {
    product: "tooltrace",
    q: "Can I standardize tool layouts across workstations?",
    a: "Yes — export once, cut the same DXF/SVG for every drawer. Duplicate tools within a design to mirror layouts across stations.",
  },
  {
    product: "tooltrace",
    q: "Does Tooltrace work for large tool cribs?",
    a: "Yes — photograph each drawer or section separately. Max foam size per design is 34\" × 54\"; split very large cribs into multiple designs.",
  },
  {
    product: "tooltrace",
    q: "How does Tooltrace help with 5S audits?",
    a: "Exact tool outlines make audits objective — missing tools are obvious at a glance. Many shops use contrasting foam colors so gaps stand out during walk-throughs.",
  },
  {
    product: "tooltrace",
    q: "3D printed inserts vs foam?",
    a: "Tooltrace exports both. Gridfinity mode → durable printed bins, great for small tools and modular layouts. Foam → faster to cut on a laser, classic shadowboard look for manufacturing floors.",
  },
  {
    product: "tooltrace",
    q: "Do you offer enterprise or team accounts?",
    a: "We can discuss volume licensing, dedicated support, and integrations for larger operations — reach out through tooltrace.ai (Contact Us).",
  },
  {
    product: "tooltrace",
    q: "What Pro features are not on free?",
    a: "Detail Mode (unlimited), custom shapes, importing existing tool outlines, magnet holes, custom bin sizes, and unlimited active tooltraces. Free still includes full foam and Gridfinity exports.",
  },
];

/** From finalrev.com FAQ, capabilities, and company content */
export const FINALREV_FAQ: FaqEntry[] = [
  {
    product: "finalrev",
    q: "What is finalREV?",
    a: "Software-first CNC machine shop in Berkeley, CA. Upload STEP for instant quotes on 3-axis CNC, millturn, and 5-axis work. Bay Area same-day delivery; 2-day ship nationwide. MOQ 1.",
  },
  {
    product: "finalrev",
    q: "How do I get a CNC quote?",
    a: "Upload your STEP (.step / .stp) file at finalrev.com/quote — instant pricing for most parts. Create an account to checkout; the first quote flow works without a long signup.",
  },
  {
    product: "finalrev",
    q: "What file formats do you accept?",
    a: "STEP and STP preferred. Upload what you have at finalrev.com/quote — we'll confirm in the quote if anything needs conversion.",
  },
  {
    product: "finalrev",
    q: "What is the minimum order quantity?",
    a: "MOQ is 1 part — one-offs through production runs. Quantity breaks show automatically in the quote.",
  },
  {
    product: "finalrev",
    q: "What is the lead time for delivery?",
    a: "Bay Area: same-day delivery via Uber when parts are ready. Nationwide: select shipping at checkout — fastest option is 2-day. Berkeley pickup available 10am–5pm after parts are ready.",
  },
  {
    product: "finalrev",
    q: "Do you ship outside the Bay Area?",
    a: "Yes — we ship across the United States. Choose shipping speed at checkout (2-day minimum outside the Bay Area). Bay Area customers can also pick Uber same-day or Berkeley pickup.",
  },
  {
    product: "finalrev",
    q: "What manufacturing processes do you offer?",
    a: "3-axis CNC (plates, brackets, pockets — 20\" × 20\" × 6\" envelope), millturn (shafts, spacers, bushings, gears — up to 1\" round), and 5-axis CNC (complex multi-sided parts — up to 12\" cube). See finalrev.com/capabilities.",
  },
  {
    product: "finalrev",
    q: "What materials can you machine?",
    a: "Common: aluminum, steel, stainless steel, acetal, brass, plywood, acrylic, carbon steel. 5-axis and specialty work includes titanium and carbon fiber layouts — upload STEP and the quote will reflect what's machinable.",
  },
  {
    product: "finalrev",
    q: "Where is the shop?",
    a: "1338 7th Street, Berkeley, CA 94710. Pickup hours Mon–Fri 10am–5pm after your order is ready.",
  },
  {
    product: "finalrev",
    q: "What parts are you best at?",
    a: "Prototypes and production CNC — brackets, fixtures, shafts, gears, carbon fiber machining, and complex 5-axis geometry. We also build our own shop tooling with Tooltrace.",
  },
  {
    product: "finalrev",
    q: "Do you do rush or same-day machining?",
    a: "Bay Area customers often get same-day delivery when the queue allows — upload STEP for an instant quote with lead time. Contact support@finalrev.com for urgent jobs.",
  },
  {
    product: "finalrev",
    q: "How do I contact finalREV support?",
    a: "Email support@finalrev.com or call +1 (415) 375-0567. Shop hours Mon–Fri 10am–5pm Pacific.",
  },
  {
    product: "finalrev",
    q: "Is finalREV related to Tooltrace?",
    a: "Same team — we built Tooltrace to organize our own shop floor. Makers use Tooltrace free; engineers upload STEP to finalREV when they need machined parts.",
  },
  {
    product: "finalrev",
    q: "Do you work with startups and hardware teams?",
    a: "Yes — MOQ 1, instant STEP quotes, and fast Bay Area turnaround are built for prototype iterations. No minimum spend.",
  },
];

export const PRODUCT_FAQ: FaqEntry[] = [...SHARED_FAQ, ...TOOLTRACE_FAQ, ...FINALREV_FAQ];

export const FAQ_SECTIONS: Array<{
  id: "both" | "tooltrace" | "finalrev";
  title: string;
  description: string;
  items: FaqEntry[];
}> = [
  {
    id: "both",
    title: "Both products",
    description: "When someone asks how Tooltrace and finalREV relate",
    items: SHARED_FAQ,
  },
  {
    id: "tooltrace",
    title: "Tooltrace",
    description: "SaaS · tool organization, foam, Gridfinity, Community",
    items: TOOLTRACE_FAQ,
  },
  {
    id: "finalrev",
    title: "finalREV",
    description: "CNC shop · quotes, materials, lead time, shipping",
    items: FINALREV_FAQ,
  },
];

export const FAQ_PRODUCT_LABEL: Record<ProductBrand, string> = {
  tooltrace: "Tooltrace",
  finalrev: "finalREV",
  social: "Social",
  both: "Both products",
};
