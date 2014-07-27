const test   = require('tape')
    , fs     = require('fs')
    , path   = require('path')
    , xtend  = require('xtend')
    , rimraf = require('rimraf')
    , mkdirp = require('mkdirp')
    , json   = require('./package.json')
    , explicitDeps = require('./process-dir')


function cleanup (t, dir) {
  t.on('end', function () {
    rimraf(dir, function () {})
  })
}


function rnddir (t) {
  var dir = '~test.' + Math.floor(Math.random() * 10000)
  mkdirp.sync(dir)
  cleanup(t, dir)
  return dir
}


function mkTestPkg (dir, dependencies) {
  var testJson = xtend(json)

  ;delete testJson.dependencies
  ;delete testJson.devDependencies
  ;delete testJson.optionalDependencies
  ;delete testJson.peerDependencies

  if (!dependencies.dependencies
        && !dependencies.devDependencies
        && !dependencies.optionalDependencies
        && !dependencies.peerDependencies) {
    testJson.dependencies = dependencies
  } else {
    if (dependencies.dependencies)
      testJson.dependencies = dependencies.dependencies
    if (dependencies.devDependencies)
      testJson.dependencies = dependencies.devDependencies
    if (dependencies.optionalDependencies)
      testJson.dependencies = dependencies.optionalDependencies
    if (dependencies.peerDependencies)
      testJson.dependencies = dependencies.peerDependencies
  }

  fs.writeFileSync(
      path.join(dir, 'package.json')
    , JSON.stringify(testJson, null, 2)
    , 'utf8'
  )
}


function assertDependencies (t, dir, dependencies) {
  var testJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))

  if (!dependencies.dependencies
        && !dependencies.devDependencies
        && !dependencies.optionalDependencies
        && !dependencies.peerDependencies) {
    t.deepEqual(testJson.dependencies, dependencies)
  }
}


test('sanity check', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, { 'foo': '~0.0.0' })
  assertDependencies(t, dir, { 'foo': '~0.0.0' })
  t.end()
})


test('single ~ dependency', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, { 'foo': '~0.1.0' })
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, { 'foo': '>=0.1.0 <0.2.0-0' })
    t.end()
  })
})


test('single ^ dependency', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, { 'foo': '^0.1.0' })
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, { 'foo': '>=0.1.0 <1.0.0-0' })
    t.end()
  })
})


test('single x.y dependency', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, { 'foo': '0.1' })
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, { 'foo': '>=0.1.0 <0.2.0-0' })
    t.end()
  })
})


test('single x dependency', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, { 'foo': '1' })
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, { 'foo': '>=1.0.0 <2.0.0-0' })
    t.end()
  })
})


test('single * dependency', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, { 'foo': '0.1.*' })
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, { 'foo': '>=0.1.0 <0.2.0-0' })
    t.end()
  })
})


test('many', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, {
      'a': '0'
    , 'b': '1'
    , 'c': '2'
    , 'd': '0.1'
    , 'e': '1.1'
    , 'f': '>0'
    , 'g': '>1'
    , 'h': '>2'
    , 'i': '>1.3.x <3'
    , 'j': '~0.0.0'
    , 'k': '^0.0.0'
    , 'l': '~0.0.0-beta1'
    , 'm': '~1.1.1-1'
    , 'n': '0.0.0'
    , 'o': '1.1.1'
    , 'p': '2.2.2'
    , 'q': '1.0.0-2'
  })
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, {
        'a': '>=0.0.0 <1.0.0-0'
      , 'b': '>=1.0.0 <2.0.0-0'
      , 'c': '>=2.0.0 <3.0.0-0'
      , 'd': '>=0.1.0 <0.2.0-0'
      , 'e': '>=1.1.0 <1.2.0-0'
      , 'f': '>=1.0.0'
      , 'g': '>=2.0.0'
      , 'h': '>=3.0.0'
      , 'i': '>=1.4.0 <3.0.0-0'
      , 'j': '>=0.0.0 <0.1.0-0'
      , 'k': '>=0.0.0 <1.0.0-0'
      , 'l': '>=0.0.0-beta1 <0.1.0-0'
      , 'm': '>=1.1.1-1 <1.2.0-0'
      , 'n': '0.0.0'
      , 'o': '1.1.1'
      , 'p': '2.2.2'
      , 'q': '1.0.0-2'
    })
    t.end()
  })
})
