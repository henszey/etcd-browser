
FROM ubuntu:14.04

RUN apt-get update
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get install -y python

RUN mkdir /app
ADD . /app/

WORKDIR /app
EXPOSE 8000

CMD ["python", "-m", "SimpleHTTPServer"]
