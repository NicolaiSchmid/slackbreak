import Link from "next/link";

const principles = [
	{
		eyebrow: "Raw event receipts",
		title: "Store what Slack sent, not a cleaned-up invention.",
		body: "Slackbreak is built around append-only event capture so the archive remains portable and auditable.",
	},
	{
		eyebrow: "Mirrored file blobs",
		title: "Binary attachments leave Slack with the rest of the archive.",
		body: "Referenced files are mirrored into your own storage so your workspace can keep a durable copy outside Slack.",
	},
	{
		eyebrow: "Tenant boundaries",
		title: "Hosted does not mean mixed together.",
		body: "The system is designed around tenant-scoped workspaces, exports, and retrieval from day one.",
	},
];

const milestones = [
	"Replace the starter scaffold with a Slackbreak product shell",
	"Add Convex as the ingestion and storage backend",
	"Support Slack sign-in plus workspace connection flows",
	"Capture raw Slack events and mirror files into blob storage",
];

export default function HomePage() {
	return (
		<main className="grain-overlay min-h-screen overflow-hidden">
			<div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
				<header className="fade-rise flex items-center justify-between border-black/10 border-b pb-5">
					<div>
						<p className="font-medium text-[0.72rem] text-[color:var(--color-muted)] uppercase tracking-[0.32em]">
							Slackbreak
						</p>
						<p className="mt-2 max-w-md text-[color:var(--color-muted)] text-sm">
							An open source archive that treats Slack as an upstream event
							source, not the final home of your data.
						</p>
					</div>
					<Link
						className="rounded-full border border-black/15 bg-[color:var(--color-panel)] px-4 py-2 font-medium text-[color:var(--color-ink)] text-sm shadow-[0_10px_30px_rgba(20,18,15,0.05)] hover:-translate-y-0.5 hover:border-black/25"
						href="https://github.com/NicolaiSchmid/slackbreak"
						target="_blank"
					>
						GitHub
					</Link>
				</header>

				<section className="grid flex-1 gap-12 py-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.8fr)] lg:items-end lg:gap-14 lg:py-14">
					<div className="max-w-4xl">
						<p className="fade-rise inline-flex rounded-full border border-[color:var(--color-accent-soft)] bg-white/70 px-3 py-1 font-medium text-[color:var(--color-accent)] text-xs uppercase tracking-[0.22em]">
							Hosted multi-tenant Slack archive
						</p>
						<h1 className="fade-rise fade-rise-delay-1 mt-6 font-[family:var(--font-display)] text-6xl text-[color:var(--color-ink)] leading-[0.9] tracking-[-0.04em] sm:text-7xl lg:text-[6.8rem]">
							Keep your Slack
							<span className="block text-[color:var(--color-accent)]">
								outside Slack.
							</span>
						</h1>
						<p className="fade-rise fade-rise-delay-2 mt-6 max-w-2xl text-[color:var(--color-muted)] text-lg leading-8 sm:text-xl">
							Slackbreak captures raw Slack events, mirrors file binaries, and
							keeps the archive portable. The first version is being built as a
							hosted product with room for customer-managed Slack apps and
							self-hosting later.
						</p>

						<div className="fade-rise fade-rise-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
							<Link
								className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-ink)] px-6 py-3 font-medium text-[color:var(--color-paper)] text-sm shadow-[0_18px_35px_rgba(20,18,15,0.16)] hover:-translate-y-0.5 hover:bg-black"
								href="https://github.com/NicolaiSchmid/slackbreak"
								target="_blank"
							>
								View repository
							</Link>
							<Link
								className="inline-flex items-center justify-center rounded-full border border-black/15 bg-[color:var(--color-panel)] px-6 py-3 font-medium text-[color:var(--color-ink)] text-sm hover:-translate-y-0.5 hover:border-black/25"
								href="https://github.com/NicolaiSchmid/slackbreak/blob/main/.plans/2026-03-14-initial-architecture.md"
								target="_blank"
							>
								Read the architecture plan
							</Link>
						</div>

						<div className="fade-rise fade-rise-delay-3 mt-10 grid gap-4 md:grid-cols-3">
							{principles.map((principle) => (
								<article
									className="rounded-[1.6rem] border border-black/10 bg-[color:var(--color-panel)] p-5 shadow-[0_16px_50px_rgba(20,18,15,0.08)] backdrop-blur-sm"
									key={principle.eyebrow}
								>
									<p className="font-medium text-[color:var(--color-accent)] text-xs uppercase tracking-[0.2em]">
										{principle.eyebrow}
									</p>
									<h2 className="mt-4 font-medium text-[color:var(--color-ink)] text-xl leading-7">
										{principle.title}
									</h2>
									<p className="mt-3 text-[color:var(--color-muted)] text-sm leading-7">
										{principle.body}
									</p>
								</article>
							))}
						</div>
					</div>

					<aside className="fade-rise fade-rise-delay-2 rounded-[2rem] border border-black/10 bg-[color:var(--color-panel)] p-6 shadow-[0_25px_70px_rgba(20,18,15,0.1)] backdrop-blur-sm">
						<div className="flex items-center justify-between border-black/10 border-b pb-4">
							<div>
								<p className="font-medium text-[color:var(--color-muted)] text-xs uppercase tracking-[0.22em]">
									Current state
								</p>
								<p className="mt-2 font-[family:var(--font-display)] text-3xl text-[color:var(--color-ink)]">
									Day-zero build
								</p>
							</div>
							<span className="rounded-full border border-[color:var(--color-accent-soft)] bg-[color:var(--color-accent-soft)]/30 px-3 py-1 font-medium text-[color:var(--color-accent)] text-xs uppercase tracking-[0.16em]">
								Early
							</span>
						</div>

						<div className="mt-6">
							<p className="font-medium text-[color:var(--color-muted)] text-sm uppercase tracking-[0.18em]">
								Immediate milestones
							</p>
							<ul className="mt-4 space-y-3">
								{milestones.map((milestone, index) => (
									<li
										className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white/55 px-4 py-3"
										key={milestone}
									>
										<span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-ink)] font-medium text-[color:var(--color-paper)] text-xs">
											{index + 1}
										</span>
										<span className="text-[color:var(--color-ink)] text-sm leading-6">
											{milestone}
										</span>
									</li>
								))}
							</ul>
						</div>

						<div className="mt-6 rounded-[1.5rem] border border-black/15 border-dashed bg-[color:var(--color-paper)] px-4 py-4">
							<p className="font-medium text-[color:var(--color-muted)] text-xs uppercase tracking-[0.2em]">
								Planned ingest path
							</p>
							<p className="mt-3 text-[color:var(--color-muted)] text-sm leading-7">
								Slack sends events to Convex. Convex verifies the signature,
								persists the raw envelope, mirrors file binaries, and exposes
								the archive back to the Next.js UI for browsing and export.
							</p>
						</div>
					</aside>
				</section>
			</div>
		</main>
	);
}
