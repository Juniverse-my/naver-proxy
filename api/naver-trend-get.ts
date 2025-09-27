import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { startDate, endDate, group } = req.query;

  const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      timeUnit: "date",
      keywordGroups: Array.isArray(group)
        ? group.map((g) => {
            const [title, keywords] = g.split(":");
            return { groupName: title, keywords: keywords.split(",") };
          })
        : [],
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
