## Todo

- [ ] Активная задача
- [x] ~~Готовая задача~~

---

Для подготовки сервера к запуску:

cd server

python -m venv .venv

source .venv/Scripts/activate

pip install -r requirements.txt

Для запуска сервера

cd server

fastapi dev

https://huggingface.co/matrixportalx/gemma-4-E2B-it-Q3_K_M-GGUF/resolve/main/gemma-4-e2b-it-q3_k_m.gguf?download=true
llama-server.exe -m models/llama/gemma-4-E2B-it-Q3_K_M.gguf --host 127.0.0.1 --port 8080
fastapi dev main.py --host 0.0.0.0 --port 8000