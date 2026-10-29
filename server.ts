/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API: AI-powered student evaluation generator
app.post('/api/generate-evaluation', async (req, res) => {
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
      console.log('No GEMINI_API_KEY detected in env, returning structured template response.');
      return res.status(200).json({
        success: true,
        source: 'fallback',
        remarks: `该生在校学习态度认真，${attendanceSummary || '出勤守纪'}。${homeworkSummary || '作业完成良好'}。在测验与各项考核中表现稳步提升。建议新学期继续保持良好习惯，在口语交际和生词书写上进一步下功夫，争取更优异的表现。`,
        tags: ['学习认真', '出勤稳定', '积极进取'],
        grade: '良好'
      });
    }

    const ai = new GoogleGenAI({});

    const prompt = `你是一位教学经验丰富、观察入微且富有爱心的中文语言教师。
请根据以下真实学期表现数据，为学生撰写一份期末综合评定报告（包含综合评语、建议等第、3-4个特征标签）：

- 学生姓名：${studentName || '同学'} (${gender || '未知'})
- 考勤实况：${attendanceSummary}
- 作业收缴实况：${homeworkSummary}
- 成绩与测验：${scoresSummary}
- 教师平时课堂表现随堂记录：${behaviorNotesSummary || '暂无特殊随堂违纪或闪光记录'}

【生成要求】：
1. 评语内容：专业、诚恳、富有建设性与鼓舞性。具体提及该生在出勤、作业及考试中的亮点与需注意之处。字数在 80 ~ 140 字之间。
2. 特征标签：精准概括该生特点的 3~4 个短标签（每个标签2~4字，例如："全勤模范"、"作业全交"、"口语流利"、"需跟进作业"、"出勤待提升"等）。
3. 建议综合等第：只能输出 "优秀"、"良好"、"合格"、"待提高" 之一。

请直接返回纯 JSON 格式数据，严格按照以下 JSON Schema：
{
  "remarks": "教师综合评语文本...",
  "tags": ["标签1", "标签2", "标签3"],
  "grade": "优秀" | "良好" | "合格" | "待提高"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return res.status(200).json({
      success: true,
      source: 'gemini',
      remarks: parsed.remarks,
      tags: parsed.tags || [],
      grade: parsed.grade || '良好'
    });
  } catch (error: any) {
    console.error('Server error during Gemini API evaluation:', error);
    return res.status(200).json({
      success: true,
      source: 'fallback',
      remarks: `该生在校学习态度端正，出勤与作业按时完成，测验成绩稳定。建议在课外多加强口语表达与复习巩固，新学期力争更大突破。`,
      tags: ['态度认真', '按时交作业', '稳步进步'],
      grade: '良好'
    });
  }
});

// Mount Vite or serve static
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
