"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [joinPin, setJoinPin] = useState("");
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateQuiz = () => {
    router.push("/create-quiz");
  };

  const handleJoinGame = async () => {
    if (!joinPin.trim() || !username.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/api/sessions?pin=${joinPin}`);
      if (!res.ok) {
        alert("Sessão não encontrada");
        setIsCreating(false);
        return;
      }
      const session = await res.json();
      localStorage.setItem(`player_${joinPin}`, username);
      router.push(`/game/${joinPin}?playerId=&username=${username}`);
    } catch {
      alert("Erro ao entrar no jogo");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-4">
            KAHOOT!
          </h1>
          <p className="text-2xl text-white/80">
            Aprenda Brincando
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Criar Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6 text-center">
                Crie seu próprio quiz e compartilhe o PIN com seus amigos!
              </p>
              <Button
                onClick={handleCreateQuiz}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Criar Quiz
              </Button>
            </CardContent>
          </Card>

          <Card className="p-8 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Entrar no Jogo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seu Nome
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu nome"
                  className="h-12 text-lg"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  PIN do Jogo
                </label>
                <Input
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="h-12 text-lg text-center font-mono text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleJoinGame}
                disabled={!joinPin.trim() || !username.trim() || isCreating}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {isCreating ? "Entrando..." : "Entrar"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
