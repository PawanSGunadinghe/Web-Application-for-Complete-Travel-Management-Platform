// src/Pages/public/Home.js
import { useEffect, useRef, useState } from "react";
import IMG2 from "../../Assets/nt.jpg";
import IMG3 from "../../Assets/gallefort.jpg";
import IMG4 from "../../Assets/1t.jpg";
import IMG5 from "../../Assets/to.jpg";

// small hook: reveals once when element enters viewport
function useReveal(options) {
    const ref = useRef(null);
    const [show, setShow] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
            setShow(true);
            io.unobserve(el);
            }
        },
        { threshold: 0.12, rootMargin: "0px 0px -10% 0px", ...options }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [options]);
    return [ref, show];
    }

    export default function Home() {
    return (
        <div className="bg-slate-50 text-slate-900">
        {/* ===== HERO (no clipping of pill bar) ===== */}
        <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-8">
            <div className="relative rounded-3xl overflow-hidden ring-1 ring-slate-200/70 bg-slate-900">
            {/* hero image */}
            <img src={IMG2} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-slate-900/20 to-transparent" />

            {/* FIX: pill bar sits INSIDE (top-4), not negative top => no cut line */}

            {/* hero content */}
            <div className="relative z-0 grid gap-8 md:grid-cols-[1.1fr_0.9fr] items-start px-6 sm:px-10 lg:px-12 py-12 md:py-16">
                <HeroCopy />
                <Reveal>
                <SearchCard />
                </Reveal>
            </div>
            </div>
        </section>

        {/* ===== PROMO ===== */}
        <section className="px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid gap-8 md:grid-cols-2">
            <Reveal>
                <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-8 transition-transform duration-500 hover:-translate-y-1 hover:shadow-xl">
                <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-start">
                    <div>
                    <p className="text-3xl font-semibold leading-tight">
                        Limited Time Offer<br />Book Now and Save Big!
                    </p>
                    <p className="mt-3 text-slate-600 text-sm">
                        Big Promo Alert! Are you ready for adventure at an unbeatable price?
                    </p>
                    </div>
                
                    <button className="rounded-full bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-slate-800"
                    onClick={() => window.location.href = '/public-booking'}>
                    Book Now
                    </button>
                
                </div>
                </div>
            </Reveal>

            <div className="grid grid-cols-2 gap-4">
                {[
                [IMG3, "Galle Fort Tour"],
                [IMG2, "Ramadan Promo"],
                [IMG4 , "Train Discount 40%"],
                [IMG5, "Concert Night"],
                ].map(([img, title]) => (
                <Reveal key={title}>
                    <PromoTile img={img} title={title} />
                </Reveal>
                ))}
            </div>
            </div>
        </section>

        {/* ===== RECOMMENDED ===== */}
        <section className="px-4 sm:px-6 lg:px-8 pb-14">
            <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Recommended for you</span>
            <a href="/public-booking" className="text-sm text-slate-700 hover:text-slate-900">See all →</a>
            </div>

            <div className="no-scrollbar overflow-x-auto">
            <div className="flex gap-5 min-w-max">
                {[
                { img: IMG2, price: "LKR250.00" },
                { img: IMG3, price: "LKR125.00" },
                { img: IMG4, price: "LKR150.00" },
                { img: IMG5, price: "LKR790.00" },
                { img: IMG2, price: "LKR310.00" },
                ].map((c, i) => (
                <Reveal key={i}>
                    <Card img={c.img} price={c.price} />
                </Reveal>
                ))}
            </div>
            </div>
        </section>
        </div>
    );
    }

    /* ---------- Pieces ---------- */

    function HeroCopy() {
    return (
        <div className="text-white max-w-xl">
        <p className="text-3xl sm:text-4xl font-semibold leading-tight">
            Where You Get Trapped in the Beauty of the World and Unforgettable Happiness!
        </p>
        <div className="mt-6 flex items-center gap-4">
            <button className="rounded-full bg-white text-slate-900 px-5 py-2.5 font-medium transition-all hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            onClick={() => window.location.href = '/booking'}>
            Booking Now
            </button>
            <p className="max-w-sm text-sm text-white/80">
            At TripTrap, every journey is an opportunity for discovery.
            </p>
        </div>
        </div>
    );
    }


    function SearchCard() {
    // Example usage of values and setValues to avoid unused variable errors
    return null;
    }

    function PromoTile({ img, title }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <img src={img} alt="" className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <p className="text-white font-medium drop-shadow">{title}</p>
            <span className="inline-grid place-items-center h-7 w-7 rounded-full bg-white/90 text-slate-900 text-sm group-hover:bg-white transition-colors">↗</span>
        </div>
        </div>
    );
    }

    function Card({ img, price }) {
    return (
        <article className="w-64 shrink-0 rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative h-40">
            <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute right-3 top-3 rounded-full bg-white/85 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
            {price}
            </div>
        </div>
        <div className="p-4">
            <p className="text-sm text-slate-600">Scenic escape</p>
            <p className="mt-1 font-medium">Handpicked experience</p>
        </div>
        </article>
    );
    }

    // function Input({ value, onChange, type = "text", placeholder }) {
    // return (
    //     <input
    //     type={type}
    //     value={value}
    //     placeholder={placeholder}
    //     onChange={(e) => onChange?.(e.target.value)}
    //     className="w-full rounded-xl border border-slate-300/70 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
    //     />
    // );
    // }

    // function Select({ value, onChange, options = [] }) {
    // return (
    //     <select
    //     value={value}
    //     onChange={(e) => onChange?.(e.target.value)}
    //     className="w-full rounded-xl border border-slate-300/70 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
    //     >
    //     {options.map((o) => (
    //         <option key={o} value={o}>
    //         {o}
    //         </option>
    //     ))}
    //     </select>
    // );
    // }

    /* Wrap children with reveal-on-scroll (down -> up) */
    function Reveal({ children }) {
    const [ref, show] = useReveal();
    return (
        <div
        ref={ref}
        className={`transform transition duration-700 ease-out will-change-transform
            ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
        {children}
        </div>
    );
}
