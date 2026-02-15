
# Use lightweight Python 3.11
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenBB/Pandas/Numpy
RUN apt-get update && apt-get install -y \
    build-essential \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy local requirements
COPY requirements.txt .

# Install dependencies (ignoring the commented out openbb in requirements.txt)
RUN pip install --no-cache-dir -r requirements.txt

# Install OpenBB explicitly for Cloud Run environment (where size limits are higher than Vercel)
# Using openbb-core or openbb to get the SDK
RUN pip install --no-cache-dir openbb

# Copy API code
# Copy API code and required modules
COPY tradingagents ./tradingagents
COPY api ./api

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080

# Run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
