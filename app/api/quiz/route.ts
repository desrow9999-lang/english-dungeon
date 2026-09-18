import { NextResponse } from 'next/server';

interface QuizResponse {
  question: string;
  options: string[];
  answerIndex: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { genre, difficulty, userApiKey } = body;

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 400 });
    }

    const prompt = `あなたはクイズRPGゲームの出題AIです。
以下の条件に従って、クイズを1問作成し、指定のJSON形式のみで出力してください。

【条件】
- ジャンル: ${genre || 'english'}
- 難易度: ${difficulty || 'NORMAL'}
- 4択クイズ（選択肢は4つ）
- 正解のインデックスは 0, 1, 2, 3 のいずれか

【出力フォーマット】
{"question":"問題文","options":["選択肢1","選択肢2","選択肢3","選択肢4"],"answerIndex":0}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Gemini API Error' }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'Empty response' }, { status: 500 });
    }

    const quizData: QuizResponse = JSON.parse(rawText.trim());

    return NextResponse.json(quizData);
  } catch (error) {
    console.error('Quiz Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
