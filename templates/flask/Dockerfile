FROM python:3.11-slim

WORKDIR /workspace

RUN useradd -u 1000 -m forgeuser
USER forgeuser
ENV PATH="/home/forgeuser/.local/bin:${PATH}"

COPY --chown=forgeuser:forgeuser requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

EXPOSE 8000

CMD ["python", "app.py"]
