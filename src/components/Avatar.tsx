import { Check } from "lucide-react";
import { avatarHue, initials } from "@/lib/game";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  size = 48,
  done = false,
  accent = false,
}: {
  name?: string | undefined;
  size?: number;
  done?: boolean;
  accent?: boolean;
}) {
  const hue = name ? avatarHue(name) : 20;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full font-semibold",
          accent && "ring-2 ring-primary",
        )}
        style={{
          backgroundColor: name ? `hsl(${hue} 25% 32%)` : "var(--surface-strong)",
          fontSize: size * 0.36,
        }}
      >
        {name ? initials(name) : ""}
      </div>
      {done && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-1/3 w-1/3 items-center justify-center rounded-full bg-primary">
          <Check className="h-2/3 w-2/3 text-primary-foreground" strokeWidth={4} />
        </span>
      )}
    </div>
  );
}
