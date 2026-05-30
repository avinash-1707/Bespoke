import { Reveal } from "./reveal";

const GENERIC_MESSAGE =
  "Hi Maya, I hope this email finds you well! I wanted to reach out because I think our solution could be a great fit for your team. We help companies like yours increase productivity and drive results. Do you have 15 minutes to hop on a quick call this week?";

const BESPOKE_LINES: ReadonlyArray<string> = [
  "Hi Maya,",
  "",
  "Saw you just shipped the offline sync rewrite at Northwind. Reconciling",
  "conflicting edits without a central lock is the part most teams hand-wave.",
  "",
  "We built Ledger for teams living in exactly that. Worth fifteen minutes?",
  "I'll come with the hard questions, not a deck.",
  "",
  "Sam",
];

export function Comparison() {
  return (
    <section id="difference" className="bg-[var(--lp-ink-panel)] py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--lp-accent)]">
            The difference
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-[var(--lp-text-invert)] sm:text-5xl">
            One of these gets deleted. The other gets a reply.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <article className="flex h-full flex-col rounded-xl border border-[var(--lp-line-invert)] bg-[var(--lp-ink-panel-raised)] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-[var(--lp-text-invert-soft)]">
                  Everyone else
                </span>
                <span className="rounded bg-[var(--lp-line-invert)] px-2 py-0.5 text-[11px] text-[var(--lp-text-invert-soft)]">
                  Mass blast
                </span>
              </div>
              <p className="mt-5 font-mono text-[13px] leading-relaxed text-[var(--lp-text-invert-soft)] line-through decoration-[var(--lp-accent)]/40">
                {GENERIC_MESSAGE}
              </p>
            </article>
          </Reveal>

          <Reveal delay={120}>
            <article className="flex h-full flex-col rounded-xl border border-[var(--lp-accent)]/40 bg-[var(--lp-ink-panel-raised)] p-6 shadow-[0_0_0_1px_var(--lp-accent-tint)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-[var(--lp-accent)]">
                  Bespoke
                </span>
                <span className="rounded bg-[var(--lp-accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--lp-text-invert)]">
                  Made to measure
                </span>
              </div>
              <pre className="mt-5 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-[var(--lp-text-invert)]">
                {BESPOKE_LINES.join("\n")}
              </pre>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
