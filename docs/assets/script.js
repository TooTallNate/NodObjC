
$(function () {

  $('button').click(function (e) {
    var code = $(this).next()
    code.toggleClass('shown')
    var shown = code.hasClass('shown')
    $(this).text((shown ? 'Hide' : 'Show') + ' Code')
    return false
  })

})
