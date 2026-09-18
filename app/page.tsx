"use client";

import { useState, useEffect } from "react";

type Quiz = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type Level = "easy" | "normal" | "hard";

// 難易度別・内蔵クイズデータベース
const QUIZ_DATABASE: Record<Level, Quiz[]> = {
  easy: [
    {
      question: "「She is ______ about her new job.」",
      options: ["excited", "excite", "exciting", "excitedly"],
      answerIndex: 0,
      explanation: "人の感情を表す場合は過去分詞「excited」を使います。"
    },
    {
      question: "「Thank you for ______ me.」",
      options: ["helping", "help", "helped", "helps"],
      answerIndex: 0,
      explanation: "前置詞 for の後ろには動名詞(ing)を置きます。"
    },
    {
      question: "「I usually go to school ______ bus.」",
      options: ["by", "on", "in", "with"],
      answerIndex: 0,
      explanation: "交通手段を表す時は「by + 乗り物」を使います。"
    },
    {
      question: "「He ______ tennis every Sunday.」",
      options: ["plays", "play", "playing", "played"],
      answerIndex: 0,
      explanation: "主語が三人称単数（He）で現在の習慣なので「plays」になります。"
    },
    {
      question: "「Look ______ that beautiful painting!」",
      options: ["at", "on", "in", "for"],
      answerIndex: 0,
      explanation: "「～を見る」は look at を使います。"
    }
  ],
  normal: [
    {
      question: "「I am looking forward to ______ you.」",
      options: ["seeing", "see", "seen", "saw"],
      answerIndex: 0,
      explanation: "look forward to の to は前置詞なので動名詞(ing)が続きます。"
    },
    {
      question: "「Could you ______ me a favor?」",
      options: ["do", "make", "give", "take"],
      answerIndex: 0,
      explanation: "「お願いを聞いてくれますか」は do me a favor と言います。"
    },
    {
      question: "「It depends ______ the weather.」",
      options: ["on", "in", "at", "to"],
      answerIndex: 0,
      explanation: "depend on ～ で「～次第だ / ～による」という意味になります。"
    },
    {
      question: "「If I ______ rich, I would buy a yacht.」",
      options: ["were", "am", "will be", "have been"],
      answerIndex: 0,
      explanation: "仮定法過去では主語に関わらず be動詞に「were」を使います。"
    },
    {
      question: "「She has been studying English ______ 3 years.」",
      options: ["for", "since", "during", "while"],
      answerIndex: 0,
      explanation: "期間（3年間）を表す場合は「for」を用います。"
    }
  ],
  hard: [
    {
      question: "「Hardly had I arrived ______ the rain started.」",
      options: ["when", "than", "after", "before"],
      answerIndex: 0,
      explanation: "Hardly ... when ~ で「～するとすぐに…した」という構文です。"
    },
    {
      question: "「The proposal was rejected as it was ______ unreasonable.」",
      options: ["utterly", "highly", "deeply", "strongly"],
      answerIndex: 0,
      explanation: "unreasonable（理不尽な）を強調する副詞は「utterly（まったく）」が最適です。"
    },
    {
      question: "「He insisted that the meeting ______ postponed.」",
      options: ["be", "is", "was", "will be"],
      answerIndex: 0,
      explanation: "提案・要求を表す動詞（insist）の後のthat節では動詞の原形（仮定法現在）を使います。"
    },
    {
      question: "「______ for your advice, I would have failed.」",
      options: ["Had it not been", "If it were not", "Were it not", "If not"],
      answerIndex: 0,
      explanation: "「Had it not been for ～」は「もし～がなかったら」の仮定法過去完了倒置形です。"
    }
  ]
};

const MONSTERS = [
  { name: "スライムドラゴン", emoji: "🐲", maxHp: 40 },
  { name: "ダークナイト", emoji: "⚔️", maxHp: 60 },
  { name: "魔導デーモン", emoji: "👿", maxHp: 80 },
  { name: "終界の魔王", emoji: "👑", maxHp: 100 }
];

