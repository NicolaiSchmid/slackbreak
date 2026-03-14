import "@/styles/globals.css";

import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";

export const metadata: Metadata = {
	title: "Slackbreak",
	description:
		"Raw-first Slack archiving with hosted multi-tenancy, mirrored files, and portable exports.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-cormorant",
});

const plex = IBM_Plex_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-plex-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${cormorant.variable} ${plex.variable}`} lang="en">
			<body>{children}</body>
		</html>
	);
}
