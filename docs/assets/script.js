
$(function () {

  $('button').click(function (e) {
    var code = $(this).next()
    code.toggleClass('shown')
    return false
  })

})
