import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  questions: z.array(
    z.object({
      text: z.string().min(1).max(500),
      points: z.number().int().min(10).max(1000).default(100),
      timeLimit: z.number().int().min(5).max(120).default(20),
      answers: z.array(
        z.object({
          text: z.string().min(1).max(200),
          isCorrect: z.boolean(),
        })
      ).min(4).max(4),
    })
  ).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createQuizSchema.parse(body);

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        questions: {
          create: data.questions.map((q) => ({
            text: q.text,
            points: q.points,
            timeLimit: q.timeLimit,
            answers: {
              create: q.answers.map((a) => ({
                text: a.text,
                isCorrect: a.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return NextResponse.json({ id: quiz.id, quiz });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
