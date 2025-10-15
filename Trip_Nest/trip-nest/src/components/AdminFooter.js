import { Link } from "react-router-dom";
import IMG1 from "../Assets/TripLOGO.png";

export default function SiteFooter() {
    return (
        <footer className="relative mt-28 bg-slate-950 text-slate-300">
        {/* === CTA Card that overlaps the footer top === */}
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto flex justify-center">
            <div className="pointer-events-auto w-[90%] max-w-5xl">
            {/* Gradient border wrapper */}
            {/* <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-500 print:hidden">
                <div className="relative rounded-3xl bg-slate-900/90 backdrop-blur-md ring-1 ring-white/10 overflow-hidden"> */}
                {/* soft conic/radial glow on the right like the screenshot */}
                {/* <div
                    className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full blur-2xl opacity-40"
                    style={{
                    background:
                        "radial-gradient(60% 60% at 50% 50%, rgba(99,102,241,.55) 0%, rgba(168,85,247,.35) 40%, rgba(16,185,129,.25) 100%)",
                    }}
                />
                <div className="relative z-10 grid gap-6 p-8 sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                    <h2 className="text-3xl sm:text-4xl font-semibold text-white">
                        Find Your Next wow.
                    </h2>
                    <p className="mt-2 text-slate-300">
                        Local guides. Hidden paths. Zero guesswork.
                    </p>
                    </div>
                    <div className="flex md:justify-end">
                    <NavLink
                        to="/signup"
                        className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 font-medium text-slate-900 hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                        Get started
                    </NavLink>
                    </div> */}
                {/* </div> */}
                {/* </div>
            </div> */}
            </div>
        </div>

        {/* === Main footer surface === */}
        <div className="relative rounded-t-3xl border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-10">
            <div className="grid gap-10 md:grid-cols-4">
                {/* Brand / address */}
                <div>
                <div className="text-white text-lg font-semibold">Address</div>
                <address className="not-italic mt-4 space-y-1 text-slate-400">
                    <div>283/3/A</div>
                    <div>New Kandy Road</div>
                    <div>Malabe,Colombo</div>
                    <div>Sri Lanka</div>
                </address>
                <div className="mt-4 space-y-1">
                    <a href="tel:+9476123456" className="hover:text-white">+94 761 234 567</a>
                    <div>
                    <a href="mailto:tripnest@gmail.com" className="hover:text-white">
                        tripnest@gmail.com
                    </a>
                    </div>
                </div>
            <div className="mt-8">
                <div>
                    <img src={IMG1} alt="TripTrap Logo" className="h-20 w-auto mt-5" />
                </div>
                <div className=" border-t border-white/10 pt-6 text-sm text-slate-500">
                    © {new Date().getFullYear()} Skipmetrix. All rights reserved.
                </div>
            </div>
                </div>

                {/* Quick links */}
                <FooterCol title="Quick links" links={[
                ["Pricing", "/pricing"],
                ["Features", "/features"],
                ["About", "/about"],
                ["Blog", "/blog"],
                ["Contact", "/contact"],
                ]} />

                {/* Company */}
                <div className="print:hidden">
                <FooterCol title="Company" links={[
                ["Careers", "/careers"],
                ["Partners", "/partners"],
                ["Security", "/security"],
                ["Status", "/status"],
                ["Press", "/press"],
                ]} />
                </div>

                {/* Social / Legal */}
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-1 print:*:hidden">
                <FooterCol title="Social" links={[
                    ["X (Twitter)", "https://twitter.com"],
                    ["Facebook", "https://facebook.com"],
                    ["Instagram", "https://instagram.com"],
                    ["LinkedIn", "https://linkedin.com"],
                    ["YouTube", "https://youtube.com"],
                ]} external />
                <FooterCol title="Legal" links={[
                    ["Privacy policy", "/privacy"],
                    ["Cookie policy", "/cookies"],
                    ["Terms of service", "/terms"],
                ]} />
                </div>
            </div>

            {/* bottom bar */}
            
            </div>
        </div>
        </footer>
    );
    }

    function FooterCol({ title, links, external = false }) {
    return (
        <nav aria-label={title}>
        <h3 className="text-white font-medium">{title}</h3>
        <ul className="mt-4 space-y-2">
            {links.map(([label, href]) => (
            <li key={label}>
                {external ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:text-white transition-colors"
                >
                    {label}
                </a>
                ) : (
                <Link to={href} className="text-slate-300 hover:text-white transition-colors">
                    {label}
                </Link>
                )}
            </li>
            ))}
        </ul>
        </nav>
    );
}
