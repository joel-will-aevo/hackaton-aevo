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

    if (session.status !== "waiting") {
      return NextResponse.json(
        { error: "Game already started" },
        { status: 400 }
      );
    }

    await prisma.gameSession.update({
      where: { pin },
      data: { status: "active", startedAt: new Date(), currentIndex: 0 },
    });

    const currentQuestion = session.quiz.questions[0];
    const shuffledAnswers = [...currentQuestion.answers].sort(
      () => Math.random() - 0.5
    );

    broadcast(pin, "gameStart", {
      status: "active",
      question: {
        ...currentQuestion,
        answers: shuffledAnswers,
      },
      players: session.players.map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
