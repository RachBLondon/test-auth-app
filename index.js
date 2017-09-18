var https = require("https");
var fs = require("fs");
var express = require("express");
var bodyparser = require("body-parser");
var yotisdk = require("yoti-node-sdk");
const env = require("env2")("./env.json");
const unauthorizedNationalities = require('./rules')

var app = express();

// yoti config
var sdkid = process.env.YOTI_CLIENT_SDK_ID;
var appid = process.env.APPLICATION_ID;

var keyfilepath = process.env.PRIVATE_KEY;
var yotiClient = new yotisdk(sdkid, keyfilepath);

// App config
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.set(bodyparser.urlencoded({ extended: true }));
app.set(bodyparser.json());

const userName = "User name";

app.get("/", function(req, res) {
  res.render("index", {
    userName: userName
  });
});
// APP ROUTES
app.get("/login", function(req, res) {
  res.render("login", {
    appid: appid
  });
});

app.get("/profile", function(req, res) {
  var token = req.query.token;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "No token provided!"
    });
  }

  yotiClient
    .getActivityDetails(token)
    .then(function(profile) {
      if (!profile.getOutcome()) {
        res.status(500).json({
          success: false,
          message: "Got false from getOutcome"
        });
      } else {
        var userInfo = profile.getUserProfile();
        var selfie = userInfo.selfie;
        if (unauthorizedNationalities.includes(userInfo.nationality)){
          res.send("Unauthorised")
        } else {
          res.send(userInfo.nationality)
        }

        // res.render("profile", {
        //   userInfo: userInfo,
        //   selfie: selfie,
        //   nationality: nationality
        // });
      }
    })
    .catch(function(error) {
      var prettyError = new Error(error).toString();
      res.status(500).json({
        success: false,
        message: "Unable to decrypt token :(",
        error: prettyError
      });
    });
});

// SERVER SETUP
var options = {
  key: process.env.SSL_KEY,
  cert: process.env.SSL_CERT
};

var server = https.createServer(options, app);
server.listen(3005, function() {
  console.log("The app is now running on port 3005");
});
