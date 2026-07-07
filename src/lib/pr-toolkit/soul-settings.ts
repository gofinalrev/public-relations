import { getAppSetting, setAppSetting } from "@/lib/db";
import {
  getDefaultVoiceGuide,
  resolveVoiceGuide,
  type CaptionBrand,
} from "@/lib/pr-toolkit/voice-guides";

export const SOUL_SETTING_KEYS: Record<CaptionBrand, string> = {
  finalrev: "soul_finalrev",
  tooltrace: "soul_tooltrace",
};

export type SoulOverrides = Record<CaptionBrand, string | null>;

export async function getSoulOverride(brand: CaptionBrand): Promise<string | null> {
  const raw = await getAppSetting(SOUL_SETTING_KEYS[brand]);
  const trimmed = raw?.trim();
  return trimmed || null;
}

export async function loadSoulOverrides(): Promise<SoulOverrides> {
  const [finalrev, tooltrace] = await Promise.all([
    getSoulOverride("finalrev"),
    getSoulOverride("tooltrace"),
  ]);
  return { finalrev, tooltrace };
}

export async function getResolvedSoul(brand: CaptionBrand): Promise<string> {
  const override = await getSoulOverride(brand);
  return resolveVoiceGuide(brand, override);
}

export async function saveSoulOverride(brand: CaptionBrand, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || trimmed === getDefaultVoiceGuide(brand)) {
    await setAppSetting(SOUL_SETTING_KEYS[brand], "");
    return;
  }
  await setAppSetting(SOUL_SETTING_KEYS[brand], trimmed);
}

export async function resetSoulOverride(brand: CaptionBrand): Promise<void> {
  await setAppSetting(SOUL_SETTING_KEYS[brand], "");
}
