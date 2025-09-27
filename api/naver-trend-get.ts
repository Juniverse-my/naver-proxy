import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Only GET method is allowed" });
    }

    // 1) 환경변수 진단
    const cid = process.env.NAVER_CLIENT_ID || "";
    const csec = process.env.NAVER_CLIENT_SECRET || "";
    if (!cid || !csec) {
      return res.status(500).json({
        error: "ENV_MISSING",
        message: "NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is empty on server.",
        hasId: !!cid,
        hasSecret: !!csec,
      });
    }

    // 2) 쿼리 파라미터 파싱
    const { startDate, endDate, timeUnit = "date" } = req.query as Record<string, string>;
    const groups = req.query.group; // string|string[]|undefined
    if (!startDate || !endDate || !groups) {
      return res.status(400).json({
        error: "Missing required params",
        required: "startDate, endDate, group (예: group=부동산:부동산,아파트)"
      });
    }

    const arr = Array.isArray(groups) ? groups : [groups];
    const keywordGroups = arr.map((g) => {
      const [name, kws = ""] = decodeURIComponent(g).split(":");
      const keywords = kws.split(",").map(s => s.trim()).filter(Boolean);
      return { groupName: name.trim(), keywords };
    });

    // 3) 네이버 호출 (응답 전문을 그대로 내려보내 진단)
    const r = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": cid,
        "X-Naver-Client-Secret": csec,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        startDate, endDate, timeUnit, keywordGroups
      }),
    });

    const text = await r.text(); // json 대신 원문을 받아 상태와 함께 전달
    return res.status(r.status).send(text);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "unknown error" });
  }
}
