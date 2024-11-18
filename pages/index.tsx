import { useState, useEffect } from "react";
import Pusher from "pusher-js";

export default function Home() {
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [scores, setScores] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchQuestion();
      setupPusher();
      fetchScores();
    }
  }, [isLoggedIn]);

  const setupPusher = () => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("math-quiz");
    channel.bind("winner", (data: any) => {
      setQuestion(data.nextQuestion);
      setAnswer("");
      setMessage(`${data.winner} won! New question loaded.`);
      fetchScores();
    });

    return () => {
      pusher.unsubscribe("math-quiz");
    };
  };

  const fetchQuestion = async () => {
    const res = await fetch("/api/question");
    const data = await res.json();
    setQuestion(data);
  };

  const fetchScores = async () => {
    const res = await fetch("/api/scores");
    const data = await res.json();
    setScores(data?.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer,
        username,
        questionId: question.id,
      }),
    });

    const data = await res.json();
    setMessage(data.message);
    if (!data.correct) {
      setAnswer("");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Enter your username</h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-2 mb-4 rounded"
            placeholder="Username"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Start Playing
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h1 className="text-2xl font-bold mb-4">Math Quiz</h1>
          {message && (
            <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">
              {message}
            </div>
          )}
          {question && (
            <form onSubmit={handleSubmit}>
              <p className="text-xl mb-4">{question.problem}</p>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full border p-2 mb-4 rounded"
                placeholder="Your answer"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded"
              >
                Submit Answer
              </button>
            </form>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
          <div className="space-y-2">
            {scores &&
              scores?.map((score) => (
                <div
                  key={score.id}
                  className="flex justify-between items-center"
                >
                  <span>{score.username}</span>
                  <span>{score.score} points</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
