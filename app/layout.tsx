import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookhub — Your next chapter",
  description: "Discover books, audiobooks, video books, and articles selected around your interests.",
  applicationName: "Bookhub",
  themeColor: "#080d18",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}