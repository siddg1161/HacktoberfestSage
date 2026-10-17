FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (curl for healthchecks, system libraries for Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Set default port and expose
ENV PORT=8000
EXPOSE 8000

# Start FastAPI application with uvicorn
CMD ["python", "main.py"]