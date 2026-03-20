"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AnswerOptionProps {
  id: string;
  text: string;
  index: number;
  selected: boolean;
  disabled: boolean;
  correct?: boolean;
  showResult?: boolean;
  onClick: (id: string) => void;
}

const colors = [
  "bg-blue-500 hover:bg-blue-600",
  "bg-pink-500 hover:bg-pink-600",
  "bg-yellow-500 hover:bg-yellow-600",
  "bg-green-500 hover:bg-green-600",
];

export function AnswerOption({
  id,
  text,
  index,
  selected,
  disabled,
  correct,
  showResult,
  onClick,
}: AnswerOptionProps) {
  return (
    <button
      onClick={() => onClick(id)}
      disabled={disabled}
      className={cn(
        "w-full p-6 rounded-xl text-white text-xl font-bold transition-all duration-300 transform",
        colors[index % colors.length],
        selected && "ring-4 ring-white scale-105",
        disabled && !selected && "opacity-50",
        showResult && correct && "bg-green-600 ring-4 ring-green-300",
        showResult && selected && !correct && "bg-red-600 ring-4 ring-red-300",
        !disabled && "hover:scale-102 active:scale-95"
      )}
    >
      <span className="flex items-center gap-4">
        <span className="text-3xl font-black">{String.fromCharCode(65 + index)}</span>
        <span className="flex-1 text-left">{text}</span>
      </span>
    </button>
  );
}
