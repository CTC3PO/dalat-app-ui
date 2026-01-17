import { Construction } from "lucide-react";
import { Link } from "@/lib/i18n/routing";

export default function OrganizersPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Construction className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Organizers</h1>
                <p className="text-gray-500 mb-8">
                    We're building a directory of local event organizers. Check back soon!
                </p>
                <Link
                    href="/"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-gray-900 px-8 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                    Back to Map
                </Link>
            </div>
        </div>
    );
}
