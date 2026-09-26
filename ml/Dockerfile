FROM python:3.10-slim

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate the model locally before building.
# RUN python train.py

# Create a non-root user and hand over ownership of the app directory
RUN useradd -m -u 10014 appuser && chown -R appuser:appuser /usr/src/app

USER 10014

EXPOSE 5000
CMD ["python", "app.py"]