from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import yfinance as yf
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StrategyRequest(BaseModel):
    code: str
    ticker: str
    start_date: str
    end_date: str

@app.post("/backtest")
def backtest(request: StrategyRequest):
    print("Received request:")
    print("Ticker:", request.ticker)
    print("Start:", request.start_date)
    print("End:", request.end_date)

    try:
        df = yf.download(request.ticker, start=request.start_date, end=request.end_date)
        print("Downloaded columns:", df.columns)
        print("Downloaded data:")
        print(df.head())

        if df.empty:
            raise HTTPException(status_code=404, detail="No data returned from yfinance")

        # Handle MultiIndex columns - flatten them
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        price_column = 'Adj Close' if 'Adj Close' in df.columns else 'Close'

        df['daily_return'] = df[price_column].pct_change()
        df = df.dropna()

        if len(df) < 2:
            raise HTTPException(status_code=400, detail="Insufficient data for analysis after cleaning")

        # Execute user-defined strategy code
        local_vars = {}
        try:
            exec(request.code, {}, local_vars)
            strategy_fn = local_vars.get("strategy")
            if not strategy_fn:
                raise Exception("No function named 'strategy' was defined.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Strategy code error: {str(e)}")

        # Run strategy and calculate performance
        try:
            signal = strategy_fn(df.copy())
            if not isinstance(signal, (pd.Series, list)):
                raise Exception("strategy() must return a Series or list of booleans.")
            if len(signal) != len(df):
                raise Exception("strategy() output length doesn't match price data.")
            df["position"] = signal
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Strategy execution error: {str(e)}")

        # Strategy returns
        df["strategy_return"] = df["daily_return"] * df["position"]
        df["cumulative_return"] = (1 + df["strategy_return"]).cumprod()
        cumulative_series = [
            {"date": str(date.date()), "value": float(val)}
            for date, val in df["cumulative_return"].items()
        ]

        # Metrics
        cumulative_return = df["cumulative_return"].iloc[-1] - 1
        sharpe_ratio = df["strategy_return"].mean() / df["strategy_return"].std() * np.sqrt(252) if df["strategy_return"].std() != 0 else 0
        max_drawdown = (df["cumulative_return"] / df["cumulative_return"].cummax() - 1).min()
        win_rate = (df["strategy_return"] > 0).mean()

        result = {
            "sharpe": round(sharpe_ratio, 4),
            "cumulative_return": round(cumulative_return, 4),
            "max_drawdown": round(max_drawdown, 4),
            "win_rate": round(win_rate, 4),
            "price_column_used": price_column,
            "trading_days": len(df),
            "cumulative_series": cumulative_series
        }

        return {"message": "Backtest executed", "summary": result}

    except HTTPException:
        raise
    except Exception as e:
        print("Exception occurred:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")