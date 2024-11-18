import { useState, useEffect } from "react";
import Pusher from "pusher-js";

export default function Home() {
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [scores, setScores] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
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
      pusher && pusher.unsubscribe("math-quiz");
    };
  };

  const fetchQuestion = async () => {
    try {
      const res = await fetch("/api/question");
      if (!res.ok) {
        throw new Error("Failed to fetch question");
      }
      const data = await res.json();
      setQuestion(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching question:", error);
      setMessage("Error fetching question. Please try again later.");
    }
  };

  const fetchScores = async () => {
    try {
      const res = await fetch("/api/scores");
      if (!res.ok) {
        throw new Error("Failed to fetch scores");
      }
      const data = await res.json();
      setScores(data?.data || []);
    } catch (error) {
      console.error("Error fetching scores:", error);
      setMessage("Error fetching scores. Please try again later.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer,
          username,
          questionId: question.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit answer");
      }

      const data = await res.json();
      setMessage(data.message);
      if (!data.correct) {
        setAnswer("");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setMessage("Error submitting answer. Please try again later.");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggedIn(true);
      setLoading(true);
    } else {
      setMessage("Username cannot be empty.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 to-blue-500">
        <form
          onSubmit={handleLogin}
          className="bg-white p-10 rounded-xl shadow-lg max-w-sm w-full"
        >
          <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
            Enter your username
          </h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 p-3 mb-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Username"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition duration-300"
          >
            Start Playing
          </button>
        </form>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 p-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
          <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
            Math Quiz
          </h1>
          {message && (
            <div className="mb-6 p-4 bg-blue-200 text-blue-800 rounded-lg text-center">
              {message}
            </div>
          )}
          {question && (
            <form onSubmit={handleSubmit}>
              <p className="text-xl mb-6 text-gray-700">{question.problem}</p>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full border border-gray-300 p-3 mb-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Your answer"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition duration-300"
              >
                Submit Answer
              </button>
            </form>
          )}
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Leaderboard
          </h2>
          <div className="space-y-4">
            {scores &&
              scores?.map((score) => (
                <div
                  key={score.id}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm"
                >
                  <span className="font-medium text-gray-700">
                    {score.username}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {score.score} points
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
