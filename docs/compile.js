
/**
 * Compiles a single file's dox output using the template.jade file.
 */

var fs = require('fs')
  , basename = require('path').basename
  , jade = require('jade')

/**
 * The output filename.
 */

var filename = process.argv[2]
  , template = __dirname + '/template.jade'

var input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', function (b) {
  input += b
})
process.stdin.on('end', function () {
  input = JSON.parse(input)
  render()
})
process.stdin.resume()

function render () {
  var opts = { input: input }
    , buf = fs.readFileSync(template)
    , fn = jade.compile(buf, opts)
    , html = fn(opts)
  //process.stdout.write(html)
  fs.writeFileSync(__dirname + '/' + basename(filename, '.js') + '.html', html)
}
