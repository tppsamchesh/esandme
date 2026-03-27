import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "How Es & Me began — premium baby products made with care for little ones and the people who love them.",
};

const storyParagraphs = [
  "Es & Me was born from a simple idea — that the products surrounding your little one should be as considered and gentle as the love you give them.",
  "We created Es & Me to offer parents and gift-givers something truly special: premium baby products made with care, designed to be cherished, and packaged beautifully enough to give as a gift straight from the box.",
  "Every product we make starts with the same question: would we give this to someone we love?",
] as const;

export default function OurStoryPage() {
  return (
    <div>
      <section
        className="w-full bg-gradient-to-b from-brand-bg to-[#E8EFE7] px-4 py-20 text-center md:py-28"
        aria-labelledby="our-story-heading"
      >
        <h1
          id="our-story-heading"
          className="font-heading text-4xl font-medium tracking-tight text-brand-text md:text-5xl lg:text-6xl"
        >
          Our Story
        </h1>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="font-sans text-base leading-relaxed text-gray-600 lg:pr-4">
            {storyParagraphs.map((text, i) => (
              <p key={i} className="mb-6 last:mb-0">
                {text}
              </p>
            ))}
          </div>
          <div
            className="aspect-[4/5] w-full rounded-xl bg-brand-secondary/35 lg:min-h-[28rem]"
            role="img"
            aria-label="Es & Me — image coming soon"
          />
        </div>
      </section>
    </div>
  );
}
