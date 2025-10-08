import { PricingTable } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";

export default function ProtectedPage() {
	return (
		<main className="p-6">
			<h1 className="font-bold text-2xl">Protected</h1>
			<p className="mt-2 text-gray-600 text-sm">
				You are signed in and can view this page.
			</p>
			<h2 className="my-4 font-bold text-xl">Subscription Plans</h2>
			<PricingTable />
		</main>
	);
}