export default function Home() {
  const [apiKey, setApiKey] = useState<string>("");
  const [inputKey, setInputKey] = useState<string>("");
  const [level, setLevel] = useState<Level>("normal");
  
  const [monsterIndex, setMonsterIndex] = useState(0);
  const [enemyHp, setEnemyHp] = useState(40);
  const [playerHp, setPlayerHp] = useState(100);
  const [combo, setCombo] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState("ダンジョンに潜入した！");
  const [gameState, setGameState] = useState<"playing" | "victory" | "gameover">("playing");
  const [isShaking, setIsShaking] = useState(false);

  // 初期読み込み
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const savedKey = localStorage.getItem("user_gemini_api_key");
    const activeKey = envKey || savedKey || "";
    if (activeKey) {
      setApiKey(activeKey);
    }
    const savedScore = localStorage.getItem("dungeon_high_score");
    if (savedScore) setHighScore(parseInt(savedScore, 10));

    fetchNextQuiz(activeKey, "normal");
  }, []);

  const handleSaveKey = () => {
    const key = inputKey.trim();
    localStorage.setItem("user_gemini_api_key", key);
    setApiKey(key);
    fetchNextQuiz(key, level);
  };

  const currentMonster = MONSTERS[monsterIndex % MONSTERS.length];

  const fetchNextQuiz = async (keyToUse: string, currentLevel: Level) => {
    setLoading(true);
    setMessage("呪文を唱え中…（クイズ生成中）");

    if (!keyToUse) {
      useFallbackQuiz(currentLevel);
      setLoading(false);
      return;
    }

    const prompt = `英語の4択クイズ（難易度:${currentLevel}）を1問作成。JSONフォーマットのみ出力。
{"question":"問題文","options":["選択肢1","選択肢2","選択肢3","選択肢4"],"answerIndex":0,"explanation":"解説"}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${keyToUse}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          }),
        }
      );

      if (!res.ok) throw new Error("API Limit or Error");

      const data = await res.json();
      const generatedQuiz = JSON.parse(data.candidates[0].content.parts[0].text);
      setQuiz(generatedQuiz);
      setMessage(`${currentMonster.name} が現れた！`);
    } catch {
      useFallbackQuiz(currentLevel);
    } finally {
      setLoading(false);
    }
  };

  const useFallbackQuiz = (currentLevel: Level) => {
    const pool = QUIZ_DATABASE[currentLevel];
    const randomIndex = Math.floor(Math.random() * pool.length);
    setQuiz(pool[randomIndex]);
    setMessage(`${currentMonster.name} が立ちはだかる！`);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleAnswer = (index: number) => {
    if (gameState !== "playing" || !quiz) return;

    if (index === quiz.answerIndex) {
      triggerShake();
      const nextCombo = combo + 1;
      setCombo(nextCombo);

      // クリティカル攻撃（コンボ倍率）
      let damage = 15;
      let extraMsg = "";
      if (nextCombo >= 3) {
        damage = 30;
        extraMsg = "🔥 クリティカルヒット！";
        setPlayerHp((prev) => Math.min(100, prev + 10)); // HP微回復
      }

      const nextEnemyHp = Math.max(0, enemyHp - damage);
      setEnemyHp(nextEnemyHp);

      if (nextEnemyHp <= 0) {
        // モンスター撃破！
        const newKillCount = killCount + 1;
        setKillCount(newKillCount);
        if (newKillCount > highScore) {
          setHighScore(newKillCount);
          localStorage.setItem("dungeon_high_score", newKillCount.toString());
        }

        setMessage(`💥 ${currentMonster.name} を撃破した！次の階層へ進む…`);
        setTimeout(() => {
          const nextIdx = monsterIndex + 1;
          setMonsterIndex(nextIdx);
          setEnemyHp(MONSTERS[nextIdx % MONSTERS.length].maxHp);
          fetchNextQuiz(apiKey, level);
        }, 1200);
        return;
      }

      setMessage(`⭕️ 正解！${damage}ダメージ！ ${extraMsg}`);
      fetchNextQuiz(apiKey, level);
    } else {
      triggerShake();
      setCombo(0);
      const nextPlayerHp = Math.max(0, playerHp - 20);
      setPlayerHp(nextPlayerHp);

      if (nextPlayerHp <= 0) {
        setGameState("gameover");
        setMessage("💀 あなたは力尽きてしまった…");
        return;
      }

      setMessage(`❌ 痛恨のミス！ 20ダメージを受けた！ (${quiz.explanation})`);
    }
  };

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    fetchNextQuiz(apiKey, newLevel);
  };

  const handleReset = () => {
    setMonsterIndex(0);
    setEnemyHp(MONSTERS[0].maxHp);
    setPlayerHp(100);
    setCombo(0);
    setKillCount(0);
    setGameState("playing");
    setMessage("新たなダンジョンに挑戦！");
    fetchNextQuiz(apiKey, level);
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          20% { transform: translate(-3px, 0px) rotate(-1deg); }
          40% { transform: translate(3px, 2px) rotate(1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          80% { transform: translate(3px, 1px) rotate(-1deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        .shake-effect { animation: shake 0.4s; }
      `}</style>

      <div style={{ maxWidth: "420px", margin: "0 auto", backgroundColor: "#1e293b", padding: "16px", borderRadius: "16px", border: "2px solid #334155", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
        {/* ヘッダー情報 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
          <div>
            <h1 style={{ color: "#fbbf24", fontSize: "17px", margin: 0, fontWeight: "bold" }}>⚔️ 英語ダンジョン ⚔️</h1>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>撃破数: {killCount} (最高: {highScore})</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["easy", "normal", "hard"] as Level[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: level === lvl ? "#2563eb" : "#334155",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: level === lvl ? "bold" : "normal"
                }}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* モンスター表示エリア */}
        <div className={isShaking ? "shake-effect" : ""} style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #dc2626", textAlign: "center" }}>
          <div style={{ fontSize: "42px", marginBottom: "4px" }}>{currentMonster.emoji}</div>
          <div style={{ fontWeight: "bold", fontSize: "15px", color: "#f87171", marginBottom: "6px" }}>{currentMonster.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", color: "#cbd5e1" }}>
            <span>HP</span>
            <span>{enemyHp} / {currentMonster.maxHp}</span>
          </div>
          <div style={{ width: "100%", backgroundColor: "#334155", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${(enemyHp / currentMonster.maxHp) * 100}%`, backgroundColor: "#ef4444", height: "100%", transition: "all 0.3s" }} />
          </div>
        </div>

        {/* プレイヤーHP ＆ コンボメーター */}
        <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
            <span style={{ fontWeight: "bold", color: "#34d399" }}>🛡️ 勇者 (あなた)</span>
            <span style={{ color: "#fbbf24", fontWeight: "bold" }}>{combo > 1 ? `🔥 ${combo} COMBO!` : ""}</span>
            <span>HP: {playerHp} / 100</span>
          </div>
          <div style={{ width: "100%", backgroundColor: "#334155", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${playerHp}%`, backgroundColor: "#10b981", height: "100%", transition: "all 0.3s" }} />
          </div>
        </div>

        {/* メッセージログ */}
        <div style={{ backgroundColor: "#020617", padding: "12px", borderRadius: "8px", marginBottom: "12px", textAlign: "center", minHeight: "44px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", color: "#e2e8f0", border: "1px solid #1e293b" }}>
          {message}
        </div>

        {/* クイズ・操作エリア */}
        {gameState === "playing" && (
          <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "12px", border: "1px solid #334155" }}>
            {loading ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>⚡ クイズを解読中…</p>
            ) : quiz ? (
              <>
                <p style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "14px", textAlign: "center", lineHeight: "1.4" }}>{quiz.question}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {quiz.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        backgroundColor: "#1e293b",
                        color: "#fff",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                        textAlign: "left",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.1s active"
                      }}
                    >
                      <span style={{ color: "#fbbf24", fontWeight: "bold", marginRight: "8px" }}>{idx + 1}.</span> {option}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ゲームオーバー・勝利リトライ */}
        {gameState !== "playing" && (
          <button
            onClick={handleReset}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            🔄 復活して再挑戦する
          </button>
        )}

        {/* アコーディオン風キー設定（下部に配置） */}
        <details style={{ marginTop: "16px", fontSize: "12px", color: "#64748b" }}>
          <summary style={{ cursor: "pointer", textAlign: "center" }}>⚙️ APIキーの手動設定（任意）</summary>
          <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
            <input
              type="password"
              placeholder="APIキーを入力"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #475569", backgroundColor: "#0f172a", color: "#fff" }}
            />
            <button onClick={handleSaveKey} style={{ padding: "8px 12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>保存</button>
          </div>
        </details>
      </div>
    </main>
  );
}
