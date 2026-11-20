/* Velune — tiny runtime for the page templates (sc-for, sc-if, {{holes}}, onClick). */
(function () {
  'use strict';
  var tpl = document.getElementById('dc-template');
  var root = document.getElementById('dc-root');
  var scriptEl = document.querySelector('script[type="text/x-dc"]');
  if (!tpl || !root || !scriptEl) return;

  var props = {};
  try {
    var spec = JSON.parse(scriptEl.getAttribute('data-props') || '{}');
    Object.keys(spec).forEach(function (k) { if (k.charAt(0) !== '$' && spec[k] && 'default' in spec[k]) props[k] = spec[k]['default']; });
  } catch (e) {}

  var scheduled = false, comp = null, handlers = {}, hid = 0;
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(function () { scheduled = false; render(); }); }

  function DCLogic(p) { this.props = p || {}; this.state = {}; }
  DCLogic.prototype.setState = function (s) {
    var next = typeof s === 'function' ? s(this.state) : s;
    for (var k in next) this.state[k] = next[k];
    schedule();
  };

  var Component = new Function('DCLogic', scriptEl.textContent + '\n;return Component;')(DCLogic);

  var inert = document.implementation.createHTMLDocument('');
  var cache = {};
  function evaluate(expr, scope) {
    var keys = Object.keys(scope);
    var key = expr + '|' + keys.join(',');
    var fn = cache[key];
    if (!fn) { try { fn = cache[key] = new Function(keys.join(','), 'return (' + expr + ');'); } catch (e) { return undefined; } }
    try { return fn.apply(null, keys.map(function (k) { return scope[k]; })); } catch (e) { return undefined; }
  }
  var HOLE = /\{\{([\s\S]+?)\}\}/g;
  function holeExpr(str) { var m = /^\s*\{\{([\s\S]+?)\}\}\s*$/.exec(str || ''); return m ? m[1].trim() : null; }
  function fill(str, scope) {
    return str.replace(HOLE, function (_, e) { var v = evaluate(e.trim(), scope); return (v === undefined || v === null || typeof v === 'function') ? '' : String(v); });
  }

  function expand(node, scope) {
    var kids = Array.prototype.slice.call(node.childNodes);
    for (var i = 0; i < kids.length; i++) {
      var ch = kids[i];
      if (ch.nodeType === 3) { if (ch.nodeValue.indexOf('{{') > -1) ch.nodeValue = fill(ch.nodeValue, scope); continue; }
      if (ch.nodeType !== 1) { if (ch.nodeType === 8) ch.remove(); continue; }
      var tag = ch.tagName.toLowerCase();
      if (tag === 'sc-for') {
        var list = evaluate(holeExpr(ch.getAttribute('list')), scope) || [];
        var as = ch.getAttribute('as') || 'item';
        var frag = inert.createDocumentFragment();
        for (var j = 0; j < list.length; j++) {
          var holder = inert.createElement('div');
          holder.innerHTML = ch.innerHTML;
          var s2 = Object.assign({}, scope); s2[as] = list[j];
          expand(holder, s2);
          while (holder.firstChild) frag.appendChild(holder.firstChild);
        }
        ch.replaceWith(frag);
        continue;
      }
      if (tag === 'sc-if') {
        if (!evaluate(holeExpr(ch.getAttribute('value')), scope)) { ch.remove(); continue; }
        expand(ch, scope);
        var f2 = inert.createDocumentFragment();
        while (ch.firstChild) f2.appendChild(ch.firstChild);
        ch.replaceWith(f2);
        continue;
      }
      var attrs = Array.prototype.slice.call(ch.attributes);
      for (var a = 0; a < attrs.length; a++) {
        var at = attrs[a], name = at.name;
        if (/^on[a-z]+$/i.test(name)) {
          ch.removeAttribute(name);
          var fn = evaluate(holeExpr(at.value) || 'undefined', scope);
          if (typeof fn === 'function') { var id = 'h' + (++hid); handlers[id] = fn; ch.setAttribute('data-dc-' + name.slice(2).toLowerCase(), id); }
          continue;
        }
        if (name.indexOf('hint-') === 0 || name === 'key') { ch.removeAttribute(name); continue; }
        if (at.value.indexOf('{{') > -1) ch.setAttribute(name, fill(at.value, scope));
      }
      expand(ch, scope);
    }
  }

  function render() {
    handlers = {}; hid = 0;
    var vals = comp.renderVals();
    var next = inert.createElement('div');
    next.appendChild(inert.importNode(tpl.content, true));
    expand(next, vals);
    if (!root.firstChild) { while (next.firstChild) root.appendChild(next.firstChild); }
    else { morphdom(root, next, { childrenOnly: true }); }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-dc-click]') : null;
    if (!el) return;
    var fn = handlers[el.getAttribute('data-dc-click')];
    if (fn) fn(e);
  });

  comp = new Component(props);
  render();
  if (comp.componentDidMount) comp.componentDidMount();
  if (location.hash) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) setTimeout(function () { t.scrollIntoView(); }, 0); }
})();
