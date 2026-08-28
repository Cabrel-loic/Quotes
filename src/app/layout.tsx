import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daybook — a new quote, every day",
  description: "A quiet daily quote, with room to reflect.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="ink" data-fonts="inkpaper" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
