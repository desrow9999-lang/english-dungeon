import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { genre = 'english', difficulty = 'NORMAL' } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    const genrePrompts: Record<string, string> = {
      english: "英単語、英文法、または英会話フレーズに関する英語クイズ",
      history: "日本史または世界史の重要な歴史的出来事・人物・年号に関する歴史クイズ",
      kanji: "難読漢字の読み方、四字熟語、ことわざに関する漢字クイズ",
      trivia: "日常生活、科学、自然、面白い世界常識に関する雑学クイズ",
      it: "ITパスポート、基本情報、Web、プログラミング基礎に関するIT・PCクイズ",
      math: "小中学生レベルの暗算、文章題、算数・数学パズルクイズ",
    };

    const targetGenre = genrePrompts[genre] || genrePrompts.english;

    const prompt = `あなたはゲームのクイズ問題作成エンジンです。
以下の条件に従って、4択クイズを1問作成してください。

【ジャンル】: ${targetGenre}
【難易度】: ${difficulty}

【絶対条件】
1. 正解は options の中に必ず1つだけ含めてください。
2. answerIndex は 0, 1, 2, 3 のいずれかの数値にしてください。
3. 余計な解説や文字は一切出力せず、以下のJSONフォーマットのみを出力してください。

{
  "question": "問題文",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "answerIndex": 0
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // JSON文字列の抽出・整形
    const cleanJson = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const quizData = JSON.parse(cleanJson);

    return NextResponse.json(quizData);
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    // フォールバック問題
    return NextResponse.json({
      question: "「織田信長」が倒れた本能寺の変が起きた年は？",
      options: ["1582年", "1600年", "1192年", "1868年"],
      answerIndex: 0,
    });
  }
}
