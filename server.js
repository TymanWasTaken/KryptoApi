// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", async (req, res) => {
  var id;
  var name;
  if (req.query.name === undefined) {
    return res.send("[DetonatorMod] Error: Must Specify player");
  }
  await fetch("https://playerdb.co/api/player/minecraft/" + req.query.name)
    .then(res => res.json())
    .then(json => {
      if (json.code !== "player.found") {
        return res.send("[DetonatorMod] Error: Player does not exist");
      }
      id = json.data.player.raw_id;
      name = json.data.player.username;
      console.log(id);
    });
  fetch(
    "https://api.hypixel.net/guild?key=" +
      process.env.HYPIXEL_API_KEY +
      "&name=Detonator"
  )
    .then(res => res.json())
    .then(async json => {
      var resultObject = await search(id, json.guild.members);
      if (resultObject === undefined) {
        return res.send(
          "[DetonatorMod] Error: Player is not in the detonator guild."
        );
      }
      var sum = Object.values(resultObject.expHistory).reduce(function(a, b) {
        return a + b;
      }, 0);
      var rank;
      var meetsReqs;
      if (sum < 125000) {
        rank = "Trainee";
      } else if (sum >= 125000 && sum < 175000) {
        rank = "Bomber";
      } else if (sum >= 175000) {
        rank = "Detonator";
      }
      if (sum >= 100000) {
        meetsReqs = ", Meets guild requirements!";
      } else {
        meetsReqs = ", Does not meet guild requirements.";
      }
      if (
        "Guild Master" === resultObject.rank ||
        "Co-Founder" === resultObject.rank ||
        "Staff" === resultObject.rank
      ) {
        res.send(
          "[DetonatorMod] [Staff] " +
            name +
            "'s guild stats:  Gexp Rank: " +
            rank +
            ", Weekly gexp: " +
            numberWithCommas(sum) +
            meetsReqs
        );
      } else if (rank === resultObject.rank) {
        res.send(
          "[DetonatorMod] " +
            name +
            "'s guild stats:  Rank: " +
            rank +
            ", Weekly gexp: " +
            numberWithCommas(sum) +
            meetsReqs
        );
      } else {
        res.send(
          "[DetonatorMod] " +
            name +
            "'s guild stats:  Rank: " +
            rank +
            " (Is currently " +
            resultObject.rank +
            ", needs to be updated), Weekly gexp: " +
            numberWithCommas(sum) +
            meetsReqs
        );
      }
    });
});
app.get("/ranks", async (req, res) => {});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
