import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

    const { startDate, endDate, timeUnit = "date", keywordGroups, device, ages, gender } = req.body || {};
    if (!startDate || !endDate || !keywordGroups) {
      return res.status(400).json({ error: "startDate, endDate, keywordGroups는 필수입니다." });
    }

    const r = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ startDate, endDate, timeUnit, keywordGroups, device, ages, gender })
    });

    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "unknown error" });
  }
}
