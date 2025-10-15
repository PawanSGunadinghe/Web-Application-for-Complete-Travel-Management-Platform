import React from "react";

export default function StarRating({ value = 0, onChange, size = 22, readOnly = false }) {
    const [hover, setHover] = React.useState(0);
    const active = hover || value;

    return (
        <div className="inline-flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
            <button
            key={n}
            type="button"
            className="p-0.5"
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(n)}
            aria-label={`${n} star`}
            disabled={readOnly}
            >
            <svg width={size} height={size} viewBox="0 0 24 24" className="transition">
                <path
                d="M12 17.27 18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={n <= active ? "#FFD700" : "none"}
                stroke={n <= active ? "#FFD700" : "#D4AF37"}
                strokeWidth="1.5"
                />
            </svg>
            </button>
        ))}
        </div>
    );
}
