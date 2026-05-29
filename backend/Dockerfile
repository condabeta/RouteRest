# Container image for the Django backend.
# Works on Koyeb, Hugging Face Spaces, Railway, Fly.io, etc.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_DEBUG=False \
    DJANGO_ALLOWED_HOSTS=* \
    CORS_ALLOW_ALL=True

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

# Hosts inject a $PORT; default to 7860 (Hugging Face Spaces) if not set.
EXPOSE 7860
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn eld_backend.wsgi:application --bind 0.0.0.0:${PORT:-7860}"]
