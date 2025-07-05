# 📈 QuantPlayground

**QuantPlayground** is a full-stack web application that allows users to write, test, and visualize custom trading strategies using real historical market data.

It simulates quant-style backtesting workflows and is built with production-level technologies across frontend, backend, and data infrastructure.

---

## 🧠 Core Features

- Write Python trading strategies in-browser
- Backtest using real OHLCV historical stock data
- Get performance metrics: Sharpe ratio, drawdown, win rate, etc.
- Visualize trades and performance over time
- AI features (optional): Strategy explanation, code generation, coaching tips

---

## 🧱 Project Architecture

```text
[React Frontend] ←→ [FastAPI Backend] ←→ [Backtest Engine] ←→ [Historical Market Data]
        ↑                                           ↓
     Monaco Editor                            [ETL Pipeline (Airflow)]
        ↑                                           ↓
[OpenAI API (optional)]                     [DuckDB / PostgreSQL Storage]


🔧 Tech Stack
Frontend:	React, Tailwind CSS, Monaco Editor, Chart.js
Backend:	FastAPI, Python, Pydantic
Data Pipeline:	Airflow (or Prefect), yfinance / Yahoo Finance API
Database:	DuckDB (or PostgreSQL), optional: S3/COS backup
AI (optional):	OpenAI GPT-4 API
Infra:	Docker, Terraform, GitHub Actions (CI/CD), GCP or Tencent