#!/usr/bin/env node

const argv       = require('minimist')(process.argv.slice(2))
    , path       = require('path')
    , fs         = require('fs')
    , xtend      = require('xtend')
    , equal      = require('deep-equal')
    , ansi       = require('ansi-styles')
    , read       = require('read')
    , processDir = require('../process-dir')
    , depTypes   = require('../dep-types')


var dir     = argv._[0] || '.'
  , pkgjson = path.join(dir, 'package.json')
  , options = {}


try {
  if (!fs.statSync(pkgjson).isFile()) {
    console.error('Path [%s] is not a directory')
    return process.exit(1)
  }
} catch (err) {
  console.error('Error reading [%s]: %s', pkgjson, err.message)
  return process.exit(1)
}


if (argv.zeroOnly || argv['0'])
  options.zeroOnly = true


function clean (json) {
  for (var k in json) {
    if (depTypes.indexOf(k) >= 0)
      continue

    ;delete json[k]
  }
}


if (!argv.yes && !argv.y) {
  options.confirm = function confirm (_oldJson, _newJson, callback) {
    var oldJson = xtend(_oldJson)
      , newJson = xtend(_newJson)

    clean(oldJson)
    clean(newJson)

    depTypes.forEach(function (depType) {
      if (!oldJson[depType] || equal(oldJson[depType], newJson[depType]))
        return

      var keys = Object.keys(oldJson[depType])

      console.log('  "%s": {', depType)

      keys.forEach(function (k, i) {
        var oldv = oldJson[depType][k]
          , newv = newJson[depType][k]

        if (oldv == newv)
          return console.log('     "%s": "%s"%s', k, oldv, i + 1 == keys.length ? '' : ',')

        console.log('%s-    "%s": "%s"%s%s', ansi.red.open, k, oldv, i + 1 == keys.length ? '' : ',', ansi.red.close)
        console.log('%s+    "%s": "%s"%s%s', ansi.green.open, k, newv, i + 1 == keys.length ? '' : ',', ansi.green.close)
      })

      console.log('  },')
    })

    console.log()
    read({ prompt: 'Do you want to save this package.json [y/N]? ' }, function (err, resp) {
      var yes = (/^y/i).test(resp)

      console.log('%saving package.json', yes ? 'S' : 'Not s')

      if (yes)
        return callback()
    })
  }
}

processDir(dir, options, function (err) {
  if (err) {
    console.error('Error processing package directory [%s]: %s', dir, err.message)
    return process.exit(1)
  }
})
