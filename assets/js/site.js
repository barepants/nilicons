(function($) {
  'use strict';

  var modes = ['copy SVG code', 'copy sprite <use>', 'copy icon name', 'download SVG'];
  var $modeBackdrop = $('<div/>').addClass('mode-backdrop');
  var $modeOptions = $('<ul/>').addClass('mode-options');
  var queuedTimeout = {};
  var svgTemplate = '<svg class="icon" width="24" height="24" viewBox="0 0 24 24">CONTENT\n</svg>';
  var spriteUseTemplate = '<svg class="icon" width="24" height="24">\n  <use xlink:href="#ni-ICONNAME" />\n</svg>';
  var $iconCode = $('<textarea/>')
        .addClass('icon-code')
        .attr('readonly', true)
        .on('click', function (e) {
          $(this).select();
          e.stopPropagation();
        });

  var selectedMode = Cookies.get('mode');
  if (!modes.some(function (mode) {return mode === selectedMode;})) {
    selectedMode = modes[0];
  }
  $('#mode-selected').text(selectedMode);
  modes.forEach(function (mode) {
    var $option = $('<li/>')
          .addClass('mode-option').text(mode).appendTo($modeOptions);
    if (mode === selectedMode) {
      $option.hide();
    }
  });
  $modeOptions.appendTo($('.mode-select'));

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
    Cookies.set('mode', selectedMode, {expires: 30});

    $modeOptions.children().each(function () {
      if ($(this).text() === selectedMode) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  });

  $('.icon-list').on('click', '.icon-list-item', function (e) {

    if (selectedMode === 'download SVG') {
      return;
    }

    if ($(this).hasClass('active')) {
      e.preventDefault();
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    var $iconName = $(this).find('.icon-name');
    var iconName = $iconName.text();
    var iconId = $(this).find('svg > use').attr('xlink:href');
    var textToCopy = '';
    switch (selectedMode) {
      case 'copy SVG code':
        var svgContent = $(iconId).html();
        if (!svgContent) {
          // Fix IE not supporting SVGElement.innerHTML
          svgContent = $('<div/>').append(
            $(iconId).children().clone()
          ).html();
        }
        svgContent = svgContent.trim().replace(/>\s*<\/\w+>/g, ' />')
                                      .replace(/\s*</g, '\n  <');
        textToCopy = svgTemplate.replace('CONTENT', svgContent);
        break;
      case 'copy icon name':
        textToCopy = iconName;
        break;
      case 'copy sprite <use>':
        textToCopy = spriteUseTemplate.replace('ICONNAME', iconName);
        break;
    }
    $iconCode.val(textToCopy).appendTo($(this)).select().focus();

    if (document.execCommand('copy')) {
      $iconCode.detach();
      if (!$.isEmptyObject(queuedTimeout)) {
        clearTimeout(queuedTimeout.id);
        queuedTimeout.fn();
      }
      $iconName.text('copied').addClass('dark');
      queuedTimeout.fn = function () {
        $iconName.text(iconName).removeClass('dark');
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

  $('.hide-me-i-am-not-ready').removeClass('hide-me-i-am-not-ready');

})(jQuery);
