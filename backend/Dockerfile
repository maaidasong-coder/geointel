# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install Gunicorn
RUN pip install --no-cache-dir gunicorn

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 5000

# Set environment variables (optional defaults)
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=production

# Run the app with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
