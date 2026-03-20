"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  points: number;
  timeLimit: number;
  answers: Answer[];
}

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", points: 100, timeLimit: 20, answers: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]},
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, {
      text: "",
      points: 100,
      timeLimit: 20,
      answers: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updated = [...questions];
    (updated[index] as Record<string, string | number>)[field] = value;
    setQuestions(updated);
  };

  const updateAnswer = (qIndex: number, aIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].answers[aIndex].text = text;
    setQuestions(updated);
  };

  const setCorrectAnswer = (qIndex: number, aIndex: number) => {
    const updated = [...questions];
    updated[qIndex].answers.forEach((a, i) => {
      a.isCorrect = i === aIndex;
    });
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Por favor, adicione um título ao quiz");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        alert(`Por favor, preencha o texto da pergunta ${i + 1}`);
        return;
      }
      for (let j = 0; j < questions[i].answers.length; j++) {
        if (!questions[i].answers[j].text.trim()) {
          alert(`Por favor, preencha a opção ${j + 1} da pergunta ${i + 1}`);
          return;
        }
      }
      if (!questions[i].answers.some(a => a.isCorrect)) {
        alert(`Por favor, selecione a resposta correta na pergunta ${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, questions }),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar quiz");
      }

      const { id } = await res.json();

      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: id }),
      });

      if (!sessionRes.ok) {
        throw new Error("Erro ao criar sessão");
      }

      const { pin } = await sessionRes.json();
      router.push(`/game/${pin}?host=true`);
    } catch (error) {
      console.error(error);
      alert("Erro ao criar quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Criar Quiz</h1>
          <p className="text-gray-400">Adicione perguntas e respostas ao seu quiz</p>
        </div>

        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <Label className="text-lg mb-2 block">Título do Quiz</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quiz de Ciências"
              className="h-12 text-lg bg-gray-700 border-gray-600 text-white"
            />
          </CardContent>
        </Card>

        {questions.map((question, qIndex) => (
          <Card key={qIndex} className="mb-6 bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Pergunta {qIndex + 1}</CardTitle>
              {questions.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeQuestion(qIndex)}
                >
                  Remover
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Pergunta</Label>
                <Input
                  value={question.text}
                  onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                  placeholder="Digite a pergunta"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Pontos</Label>
                  <Input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value) || 100)}
                    min={10}
                    max={1000}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Tempo (segundos)</Label>
                  <Input
                    type="number"
                    value={question.timeLimit}
                    onChange={(e) => updateQuestion(qIndex, "timeLimit", parseInt(e.target.value) || 20)}
                    min={5}
                    max={120}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Respostas</Label>
                {question.answers.map((answer, aIndex) => (
                  <div key={aIndex} className="flex gap-2">
                    <button
                      onClick={() => setCorrectAnswer(qIndex, aIndex)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        answer.isCorrect
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-500 hover:border-green-400"
                      }`}
                    >
                      {answer.isCorrect && "✓"}
                    </button>
                    <Input
                      value={answer.text}
                      onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                      placeholder={`Opção ${aIndex + 1}`}
                      className="flex-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                ))}
                <p className="text-sm text-gray-400">
                  Clique no botão verde para marcar a resposta correta
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button
            onClick={addQuestion}
            variant="outline"
            className="flex-1 h-12 text-lg border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            + Adicionar Pergunta
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isSubmitting ? "Criando..." : "Iniciar Jogo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
