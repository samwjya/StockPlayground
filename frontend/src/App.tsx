import { useState } from 'react';
import axios from 'axios';

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
        <input className="w-full p-2 border rounded" placeholder="Ticker (e.g. AAPL)" value={ticker} onChange={e => setTicker(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="Start date (YYYY-MM-DD)" value={start} onChange={e => setStart(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="End date (YYYY-MM-DD)" value={end} onChange={e => setEnd(e.target.value)} />
        <textarea className="w-full p-2 border rounded font-mono h-32" value={code} onChange={e => setCode(e.target.value)} />

        <button onClick={handleRun} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {loading ? "Running..." : "Run Backtest"}
        </button>

        {output && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );

}


  

export default App;