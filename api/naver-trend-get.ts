import type { VercelRequest, VercelResponse } from "@vercel/node";

// 문자열 보정
function ensureString(v: any): string {
  if (Array.isArray(v)) return String(v[0] ?? "");
  return typeof v === "string" ? v : String(v ?? "");
}

// group 파라미터 파싱: group=그룹명:키워드1,키워드2 (여러 개 가능)
function parseGroups(query: any) {
  const raw = query.group
    ? Array.isArray(query.group)
      ? query.group
      : [query.group]
    : [];
  const groups = raw
    .map((item: any) => ensureString(item))
    .map((s: string) => {
      const [groupName, keywordsStr = ""] = s.split(":");
      const keywords = keywordsStr
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      return { groupName: groupName?.trim(), keywords };
    })
    .filter((g) => g.groupName && g.keywords.length > 0);

  return groups;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Use GET" });
    }

    const startDate = ensureString(req.query.startDate);
    const endDate = ensureString(req.query.endDate);
    const groups = parseGroups(req.query);

    if (!startDate || !endDate || groups.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing required query", got: { startDate, endDate, groups } });
    }

    const body = {
      startDate,
      endDate,
      timeUnit: "date",
      keywordGroups: groups,
    };

    const resp = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID ?? "",
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET ?? "",
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();

    // 네이버에서 4xx/5xx 주면 본문 그대로 반환 (크래시 방지)
    if (!resp.ok) {
      console.error("NAVER_ERROR", resp.status, text);
      // 네이버가 보내준 본문을 그대로 전달 (디버그에 도움)
      return res.status(resp.status).send(text);
    }

    // 성공: JSON 파싱 후 반환
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      // 혹시 JSON이 아니면 문자열 그대로
      return res.status(200).send(text);
    }
  } catch (err: any) {
    console.error("SERVER_ERROR", err);
    return res.status(500).json({ error: "server_error", message: String(err?.message ?? err) });
  }
}
