import { ImageResponse } from "next/og";

export const alt = "Es & Me — Premium Baby Products UK";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded default social-share / Open Graph card. Used as the fallback OG
// image sitewide and as the Organization logo in structured data.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F4F1EA 0%, #E8EFE7 100%)",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 600,
            color: "#5A6B52",
            letterSpacing: "-0.02em",
          }}
        >
          Es &amp; Me
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            color: "#3A3A36",
          }}
        >
          Premium Baby Products, made with care
        </div>
      </div>
    ),
    { ...size },
  );
}
