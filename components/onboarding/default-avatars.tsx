"use client";

import { cn } from "@/lib/utils";

const DEFAULT_AVATARS = [
  { id: "pine", src: "/avatars/defaults/pine.svg", alt: "Pine tree" },
  { id: "flower", src: "/avatars/defaults/flower.svg", alt: "Flower" },
  { id: "coffee", src: "/avatars/defaults/coffee.svg", alt: "Coffee cup" },
  { id: "mountain", src: "/avatars/defaults/mountain.svg", alt: "Mountain" },
  { id: "bicycle", src: "/avatars/defaults/bicycle.svg", alt: "Bicycle" },
  { id: "abstract", src: "/avatars/defaults/abstract.svg", alt: "Abstract" },
];

interface DefaultAvatarsProps {
  selected: string | null;
  onSelect: (src: string) => void;
}

export function DefaultAvatars({ selected, onSelect }: DefaultAvatarsProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {DEFAULT_AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.src)}
          className={cn(
            "w-12 h-12 rounded-full overflow-hidden border-2 transition-all",
            "hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selected === avatar.src
              ? "border-primary ring-2 ring-primary/20"
              : "border-transparent hover:border-muted-foreground/30"
          )}
        >
          <img
            src={avatar.src}
            alt={avatar.alt}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}

export { DEFAULT_AVATARS };
