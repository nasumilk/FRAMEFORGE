import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://frameforge.example"),
  title: "FRAMEFORGE — H3 Visual Prompt Studio",
  description: "A visual pose, camera-blocking, and timeline editor for structured MiniMax H3 video prompts.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "FRAMEFORGE — H3 Visual Prompt Studio",
    description: "Compose poses, body direction, framing, and camera placement visually, then generate a structured H3 prompt.",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "FRAMEFORGE visual pose rig and camera placement map" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FRAMEFORGE — H3 Visual Prompt Studio",
    description: "Visual pose and camera blocking for structured H3 prompts.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
