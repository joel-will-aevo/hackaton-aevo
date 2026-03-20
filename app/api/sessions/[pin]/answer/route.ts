import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/sse";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const { pin } = await params;
    const { playerId, answerId } = await request.json();

    if (!playerId || !answerId) {
      return NextResponse.json(
        { error: "playerId and answerId are required" },
        { status: 400 }
      );
    }

    const session = await prisma.gameSession.findUnique({
      where: { pin },
      include: {
        quiz: {
          include: {
            questions: {
              include: { answers: true },
            },
          },
        },
        players: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Game is not active" },
        { status: 400 }
      );
    }

    const player = session.players.find((p) => p.id === playerId);
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (player.answered) {
      return NextResponse.json(
        { error: "Already answered" },
        { status: 400 }
      );
    }

    const currentQuestion = session.quiz.questions[session.currentIndex];
    const selectedAnswer = currentQuestion.answers.find(
      (a) => a.id === answerId
    );

    if (!selectedAnswer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    let pointsEarned = 0;
    if (selectedAnswer.isCorrect) {
      const timeBonus = 1;
      pointsEarned = Math.round(currentQuestion.points * timeBonus);
    }

    await prisma.player.update({
      where: { id: playerId },
      data: { answered: true, score: player.score + pointsEarned },
    });

    const updatedSession = await prisma.gameSession.findUnique({
      where: { pin },
      include: {
        quiz: {
          include: {
            questions: {
              include: { answers: true },
            },
          },
        },
        players: true,
      },
    });

    broadcast(pin, "state", {
      players: updatedSession?.players.map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
        answered: p.answered,
      })),
    });

    return NextResponse.json({
      correct: selectedAnswer.isCorrect,
      pointsEarned,
      newScore: player.score + pointsEarned,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
