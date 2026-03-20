import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generatePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { quizId } = await request.json();

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { answers: true } } },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let pin = generatePIN();
    while (await prisma.gameSession.findUnique({ where: { pin } })) {
      pin = generatePIN();
    }

    const session = await prisma.gameSession.create({
      data: {
        pin,
        quizId,
        status: "waiting",
      },
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

    return NextResponse.json({ pin: session.pin, session });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin");

  if (!pin) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  try {
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

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
