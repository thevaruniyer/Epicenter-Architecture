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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
