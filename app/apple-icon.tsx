import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#2A4A3C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
        }}
      >
        <span
          style={{
            color: "#C8964A",
            fontSize: 96,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          42
        </span>
      </div>
    ),
    { ...size }
  );
}
