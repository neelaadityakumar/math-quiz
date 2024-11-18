import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Score = {
  id: string;
  username: string;
  score: number;
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
    const scores = await prisma.$queryRaw<Score[]>`
      SELECT id, username, score, "createdAt"
      FROM "Score"
      ORDER BY score DESC
      LIMIT 10
    `;

    return res.json({
      success: true,
      data: scores,
    });
  } catch (error) {
    console.error("Scores API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
}
