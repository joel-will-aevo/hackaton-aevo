import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/sse";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const { pin } = await params;
    const { username } = await request.json();

    if (!username || username.trim().length < 1) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (username.length > 20) {
      return NextResponse.json(
        { error: "Username too long (max 20 characters)" },
        { status: 400 }
      );
    }

    const session = await prisma.gameSession.findUnique({
      where: { pin },
      include: { players: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "finished") {
      return NextResponse.json(
        { error: "Game has ended" },
        { status: 400 }
      );
    }

    const existingPlayer = session.players.find(
      (p) => p.username.toLowerCase() === username.toLowerCase()
    );

    if (existingPlayer) {
      return NextResponse.json({
        playerId: existingPlayer.id,
        username: existingPlayer.username,
        score: existingPlayer.score,
        isHost: false,
      });
    }

    const player = await prisma.player.create({
      data: {
        sessionId: session.id,
        username: username.trim(),
      },
    });

    broadcast(pin, "playerJoined", {
      players: [...session.players, player].map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
      })),
    });

    return NextResponse.json({
      playerId: player.id,
      username: player.username,
      score: player.score,
      isHost: false,
    });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
