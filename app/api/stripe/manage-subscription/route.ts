import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, getRequesterIp } from "@/lib/security/rate-limit";

const ALLOWED_ACTIONS = ["cancel", "pause", "apply-discount"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

export async function POST(req: NextRequest) {
  const ip = getRequesterIp(req.headers);
  const limiter = consumeRateLimit(`manage-sub:${ip}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action, userId, establishmentId } = body as {
      action: string;
      userId: string;
      establishmentId: string;
    };

    if (
      !ALLOWED_ACTIONS.includes(action as Action) ||
      !userId ||
      !establishmentId
    ) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: est } = await supabase
      .from("establishments")
      .select("stripe_subscription_id, subscription_status, current_period_end")
      .eq("id", establishmentId)
      .eq("user_id", user.id)
      .single();

    if (!est?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const subscriptionId = est.stripe_subscription_id;

    switch (action as Action) {
      case "cancel": {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        await supabase
          .from("establishments")
          .update({ subscription_status: "canceling" })
          .eq("id", establishmentId);
        return NextResponse.json({ success: true, action: "cancel" });
      }

      case "pause": {
        const resumeAt = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
        await (stripe.subscriptions.update as any)(subscriptionId, {
          pause_collection: { behavior: "void", resumes_at: resumeAt },
        });
        await supabase
          .from("establishments")
          .update({ subscription_status: "paused" })
          .eq("id", establishmentId);
        return NextResponse.json({ success: true, action: "pause" });
      }

      case "apply-discount": {
        // Guard: don't allow double discounts
        const sub = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["discounts"],
        });
        const existingDiscounts = (sub as any).discounts ?? [];
        if (existingDiscounts.length > 0) {
          return NextResponse.json(
            { error: "A discount is already active on this subscription" },
            { status: 409 },
          );
        }

        const coupon = await stripe.coupons.create({
          percent_off: 20,
          duration: "repeating",
          duration_in_months: 3,
          name: "Descuento Retención 20% · 3 meses",
          max_redemptions: 1,
        });

        await (stripe.subscriptions.update as any)(subscriptionId, {
          discounts: [{ coupon: coupon.id }],
        });

        return NextResponse.json({ success: true, action: "apply-discount" });
      }
    }
  } catch (error: any) {
    console.error("manage-subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 },
    );
  }
}
