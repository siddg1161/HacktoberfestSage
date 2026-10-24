FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (curl for healthcheck, libgl for OpenCV CLAHE)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and langgraph config
COPY . .

# Expose port 8000 for LangGraph API server
ENV PORT=8000
EXPOSE 8000

# Start standard LangGraph Server API (compatible with @langchain/langgraph-sdk)
CMD ["langgraph", "dev", "--host", "0.0.0.0", "--port", "8000", "--no-browser", "--no-reload"]