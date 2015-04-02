var url = require('url');
var path = require('path');
var fs = require('fs');
var http = require('http');

var ca_file = process.env.ETCDCTL_CA_FILE || false;
var key_file = process.env.ETCDCTL_KEY_FILE || false;
var cert_file = process.env.ETCDCTL_CERT_FILE || false;

var requester = http.request;
if(cert_file) {
  // use https requests if theres a cert file
  var https = require('https');
  requester = https.request;

  if(!fs.existsSync(cert_file)) {
    console.error('CERT FILE', cert_file, 'not found!');
    process.exit(1);
  }
  if(!fs.existsSync(key_file)) {
    console.error('KEY FILE', key_file, 'not found!');
    process.exit(1);
  }
  if(!fs.existsSync(ca_file)) {
    console.error('CA FILE', ca_file, 'not found!');
    process.exit(1);
  }
}

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
  var opts = {
    hostname: etcdHost,
    port: etcdPort,
    path: client_req.url,
    method: client_req.method
  };

  // https/certs supprt
  if(cert_file) {
    opts.key = fs.readFileSync(key_file);
    opts.ca = fs.readFileSync(ca_file);
    opts.cert = fs.readFileSync(cert_file);
  }

  client_req.pipe(requester(opts, function(res) {
    // if etcd returns that the requested  page  has been moved
    // to a different location, indicates that the node we are
    // querying is not the leader. This will redo the request
    // on the leader which is reported by the Location header
    if (res.statusCode === 307) {
        opts.hostname = url.parse(res.headers['location']).hostname;
        client_req.pipe(requester(opts, function(res) {
            console.log('Got response: ' + res.statusCode);
            res.pipe(client_res, {end: true});
        }, {end: true}));
    } else {
        res.pipe(client_res, {end: true});
    }
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
