import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stocklytics",
  description:
    "Real-time stock market analytics . Monitor market trends, analyze stock performance, and make informed investment decisions with comprehensive market data and advanced analytics tools.",
};

/**
 * Root layout component that renders the HTML document skeleton and applies global fonts and dark theme.
 *
 * Renders an <html lang="en"> element with the dark class and a <body> that sets the Geist Sans and Geist Mono font CSS variables and enables antialiasing, then renders the provided children inside the body.
 *
 * @param children - React nodes to be rendered as the application's page content
 * @returns The root React element for the application's document layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
