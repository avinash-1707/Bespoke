import { Reveal } from "./reveal";

interface Step {
  number: string;
  title: string;
  body: string;
}

const STEPS: ReadonlyArray<Step> = [
  {
    number: "01",
    title: "Describe what you sell",
    body: "Paste a link or type it out. Bespoke learns your offer once: the problem it solves, who it's for, why it lands.",
  },
  {
    number: "02",
    title: "Drop in a prospect",
    body: "A profile screenshot, a few links, a scrap of notes, any mix at all. Bespoke reads it and builds a picture of the person.",
  },
  {
    number: "03",
    title: "Generate, tuned to taste",
    body: "Set the tone and angle. Out comes a message written for that one reader, ready to copy. Don't like it? Re-cut it.",
  },
  {
    number: "04",
    title: "Carry the conversation",
    body: "When they reply, paste it back. Bespoke continues the thread in the same voice, with all the context intact.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--lp-accent)]">
          The fitting
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-5xl">
          Four steps from cold name to something they&apos;ll answer.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-[var(--lp-line)] bg-[var(--lp-line)] sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal key={step.number} delay={index * 90}>
            <div className="flex h-full flex-col bg-[var(--lp-bg-raised)] p-7 transition-colors duration-200 hover:bg-[var(--lp-bg)]">
              <span className="font-display text-3xl font-semibold text-[var(--lp-accent)]">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[var(--lp-text)]">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--lp-text-soft)]">
                {step.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
