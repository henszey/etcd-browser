var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

var etcdHost = process.env.ETCD_HOST || '172.17.42.1';
var etcdPort = process.env.ETCD_PORT || 4001;
var serverPort = process.env.SERVER_PORT || 8000;
var publicDir = 'frontend';
var authUser = process.env.AUTH_USER;
var authPass = process.env.AUTH_PASS;

var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css"
};


http.createServer(function serverFile(req, res) {
  // authenticaton
  if(!auth(req, res)) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
    res.end('Unauthorized');
    return;
  }

  if(req.url === '/'){
    req.url = '/index.html';
  } else if(req.url.substr(0, 3) === '/v2') {
    // avoid fileExists for /v2 routes
    return proxy(req, res);
  }
  var uri = url.parse(req.url).pathname;
  var filename = path.join(process.cwd(), publicDir, uri);

  fs.exists(filename, function(exists) {
    // proxy if file does not exist
    if(!exists) return proxy(req, res);

    // serve static file if exists
    res.writeHead(200, mimeTypes[path.extname(filename).split(".")[1]]);
    fs.createReadStream(filename).pipe(res);
  });
}).listen(serverPort, function() {
  console.log('proxy /api requests to etcd on ' + etcdHost + ':' + etcdPort);
  console.log('etc-browser listening on port ' + serverPort);
});


function proxy(client_req, client_res) {
  client_req.pipe(http.request({
    hostname: etcdHost,
    port: etcdPort,
    path: client_req.url,
    method: client_req.method
  }, function(res) {
    res.pipe(client_res, {end: true});
  }, {end: true}));
}


function auth(req, res) {
  if(!authUser) return true;

  var auth = req.headers.authorization;
  if(!auth) return false;

  // malformed
  var parts = auth.split(' ');
  if('basic' != parts[0].toLowerCase()) return false;
  if(!parts[1]) return false;
  auth = parts[1];

  // credentials
  auth = new Buffer(auth, 'base64').toString();
  auth = auth.match(/^([^:]*):(.*)$/);
  if(!auth) return false;

  return (auth[1] === authUser && auth[2] === authPass)
}