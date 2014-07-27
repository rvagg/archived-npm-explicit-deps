const sanever  = require('sanever')
    , xtend    = require('xtend')
    , depTypes = require('./dep-types')

function explicitDeps (_json, options) {
  if (!options)
    options = {}

  var json = xtend(_json)

  function fix (dependencies) {
    Object.keys(dependencies).forEach(function (name) {
      try {
        var range = new sanever.Range(dependencies[name])

        if (!range)
          return

        // if '1.0.0-0' is outside the range on the upper side, and we're doing
        // zeroOnly then skip this one
        if (options.zeroOnly && !sanever.outside('1.0.0-0', range, '>'))
          return

        dependencies[name] = range.format()
      } catch (e) {}
    })

    return dependencies
  }

  depTypes.forEach(function (depType) {
    if (json[depType])
      json[depType] = fix(xtend(json[depType]))
  })

  return json
}


module.exports = explicitDeps
