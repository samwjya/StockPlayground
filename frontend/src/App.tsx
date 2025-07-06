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

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
    <h1 className="text-3xl font-bold mb-6 text-blue-700">QuantPlayground</h1>

    <div className="w-full max-w-2xl bg-white shadow p-6 rounded-lg space-y-4">
      <input
        className="w-full p-2 border rounded"
        placeholder="Ticker (e.g. AAPL)"
        value={ticker}
        onChange={e => setTicker(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded"
        placeholder="Start date (YYYY-MM-DD)"
        value={start}
        onChange={e => setStart(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded"
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
        onClick={handleRun}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Running..." : "Run Backtest"}
      </button>

      {output && (
        <div className="mt-4 p-4 bg-gray-100 rounded w-full">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">📊 Strategy Results</h2>

          {output.summary ? (
            <ul className="list-disc pl-6 text-sm text-gray-800">
              <li><strong>Sharpe Ratio:</strong> {output.summary.sharpe}</li>
              <li><strong>Cumulative Return:</strong> {(output.summary.cumulative_return * 100).toFixed(2)}%</li>
              <li><strong>Max Drawdown:</strong> {(output.summary.max_drawdown * 100).toFixed(2)}%</li>
              <li><strong>Win Rate:</strong> {(output.summary.win_rate * 100).toFixed(2)}%</li>
              <li><strong>Trading Days:</strong> {output.summary.trading_days ?? output.summary.total_days}</li>
            </ul>
          ) : (
            <pre className="text-sm whitespace-pre-wrap text-red-600">{output.error}</pre>
          )}

          {output.summary?.cumulative_series && (
            <div className="mt-6 bg-white rounded p-4 shadow">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">📈 Cumulative Return Chart</h2>
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
  </div>
);
}


  

export default App;