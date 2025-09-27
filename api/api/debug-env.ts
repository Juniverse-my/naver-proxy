import type { VercelRequest, VercelResponse } from "@vercel/node";
export default function handler(req: VercelRequest, res: VercelResponse) {
  const id = process.env.NAVER_CLIENT_ID || "";
  const sec = process.env.NAVER_CLIENT_SECRET || "";
  res.status(200).json({ hasId: !!id, idLength: id.length, hasSecret: !!sec, secretLength: sec.length });
}
