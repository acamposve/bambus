var mysql = require('mysql');
var _connection = null;

module.exports = {
  connect: function (host, user, pass, dbname, port) {
    if (_connection === null) {
      console.log('DB | Connect | Connecting to ' + dbname + '@' + host + '...');
      _connection = mysql.createConnection({
        host: host,
        user: user,
        password: pass,
        database: dbname,
        timezone: 'utc',
        port: port || 3306,
      });

      _connection.connect();
      console.log('DB | Connect | Connected successfully');
    }

    return;
  },

  disconnect: () => {
    if (_connection == null) return;
    console.log('DB | disconnected');
    _connection.end();
    _connection = null;
  },

  query: function (sql, params, cb) {
    _connection.query(sql, params, (err, result) => {
      cb(err, result);
    });
  },

  insert: function (object, table) {
    var keys = Object.keys(object);
    var values = Object.values(object);
    var args = [];
    values.forEach((value) => {
      args.push('?');
    });
    var query = `INSERT INTO ${table} (${keys.map((k) => `\`${k}\``).join(',')}) VALUES (${args.join(',')})`;

    return module.exports.querySync(query, values);
  },

  querySync: function (sql, params) {
    return new Promise((resolve, reject) => {
      module.exports.query(sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  },
};
