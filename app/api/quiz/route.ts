import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { genre, difficulty, userApiKey } = await req.json();

    // 優先順位: 画面で入力されたキー ＞ Vercelの環境変数 GEMINI_API_KEY
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 400 });
    }

    const prompt = `あなたはクイズRPGゲームの出題AIです。
以下の条件に従って、クイズを1問作成し、指定のJSON形式のみで出力してください。Markdownの枠組み (\`\`\`json 等) や解説テキストは一切出力しないでください。

【条件】
- ジャンル: ${genre}
- 難易度: ${difficulty}
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
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: 'Gemini API Error' }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
    }

    // JSONをパース
    const quizData = JSON.parse(rawText.trim());

    return NextResponse.json(quizData);
  } catch (error) {
    console.error('Quiz Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
