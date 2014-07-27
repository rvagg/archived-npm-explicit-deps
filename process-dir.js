const fs           = require('fs')
    , path         = require('path')
    , explicitDeps = require('./')


function processDir (dir, options, callback) {
  var jsonPath = path.join(dir, 'package.json')

  if (typeof options == 'function') {
    callback = options
    options = {}
  }

  function write (json) {
    fs.writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf8', callback)
  }

  function processJson (err, data) {
    if (err)
      return callback(err)

    var originalJson
      , newJson

    try {
      originalJson = JSON.parse(data)
    } catch (e) {
      return callback(new Error('Invalid JSON in package.json: ' + err.message))
    }

    newJson = explicitDeps(originalJson, options)

    if (typeof options.confirm == 'function')
      options.confirm(originalJson, newJson, write.bind(null, newJson))
    else
      write(newJson)
  }

  fs.readFile(jsonPath, 'utf8', processJson)
}


module.exports = processDir
