import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignOutButton,
} from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { HydrateClient, api } from "~/trpc/server";

export default async function Home() {
	const hello = await api.post.hello({ text: "from tRPC" });
	const user = await currentUser();
	void api.post.getLatest.prefetch();
	const secret = user ? await api.post.secret() : null;

	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
						Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
					</h1>
					<div className="space-x-2 space-y-2 text-center">
						<SignedOut>
							<SignInButton>
								<button
									type="button"
									className="cursor-pointer rounded-full bg-green-300 px-10 py-3 font-bold text-black"
								>
									Sign In
								</button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<div className="space-y-2 text-center">
								<h1 className="font-bold text-2xl">
									Hello, {user?.primaryEmailAddress?.emailAddress}
								</h1>
								{secret && (
									<p className="mt-2 text-pink-300 text-sm">{secret.message}</p>
								)}
							</div>
							<SignOutButton>
								<button
									type="button"
									className="cursor-pointer rounded-full bg-orange-300 px-10 py-3 font-bold text-black"
								>
									Sign Out
								</button>
							</SignOutButton>
						</SignedIn>

						<Link href="/protected">
							<button
								type="button"
								className={`cursor-pointer rounded-full px-10 py-3 font-bold text-black ${
									user ? "bg-blue-300" : "bg-red-300"
								}`}
							>
								Go to Protected Page
							</button>
						</Link>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
							href="https://create.t3.gg/en/usage/first-steps"
							target="_blank"
						>
							<h3 className="font-bold text-2xl">First Steps →</h3>
							<div className="text-lg">
								Just the basics - Everything you need to know to set up your
								database and authentication.
							</div>
						</Link>
						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
							href="https://create.t3.gg/en/introduction"
							target="_blank"
						>
							<h3 className="font-bold text-2xl">Documentation →</h3>
							<div className="text-lg">
								Learn more about Create T3 App, the libraries it uses, and how
								to deploy it.
							</div>
						</Link>
					</div>
					<div className="flex flex-col items-center gap-2">
						<p className="text-2xl text-white">
							{hello ? hello.greeting : "Loading tRPC query..."}
						</p>
					</div>

					<LatestPost />
				</div>
			</main>
		</HydrateClient>
	);
}
