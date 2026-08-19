import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#08090b", color: "#f6ff70", fontSize: 154, fontWeight: 800, letterSpacing: "-14px", border: "28px solid #f6ff70", borderRadius: 104 }}>H3</div>, size);
}
