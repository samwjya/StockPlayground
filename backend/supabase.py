import os, httpx, logging
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


async def save_strategy(user_id: str, code: str, win_rate: float):
    url = f"{SUPABASE_URL}/rest/v1/strategies"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {
        "user_id": user_id,
        "code": code,
        "win_rate": win_rate
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, json=payload)
        logging.info("Supabase response: %s %s", r.status_code, r.text)
        r.raise_for_status()
        return r.json()

