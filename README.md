docker build -t cmdb-flask-app .
docker run -p 5000:5000 cmdb-flask-app


docker run -p 5000:5000 -v /pad/naar/je/facts:/app/facts cmdb-flask-app


# Via Docker compose:
docker-compose up --build