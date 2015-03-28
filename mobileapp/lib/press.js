var sys = require("util"),
    https = require("https"),
    OAuth= require("oauth"),
    mustache = require("mustache"),
    config = require("./config").config,
    locales = require("./locales").locales,
    te = require("./tableevents").TableEvents;


var sendSlack = function(doc, options) {
    var req = https.request(options, function(res) {
        sys.debug("STATUS: " + res.statusCode);
        sys.debug("HEADERS: " + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on("data", function (chunk) {
            sys.debug("BODY: " + chunk);
        });
    });
    req.write(doc);
    req.end();
};

te.subscribe("referee:openingwhistle", function(game) {

    var quickgame = game.players.home.length === 0,
        players = {
            home: quickgame ? config.scoreboard.home : game.players.home.join(" " + locales.global['concat'] + " "),
            visitors: quickgame ? config.scoreboard.visitors : game.players.visitors.join(" " + locales.global['concat'] + " ")
        }

    var data = {
        quickgame: quickgame,
        players: players,
    };

    var slackmsg = mustache.to_html(locales.press.slack["start"], data);
    var slackStruct = {
        text: slackmsg,
        channel: config.slack.channel,
        username: config.slack.user,
        icon_emoji: config.slack.emoji
    };

    var slackText = JSON.stringify(slackStruct);

    var options = {
        host: config.slack.host,
        port: config.slack.port,
        path: config.slack.path,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": slackText.length
        }
    };

    try {
        sys.debug(slackText);
        sendSlack(slackText, options);

    } catch(err) {
        sys.debug('error: '+err);
    }
});



te.subscribe("referee:finalwhistle", function(game) {

    var goals = game.goals.reduce(function(prev, curr) {++prev[curr.scorer]; return prev; }, {home: 0, visitors: 0}),
        home_won = goals.home > goals.visitors;
    goals.winner = home_won ? goals.home : goals.visitors;
    goals.loser = !home_won ? goals.home : goals.visitors;

    var data = {
        players: {
          winner: (home_won ? game.players.home : game.players.visitors).join(" " + locales.global['concat'] + " "),
          loser: (!home_won ? game.players.home : game.players.visitors).join(" " + locales.global['concat'] + " ")
        },
        goals: goals
    }
    var slackmsg = mustache.to_html(locales.press.slack.end[[game.players.home.concat(game.players.visitors).length, "players"].join("")], data);
    sys.debug(slackmsg);
    var slackStruct = {
        text: slackmsg,
        channel: config.slack.channel,
        username: config.slack.user,
        icon_emoji: config.slack.emoji
    };

    var slackText = JSON.stringify(slackStruct);

    var options = {
        host: config.slack.host,
        port: config.slack.port,
        path: config.slack.path,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": slackText.length
        }
    };

    try {
        sys.debug(slackText);
        sendSlack(slackText, options);

    } catch(err) {
        sys.debug('error: '+err);
    }
});



te.subscribe("referee:finalwhistle", function(game) {
  if(!config.twitter) { return; }

  var goals = game.goals.reduce(function(prev, curr) {++prev[curr.scorer]; return prev; }, {home: 0, visitors: 0}),
      home_won = goals.home > goals.visitors;
  goals.winner = home_won ? goals.home : goals.visitors;
  goals.loser = !home_won ? goals.home : goals.visitors;

  var data = {
        id: new Date(game.start).getTime(),
        players: {
          winner: (home_won ? game.players.home : game.players.visitors).join(" " + locales.global['concat'] + " "),
          loser: (!home_won ? game.players.home : game.players.visitors).join(" " + locales.global['concat'] + " ")
        },
        goals: goals,
        hashtags: config.twitter.hashtags || []
      },
      tweet = mustache.to_html(locales.press.tweet[[game.players.home.concat(game.players.visitors).length, "players"].join("")], data);
      sys.debug(tweet);

  var oauth = null;

  try {
    oauth = new OAuth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      config.twitter.consumerKey,
      config.twitter.consumerSecret,
      '1.0A',
      null,
      'HMAC-SHA1'
    );

  } catch(err) {
      sys.debug('error: '+err);
  }

  try {
    oauth.post(
      'https://api.twitter.com/1.1/statuses/update.json?trim_user=true',
      config.twitter.accessToken,
      config.twitter.accessTokenSecret,
      {"status": tweet},
      function(error, data, response) {
      if (error) {
        sys.debug(data);
        sys.debug(sys.inspect(error));
        te.publish("press:wrote", "-1");
      } else {
        sys.debug(data);
        te.publish("press:wrote", "https://twitter.com/#!/" + config.twitter.userId + "/status/" + JSON.parse(data).id_str);
      }
    }); 

  } catch(err) {
      sys.debug('error: '+err);
  }

});

te.subscribe("referee:openingwhistle", function(game) {
  var players = game.players.home.concat(game.players.visitors).filter(function(player) { return player.charAt(0) === "@"; }).map(function(player) { return player.substring(1); }),
      avatars = {},
      fetchedTwitterers = 0;

  var fetchFromTwitter = function(p) {
    var opts = {
      host: "twitter.com",
      port: 80,
      path: ["/users/", ".json"].join(p)
    },
    buffer = "";

    http.get(opts, function(res) {
      res.on("data", function(chunk) {
        buffer += chunk;
      });
      res.on("end", function() {
        try {
          avatars["@" + p] = JSON.parse(buffer).profile_image_url;
        } catch(e) {
          sys.debug("Could not fetch the avatar of @" + p);
        }

        if (players.length == ++fetchedTwitterers) {
          te.publish("press:avatars", avatars);
        }
      });
    });
  };

  players.forEach(function(player) {
    fetchFromTwitter(player);
  });
});

