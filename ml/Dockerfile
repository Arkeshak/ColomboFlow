FROM python:3.10-slim

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate the model locally before building.
# RUN python train.py

EXPOSE 5000
CMD ["python", "app.py"]
