var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/cache.db');
exports.sqlite = sqlite3;
exports.db = db;
