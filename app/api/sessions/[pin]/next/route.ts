import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/sse";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const { pin } = await params;

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
      return NextResponse.json({ error: "Game is not active" }, { status: 400 });
    }

    await prisma.player.updateMany({
      where: { sessionId: session.id },
      data: { answered: false },
    });

    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.quiz.questions.length) {
      await prisma.gameSession.update({
        where: { pin },
        data: { status: "finished", endedAt: new Date() },
      });

      broadcast(pin, "gameEnd", {
        status: "finished",
        players: session.players.map((p) => ({
          id: p.id,
          username: p.username,
          score: p.score,
        })),
      });

      return NextResponse.json({ finished: true });
    }

    await prisma.gameSession.update({
      where: { pin },
      data: { currentIndex: nextIndex },
    });

    const nextQuestion = session.quiz.questions[nextIndex];
    const shuffledAnswers = [...nextQuestion.answers].sort(
      () => Math.random() - 0.5
    );

    broadcast(pin, "question", {
      question: {
        ...nextQuestion,
        answers: shuffledAnswers,
      },
      players: session.players.map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
      })),
    });

    return NextResponse.json({ finished: false, nextIndex });
  } catch (error) {
    console.error("Error advancing question:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
