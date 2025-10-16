import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "md" | "sm";

const base =
    "inline-flex items-center justify-center rounded-md font-medium transition " +
    "focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed " +
    "active:translate-y-px select-none";

const variants: Record<Variant, string> = {
    primary:
        "bg-slate-900 text-white hover:bg-slate-800",
    outline:
        "border border-slate-300 bg-white hover:bg-slate-50 text-slate-900",
    ghost:
        "text-slate-700 hover:bg-slate-100",
};

const sizes: Record<Size, string> = {
    md: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-sm",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(base, variants[variant], sizes[size], "cursor-pointer", className)}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export function buttonClasses(opts?: { variant?: Variant; size?: Size; className?: string }) {
    const v = opts?.variant ?? "outline";
    const s = opts?.size ?? "md";
    return cn(base, variants[v], sizes[s], "cursor-pointer", opts?.className);
}
