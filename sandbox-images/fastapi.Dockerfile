FROM python:3.12-slim

RUN id -u 1000 >/dev/null 2>&1 || useradd -m -u 1000 sandbox
RUN pip install --no-cache-dir fastapi uvicorn[standard] pydantic python-multipart httpx

WORKDIR /workspace
RUN chown -R 1000:1000 /workspace
USER 1000:1000

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
