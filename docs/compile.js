
/**
 * Compiles a single file's dox output using the template.jade file.
 */

var fs = require('fs')
  , basename = require('path').basename
  , jade = require('jade')
  , highlight = require('highlight').Highlight
  , package = JSON.parse(fs.readFileSync(__dirname + '/../package.json'))

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
  var title = basename(filename, '.js')
    , opts = {
        title: title[0].toUpperCase() + title.substring(1)
      , input: input
      , package: package
    }
    , buf = fs.readFileSync(template)
    , fn = jade.compile(buf, opts)
    , html = fn(opts)

  // Syntax highlighting
  html = highlight(html, false, true)

  // XXX: Output to stdout when I can figure out the Makefile syntax
  //process.stdout.write(html)
  fs.writeFileSync(__dirname + '/' + title + '.html', html)
}
