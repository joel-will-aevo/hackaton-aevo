"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
}

export function Timer({ timeRemaining, totalTime }: TimerProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  const isLow = timeRemaining <= 5;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (percentage / 100) * 251.2}
            className={cn(
              "transition-all duration-1000",
              isLow ? "text-red-500" : "text-blue-500"
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-3xl font-bold",
              isLow && "text-red-500 animate-pulse"
            )}
          >
            {timeRemaining}
          </span>
        </div>
      </div>
      <span className="text-sm text-gray-400">segundos</span>
    </div>
  );
}
