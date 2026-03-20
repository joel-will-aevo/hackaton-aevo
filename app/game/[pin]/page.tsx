"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PINDisplay } from "@/components/pin-display";
import { AnswerOption } from "@/components/answer-option";
import { Timer } from "@/components/timer";
import { Scoreboard } from "@/components/scoreboard";

interface Player {
  id: string;
  username: string;
  score: number;
  answered?: boolean;
}

interface Answer {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  points: number;
  timeLimit: number;
  answers: Answer[];
}

interface GameState {
  status: "waiting" | "active" | "finished";
  question?: Question;
  players: Player[];
  playerId?: string;
  username?: string;
  timeRemaining?: number;
}

export default function GamePage({ params }: { params: Promise<{ pin: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHost = searchParams.get("host") === "true";

  const [pin, setPin] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: "waiting",
    players: [],
  });
  const [username, setUsername] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setPin(p.pin));
  }, [params]);

  useEffect(() => {
    if (!pin) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions?pin=${pin}`);
        if (!res.ok) throw new Error("Session not found");
        const data = await res.json();
        setSession(data);
        if (data.status === "active" && data.quiz?.questions?.[data.currentIndex]) {
          const question = data.quiz.questions[data.currentIndex];
          const shuffledAnswers = [...question.answers].sort(() => Math.random() - 0.5);
          setGameState({
            status: data.status,
            question: { ...question, answers: shuffledAnswers },
            players: data.players,
          });
        } else {
          setGameState({
            status: data.status,
            players: data.players,
          });
        }
      } catch (err) {
        setError("Sessão não encontrada");
      }
    };

    fetchSession();

    const eventSource = new EventSource(`/api/sessions/${pin}/events`);

    eventSource.addEventListener("connected", (e) => {
      console.log("Connected to SSE");
    });

    eventSource.addEventListener("playerJoined", (e) => {
      const data = JSON.parse(e.data);
      setGameState(prev => ({ ...prev, players: data.players }));
    });

    eventSource.addEventListener("gameStart", (e) => {
      const data = JSON.parse(e.data);
      setGameState({
        status: "active",
        question: data.question,
        players: data.players,
      });
    });

    eventSource.addEventListener("question", (e) => {
      const data = JSON.parse(e.data);
      setSelectedAnswer(null);
      setShowResult(false);
      setLastResult(null);
      setGameState(prev => ({
        ...prev,
        question: data.question,
        players: data.players,
      }));
    });

    eventSource.addEventListener("state", (e) => {
      const data = JSON.parse(e.data);
      setGameState(prev => ({
        ...prev,
        players: data.players,
      }));
    });

    eventSource.addEventListener("gameEnd", (e) => {
      const data = JSON.parse(e.data);
      setGameState({
        status: "finished",
        players: data.players,
      });
    });

    return () => {
      eventSource.close();
    };
  }, [pin]);

  const handleJoin = async () => {
    if (!username.trim() || !pin) return;
    try {
      const res = await fetch(`/api/sessions/${pin}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to join");
      const data = await res.json();
      setPlayerId(data.playerId);
      setGameState(prev => ({
        ...prev,
        playerId: data.playerId,
        username: data.username,
      }));
    } catch {
      alert("Erro ao entrar no jogo");
    }
  };

  const handleStart = async () => {
    try {
      await fetch(`/api/sessions/${pin}/start`, { method: "POST" });
    } catch {
      alert("Erro ao iniciar o jogo");
    }
  };

  const handleNext = async () => {
    try {
      const res = await fetch(`/api/sessions/${pin}/next`, { method: "POST" });
      const data = await res.json();
      if (data.finished) {
        setGameState(prev => ({ ...prev, status: "finished" }));
      }
    } catch {
      alert("Erro ao avançar");
    }
  };

  const handleSelectAnswer = async (answerId: string) => {
    if (selectedAnswer || !playerId) return;
    setSelectedAnswer(answerId);

    try {
      const res = await fetch(`/api/sessions/${pin}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, answerId }),
      });
      const data = await res.json();
      setLastResult({ correct: data.correct, points: data.pointsEarned });
      setShowResult(true);
    } catch {
      console.error("Error submitting answer");
    }
  };

  const handlePlayAgain = () => {
    router.push("/");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Erro</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Button onClick={() => router.push("/")} className="bg-blue-500">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  if (!isHost && !playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Entrar no Jogo</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seu Nome</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu nome"
                className="h-12 text-lg"
                maxLength={20}
              />
            </div>
            <Button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600"
            >
              Entrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {gameState.status === "waiting" && (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold mb-8">Aguardando Jogadores</h1>
          
          {isHost && (
            <>
              <div className="mb-8">
                <p className="text-gray-400 text-center mb-4">Compartilhe este PIN:</p>
                <PINDisplay pin={pin} size="large" />
              </div>
              
              <div className="w-full max-w-md mb-8">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  Jogadores ({gameState.players.length})
                </h3>
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-gray-800 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                        {player.username[0].toUpperCase()}
                      </div>
                      <span className="text-lg">{player.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={gameState.players.length === 0}
                className="h-16 px-12 text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600"
              >
                Iniciar Jogo
              </Button>
            </>
          )}

          {!isHost && (
            <>
              <PINDisplay pin={pin} size="medium" />
              <p className="text-gray-400 mt-4">Aguardando o host iniciar...</p>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  Jogadores ({gameState.players.length})
                </h3>
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-gray-800 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                        {player.username[0].toUpperCase()}
                      </div>
                      <span className="text-lg">{player.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {gameState.status === "active" && gameState.question && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">{session?.quiz?.title}</h1>
            <p className="text-gray-400">
              Pergunta {session?.currentIndex !== undefined ? session.currentIndex + 1 : 1} de {session?.quiz?.questions?.length || 0}
            </p>
          </div>

          <div className="mb-8">
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">{gameState.question.text}</h2>
              <div className="flex justify-between items-center text-lg">
                <span className="text-yellow-400 font-semibold">
                  {gameState.question.points} pontos
                </span>
                <Timer
                  timeRemaining={gameState.timeRemaining ?? gameState.question.timeLimit}
                  totalTime={gameState.question.timeLimit}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {gameState.question.answers.map((answer, index) => (
                <AnswerOption
                  key={answer.id}
                  id={answer.id}
                  text={answer.text}
                  index={index}
                  selected={selectedAnswer === answer.id}
                  disabled={!!selectedAnswer}
                  showResult={showResult}
                  correct={gameState.question!.answers.some(a => {
                    const original = session?.quiz?.questions?.[session?.currentIndex || 0]?.answers;
                    return original?.find(oa => oa.id === a.id)?.isCorrect;
                  })}
                  onClick={handleSelectAnswer}
                />
              ))}
            </div>

            {showResult && lastResult && (
              <div
                className={`text-center p-6 rounded-xl mb-8 ${
                  lastResult.correct ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                <p className="text-3xl font-bold mb-2">
                  {lastResult.correct ? "Correto!" : "Incorreto!"}
                </p>
                {lastResult.correct && (
                  <p className="text-xl text-green-400">
                    +{lastResult.points} pontos
                  </p>
                )}
              </div>
            )}

            <div className="mb-8">
              <Scoreboard
                players={gameState.players}
                currentPlayerId={playerId || undefined}
              />
            </div>

            {isHost && (
              <div className="text-center">
                <Button
                  onClick={handleNext}
                  className="h-14 px-12 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  Próxima Pergunta
                </Button>
              </div>
            )}

            {!isHost && !showResult && (
              <p className="text-center text-gray-400">
                Aguardando sua resposta...
              </p>
            )}

            {!isHost && showResult && (
              <p className="text-center text-gray-400">
                Aguardando próxima pergunta...
              </p>
            )}
          </div>
        </div>
      )}

      {gameState.status === "finished" && (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Fim de Jogo!
          </h1>
          
          <div className="mb-8 w-full max-w-md">
            <Scoreboard
              players={gameState.players}
              currentPlayerId={playerId || undefined}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handlePlayAgain}
              className="h-12 px-8 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600"
            >
              Jogar Novamente
            </Button>
            {isHost && (
              <Button
                onClick={() => router.push("/create-quiz")}
                className="h-12 px-8 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600"
              >
                Criar Novo Quiz
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
