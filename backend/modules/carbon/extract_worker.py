"""
Karbon aktivite çıkarımını (Gemini LLM çağrısı) ana FastAPI sürecinin dışında,
izole bir alt süreçte çalıştırmak için kullanılan giriş noktası.

Neden gerekli: ChatGoogleGenerativeAI çağrısı FastAPI'nin senkron endpoint'i
içinde (uvicorn'un ana asyncio event loop'una bağlı thread havuzunda)
çalıştırıldığında, art arda gelen isteklerde event-loop/bağlantı havuzu
durumu bozulup süresiz askıda kalabiliyordu — aynı çağrı bağımsız bir
Python sürecinde her zaman saniyeler içinde tamamlanıyor. Bu yüzden
api.py, bu dosyayı `python -m modules.carbon.extract_worker` ile ayrı bir
süreç olarak başlatıp stdin'den metni, stdout'tan JSON sonucu okuyor.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(dotenv_path=BACKEND_DIR / ".env")

from modules.carbon.extractor import extract_activities


def main():
    text = sys.stdin.read()
    result = extract_activities(text)
    sys.stdout.write(result.model_dump_json())
    sys.stdout.flush()


if __name__ == "__main__":
    main()
