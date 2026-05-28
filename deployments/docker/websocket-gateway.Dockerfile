FROM python:3.12-slim
WORKDIR /app
COPY services/websocket-gateway/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/websocket-gateway/app /app/app
COPY shared/python/shared_lib /app/shared_lib
ENV PYTHONPATH=/app
EXPOSE 8061
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8061"]
