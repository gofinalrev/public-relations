"use server";

import { revalidatePath } from "next/cache";
import { updatePostHighlights } from "@/lib/db";
import { type PostHighlight, serializePostHighlights } from "@/lib/post-highlights";

export async function savePostHighlights(weekStart: string, posts: PostHighlight[]) {
  await updatePostHighlights(weekStart, serializePostHighlights(posts));
  revalidatePath("/");
  revalidatePath(`/?week=${weekStart}`);
}
