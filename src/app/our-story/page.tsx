import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Meet Megan, founder of Es & Me — baby changing essentials that are stylish, practical, and made with love.",
};

const FOUNDER_IMAGE =
  "https://zgskeielwbqasawbtjsg.supabase.co/storage/v1/object/public/product-images/PHOTO-2023-11-08-21-49-36.jpg";

export default function OurStoryPage() {
  return (
    <div className="bg-brand-bg">
      {/* Section 1 — Founder intro */}
      <section
        className="border-b border-brand-text/5 px-4 py-16 md:py-24"
        aria-labelledby="founder-heading"
      >
        <div className="mx-auto grid max-w-6xl items-start gap-10 md:gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-sm ring-1 ring-brand-text/10">
              <Image
                src={FOUNDER_IMAGE}
                alt="Megan, founder of Es & Me"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized
              />
            </div>
          </div>
          <div className="flex flex-col justify-center font-sans text-brand-text">
            <h1
              id="founder-heading"
              className="font-heading text-4xl font-medium tracking-tight text-brand-text md:text-5xl"
            >
              Hi, I&apos;m Megan
            </h1>
            <div className="mt-8 space-y-6 text-base leading-relaxed text-brand-text/90 md:text-lg">
              <p>
                Proud mum to Esme and her little sister Harper, and the founder
                of Es &amp; Me.
              </p>
              <p>
                Es &amp; Me began during my first year of mumming, born from a
                simple idea: to create baby changing essentials that were
                stylish, practical, and affordable for other new mums like me.
              </p>
              <p>
                I wanted to offer something different from the plain, overpriced
                options I kept seeing — something that felt personal and made
                everyday moments easier and more comfortable for both baby and
                parent.
              </p>
              <p>
                Everything we create is made with love and tested by our
                toughest little critics, Esme and Harper!
              </p>
            </div>
            <p className="mt-10 font-sans text-base italic leading-relaxed text-brand-text/85 md:text-lg">
              With love, Megan
              <br />
              Director of Cuddles &amp; Chaos
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — Join Our Family */}
      <section
        className="border-b border-brand-text/5 bg-brand-primary/10 px-4 py-16 md:py-24"
        aria-labelledby="join-family-heading"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="join-family-heading"
            className="font-heading text-3xl font-medium tracking-tight text-brand-text md:text-4xl"
          >
            Join Our Family
          </h2>
          <div className="mt-8 space-y-6 font-sans text-base leading-relaxed text-brand-text/90 md:text-lg">
            <p>
              At Es &amp; Me, we believe in making everyday moments feel magical
              — from sleepy snuggles to on-the-go nappy changes. Our collection
              is all about softness, practicality, and a touch of joy for you
              and your little one.
            </p>
            <p>
              Because motherhood is messy, beautiful, and totally worth
              celebrating.
            </p>
            <p>
              Come join our village — where cozy meets cute, and every mum is
              seen.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Connect With Us */}
      <section
        className="px-4 py-16 md:py-24"
        aria-labelledby="connect-heading"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="connect-heading"
            className="font-heading text-3xl font-medium tracking-tight text-brand-text md:text-4xl"
          >
            Connect With Us
          </h2>
          <div className="mt-8 space-y-6 font-sans text-base leading-relaxed text-brand-text/90 md:text-lg">
            <p>
              We love growing alongside your little ones. If there&apos;s a
              design you&apos;d love to see or a product you think we should
              create, we&apos;re all ears — just drop us a message!
            </p>
            <p>
              Stay connected with us on Instagram and through our newsletter for
              the latest product launches, behind-the-scenes peeks, and community
              updates. We&apos;re always here to chat, answer any questions, and
              hear your brilliant ideas.
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="https://www.instagram.com/esandmeuk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center justify-center rounded-md bg-[#8BA888] px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Follow us on Instagram
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
