const ANNOUNCEMENT =
  "Free delivery on orders over £50 · 30-day returns · Sustainable packaging";

export function AnnouncementBar() {
  return (
    <div className="bg-brand-primary text-white">
      <div className="overflow-hidden py-2 text-center text-xs tracking-wide md:py-2.5">
        <p className="hidden px-4 md:block">{ANNOUNCEMENT}</p>
        <div
          className="md:hidden overflow-hidden"
          aria-label={ANNOUNCEMENT}
        >
          <div className="flex w-max animate-announcement-marquee" aria-hidden>
            <span className="shrink-0 px-8">{ANNOUNCEMENT}</span>
            <span className="shrink-0 px-8">{ANNOUNCEMENT}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
