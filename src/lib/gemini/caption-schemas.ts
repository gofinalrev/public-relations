import { z } from "zod";

export const captionPlatformSchema = z.enum([
  "linkedin",
  "x",
  "youtube",
  "instagram",
  "tiktok",
]);

export const captionOptionSchema = z.object({
  text: z.string().min(1),
  style: z.string().describe("Short label e.g. dfm lesson, shop-floor hook, machinist POV"),
  hookType: z
    .string()
    .describe("What the first line does e.g. visual payoff, contrarian claim, number lead"),
});

export const captionPlatformBlockSchema = z.object({
  platform: captionPlatformSchema,
  options: z.array(captionOptionSchema).length(4),
});

export const captionResponseSchema = z.object({
  captions: z.array(captionPlatformBlockSchema),
  detectedArchetype: z
    .string()
    .optional()
    .describe("Primary content archetype detected from transcript"),
  audience: z
    .string()
    .optional()
    .describe("Primary audience e.g. CNC engineer, shop owner, maker"),
});

export type CaptionResponse = z.infer<typeof captionResponseSchema>;
export type CaptionOptionMeta = z.infer<typeof captionOptionSchema>;
