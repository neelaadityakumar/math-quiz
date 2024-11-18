import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generateQuestion } from "@/lib/questionGenerator";

type QuestionResponse = {
  id: string;
  problem: string;
  active: boolean;
  createdAt: Date;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const activeQuestion = await prisma.question.findFirst({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        problem: true,
        active: true,
        createdAt: true,
      },
    });

    if (!activeQuestion) {
      const newQuestion = generateQuestion();
      const created = await prisma.question.create({
        data: {
          problem: newQuestion.problem,
          answer: newQuestion.answer,
          active: true,
          createdAt: new Date(),
        },
        select: {
          id: true,
          problem: true,
          active: true,
          createdAt: true,
        },
      });

      return res.json(created);
    }

    return res.json(activeQuestion);
  } catch (error) {
    console.error("Question API Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
