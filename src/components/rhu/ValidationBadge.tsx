//no "use client" needed - this is a pure display component, no interactivity

type Props = {
    status: string
}

// A config object - one entry per status
// Each entry has: label (display text), className (Tailwind color classes)
const config: Record<string, { label: string; className: string }> = { // lookup object. cleaner than if statements
    VALIDATED:           { label: "Validated",          className: "bg-green-100 text-green-800" },
    PENDING_VALIDATION:  { label: "Pending Validation", className: "bg-yellow-100 text-yellow-800" },
    REJECTED:            { label: "Rejected",           className: "bg-red-100 text-red-800" },
    DRAFT:               { label: "Draft",              className: "bg-gray-100 text-gray-600" },
    INACTIVE:            { label: "Inactive",           className: "bg-gray-100 text-green-600" },
}

export function ValidationBadge({ status }: Props) {
    //look up at the config for this status, fall back to a default if unknown
    const badge = config[status] ?? { label: status, className: "bg-gray-100 text-gray-600"}

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.label}
        </span>
    )
}