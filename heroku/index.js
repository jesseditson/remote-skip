var http = require("http");
var url = require("url");
var request = require('request');
var async = require('async');

var port = process.env['PORT'] || process.argv[2] || 8899;
var clientPort = process.env['CLIENT_PORT'] || process.argv[3] || 8888;

var clients = {};

http.createServer(function(req, res) {
  var uri = url.parse(req.url,true);
  var pathname = uri.pathname;
  var query = uri.query;
  if(/^\/?client-ping$/.test(pathname)){
    if(query.address){
      var ip = query.address;
    } else {
      var ip = getClientIp(req);
    }
    clients[ip] = new Date().getTime();
    res.writeHead(200, {"Content-Type":"application/json"});
    res.write(JSON.stringify({response : "client ip recognized : " + ip}));
    res.end();
  } else if(/^\/?skip$/.test(pathname)){
    var ips = Object.keys(clients);
    async.map(ips,function(client,done){
      var address = /:/.test(client) ? client : client + ":" + clientPort;
      console.log("dispatching skip request to: ",address);
      request({
        url : address,
        qs : query
      },function(err,res,body){
        try {
          var response = JSON.parse(body)
        } catch(e){
          var response = {error : "error parsing response : " + e.message}
        } finally {
          done(null,response);
        }
      })
    },function(err,responses){
      if(err){
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write("Error encountered:\n",err);
        res.end();
      } else {
        res.writeHead(200, {"Content-Type":"application/json"});
        var response = {};
        ips.forEach(function(ip,idx){
          response[ip] = responses[idx];
        })
        res.write(JSON.stringify({responses : response}));
        res.end();
      }
    })
  } else {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
  }
}).listen(parseInt(port, 10));

console.log("Skip server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");

process.on('uncaughtException',function(err){
  console.error("ERROR: uncaught exception",err);
})

// snippet taken from http://catapulty.tumblr.com/post/8303749793/heroku-and-node-js-how-to-get-the-client-ip-address
function getClientIp(req) {
  var ipAddress;
  // The request may be forwarded from local web server.
  var forwardedIpsStr = req.headers['x-forwarded-for'];
  if (forwardedIpsStr) {
    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // If request was not forwarded
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};

var reaper = setInterval(function(){
  Object.keys(clients).forEach(function(client){
    if(new Date().getTime() - clients[client] > 30000){
      // remove old clients
      delete clients[client]
    }
  })
},5000)