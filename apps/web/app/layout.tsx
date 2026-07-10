import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Epicenter Education",
  description: "College-counselling platform for the Epicenter pilot school.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Satoshi (the single Epicenter typeface) is loaded via Fontshare in
  // globals.css and applied through the `font-sans` body style — no second font.
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
