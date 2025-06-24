# Gebruik een lichte Python base image
FROM python:3.13.4-slim

# Zet werkdirectory
WORKDIR /app

# Kopieer requirements (maak requirements.txt aan zoals eerder)
COPY cmdb_app/requirements.txt .

# Installeer dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Kopieer app code
COPY /cmdb_app/ .

# Expose de poort waarop Flask draait
EXPOSE 5000

# Environment variable voor Flask app
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=production

# Run de flask app
CMD ["flask", "run"]