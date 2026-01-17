import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { ArrowLeft, Book, Globe, Link2, Users, Briefcase, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function GuidePage() {
    const t = await getTranslations();

    const sections = [
        {
            id: "expat-living",
            title: "Expat Living in Da Lat",
            icon: Globe,
            color: "text-blue-600",
            bg: "bg-blue-50",
            description: "Essential information for settling in",
            items: [
                { title: "Visa & Immigration", href: "#" },
                { title: "Housing & Rentals", href: "#" },
                { title: "Healthcare & Hospitals", href: "#" },
                { title: "Banking & Finance", href: "#" },
            ]
        },
        {
            id: "helpful-links",
            title: "Helpful Links",
            icon: Link2,
            color: "text-purple-600",
            bg: "bg-purple-50",
            description: "Curated resources for daily life",
            items: [
                { title: "Emergency Numbers", href: "#" },
                { title: "Public Transport Routes", href: "#" },
                { title: "Weather Forecasts", href: "#" },
                { title: "Government ServicesPortal", href: "#" },
            ]
        },
        {
            id: "group-directory",
            title: "Group Directory",
            icon: Users,
            color: "text-green-600",
            bg: "bg-green-50",
            description: "Connect with local communities",
            items: [
                { title: "Da Lat Expats Facebook Group", href: "#" },
                { title: "Digital Nomads Da Lat", href: "#" },
                { title: "Language Exchange Club", href: "#" },
                { title: "Hiking & Adventure Group", href: "#" },
            ]
        },
        {
            id: "services",
            title: "Services",
            icon: Briefcase,
            color: "text-orange-600",
            bg: "bg-orange-50",
            description: "Trusted local service providers",
            items: [
                { title: "Legal & Notary", href: "#" },
                { title: "Motorbike Rental & Repair", href: "#" },
                { title: "Laundry Services", href: "#" },
                { title: "Pet Care & Vets", href: "#" },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <div className="container flex h-14 max-w-7xl items-center justify-between mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm font-medium hover:text-green-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                        <h1 className="font-bold text-lg">Guide to Dalat</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-4xl mx-auto px-4 py-8 pb-24">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-6 shadow-lg shadow-green-200">
                        <Book className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3 tracking-tight text-gray-900">Welcome to Da Lat</h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        Your comprehensive handbook for living, visiting, and thriving in the City of Eternal Spring.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid gap-6 md:grid-cols-2">
                    {sections.map((section) => (
                        <Card key={section.id} className="border-none shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.bg} ${section.color} group-hover:scale-105 transition-transform duration-200`}>
                                            <section.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">{section.title}</CardTitle>
                                            <CardDescription className="text-xs text-gray-500 font-medium mt-0.5">{section.description}</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-1">
                                    {section.items.map((item, idx) => (
                                        <li key={idx}>
                                            <Link
                                                href={item.href}
                                                className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 hover:text-gray-900 transition-colors group/item"
                                            >
                                                <span>{item.title}</span>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover/item:text-gray-500 transition-colors" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <Link href="#" className={`text-sm font-medium ${section.color} hover:opacity-80 flex items-center gap-1`}>
                                        View all
                                        <ArrowLeft className="w-3 h-3 rotate-180" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer / CTA */}
                <div className="mt-16 text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-2">Have something to add?</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                        This guide is community-maintained. If you know a great local resource or service, let us know!
                    </p>
                    <Link href="#">
                        <Button variant="outline" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Submit a Resource
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
