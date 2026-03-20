"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  username: string;
  score: number;
}

interface ScoreboardProps {
  players: Player[];
  currentPlayerId?: string;
}

export function Scoreboard({ players, currentPlayerId }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <h2 className="text-2xl font-bold text-center mb-4">Classificação</h2>
      {sortedPlayers.map((player, index) => (
        <div
          key={player.id}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl transition-all",
            index === 0 && "bg-yellow-500/20 border-2 border-yellow-500",
            index === 1 && "bg-gray-400/20 border-2 border-gray-400",
            index === 2 && "bg-amber-600/20 border-2 border-amber-600",
            player.id === currentPlayerId && "ring-2 ring-blue-500",
            index > 2 && "bg-gray-800"
          )}
        >
          <span
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg",
              index === 0 && "bg-yellow-500 text-black",
              index === 1 && "bg-gray-300 text-black",
              index === 2 && "bg-amber-600 text-white",
              index > 2 && "bg-gray-600"
            )}
          >
            {index + 1}
          </span>
          <span className="flex-1 text-xl font-semibold truncate">
            {player.username}
            {player.id === currentPlayerId && " (você)"}
          </span>
          <span className="text-2xl font-bold">{player.score}</span>
        </div>
      ))}
    </div>
  );
}
