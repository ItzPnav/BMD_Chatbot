FROM python:3.11

# Prevents Python from buffering logs
ENV PYTHONUNBUFFERED=1

# Create app directory
WORKDIR /app

# Copy requirements first (better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy remaining files
COPY . .

# Expose reranker port
EXPOSE 8091

# Start reranker service
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8091"]
