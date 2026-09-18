"use client";

import { useState, useEffect, useRef } from "react";

type Quiz = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type Level = "easy" | "normal" | "hard";

// Web Audio APIによるレトロ効果音合成エンジン（外部音声ファイル不要）
const playSE = (type: "hit" | "critical" | "damage" | "heal" | "win" | "lose") => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "hit") {
      osc.type = "square";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "critical") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "damage") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "heal") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "lose") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {
    // ブラウザの自動再生制限制限対策
  }
};

const QUIZ_DATABASE: Record<Level, Quiz[]> = {
  easy: [
    { question: "「She is ______ about her new job.」", options: ["excited", "excite", "exciting", "excitedly"], answerIndex: 0, explanation: "人の感情は過去分詞「excited」を用います。" },
    { question: "「Thank you for ______ me.」", options: ["helping", "help", "helped", "helps"], answerIndex: 0, explanation: "前置詞 for の後ろは動名詞(ing)になります。" },
    { question: "「I usually go to school ______ bus.」", options: ["by", "on", "in", "with"], answerIndex: 0, explanation: "交通手段は「by + 乗り物」で表します。" },
    { question: "「He ______ tennis every Sunday.」", options: ["plays", "play", "playing", "played"], answerIndex: 0, explanation: "三人称単数現在の主語 He には「plays」を使います。" },
    { question: "「Look ______ that beautiful painting!」", options: ["at", "on", "in", "for"], answerIndex: 0, explanation: "「～を見る」は look at を使います。" }
  ],
  normal: [
    { question: "「I am looking forward to ______ you.」", options: ["seeing", "see", "seen", "saw"], answerIndex: 0, explanation: "look forward to の to は前置詞なので動名詞(ing)が続きます。" },
    { question: "「Could you ______ me a favor?」", options: ["do", "make", "give", "take"], answerIndex: 0, explanation: "「お願いを聞いてくれますか」は do me a favor です。" },
    { question: "「It depends ______ the weather.」", options: ["on", "in", "at", "to"], answerIndex: 0, explanation: "depend on ～ で「～次第だ」の意味になります。" },
    { question: "「If I ______ rich, I would buy a yacht.」", options: ["were", "am", "will be", "have been"], answerIndex: 0, explanation: "仮定法過去では be動詞に「were」を用います。" },
    { question: "「She has been studying English ______ 3 years.」", options: ["for", "since", "during", "while"], answerIndex: 0, explanation: "期間（3年間）を表す場合は「for」を使います。" }
  ],
  hard: [
    { question: "「Hardly had I arrived ______ the rain started.」", options: ["when", "than", "after", "before"], answerIndex: 0, explanation: "Hardly ... when ~ で「～するとすぐに…した」となります。" },
    { question: "「The proposal was rejected as it was ______ unreasonable.」", options: ["utterly", "highly", "deeply", "strongly"], answerIndex: 0, explanation: "unreasonable（理不尽な）を強調する副詞は「utterly（まったく）」です。" },
    { question: "「He insisted that the meeting ______ postponed.」", options: ["be", "is", "was", "will be"], answerIndex: 0, explanation: "提案・要求を表す動詞のthat節内では動詞の原形（仮定法現在）を用います。" },
    { question: "「______ for your advice, I would have failed.」", options: ["Had it not been", "If it were not", "Were it not", "If not"], answerIndex: 0, explanation: "「Had it not been for ～」は「もし～がなかったら」の仮定法過去完了倒置形です。" }
  ]
};

