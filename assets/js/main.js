(function (window, document) {
  'use strict';

  var qsa = function (sel) {
    return document.querySelectorAll(sel);
  };

  var bindSlideChange = function () {
    var slides = qsa('.slide');
    var lastSlide = slides[slides.length -1];
    var firstSlide = slides[0];

    var changeSlide = function (forwards) {
      var fallbackSlide =  (forwards ? firstSlide : lastSlide);
      var activeSlide = qsa('.slide.active')[0] || fallbackSlide;

      if (forwards) {
        var nextSlide = qsa('.slide.active + .slide')[0] || fallbackSlide;
        activeSlide.classList.remove('active');
        nextSlide.classList.add('active');
      } else {
        var previousSlide = activeSlide.previousElementSibling || fallbackSlide;
        activeSlide.classList.remove('active');
        previousSlide.classList.add('active');
      }
    };
    document.onclick = function () {
      changeSlide(true);
    };
    document.onkeydown = function (e) {
      if (e.which === 39) {
        changeSlide(true);
      }
      if (e.which === 37) {
        changeSlide(false);
      }
    };
  };

  var renderMarkdown = function () {
    var content = qsa('xmp')[0];
    var markdown = content.textContent;

    var html = window.marked(markdown);

    // Split content at '<hr>' and make sections
    var slides = html.split('<hr>');
    var htmlSlides = [];
    for (var i=0; i<slides.length; i++) {
      htmlSlides.push('<section class="slide">' + slides[i] + '</section>');
    }
    html = htmlSlides.join('');

    // Fix the code block attributes
    html = html.replace(/class\=\"lang-/gi, 'data-language="');

    document.body.innerHTML = html;

    qsa('.slide')[0].classList.add('active');

  };

  renderMarkdown();
  bindSlideChange();

}(window, document));
