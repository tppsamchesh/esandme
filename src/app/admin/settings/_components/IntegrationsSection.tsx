export type IntegrationKey =
  | "stripe"
  | "supabase"
  | "shipstation"
  | "resend"
  | "ga4";

const ROWS: {
  key: IntegrationKey;
  label: string;
  envVar: string;
}[] = [
  { key: "stripe", label: "Stripe", envVar: "STRIPE_SECRET_KEY" },
  {
    key: "supabase",
    label: "Supabase",
    envVar: "NEXT_PUBLIC_SUPABASE_URL (+ ANON KEY)",
  },
  { key: "shipstation", label: "ShipStation", envVar: "SHIPSTATION_API_KEY" },
  { key: "resend", label: "Resend", envVar: "RESEND_API_KEY" },
  {
    key: "ga4",
    label: "Google Analytics",
    envVar: "GA4_PROPERTY_ID",
  },
];

export function IntegrationsSection({
  status,
}: {
  status: Record<IntegrationKey, boolean>;
}) {
  return (
    <section className="rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl text-brand-text">Integrations</h2>
      <p className="mt-1 text-sm text-brand-text/65">
        Read-only check that expected environment variables are set (values are
        never shown).
      </p>
      <ul className="mt-6 divide-y divide-brand-text/10 rounded-lg border border-brand-text/10">
        {ROWS.map((row) => {
          const ok = status[row.key];
          return (
            <li
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-brand-text">{row.label}</p>
                <p className="font-mono text-xs text-brand-text/50">
                  {row.envVar}
                </p>
              </div>
              {ok ? (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Connected
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                  Not configured
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
