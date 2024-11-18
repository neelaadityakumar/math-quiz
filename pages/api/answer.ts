import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";
import { generateQuestion } from "@/lib/questionGenerator";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { answer, username, questionId } = req.body;

    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
        active: true,
      },
    });

    if (!question) {
      return res.json({
        correct: false,
        message: "Question not found or already answered",
      });
    }

    if (question.answer === answer) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.question.update({
          where: { id: questionId },
          data: { active: false },
        });

        await tx.score.upsert({
          where: { username },
          update: { score: { increment: 10 } },
          create: { username, score: 10 },
        });

        const newQuestion = generateQuestion();
        const nextQuestion = await tx.question.create({
          data: {
            problem: newQuestion.problem,
            answer: newQuestion.answer,
            active: true,
          },
        });

        return nextQuestion;
      });

      await pusher.trigger("math-quiz", "winner", {
        winner: username,
        nextQuestion: result,
      });

      return res.json({
        correct: true,
        message: "Correct answer!",
        nextQuestion: result,
      });
    }

    return res.json({ correct: false, message: "Wrong answer" });
  } catch (error) {
    console.error("Answer API Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
