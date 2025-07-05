from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import yfinance as yf


app = FastAPI()

class StrategyRequest(BaseModel):
    code: str 
    ticker: str 
    start_date: str
    end_date: str

@app.post("/backtest")
def backtest(request: StrategyRequest):
    #fetch data
    try:
        df = yf.download(request.ticker, start=request.start_date, end = request.end_date)
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found in the given range")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

    #environment

    local_env = {"df": df.copy(), "pd": pd}
    try:
        exec(request.code, {}, local_env)
        result = local_env.get("result", {})

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error in strategy code: {str(e)}")
    
    #return result
    return {
        "message": "Backtest executed",
        "summary": result
    }
