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
            df.columns = df.columns.droplevel(1)  # Remove ticker level, keep price level
        
        # Use Close price (Adj Close might not be available)
        price_column = 'Adj Close' if 'Adj Close' in df.columns else 'Close'
        
        df['daily_return'] = df[price_column].pct_change()
        df = df.dropna()

        # Check if we have sufficient data after cleaning
        if len(df) < 2:
            raise HTTPException(status_code=400, detail="Insufficient data for analysis after cleaning")

        cumulative_return = (df[price_column].iloc[-1] / df[price_column].iloc[0]) - 1
        
        # Safe Sharpe ratio calculation
        daily_return_std = np.std(df['daily_return'])
        if daily_return_std == 0:
            sharpe_ratio = 0
        else:
            sharpe_ratio = np.mean(df['daily_return']) / daily_return_std * np.sqrt(252)
        
        cum_returns = (1 + df['daily_return']).cumprod()
        rolling_max = cum_returns.cummax()
        drawdown = cum_returns / rolling_max - 1
        max_drawdown = drawdown.min()
        win_rate = (df['daily_return'] > 0).mean()

        result = {
            "sharpe": round(sharpe_ratio, 4),
            "cumulative_return": round(cumulative_return, 4),
            "max_drawdown": round(max_drawdown, 4),
            "win_rate": round(win_rate, 4),
            "price_column_used": price_column,
            "total_days": len(df)
        }

        return {
            "message": "Backtest executed",
            "summary": result
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Exception occurred:", str(e)) 
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")