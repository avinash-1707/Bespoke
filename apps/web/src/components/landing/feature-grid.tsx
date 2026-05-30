import { Reveal } from "./reveal";
import {
  Scissors,
  Layers,
  MessagesSquare,
  ScanLine,
  RefreshCw,
  LineChart,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Span two columns on large screens for a bento rhythm. */
  wide?: boolean;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    icon: Scissors,
    title: "Tailored, not templated",
    body: "What you sell, your voice, and who you're writing to all shape the words. Change any one and the message genuinely changes, with no swappable name fields.",
    wide: true,
  },
  {
    icon: ScanLine,
    title: "Context from anything",
    body: "A screenshot, a website, a handful of links. Bespoke reads them and forms a picture of the person before it writes a word.",
  },
  {
    icon: Layers,
    title: "Many offers, one home",
    body: "Different products, different audiences. Keep a set of offers and voices, and reach for the right one in a click.",
  },
  {
    icon: MessagesSquare,
    title: "Whole conversations",
    body: "First message to final reply, the thread lives in one place, so a follow-up never starts from a blank page.",
  },
  {
    icon: RefreshCw,
    title: "Re-cut on a whim",
    body: "Want it warmer, shorter, bolder? Regenerate against the same context until it sounds exactly right.",
  },
  {
    icon: LineChart,
    title: "Know what lands",
    body: "Rate what you send, favourite the best, and see which offers and angles actually earn replies.",
    wide: true,
  },
];

export function FeatureGrid() {
  return (
    <section
      id="craft"
      className="border-y border-(--lp-line) bg-(--lp-bg-sunk) py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-(--lp-accent)">
            The craft
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-(--lp-text) sm:text-5xl">
            Built for people whose words have to do the work.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal
              key={feature.title}
              delay={(index % 3) * 90}
              className={feature.wide ? "lg:col-span-2" : undefined}
            >
              <article className="group h-full rounded-xl border border-(--lp-line) bg-(--lp-bg-raised) p-7 transition-transform duration-200 ease-out hover:-translate-y-1">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-(--lp-accent-tint) text-(--lp-accent) transition-colors duration-200 group-hover:bg-(--lp-accent) group-hover:text-(--lp-text-invert)">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-(--lp-text)">
                  {feature.title}
                </h3>
                <p className="mt-2.5 max-w-md text-sm leading-relaxed text-(--lp-text-soft)">
                  {feature.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
