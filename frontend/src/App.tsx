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

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface BacktestResponse {
  message?: string;
  summary?: any;
  error?: string;
}

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [start, setStart] = useState("2022-01-01");
  const [end, setEnd] = useState("2022-12-31");
  const [code, setCode] = useState(`result = {'example': 'strategy output here'}`);
  const [output, setOutput] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await axios.post<BacktestResponse>("http://localhost:8000/backtest", {
        code,
        ticker,
        start_date: start,
        end_date: end,
      });
      setOutput(res.data);
    } catch (err: any) {
      console.error(err);
      setOutput({ error: err.response?.data?.detail || "Request failed" });
    }
    setLoading(false);
  };

  interface GenerateResponse {
    code: string;
  }
  const handleGenerate = async () => {
    try {
      const res = await axios.post<GenerateResponse>("http://localhost:8000/generate", {
        description: "Buy when the 10-day SMA crosses above the 30-day SMA",
      });
      const aiCode = res.data.code;
      setCode(aiCode);  
    } catch (err: any) {
      console.error(err);
      alert("AI generation failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="app-container">
      <h1>QuantPlayground</h1>

      <input
        className="input"
        placeholder="Ticker (e.g. AAPL)"
        value={ticker}
        onChange={e => setTicker(e.target.value)}
      />
      <input
        className="input"
        placeholder="Start date (YYYY-MM-DD)"
        value={start}
        onChange={e => setStart(e.target.value)}
      />
      <input
        className="input"
        placeholder="End date (YYYY-MM-DD)"
        value={end}
        onChange={e => setEnd(e.target.value)}
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
        onClick={handleGenerate}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-2"
      >
        Generate Strategy with AI
      </button>

      <button onClick={handleRun} disabled={loading}>
        {loading ? "Running..." : "Run Backtest"}
      </button>

      {output && (
        <div className="results-box">
          <h2>📊 Strategy Results</h2>

          {output.summary ? (
            <ul>
              <li><strong>Sharpe Ratio:</strong> {output.summary.sharpe}</li>
              <li><strong>Cumulative Return:</strong> {(output.summary.cumulative_return * 100).toFixed(2)}%</li>
              <li><strong>Max Drawdown:</strong> {(output.summary.max_drawdown * 100).toFixed(2)}%</li>
              <li><strong>Win Rate:</strong> {(output.summary.win_rate * 100).toFixed(2)}%</li>
              <li><strong>Trading Days:</strong> {output.summary.trading_days ?? output.summary.total_days}</li>
            </ul>
          ) : (
            <pre>{output.error}</pre>
          )}

          {output.summary?.cumulative_series && (
            <div className="chart-box">
              <h2>📈 Cumulative Return Chart</h2>
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
    </div>
  );
}

export default App;
