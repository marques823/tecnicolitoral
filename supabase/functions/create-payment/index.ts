import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  plan_id: string;
  is_annual?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

  const supabase = createClient(supabaseUrl, supabaseAnon);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated or email missing");

    const { plan_id, is_annual }: CreatePaymentRequest = await req.json();
    if (!plan_id) throw new Error("plan_id is required");

    // Fetch plan details securely from DB (avoid trusting client values)
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id,name,monthly_price')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) throw new Error("Plano não encontrado");

    const priceMonthly = Number(plan.monthly_price || 0);
    if (!priceMonthly || priceMonthly <= 0) throw new Error("Preço inválido do plano");

    const amount = is_annual ? priceMonthly * 12 * 0.8 : priceMonthly;
    const unit_amount = Math.round(amount * 100); // cents

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") ?? Deno.env.get("SITE_URL") ?? "";
    const success = `${origin}/payment-success?plan_id=${plan_id}&annual=${is_annual ? '1' : '0'}`;
    const cancel = `${origin}/payment-canceled`;

    const session = await stripe.checkout.sessions.create({
      customer_email: userData.user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: `${plan.name} ${is_annual ? '(Anual)' : '(Mensal)'}` },
            unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: success,
      cancel_url: cancel,
      metadata: {
        plan_id,
        is_annual: is_annual ? '1' : '0',
        user_id: userData.user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("create-payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
