const csv = require('csv-parse');
const db = require('./db.js');
const fs = require('fs');

var dbHost = 'dbw';
var dbPort = 3306;
var dbName = 'totems';

var dbUser = 'ngrock';
var dbPasswd = 'el4denOs';

var csvFile = 'tagsIgnorar.csv';
var rollName = 'Tags IGNORAR';

async function run() {
  await db.connect(dbHost, dbUser, dbPasswd, dbName, dbPort);

  var tags = [];
  fs.createReadStream(csvFile)
    .pipe(csv({ columns: true }))
    .on('data', function (data) {
      tags.push(data.tag);
    })
    .on('end', async () => {
      var roll = await db.insert({ name: rollName, sequencePosition: 1, qty: tags.length }, 'roll');
      for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        await db.insert({ code: tag, createdOn: new Date(), status: 'FREE', sequence: i + 1, rollId: roll.insertId }, 'tag');
        console.log('Inserted TAG:', tag);
      }

      await db.disconnect();
      console.log('OK done');
    });
}

run();
