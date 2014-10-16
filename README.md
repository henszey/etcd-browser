
# etcd browser

## Demo
[http://henszey.github.io/etcd-browser/](http://henszey.github.io/etcd-browser/)

## Screen Shot
![etcd-browser Screen Shot](http://henszey.github.io/etcd-browser/images/etcdbrowser.png)

## Needs One of the following
* Start Etcd server with "-cors '*'"
* Pass through nginx/apache proxy with correct cors headers
* host on the same server as etcd

## TODO
* Implement missing features (TTL)
* Ajax Basic Auth

## To build/run as a Docker container:

(adjust options as necessary - to run it as a daemon, remove "--rm", "-t", "-i" and add "-D")

    cd <repository>
    sudo docker build -t etcd-browser .
	sudo docker run --rm --name etcd-browser -p 8000 -t -i etcd-browser
	
