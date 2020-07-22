const express = require("express");
const app = express();
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function makeRankResponse(members) {
  var string = "";
  for (var i = 0; i < members.length; i++) {
    let info = await getPlayerInfo(members[i]);
    console.log(info);
    if (info.cRank !== info.rank) {
      string = string.concat(info.name + "'s rank need to be changed to " + info.rank + ", it is currently " + info.cRank + "\n");
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
      info.gexp = getGexp(item.expHistory);
      info.uuid = item.uuid;
      info.cRank = item.rank;
      let rank;
      if (
        "Guild Master" === info.cRank ||
        "Co-Founder" === info.cRank ||
        "Staff" === info.cRank
      ) {
        rank = info.cRank;
      } else if (info.gexp < 125000) {
        rank = "Initiate";
      } else if (info.gexp < 175000) {
        rank = "Experienced";
      } else if (info.gexp >= 175000) {
        rank = "Krypt GOD";
      }
      info.rank = rank;
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
      var resultObject = await search(id, json.guild.members);
      if (resultObject === undefined) {
        return res.send(
          "Error: Player is not in the krypton guild."
        );
      }
      var sum = getGexp(resultObject.expHistory);
      var rank;
      if (sum < 125000) {
        rank = "Initiate";
      } else if (sum >= 125000 && sum < 175000) {
        rank = "Experienced";
      } else if (sum >= 175000) {
        rank = "Krypt GOD";
      }
      if (
        "Guild Master" === resultObject.rank ||
        "Co-Founder" === resultObject.rank ||
        "Staff" === resultObject.rank
      ) {
        res.send(
          " [Staff] " +
            name +
            "'s guild stats:  Gexp Rank: " +
            rank +
            ", Weekly gexp: " +
            numberWithCommas(sum)
        );
      } else if (rank === resultObject.rank) {
        res.send(
          
            name +
            "'s guild stats:  Rank: " +
            rank +
            ", Weekly gexp: " +
            numberWithCommas(sum)
        );
      } else {
        res.send(
          name +
            "'s guild stats:  Rank: " +
            rank +
            " (Is currently " +
            resultObject.rank +
            ", needs to be updated), Weekly gexp: " +
            numberWithCommas(sum)
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
      for (var i = 0; i < members.length; i++) {
        let info = await getPlayerInfo(members[i]);
        console.log(info);
        if (info.cRank !== info.rank) {
          string = string.concat(info.name + "'s rank need to be changed to " + info.rank + ", it is currently " + info.cRank + "\n");
        }
      }
      if (string !== undefined) res.send(string);
      else res.send("Everyone has correct ranks!");
      });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
