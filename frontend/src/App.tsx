import { useState } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {supabase} from "./supabase";
import api from "./api";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface BacktestResponse {
  message?: string;
  summary?: any;
  error?: string;
}

interface GenerateResponse {
  code: string;
}

type Mode = 'playground' | 'ai';

function App() {
  const [mode, setMode] = useState<Mode>('playground');

  const [ticker, setTicker] = useState("AAPL");
  const [start, setStart] = useState("2022-01-01");
  const [end, setEnd] = useState("2022-12-31");
  const [code, setCode] = useState(`result = {'example': 'strategy output here'}`);
  const [prompt, setPrompt] = useState("Buy when the 10-day SMA crosses above the 30-day SMA");

  const [output, setOutput] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000",
  });
// "https://stockplayground.onrender.com/"
  const handleRun = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      if (!token) {
      alert("You must be logged in to run a backtest");
      setLoading(false);
      return;
      }

      const res = await api.post<BacktestResponse>("/backtest", {
        code,
        ticker,
        start_date: start,
        end_date: end,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } 
    );
      setOutput(res.data);
    } catch (err: any) {
      console.error(err);
      setOutput({ error: err.response?.data?.detail || "Request failed" });
    }
    setLoading(false);
  };

  const enterAIMode = () => setMode('ai');
  const exitAIMode = () => setMode('playground');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post<GenerateResponse>("/generate", { description: prompt });
      setCode(res.data.code || "");
      setMode('playground');
    } catch (err: any) {
      console.error(err);
      alert("AI generation failed: " + (err.response?.data?.detail || err.message));
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">StockPlayground</h1>

      <div className="w-full max-w-2xl bg-white shadow p-6 rounded-lg space-y-4">
        {mode === 'playground' ? (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Playground</h2>
          <button
            onClick={enterAIMode}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Use AI to Generate Strategy
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI Strategy Generator</h2>
          <button onClick={exitAIMode} className="px-4 py-2 rounded border hover:bg-gray-50">
            Back to Playground
          </button>
        </div>
      )}

        {mode === 'ai' && (
        <>
          <textarea
            className="w-full p-2 border rounded h-28 resize-none mb-4"
            placeholder="Describe your strategy (e.g., Buy when 10-day SMA crosses 30-day SMA)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mb-2"
          >
            {generating ? "Generating..." : "Generate Strategy"}
          </button>
          <p className="text-xs text-gray-500">
            Tip: After generation, you’ll be returned to the Playground with the code pre-filled.
          </p>
        </>
      )}

        {mode === 'playground' && (
          <>
            <input
              className="w-full p-2 border rounded"
              placeholder="Ticker (e.g. AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
            <input
              className="w-full p-2 border rounded"
              placeholder="Start date (YYYY-MM-DD)"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <input
              className="w-full p-2 border rounded"
              placeholder="End date (YYYY-MM-DD)"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />

            <Editor
              height="300px"
              defaultLanguage="python"
              value={code}
              onChange={(val) => setCode(val || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                automaticLayout: true,
              }}
            />

            <button
              onClick={handleRun}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              {loading ? "Running..." : "Run Backtest"}
            </button>

            {/* Results */}
            {output && (
              <div className="mt-6 bg-gray-100 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Strategy Results</h3>
                {output.summary ? (
                  <ul className="list-disc pl-6 text-sm text-gray-800">
                    <li><strong>Sharpe Ratio:</strong> {output.summary.sharpe}</li>
                    <li><strong>Cumulative Return:</strong> {(output.summary.cumulative_return * 100).toFixed(2)}%</li>
                    <li><strong>Max Drawdown:</strong> {(output.summary.max_drawdown * 100).toFixed(2)}%</li>
                    <li><strong>Win Rate:</strong> {(output.summary.win_rate * 100).toFixed(2)}%</li>
                    <li><strong>Trading Days:</strong> {output.summary.trading_days ?? output.summary.total_days}</li>
                  </ul>
                ) : (
                  <pre className="text-red-600 whitespace-pre-wrap">{output.error}</pre>
                )}

                {output.summary?.cumulative_series && (
                  <div className="mt-6 bg-white p-4 rounded shadow">
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Cumulative Return Chart</h4>
                    <Line
                      data={{
                        labels: output.summary.cumulative_series.map((d: any) => d.date),
                        datasets: [
                          {
                            label: "Cumulative Return",
                            data: output.summary.cumulative_series.map((d: any) => d.value),
                            fill: false,
                            borderColor: "rgb(75, 192, 192)",
                            tension: 0.1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            ticks: {
                              callback: function (tickValue: string | number) {
                                if (typeof tickValue === "number") {
                                  return `${(tickValue * 100).toFixed(0)}%`;
                                }
                                return tickValue;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;



