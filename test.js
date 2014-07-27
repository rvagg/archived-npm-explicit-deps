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
      testJson.devDependencies = dependencies.devDependencies
    if (dependencies.optionalDependencies)
      testJson.optionalDependencies = dependencies.optionalDependencies
    if (dependencies.peerDependencies)
      testJson.peerDependencies = dependencies.peerDependencies
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
    t.deepEqual(testJson.dependencies, dependencies, 'deepEqual dependencies')
  } else {
    if (dependencies.dependencies)
      t.deepEqual(testJson.dependencies, dependencies.dependencies, 'deepEqual dependencies')
    if (dependencies.devDependencies)
      t.deepEqual(testJson.devDependencies, dependencies.devDependencies, 'deepEqual devDependencies')
    if (dependencies.optionalDependencies)
      t.deepEqual(testJson.optionalDependencies, dependencies.optionalDependencies, 'deepEqual optionalDependencies')
    if (dependencies.peerDependencies)
      t.deepEqual(testJson.peerDependencies, dependencies.peerDependencies, 'deepEqual peerDependencies')
  }
}

'dependencies devDependencies optionalDependencies peerDependencies'.split(' ').forEach(function (depType) {

test(depType + ' sanity check', function (t) {
  var dir = rnddir(t)
  mkTestPkg(dir, { 'foo': '~0.0.0' })
  assertDependencies(t, dir, { 'foo': '~0.0.0' })
  t.end()
})


test(depType + ' single ~ dependency', function (t) {
  var dir = rnddir(t)
    , inp = {}
    , exp = {}

  inp[depType] = { 'foo': '~0.1.0' }
  exp[depType] = { 'foo': '>=0.1.0 <0.2.0-0' }

  mkTestPkg(dir, inp)
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, exp)
    t.end()
  })
})


test(depType + ' single ^ dependency', function (t) {
  var dir = rnddir(t)
    , inp = {}
    , exp = {}

  inp[depType] = { 'foo': '^0.1.0' }
  exp[depType] = { 'foo': '>=0.1.0 <1.0.0-0' }

  mkTestPkg(dir, inp)
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, exp)
    t.end()
  })
})


test(depType + ' single x.y dependency', function (t) {
  var dir = rnddir(t)
    , inp = {}
    , exp = {}

  inp[depType] = { 'foo': '0.1' }
  exp[depType] = { 'foo': '>=0.1.0 <0.2.0-0' }

  mkTestPkg(dir, inp)
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, exp)
    t.end()
  })
})


test(depType + ' single x dependency', function (t) {
  var dir = rnddir(t)
    , inp = {}
    , exp = {}

  inp[depType] = { 'foo': '1' }
  exp[depType] = { 'foo': '>=1.0.0 <2.0.0-0' }

  mkTestPkg(dir, inp)
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, exp)
    t.end()
  })
})


test(depType + ' single * dependency', function (t) {
  var dir = rnddir(t)
    , inp = {}
    , exp = {}

  inp[depType] = { 'foo': '0.1.*' }
  exp[depType] = { 'foo': '>=0.1.0 <0.2.0-0' }

  mkTestPkg(dir, inp)
  explicitDeps(dir, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, exp)
    t.end()
  })
})


test(depType + ' zero-only', function (t) {
  var dir = rnddir(t)
    , inp = {}
    , exp = {}

  inp[depType] = {
      'a': '0.1.*'
    , 'b': '1.0.0'
    , 'c': '~1.0.1'
    , 'd': '~0.1.2'
    , 'e': '^0.9.1'
    , 'f': '0.9'
    , 'g': '1.9'
    , 'h': '>=0 <1'
    , 'i': '>=1 <2'
    , 'j': '~10'
  }
  exp[depType] = {
      'a': '>=0.1.0 <0.2.0-0'
    , 'b': '1.0.0'
    , 'c': '~1.0.1'
    , 'd': '>=0.1.2 <0.2.0-0'
    , 'e': '>=0.9.1 <1.0.0-0'
    , 'f': '>=0.9.0 <0.10.0-0'
    , 'g': '1.9'
    , 'h': '>=0.0.0 <1.0.0-0'
    , 'i': '>=1 <2'
    , 'j': '~10'
  }


  mkTestPkg(dir, inp)
  explicitDeps(dir, { zeroOnly: true }, function (err) {
    t.ifError(err)
    assertDependencies(t, dir, exp)
    t.end()
  })
})


test(depType + ' many', function (t) {
  var dir = rnddir(t)
    , inp = {}
    , exp = {}

  inp[depType] = {
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
  }
  exp[depType] = {
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
  }

  mkTestPkg(dir, inp)
  explicitDeps(dir, function (err) {
    t.ifError(err, 'no error')
    assertDependencies(t, dir, exp)
    t.end()
  })
})

})
