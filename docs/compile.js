
/**
 * Compiles a single file's dox output using the template.jade file.
 */

var fs = require('fs')
  , basename = require('path').basename
  , jade = require('jade')
  , highlight = require('highlight').Highlight
  , package = JSON.parse(fs.readFileSync(__dirname + '/../package.json'))
  , pages = process.env.PAGES.split(' ')

/**
 * The output filename.
 */

var title = process.argv[2]
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
  var opts = {
        title: title[0].toUpperCase() + title.substring(1)
      , input: input
      , package: package
      , pages: pages
    }
    , buf = fs.readFileSync(template)
    , fn = jade.compile(buf, opts)
    , html = fn(opts)

  // Syntax highlighting
  html = highlight(html, false, true)

  // Output the result to stdout
  process.stdout.write(html + '\n')
}
