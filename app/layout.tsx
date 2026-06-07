import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { SessionProvider } from "./SessionProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Libertad National High School - Senior High Scheduling",
  description: "Class scheduling system for Libertad National High School Senior High School",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
