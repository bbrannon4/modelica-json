const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const fse = require('fs.extra')
const path = require('path')
const glob = require('glob')

var logger = require('winston')

function writeFile (fileName, content) {
  fs.writeFileAsync(fileName, content).then(
    function (res) {
      logger.debug('Wrote ', fileName)
      return true
    }
  )
}

/** Get the JSON data structure of the JSON file.
  *
  *@param jsonFile Name of the JSON file.
  *@return The JSON representation of the JSON file.
  */
function readJSON (jsonFile) {
  logger.debug('Entered getJSON for ', jsonFile)
  const json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
  return Promise.resolve(json)
}

/** Return the MODELICAPATH, with the current directory being the first
  *  element. Elements are separated by ':'
  */
function getMODELICAPATH () {
  return (process.env.MODELICAPATH)
    ? (process.cwd() + ':' + process.env.MODELICAPATH).split(':')
    : [process.cwd()]
}

/** Return a string that points to the .mo file that contains
  * the class `className`. This function searches on the
  * current directory and the MODELICAPATH.
  * If the file is not found, it returns 'null'
  */
function getModelicaFileName (className) {
  const MOPA = getMODELICAPATH()
  // Search on the MODELICAPATH
  // Note that 'file:///Buildings/Resources' may be in the
  // directory 'file:///Buildings 5.0.1/Resources'
  // rather than only in Buildings
  const topLevel = className.substring(0, className.indexOf('.'))
  const classNameWithoutTopLevel = className.substring(className.indexOf('.') + 1)
  // fixme: for now, get the json file, not the .mo file,
  //        this will be changed later when we parse mo files dynamicall
  const fileName = classNameWithoutTopLevel.replace(/\./g, '/') + '.mo'

  for (var k = 0; k < MOPA.length; k++) {
    // Process the first element in the MODELICAPATH
    // Search 'Buildings' and 'Buildings x' where x is any character
    var dirs = (topLevel)
      ? glob.sync(path.join(MOPA[k], topLevel + '?( *)'))
      : [MOPA[k]]
    for (var d = 0; d < dirs.length; d++) {
      if (fse.existsSync(path.join(dirs[d], fileName))) {
        return path.join(dirs[d], fileName)
      }
    }
  }
  return null
}
module.exports.writeFile = writeFile
module.exports.readJSON = readJSON
module.exports.getModelicaFileName = getModelicaFileName
module.exports.getMODELICAPATH = getMODELICAPATH