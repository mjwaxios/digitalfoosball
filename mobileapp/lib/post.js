var https = require('https');

var tweet = "TESTING HOOKS"
var slackStruct = {
    text: tweet,
    channel: "#geo",
    username: "geo-bot",
    icon_emoji: ":monkey:"
};
var slackText = JSON.stringify(slackStruct);

var options = {
    host: "hooks.slack.com",
    port: 443,
    path: "/CUSTOM_PATH",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": slackText.length
    }
};

var sendSlack = function(doc) {
    var req = https.request(options, function(res) {
        console.log("STATUS: " + res.statusCode);
        console.log("HEADERS: " + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on("data", function (chunk) {
            console.log("BODY: " + chunk);
        });
    });
    req.write(doc);
    req.end();
};

try {
    console.log(slackText);
    sendSlack(slackText);

} catch(err) {
    console.log('error: '+err);
}

