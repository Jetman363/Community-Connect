# BlueCore monorepo — default image: API Gateway
# Build other services: docker buildx bake
# Or: docker buildx build -f deployments/docker/alert-engine.Dockerfile .

FROM python:3.12-slim

WORKDIR /app

COPY gateway/service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY gateway/service/app /app/app
COPY shared/python/shared_lib /app/shared_lib

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
