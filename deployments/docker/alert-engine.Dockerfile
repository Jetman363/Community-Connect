FROM python:3.12-slim
WORKDIR /app
COPY services/alert-engine/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/alert-engine/app /app/app
COPY services/alert-engine/alembic /app/alembic
COPY services/alert-engine/alembic.ini /app/alembic.ini
COPY shared/python/shared_lib /app/shared_lib
ENV PYTHONPATH=/app
EXPOSE 8060
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8060"]
