import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/naver-trend-get
 *
 * 예시 호출:
 *   /api/naver-trend-get?startDate=2025-08-27&endDate=2025-09-27
 *     &group=부동산:부동산,아파트
 *     &group=청약:청약,무순위청약
 *
 * 쿼리 파라미터만 넣어도 JSON을 반환하므로,
 * GPT 웹 브라우징 기능이 바로 열어서 분석할 수 있음.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Only GET method is allowed" });
    }

    // 쿼리 파라미터 읽기
    const { startDate, endDate, timeUnit = "date" } = req.query as Record<string, string>;
    const groups = req.query.group; // string | string[] | undefined

    if (!startDate || !endDate || !groups) {
      return res.status(400).json({
        error: "Missing required params",
        required: "startDate, endDate, group (예: group=부동산:부동산,아파트)"
      });
    }

    // group=타이틀:키워드1,키워드2 형태 → [{ groupName, keywords }]
    const arr = Array.isArray(groups) ? groups : [groups];
    const keywordGroups = arr.map((g) => {
      const decoded = decodeURIComponent(g);
      const [name, kws = ""] = decoded.split(":");
      const keywords = kws.split(",").map(s => s.trim()).filter(Boolean);
      return { groupName: name.trim(), keywords };
    });

    // 네이버 데이터랩 API 호출
    const r = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit,
        keywordGroups
      }),
    });

    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "unknown error" });
  }
}
