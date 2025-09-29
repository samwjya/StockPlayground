#  StockPlayground

**StockPlayground** is a full-stack web application that allows users to write, test, and visualize custom trading strategies using real historical market data.

It simulates quant-style backtesting workflows and is built with production-level technologies across frontend, backend, and data infrastructure.

---

##  Core Features

- Write Python trading strategies in-browser
- Backtest using real historical stock data
- Get performance metrics: Sharpe ratio, drawdown, win rate, etc.
- Visualize trades and performance over time
- AI features:code generation

---

##  Project Architecture

```text
[React Frontend] ←→ [FastAPI Backend] ←→ [Backtest Engine] ←→ [Historical Market Data]
        ↑                                           
     Monaco Editor                           
        ↑                                            
[OpenAI API]                                   


Tech Stack
Frontend:	React, HTML, CSS, Monaco Editor, Chart.js
Backend:	FastAPI, Python, Pydantic
Data Pipeline:	yfinance / Yahoo Finance API
Database:	PostgreSQL 
AI:	        OpenAI GPT-4 API

---

#Backend
        - Backend live on Render
        - To run backend locally:       
                cd backend -> .\venv\Scripts\activate (Windows) -> uvicorn main:app --reload

Run Frontend:
cd frontend -> npm run dev