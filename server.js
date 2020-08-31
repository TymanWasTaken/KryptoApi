const express = require("express");
const app = express();
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
var differenceInMonths = require('date-fns/differenceInMonths');
var utcToZonedTime = require('date-fns-tz/utcToZonedTime');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function makeRankResponse(members) {
  var string = "";
  for (var i = 0; i < members.length; i++) {
    let info = await getPlayerInfo(members[i]);
    console.log(info);
    if (info.currentRank !== info.correctRank) {
      string = string.concat(info.name + "'s rank need to be changed to " + info.correctRank + ", it is currently " + info.currentRank + "\n");
    }
  }
  console.log(string);
  if (string !== undefined) return string;
  else return "Everyone has correct ranks!";
}

function search(nameKey, myArray) {
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].uuid === nameKey) {
      return myArray[i];
    }
  }
}
function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
function getGexp(expHistory) {
  return Object.values(expHistory).reduce(function(a, b) {
    return a + b;
  }, 0);
}
async function getApi() {
  var response;
  fetch(
    "https://api.hypixel.net/guild?key=0263b520-7895-4f37-84c1-033d04bde642&id=5ef336138ea8c950b6cb73f2"
  )
    .then(res => res.json())
    .then(async json => {
    response = json;
  });
  return response;
};
async function getPlayerInfo(item) {
  var info = {e: 1};
  await fetch("https://playerdb.co/api/player/minecraft/" + item.uuid)
    .then(res => res.json())
    .then(json => {
      info.name = json.data.player.username;
      info.uuid = item.uuid;
      info.currentRank = item.rank;
      let rank;
      let months = differenceInMonths(utcToZonedTime(new Date(), 'America/New_York'), utcToZonedTime(new Date(item.joined), 'America/New_York'));
      if (
        "Guild Master" === info.currentRank ||
        "Co-Owner" === info.currentRank ||
        "Officer" === info.currentRank
      ) {
        rank = info.currentRank;
      } else if (months < 1) {
        rank = "Trial Member";
      } else if (months >= 1 && months < 3) {
        rank = "Trusted";
      } else if (months >= 3) {
        rank = "Senior Member";
      }
      info.correctRank = rank;
      info.months = months
    });
    return info;
}

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", async (req, res) => {
  var id;
  var name;
  if (req.query.name === undefined) {
    return res.send(" Error: Must Specify player");
  }
  await fetch("https://playerdb.co/api/player/minecraft/" + req.query.name)
    .then(res => res.json())
    .then(json => {
      if (json.code !== "player.found") {
        return res.send(" Error: Player does not exist");
      }
      id = json.data.player.raw_id;
      name = json.data.player.username;
    });
  fetch(
    "https://api.hypixel.net/guild?key=0263b520-7895-4f37-84c1-033d04bde642&id=5ef336138ea8c950b6cb73f2"
  )
    .then(res => res.json())
    .then(async json => {
      var player = await search(id, json.guild.members);
      if (player === undefined) {
        return res.send(
          "Error: Player is not in the krypton guild."
        );
      }
      var info = getPlayerInfo(player);
      if (
        "Guild Master" === info.correctRank ||
        "Co-Owner" === info.correctRank ||
        "Officer" === info.correctRank
      ) {
        res.send(
          " [Staff] " +
            name +
            "'s guild stats:  Time Rank: " +
            info.correctRank +
            ", Months in guild: " +
            info.months
        );
      } else if (info.correctRank === info.currentRank) {
        res.send(
          " " +
            name +
            "'s guild stats:  Rank: " +
            info.correctRank +
            ", Months in guild: " +
            info.months
        );
      } else {
        res.send(
          " " +
          name +
            "'s guild stats:  Rank: " +
            info.correctRank +
            " (Is currently " +
            info.currentRank +
            ", needs to be updated), Months in guild: " +
            info.months
        );
      }
    });
});
app.get("/ranks", async (req, res) => {
  var e = res;
  fetch(
    "https://api.hypixel.net/guild?key=0263b520-7895-4f37-84c1-033d04bde642&id=5ef336138ea8c950b6cb73f2" 
  )
    .then(res => res.json())
    .then(async json => {
      var members = json.guild.members;
      var string = "";
      res.writeHead(200, "200 Found, Streaming response",
        {
          'Content-Type': 'text/html; charset=utf-8'
        }
      );
      for (var i = 0; i < members.length; i++) {
        let info = await getPlayerInfo(members[i]);
        if (info.currentRank !== info.correctRank) {
          string = string.concat(info.name + "'s rank needs to be changed to " + info.correctRank + ", it is currently " + info.currentRank + "<br><br>");
          res.write(info.name + "'s rank needs to be changed to " + info.correctRank + ", it is currently " + info.currentRank + "<br><br>")
        }
      }
      if (string === undefined) {
        res.send("Everyone has correct ranks!");
      }
      res.end();
      });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
