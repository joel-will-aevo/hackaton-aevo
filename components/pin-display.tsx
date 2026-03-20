"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PINDisplayProps {
  pin: string;
  size?: "small" | "medium" | "large";
}

export function PINDisplay({ pin, size = "medium" }: PINDisplayProps) {
  return (
    <div className={cn("flex gap-2 font-mono font-bold", {
      "text-2xl": size === "small",
      "text-4xl": size === "medium",
      "text-6xl": size === "large",
    })}>
      {pin.split("").map((digit, index) => (
        <span
          key={index}
          className="w-12 h-16 md:w-16 md:h-24 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white shadow-lg"
        >
          {digit}
        </span>
      ))}
    </div>
  );
}
