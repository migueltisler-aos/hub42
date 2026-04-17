import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#2A4A3C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
        }}
      >
        <span
          style={{
            color: "#C8964A",
            fontSize: 18,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-0.5px",
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
