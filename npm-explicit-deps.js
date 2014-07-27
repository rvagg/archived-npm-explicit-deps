const sanever = require('sanever')


function explicitDeps (json) {
  function fix (dependencies) {
    Object.keys(dependencies).forEach(function (name) {
      try {
        var range = new sanever.Range(dependencies[name])
        if (range)
          dependencies[name] = range.format()
      } catch (e) {}
    })
  }

  fix(json.dependencies)
}


module.exports = explicitDeps
