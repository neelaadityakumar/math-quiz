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
    const activeQuestions = await prisma.$queryRaw<QuestionResponse[]>`
      SELECT id, problem, active, "createdAt"
      FROM "Question"
      WHERE active = true
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    const activeQuestion = activeQuestions[0];

    if (!activeQuestion) {
      const newQuestion = generateQuestion();
      const [created] = await prisma.$queryRaw<QuestionResponse[]>`
        INSERT INTO "Question" (id, problem, answer, active, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${newQuestion.problem},
          ${newQuestion.answer},
          true,
          CURRENT_TIMESTAMP
        )
        RETURNING id, problem, active, "createdAt"
      `;

      return res.json(created);
    }

    return res.json(activeQuestion);
  } catch (error) {
    console.error("Question API Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
