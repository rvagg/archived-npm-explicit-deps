#!/usr/bin/env node

const argv       = require('minimist')(process.argv.slice(2))
    , path       = require('path')
    , fs         = require('fs')
    , processDir = require('../process-dir')


var dir = argv._[0] || '.'
  , pkgjson = path.join(dir, 'package.json')


try {
  if (!fs.statSync(pkgjson).isFile()) {
    console.error('Path [%s] is not a directory')
    return process.exit(1)
  }
} catch (err) {
  console.error('Error reading [%s]: %s', pkgjson, err.message)
  return process.exit(1)
}


processDir(dir, function (err) {
  console.error('Error processing package directory [%s]: %s', dir, err.message)
  return process.exit(1)
})
