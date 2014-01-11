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
    clients[getClientIp(req)] = true
    response.writeHead(200, {"Content-Type":"application/json"});
    response.write(JSON.stringify({response : "client recognized."}));
    response.end();
  } else if(/^\/?skip$/.test(pathname)){
    var ips = Object.keys(clients);
    async.map(ips,function(client,done){
      request({
        url : client + ":" + clientPort,
        qs : query
      },function(err,res,body){
        try {
          var response = JSON.parse(body)
        } catch(e){
          var response = {error : e}
        } finally {
          done(null,response);
        }
      })
    },function(err,responses){
      if(err){
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write("Error encountered:\n",err);
        response.end();
      } else {
        response.writeHead(200, {"Content-Type":"application/json"});
        var response = {};
        ips.forEach(function(ip,idx){
          response[ip] = responses[idx];
        })
        response.write(JSON.stringify({responses : responses}));
        response.end();
      }
    })
  } else {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
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
  var forwardedIpsStr = req.header('x-forwarded-for'); 
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