FROM python:3.12-slim
WORKDIR /app
COPY services/integration-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/integration-service/app /app/app
COPY services/integration-service/alembic /app/alembic
COPY services/integration-service/alembic.ini /app/alembic.ini
COPY shared/python/shared_lib /app/shared_lib
ENV PYTHONPATH=/app
EXPOSE 8050
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8050"]
