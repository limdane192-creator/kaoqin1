/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3e3;
app.use(express.json());
app.post("/api/generate-evaluation", async (req, res) => {
  try {
    const {
      studentName,
      gender,
      attendanceSummary,
      homeworkSummary,
      scoresSummary,
      behaviorNotesSummary
    } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No GEMINI_API_KEY detected in env, returning structured template response.");
      return res.status(200).json({
        success: true,
        source: "fallback",
        remarks: `\u8BE5\u751F\u5728\u6821\u5B66\u4E60\u6001\u5EA6\u8BA4\u771F\uFF0C${attendanceSummary || "\u51FA\u52E4\u5B88\u7EAA"}\u3002${homeworkSummary || "\u4F5C\u4E1A\u5B8C\u6210\u826F\u597D"}\u3002\u5728\u6D4B\u9A8C\u4E0E\u5404\u9879\u8003\u6838\u4E2D\u8868\u73B0\u7A33\u6B65\u63D0\u5347\u3002\u5EFA\u8BAE\u65B0\u5B66\u671F\u7EE7\u7EED\u4FDD\u6301\u826F\u597D\u4E60\u60EF\uFF0C\u5728\u53E3\u8BED\u4EA4\u9645\u548C\u751F\u8BCD\u4E66\u5199\u4E0A\u8FDB\u4E00\u6B65\u4E0B\u529F\u592B\uFF0C\u4E89\u53D6\u66F4\u4F18\u5F02\u7684\u8868\u73B0\u3002`,
        tags: ["\u5B66\u4E60\u8BA4\u771F", "\u51FA\u52E4\u7A33\u5B9A", "\u79EF\u6781\u8FDB\u53D6"],
        grade: "\u826F\u597D"
      });
    }
    const ai = new GoogleGenAI({});
    const prompt = `\u4F60\u662F\u4E00\u4F4D\u6559\u5B66\u7ECF\u9A8C\u4E30\u5BCC\u3001\u89C2\u5BDF\u5165\u5FAE\u4E14\u5BCC\u6709\u7231\u5FC3\u7684\u4E2D\u6587\u8BED\u8A00\u6559\u5E08\u3002
\u8BF7\u6839\u636E\u4EE5\u4E0B\u771F\u5B9E\u5B66\u671F\u8868\u73B0\u6570\u636E\uFF0C\u4E3A\u5B66\u751F\u64B0\u5199\u4E00\u4EFD\u671F\u672B\u7EFC\u5408\u8BC4\u5B9A\u62A5\u544A\uFF08\u5305\u542B\u7EFC\u5408\u8BC4\u8BED\u3001\u5EFA\u8BAE\u7B49\u7B2C\u30013-4\u4E2A\u7279\u5F81\u6807\u7B7E\uFF09\uFF1A

- \u5B66\u751F\u59D3\u540D\uFF1A${studentName || "\u540C\u5B66"} (${gender || "\u672A\u77E5"})
- \u8003\u52E4\u5B9E\u51B5\uFF1A${attendanceSummary}
- \u4F5C\u4E1A\u6536\u7F34\u5B9E\u51B5\uFF1A${homeworkSummary}
- \u6210\u7EE9\u4E0E\u6D4B\u9A8C\uFF1A${scoresSummary}
- \u6559\u5E08\u5E73\u65F6\u8BFE\u5802\u8868\u73B0\u968F\u5802\u8BB0\u5F55\uFF1A${behaviorNotesSummary || "\u6682\u65E0\u7279\u6B8A\u968F\u5802\u8FDD\u7EAA\u6216\u95EA\u5149\u8BB0\u5F55"}

\u3010\u751F\u6210\u8981\u6C42\u3011\uFF1A
1. \u8BC4\u8BED\u5185\u5BB9\uFF1A\u4E13\u4E1A\u3001\u8BDA\u6073\u3001\u5BCC\u6709\u5EFA\u8BBE\u6027\u4E0E\u9F13\u821E\u6027\u3002\u5177\u4F53\u63D0\u53CA\u8BE5\u751F\u5728\u51FA\u52E4\u3001\u4F5C\u4E1A\u53CA\u8003\u8BD5\u4E2D\u7684\u4EAE\u70B9\u4E0E\u9700\u6CE8\u610F\u4E4B\u5904\u3002\u5B57\u6570\u5728 80 ~ 140 \u5B57\u4E4B\u95F4\u3002
2. \u7279\u5F81\u6807\u7B7E\uFF1A\u7CBE\u51C6\u6982\u62EC\u8BE5\u751F\u7279\u70B9\u7684 3~4 \u4E2A\u77ED\u6807\u7B7E\uFF08\u6BCF\u4E2A\u6807\u7B7E2~4\u5B57\uFF0C\u4F8B\u5982\uFF1A"\u5168\u52E4\u6A21\u8303"\u3001"\u4F5C\u4E1A\u5168\u4EA4"\u3001"\u53E3\u8BED\u6D41\u5229"\u3001"\u9700\u8DDF\u8FDB\u4F5C\u4E1A"\u3001"\u51FA\u52E4\u5F85\u63D0\u5347"\u7B49\uFF09\u3002
3. \u5EFA\u8BAE\u7EFC\u5408\u7B49\u7B2C\uFF1A\u53EA\u80FD\u8F93\u51FA "\u4F18\u79C0"\u3001"\u826F\u597D"\u3001"\u5408\u683C"\u3001"\u5F85\u63D0\u9AD8" \u4E4B\u4E00\u3002

\u8BF7\u76F4\u63A5\u8FD4\u56DE\u7EAF JSON \u683C\u5F0F\u6570\u636E\uFF0C\u4E25\u683C\u6309\u7167\u4EE5\u4E0B JSON Schema\uFF1A
{
  "remarks": "\u6559\u5E08\u7EFC\u5408\u8BC4\u8BED\u6587\u672C...",
  "tags": ["\u6807\u7B7E1", "\u6807\u7B7E2", "\u6807\u7B7E3"],
  "grade": "\u4F18\u79C0" | "\u826F\u597D" | "\u5408\u683C" | "\u5F85\u63D0\u9AD8"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return res.status(200).json({
      success: true,
      source: "gemini",
      remarks: parsed.remarks,
      tags: parsed.tags || [],
      grade: parsed.grade || "\u826F\u597D"
    });
  } catch (error) {
    console.error("Server error during Gemini API evaluation:", error);
    return res.status(200).json({
      success: true,
      source: "fallback",
      remarks: `\u8BE5\u751F\u5728\u6821\u5B66\u4E60\u6001\u5EA6\u7AEF\u6B63\uFF0C\u51FA\u52E4\u4E0E\u4F5C\u4E1A\u6309\u65F6\u5B8C\u6210\uFF0C\u6D4B\u9A8C\u6210\u7EE9\u7A33\u5B9A\u3002\u5EFA\u8BAE\u5728\u8BFE\u5916\u591A\u52A0\u5F3A\u53E3\u8BED\u8868\u8FBE\u4E0E\u590D\u4E60\u5DE9\u56FA\uFF0C\u65B0\u5B66\u671F\u529B\u4E89\u66F4\u5927\u7A81\u7834\u3002`,
      tags: ["\u6001\u5EA6\u8BA4\u771F", "\u6309\u65F6\u4EA4\u4F5C\u4E1A", "\u7A33\u6B65\u8FDB\u6B65"],
      grade: "\u826F\u597D"
    });
  }
});
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
