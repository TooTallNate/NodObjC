
/**
 * Compiles a single file's dox output using the template.jade file.
 */

var fs = require('fs')
  , basename = require('path').basename
  , jade = require('jade')
  , marked = require('marked')
  , hljs = require('highlight.js')
  , highlight = hljs.highlight
  , package = require('../package')
  , pages = process.env.PAGES.split(' ')

function markdown (code) {
  if (!code) return code
  return marked(code, {
      gfm: true
    , highlight: function (code, lang) {
        if (!hljs.LANGUAGES.hasOwnProperty(lang)) {
          lang = 'javascript'
        }
        return highlight(lang, code).value
      }
  })
}

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

  // Apply Markdown conversion and syntax highlighting
  input.forEach(function (i) {
    var desc = i.description
    desc.full = markdown(desc.full)
    desc.summary = markdown(desc.summary)
    desc.body = markdown(desc.body)

    i.code && (i.code = highlight('javascript', i.code).value)
  })

  var opts = {
        title: title[0].toUpperCase() + title.substring(1)
      , input: input
      , package: package
      , pages: pages
    }
    , buf = fs.readFileSync(template)
    , fn = jade.compile(buf, opts)
    , html = fn(opts)

  // Output the result to stdout
  process.stdout.write(html + '\n')
}
