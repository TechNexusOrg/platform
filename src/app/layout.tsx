import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "TechNexusOrg — Build Real Software. Build Real Proof.",
  description:
    "TechNexusOrg helps students and early developers move from learning to real open-source engineering experience. Verified GitHub proof of work.",
  metadataBase: new URL(process.env.APP_URL || "https://technexusorg.github.io"),
  openGraph: {
    title: "TechNexusOrg — Build Real Software. Build Real Proof.",
    description:
      "Move from learning to real open-source engineering experience. Verified GitHub proof of work.",
    siteName: "TechNexusOrg",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="flex min-h-screen flex-col bg-[#090d16] font-sans antialiased text-slate-100">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
