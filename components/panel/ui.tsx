import type { Metric } from "./types";

const accentClassMap = {
  green: "text-emerald-600",
  red: "text-rose-600",
  blue: "text-sky-600",
  orange: "text-amber-600",
};

export function PanelTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="subtle text-sm">{description}</p>
    </header>
  );
}

export function MetricCards({ items }: { items: Metric[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((item) => {
        const accent = item.accent ? accentClassMap[item.accent] : "text-emerald-600";
        return (
          <article className="card p-4" key={item.title}>
            <p className="subtle text-xs">{item.title}</p>
            <p className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight truncate">{item.value}</p>
            {item.delta ? <p className={`mt-1 text-xs font-medium ${accent}`}>{item.delta}</p> : null}
          </article>
        );
      })}
    </section>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action ? <button className="text-sm text-rose-600">{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "ok" | "warn" | "bad" | "muted" }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warn"
        ? "bg-amber-100 text-amber-700"
        : tone === "bad"
          ? "bg-rose-100 text-rose-700"
          : "bg-zinc-100 text-zinc-600";
  return (
    <span className={`inline-flex min-w-[96px] items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
