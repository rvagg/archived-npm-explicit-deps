const fs           = require('fs')
    , path         = require('path')
    , explicitDeps = require('./')


function processDir (dir, callback) {
  var jsonPath = path.join(dir, 'package.json')

  function processJson (err, data) {
    if (err)
      return callback(err)

    var json

    try {
      json = JSON.parse(data)
    } catch (e) {
      return callback(new Error('Invalid JSON in package.json: ' + err.message))
    }

    explicitDeps(json)

    fs.writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf8', callback)
  }

  fs.readFile(jsonPath, 'utf8', processJson)
}


module.exports = processDir
