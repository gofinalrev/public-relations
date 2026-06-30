import { addDays, format, parseISO } from "date-fns";
import Stripe from "stripe";
import { getStripeEnvironment, getStripeProPriceId, getStripeSecretKey, isStripeConfigured } from "./config";

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }
  return stripeClient;
}

function isProSubscription(subscription: Stripe.Subscription, proPriceId: string, environment: string): boolean {
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId !== proPriceId) return false;

  const subEnvironment = subscription.metadata?.environment;
  if (!subEnvironment) {
    // Older subscriptions may lack metadata — treat as production when tracking prod.
    return environment === "production";
  }

  return subEnvironment === environment;
}

/**
 * Count new Tooltrace Pro subscriptions created in [periodStart, periodEnd] (inclusive dates).
 * Source of truth: Stripe (same data that triggers Slack "subscribed to Tooltrace Pro!" alerts).
 */
export async function countNewProSubscriptions(periodStart: string, periodEnd: string): Promise<number> {
  if (!isStripeConfigured()) {
    return 0;
  }

  const stripe = getStripeClient();
  const proPriceId = getStripeProPriceId();
  const environment = getStripeEnvironment();

  const startTs = Math.floor(parseISO(`${periodStart}T00:00:00Z`).getTime() / 1000);
  const endExclusive = addDays(parseISO(periodEnd), 1);
  const endTs = Math.floor(parseISO(`${format(endExclusive, "yyyy-MM-dd")}T00:00:00Z`).getTime() / 1000);

  let total = 0;
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
      created: { gte: startTs, lt: endTs },
      starting_after: startingAfter,
      expand: ["data.items.data.price"],
    });

    for (const subscription of page.data) {
      if (isProSubscription(subscription, proPriceId, environment)) {
        total += 1;
      }
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return total;
}

export type SubscriptionCountResult = {
  count: number;
  source: "stripe" | "unconfigured";
};

export async function fetchProSubscriptionCount(
  periodStart: string,
  periodEnd: string,
): Promise<SubscriptionCountResult> {
  if (!isStripeConfigured()) {
    return { count: 0, source: "unconfigured" };
  }

  const count = await countNewProSubscriptions(periodStart, periodEnd);
  return { count, source: "stripe" };
}
