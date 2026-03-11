import type { ReactNode } from "react";

import { CheckCircle2, KeyRound, ShoppingCart, Store, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { getShopifyConfigStatus } from "@/lib/shopify/config";

function StatusPill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-ink/6 px-3 py-1 text-[11px] font-medium tracking-[0.08em] uppercase">{children}</span>;
}

export function ShopifyReadinessPanel() {
  const status = getShopifyConfigStatus();

  return (
    <Card tone={status.configured ? "ivory" : "stone"}>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={status.configured ? "teal" : "gold"}>
            {status.configured ? "Shopify Ready" : "Shopify Setup Pending"}
          </Badge>
          <p className="text-xs tracking-[0.12em] text-smoke uppercase">
            Storefront API scaffold + secure cart session are now part of the app
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <h2 className="font-heading text-3xl text-ink sm:text-4xl">Custom cart page, Shopify backend</h2>
            <p className="mt-3 text-sm leading-7 text-smoke">
              This site is now structured for a headless Shopify rollout: secure Storefront API access on the server, a cart
              session cookie for returning shoppers, and API routes for cart creation, line updates, and checkout handoff.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill>GET /api/shopify/cart</StatusPill>
              <StatusPill>POST /api/shopify/cart</StatusPill>
              <StatusPill>PATCH /api/shopify/cart</StatusPill>
              <StatusPill>DELETE /api/shopify/cart</StatusPill>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-ink/10 bg-white/65 p-4 sm:p-5">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-smoke uppercase">Integration Status</h3>
            <div className="mt-4 space-y-3 text-sm text-smoke">
              <div className="flex items-start gap-3">
                {status.configured ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-deep-teal" /> : <TriangleAlert className="mt-0.5 h-5 w-5 text-gold" />}
                <div>
                  <p className="font-semibold text-ink">Credentials</p>
                  <p>
                    {status.configured
                      ? `${status.storeDomain} on Storefront API ${status.apiVersion}`
                      : `Missing ${status.missingKeys.join(" and ")} in the environment.`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Store className="mt-0.5 h-5 w-5 text-deep-teal" />
                <div>
                  <p className="font-semibold text-ink">Catalog foundation</p>
                  <p>Next step: map Shopify collections and product handles into the current designer/category routes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShoppingCart className="mt-0.5 h-5 w-5 text-deep-teal" />
                <div>
                  <p className="font-semibold text-ink">Cart experience</p>
                  <p>The app can now persist a Shopify cart server-side and hand shoppers to Shopify Checkout when ready.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-deep-teal" />
                <div>
                  <p className="font-semibold text-ink">Security posture</p>
                  <p>Cart IDs stay in an httpOnly cookie so Shopify’s secret cart key never leaks into public page code.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
