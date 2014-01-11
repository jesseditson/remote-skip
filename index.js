var http = require("http");
var url = require("url");
var fs = require('fs');
var applescript = require("applescript");
var exec = require('child_process').exec;
var request = require('request')

var port = process.env['PORT'] || 8888;
var address = process.env['CLIENT_ADDRESS'] || process.argv[2] || false;

process.on('uncaughtException',function(err){
  console.error("ERROR: uncaught exception",err);
});

var skipSongScript = fs.readFileSync('./scripts/skipSong.oascript',"utf-8");

http.createServer(function(request, response) {
  var uri = url.parse(request.url,true);
  var pathname = uri.pathname;
  var query = uri.query;
  if(/^\/?skip$/.test(pathname)){
    if(!query.user){
      response.writeHead(403, {"Content-Type":"application/json"});
      response.write(JSON.stringify({response : "You must identify yourself to ask to skip a song."}));
      response.end();
      return;
    }
    var script = skipSongScript.replace("$username",query.user);
    applescript.execString(script,function(err,rtn){
      if(err){
        response.writeHead(500, {"Content-Type":"application/json"});
        response.write(JSON.stringify({response : "Failed to run skip script"}));
        response.end();
        return;
      }
      var message = rtn == "true" ? "skipped" : "denied";
      response.writeHead(200, {"Content-Type":"application/json"});
      console.log(message)
      response.write(JSON.stringify({response : message}));
      response.end();
    });
  } else {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
  }
}).listen(parseInt(port, 10));

console.log("Skip server running at\n  => http://localhost:" + port + "/ using client address "+address+"\nCTRL + C to shutdown");

// set up timer to ping the server with our IP
exec('heroku apps:info',function(err,stdout,stderr){
  var urlString = process.env['SERVER_ADDRESS'] || process.argv[3] || stdout.match(/Web URL: +(.+)/)[1]
  var timer = setInterval(function(){
      if(err || stderr) return console.error("ERROR getting app name:",err || stderr);
      var info = {};
      if(address) info.address = address;
      request({
        url : urlString + "client-ping",
        qs : info
      },function(err,res,body){
        if(err) console.error("ERROR updating remote server",err)
        try {
          var response = JSON.parse(body)
        } catch(e){
          var response = {error : e.message}
        } finally {
          if(!response || response.error) console.error("ERROR error parsing client ping response: ",(response && response.error) || "Empty response.");
        }
      })
  },1000);
});