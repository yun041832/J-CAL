(function () {
  'use strict';

  function getSectionColor(section) {
    return section?.color || '#5C8DFF';
  }

  function createCheckbox(sectionColor) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.style.cssText = `width:13px;height:13px;cursor:pointer;flex-shrink:0;margin-top:2px;accent-color:${sectionColor}`;
    return cb;
  }

  function createDeleteBtn() {
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.style.cssText = 'position:absolute;top:0;right:0;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;line-height:1;padding:0 2px;opacity:0;transition:opacity 0.15s';
    return btn;
  }

  Object.assign(window.JCal || (window.JCal = {}), {
    getSectionColor,
    createCheckbox,
    createDeleteBtn,
  });
})();
