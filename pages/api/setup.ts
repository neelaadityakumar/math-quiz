import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Create Score table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Score" (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        score INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert test data
    await prisma.$executeRaw`
      INSERT INTO "Score" (id, username, score)
      VALUES
        (gen_random_uuid()::text, 'testuser1', 10),
        (gen_random_uuid()::text, 'testuser2', 20)
      ON CONFLICT (username) DO NOTHING
    `;

    return res.json({
      success: true,
      message: "Database setup complete",
    });
  } catch (error) {
    console.error("Setup Error:", error);
    return res.status(500).json({
      success: false,
      error: error,
    });
  }
}