const MONSTERS = [
  { name: "スライムドラゴン", emoji: "🐲", maxHp: 40 },
  { name: "ダークナイト", emoji: "⚔️", maxHp: 60 },
  { name: "魔導デーモン", emoji: "👿", maxHp: 80 },
  { name: "終界の魔王", emoji: "👑", maxHp: 100 },
  { name: "幻影の邪神", emoji: "👁️", maxHp: 130 },
  { name: "究極神ドラゴン", emoji: "🐉", maxHp: 180 }
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

  // アイテム・スキル
  const [potions, setPotions] = useState(2);
  const [specialReady, setSpecialReady] = useState(false);

  // タイマー
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState("ダンジョンに潜入した！");
  const [gameState, setGameState] = useState<"playing" | "victory" | "gameover">("playing");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const savedKey = localStorage.getItem("user_gemini_api_key");
    const activeKey = envKey || savedKey || "";
    if (activeKey) setApiKey(activeKey);

    const savedScore = localStorage.getItem("dungeon_high_score");
    if (savedScore) setHighScore(parseInt(savedScore, 10));

    fetchNextQuiz(activeKey, "normal");
  }, []);

  // カウントダウンタイマー処理
  useEffect(() => {
    if (gameState !== "playing" || loading || !quiz) return;

    setTimeLeft(15);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz, gameState, loading]);

  const handleTimeOut = () => {
    playSE("damage");
    triggerShake();
    setCombo(0);
    setSpecialReady(false);

    const nextPlayerHp = Math.max(0, playerHp - 25);
    setPlayerHp(nextPlayerHp);

    if (nextPlayerHp <= 0) {
      setGameState("gameover");
      playSE("lose");
      setMessage("💀 タイムオーバー！敵の痛恨の一撃で力尽きた…");
      return;
    }

    setMessage("⏱️ タイムオーバー！ 敵から25ダメージ！");
    fetchNextQuiz(apiKey, level);
  };

  const currentMonster = MONSTERS[monsterIndex % MONSTERS.length];

  const fetchNextQuiz = async (keyToUse: string, currentLevel: Level) => {
    setLoading(true);
    setMessage("呪文を解析中…（クイズ生成中）");

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

      if (!res.ok) throw new Error("API Limit");

      const data = await res.json();
      const generatedQuiz = JSON.parse(data.candidates[0].content.parts[0].text);
      setQuiz(generatedQuiz);
      setMessage(`${currentMonster.name} が立ちはだかる！`);
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
    if (timerRef.current) clearInterval(timerRef.current);

    if (index === quiz.answerIndex) {
      triggerShake();
      const nextCombo = combo + 1;
      setCombo(nextCombo);

      if (nextCombo >= 3) setSpecialReady(true);

      let damage = 15;
      let isCrit = nextCombo >= 3;

      if (isCrit) {
        damage = 30;
        playSE("critical");
      } else {
        playSE("hit");
      }

      const nextEnemyHp = Math.max(0, enemyHp - damage);
      setEnemyHp(nextEnemyHp);

      if (nextEnemyHp <= 0) {
        playSE("win");
        const newKillCount = killCount + 1;
        setKillCount(newKillCount);
        if (newKillCount > highScore) {
          setHighScore(newKillCount);
          localStorage.setItem("dungeon_high_score", newKillCount.toString());
        }

        setMessage(`💥 ${currentMonster.name} を撃破！次なる強敵のもとへ…`);
        setTimeout(() => {
          const nextIdx = monsterIndex + 1;
          setMonsterIndex(nextIdx);
          setEnemyHp(MONSTERS[nextIdx % MONSTERS.length].maxHp);
          fetchNextQuiz(apiKey, level);
        }, 1200);
        return;
      }

      setMessage(`⭕️ 正解！ ${damage}ダメージを与えた！`);
      fetchNextQuiz(apiKey, level);
    } else {
      playSE("damage");
      triggerShake();
      setCombo(0);
      setSpecialReady(false);
      const nextPlayerHp = Math.max(0, playerHp - 20);
      setPlayerHp(nextPlayerHp);

      if (nextPlayerHp <= 0) {
        setGameState("gameover");
        playSE("lose");
        setMessage("💀 あなたは力尽きてしまった…");
        return;
      }

      setMessage(`❌ 不正解！ 20ダメージ！ (${quiz.explanation})`);
    }
  };

  // アイテム：ポーション
  const usePotion = () => {
    if (potions <= 0 || playerHp >= 100) return;
    playSE("heal");
    setPotions((prev) => prev - 1);
    setPlayerHp((prev) => Math.min(100, prev + 40));
    setMessage("🧪 ポーションを使用！ HPが40回復した！");
  };

  // スキル：必殺技
  const useSpecialAttack = () => {
    if (!specialReady || gameState !== "playing") return;
    playSE("critical");
    triggerShake();
    setSpecialReady(false);

    const damage = 50;
    const nextEnemyHp = Math.max(0, enemyHp - damage);
    setEnemyHp(nextEnemyHp);

    if (nextEnemyHp <= 0) {
      playSE("win");
      const newKillCount = killCount + 1;
      setKillCount(newKillCount);
      if (newKillCount > highScore) {
        setHighScore(newKillCount);
        localStorage.setItem("dungeon_high_score", newKillCount.toString());
      }
      setMessage(`⚡ 必殺「アルティメットスラッシュ」！ 50ダメージで撃破！`);
      setTimeout(() => {
        const nextIdx = monsterIndex + 1;
        setMonsterIndex(nextIdx);
        setEnemyHp(MONSTERS[nextIdx % MONSTERS.length].maxHp);
        fetchNextQuiz(apiKey, level);
      }, 1200);
      return;
    }

    setMessage(`⚡ 必殺「アルティメットスラッシュ」！ 50の超極大ダメージ！`);
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
    setPotions(2);
    setSpecialReady(false);
    setGameState("playing");
    setMessage("新たな冒険が始まった！");
    fetchNextQuiz(apiKey, level);
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#070a13", color: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
      <style>{`
        @keyframes shake {
          0% { transform: translate(2px, 2px) rotate(0deg); }
          20% { transform: translate(-3px, 0px) rotate(-1deg); }
          40% { transform: translate(3px, 2px) rotate(1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          80% { transform: translate(3px, 1px) rotate(-1deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        .shake-effect { animation: shake 0.4s; }
      `}</style>

      <div style={{ maxWidth: "420px", margin: "0 auto", backgroundColor: "#1e293b", padding: "16px", borderRadius: "16px", border: "2px solid #334155", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
          <div>
            <h1 style={{ color: "#fbbf24", fontSize: "18px", margin: 0, fontWeight: "bold" }}>⚔️ 英語ダンジョン Ultimate</h1>
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

        {/* モンスター表示 */}
        <div className={isShaking ? "shake-effect" : ""} style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #dc2626", textAlign: "center", position: "relative" }}>
          <div style={{ fontSize: "48px", marginBottom: "2px" }}>{currentMonster.emoji}</div>
          <div style={{ fontWeight: "bold", fontSize: "16px", color: "#f87171", marginBottom: "6px" }}>{currentMonster.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", color: "#cbd5e1" }}>
            <span>HP</span>
            <span>{enemyHp} / {currentMonster.maxHp}</span>
          </div>
          <div style={{ width: "100%", backgroundColor: "#334155", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${(enemyHp / currentMonster.maxHp) * 100}%`, backgroundColor: "#ef4444", height: "100%", transition: "all 0.3s" }} />
          </div>
        </div>

        {/* プレイヤー＆アイテムバー */}
        <div style={{ backgroundColor: "#0f172a", padding: "12px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
            <span style={{ fontWeight: "bold", color: "#34d399" }}>🛡️ 勇者</span>
            <span style={{ color: "#fbbf24", fontWeight: "bold" }}>{combo > 1 ? `🔥 ${combo} COMBO` : ""}</span>
            <span>HP: {playerHp} / 100</span>
          </div>
          <div style={{ width: "100%", backgroundColor: "#334155", height: "10px", borderRadius: "5px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ width: `${playerHp}%`, backgroundColor: "#10b981", height: "100%", transition: "all 0.3s" }} />
          </div>

          {/* アイテム・スキルコマンド */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={usePotion}
              disabled={potions <= 0 || playerHp >= 100}
              style={{
                flex: 1,
                padding: "6px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: potions > 0 && playerHp < 100 ? "#059669" : "#334155",
                color: "#fff",
                cursor: potions > 0 ? "pointer" : "default"
              }}
            >
              🧪 ポーション ({potions})
            </button>
            <button
              onClick={useSpecialAttack}
              disabled={!specialReady}
              style={{
                flex: 1,
                padding: "6px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: specialReady ? "#d97706" : "#334155",
                color: "#fff",
                fontWeight: "bold",
                cursor: specialReady ? "pointer" : "default"
              }}
            >
              ⚡ 必殺技 {specialReady ? "READY!" : ""}
            </button>
          </div>
        </div>

        {/* 制限時間タイマーバー */}
        {gameState === "playing" && quiz && !loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", backgroundColor: "#020617", padding: "6px 12px", borderRadius: "8px", border: "1px solid #334155" }}>
            <span style={{ fontSize: "12px", color: timeLeft <= 5 ? "#ef4444" : "#94a3b8", fontWeight: "bold" }}>⏱️ 残り {timeLeft}秒</span>
            <div style={{ flex: 1, backgroundColor: "#334155", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${(timeLeft / 15) * 100}%`, backgroundColor: timeLeft <= 5 ? "#ef4444" : "#3b82f6", height: "100%", transition: "all 1s linear" }} />
            </div>
          </div>
        )}

        {/* メッセージログ */}
        <div style={{ backgroundColor: "#020617", padding: "10px", borderRadius: "8px", marginBottom: "12px", textAlign: "center", minHeight: "40px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", color: "#e2e8f0" }}>
          {message}
        </div>

        {/* クイズ領域 */}
        {gameState === "playing" && (
          <div style={{ backgroundColor: "#0f172a", padding: "16px", borderRadius: "12px", border: "1px solid #334155" }}>
            {loading ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>⚡ AIが高度な呪文を詠唱中…</p>
            ) : quiz ? (
              <>
                <p style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "14px", textAlign: "center", lineHeight: "1.4" }}>{quiz.question}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {quiz.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#1e293b",
                        color: "#fff",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                        textAlign: "left",
                        fontSize: "14px",
                        cursor: "pointer"
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

        {/* リトライボタン */}
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
      </div>
    </main>
  );
}
