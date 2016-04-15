(function($) {
  'use strict';

  var modes = ['copy SVG', 'download SVG'];
  var selectedMode = modes[0];
  var $modeBackdrop = $('<div/>').addClass('mode-backdrop');
  var $modeOptions = $('<ul/>').addClass('mode-options');
  var queuedTimeout = {};
  var svgTemplate = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">CONTENT</svg>';
  var $iconCode = $('<input/>')
        .addClass('icon-code')
        .attr('readonly', true)
        .on('click', function (e) {
          $(this).select();
          e.stopPropagation();
        });

  modes.forEach(function (mode) {
    var $option = $('<li/>').text(mode).appendTo($modeOptions);
    if (mode === selectedMode) {
      $option.hide();
    }
  });
  $modeOptions.appendTo($('.mode-select'));

  $('#mode-selected').text(modes[0]);

  $('.mode-select').on('click', function (e) {
    if ($(this).hasClass('active')) {
      return;
    }

    e.stopPropagation();

    $(this).addClass('active');
    $modeBackdrop.appendTo($('body'));
    this.offsetHeight; // force reflow
    $modeBackdrop.addClass('fade-in');
  });

  $modeOptions.on('click', 'li', function () {
    selectedMode = $(this).text();
    $('#mode-selected').text(selectedMode);

    $modeOptions.children().each(function () {
      if ($(this).text() === selectedMode) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  });

  $('.icon-list').on('click', '.icon-list-item', function (e) {

    if ($('#mode-selected').text() !== 'copy SVG') {
      return;
    }

    if ($(this).hasClass('active')) {
      e.preventDefault();
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    var $iconName = $(this).find('.icon-name');
    var iconId = $(this).find('svg > use').attr('xlink:href');
    var svgContent = $(iconId).html().trim().replace(/>\s*</g, '><')
                                            .replace(/>\s*<\/\w+>/g, '/>');
    var svg = svgTemplate.replace('CONTENT', svgContent);
    $iconCode.val(svg).appendTo($(this)).select().focus();

    if (document.execCommand('copy')) {
      $iconCode.detach();
      if (!$.isEmptyObject(queuedTimeout)) {
        clearTimeout(queuedTimeout.id);
        queuedTimeout.fn();
      }
      $iconName.text('copied').addClass('dark');
      queuedTimeout.fn = function () {
        $iconName.text(iconId.replace('#ni-', '')).removeClass('dark');
        queuedTimeout = {};
      };
      queuedTimeout.id = setTimeout(queuedTimeout.fn, 900);
      return;
    }

    $(this).addClass('active').siblings('.active').removeClass('active');;

    var left = $iconCode.css('margin', 0).offset().left;
    if (left < 0) {
      $iconCode.css('margin-left', '50%');
    } else if (left + $iconCode.outerWidth() > $(window).width()) {
      $iconCode.css('margin-left', '-50%');
    }

  });

  $(document).on('click', function () {
    $('.mode-select').removeClass('active');
    $modeBackdrop.removeClass('fade-in').detach();
    $('.icon-list-item.active').removeClass('active');
    $iconCode.detach();
  });

})(jQuery);
