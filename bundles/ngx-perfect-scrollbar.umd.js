(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('rxjs/Subject'), require('rxjs/operators'), require('@angular/core'), require('@angular/common')) :
	typeof define === 'function' && define.amd ? define(['exports', 'rxjs/Subject', 'rxjs/operators', '@angular/core', '@angular/common'], factory) :
	(factory((global.zef = global.zef || {}, global.zef.ngxPerfectScrollbar = {}),global.Rx,global.Rx.Observable.prototype,global.ng.core,global.ng.common));
}(this, (function (exports,Subject,operators,core,common) { 'use strict';

/*!
 * perfect-scrollbar v1.2.0
 * (c) 2017 Hyunje Jun
 * @license MIT
 */
function get(element) {
  return getComputedStyle(element);
}

function set(element, obj) {
  for (var key in obj) {
    var val = obj[key];
    if (typeof val === 'number') {
      val = val + "px";
    }
    element.style[key] = val;
  }
  return element;
}

function div(className) {
  var div = document.createElement('div');
  div.className = className;
  return div;
}

function matches(element, query) {
  var elMatches =
    Element.prototype.matches ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.msMatchesSelector;

  if (!elMatches) {
    throw new Error('No element matching method supported');
  }

  return elMatches.call(element, query);
}

function remove(element) {
  if (element.remove) {
    element.remove();
  } else {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

function queryChildren(element, selector) {
  return Array.prototype.filter.call(element.children, function (child) { return matches(child, selector); }
  );
}

var cls = {
  main: 'ps',
  element: {
    thumb: function (x) { return ("ps__thumb-" + x); },
    rail: function (x) { return ("ps__rail-" + x); },
    consuming: 'ps__child--consume',
  },
  state: {
    focus: 'ps--focus',
    active: function (x) { return ("ps--active-" + x); },
    scrolling: function (x) { return ("ps--scrolling-" + x); },
  },
};

/*
 * Helper methods
 */
var scrollingClassTimeout = { x: null, y: null };

function addScrollingClass(i, x) {
  var classList = i.element.classList;
  var className = cls.state.scrolling(x);

  if (classList.contains(className)) {
    clearTimeout(scrollingClassTimeout[x]);
  } else {
    classList.add(className);
  }
}

function removeScrollingClass(i, x) {
  scrollingClassTimeout[x] = setTimeout(
    function () { return i.isAlive && i.element.classList.remove(cls.state.scrolling(x)); },
    i.settings.scrollingThreshold
  );
}

function setScrollingClassInstantly(i, x) {
  addScrollingClass(i, x);
  removeScrollingClass(i, x);
}

var EventElement = function EventElement(element) {
  this.element = element;
  this.handlers = {};
};

var prototypeAccessors = { isEmpty: { configurable: true } };

EventElement.prototype.bind = function bind (eventName, handler) {
  if (typeof this.handlers[eventName] === 'undefined') {
    this.handlers[eventName] = [];
  }
  this.handlers[eventName].push(handler);
  this.element.addEventListener(eventName, handler, false);
};

EventElement.prototype.unbind = function unbind (eventName, target) {
    var this$1 = this;

  this.handlers[eventName] = this.handlers[eventName].filter(function (handler) {
    if (target && handler !== target) {
      return true;
    }
    this$1.element.removeEventListener(eventName, handler, false);
    return false;
  });
};

EventElement.prototype.unbindAll = function unbindAll () {
    var this$1 = this;

  for (var name in this$1.handlers) {
    this$1.unbind(name);
  }
};

prototypeAccessors.isEmpty.get = function () {
    var this$1 = this;

  return Object.keys(this.handlers).every(
    function (key) { return this$1.handlers[key].length === 0; }
  );
};

Object.defineProperties( EventElement.prototype, prototypeAccessors );

var EventManager = function EventManager() {
  this.eventElements = [];
};

EventManager.prototype.eventElement = function eventElement (element) {
  var ee = this.eventElements.filter(function (ee) { return ee.element === element; })[0];
  if (!ee) {
    ee = new EventElement(element);
    this.eventElements.push(ee);
  }
  return ee;
};

EventManager.prototype.bind = function bind (element, eventName, handler) {
  this.eventElement(element).bind(eventName, handler);
};

EventManager.prototype.unbind = function unbind (element, eventName, handler) {
  var ee = this.eventElement(element);
  ee.unbind(eventName, handler);

  if (ee.isEmpty) {
    // remove
    this.eventElements.splice(this.eventElements.indexOf(ee), 1);
  }
};

EventManager.prototype.unbindAll = function unbindAll () {
  this.eventElements.forEach(function (e) { return e.unbindAll(); });
  this.eventElements = [];
};

EventManager.prototype.once = function once (element, eventName, handler) {
  var ee = this.eventElement(element);
  var onceHandler = function (evt) {
    ee.unbind(eventName, onceHandler);
    handler(evt);
  };
  ee.bind(eventName, onceHandler);
};

function createEvent(name) {
  if (typeof window.CustomEvent === 'function') {
    return new CustomEvent(name);
  } else {
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(name, false, false, undefined);
    return evt;
  }
}

var processScrollDiff = function(
  i,
  axis,
  diff,
  useScrollingClass,
  forceFireReachEvent
) {
  if ( useScrollingClass === void 0 ) useScrollingClass = true;
  if ( forceFireReachEvent === void 0 ) forceFireReachEvent = false;

  var fields;
  if (axis === 'top') {
    fields = [
      'contentHeight',
      'containerHeight',
      'scrollTop',
      'y',
      'up',
      'down' ];
  } else if (axis === 'left') {
    fields = [
      'contentWidth',
      'containerWidth',
      'scrollLeft',
      'x',
      'left',
      'right' ];
  } else {
    throw new Error('A proper axis should be provided');
  }

  processScrollDiff$1(i, diff, fields, useScrollingClass, forceFireReachEvent);
};

function processScrollDiff$1(
  i,
  diff,
  ref,
  useScrollingClass,
  forceFireReachEvent
) {
  var contentHeight = ref[0];
  var containerHeight = ref[1];
  var scrollTop = ref[2];
  var y = ref[3];
  var up = ref[4];
  var down = ref[5];
  if ( useScrollingClass === void 0 ) useScrollingClass = true;
  if ( forceFireReachEvent === void 0 ) forceFireReachEvent = false;

  var element = i.element;

  // reset reach
  i.reach[y] = null;

  // 1 for subpixel rounding
  if (element[scrollTop] < 1) {
    i.reach[y] = 'start';
  }

  // 1 for subpixel rounding
  if (element[scrollTop] > i[contentHeight] - i[containerHeight] - 1) {
    i.reach[y] = 'end';
  }

  if (diff) {
    element.dispatchEvent(createEvent(("ps-scroll-" + y)));

    if (diff < 0) {
      element.dispatchEvent(createEvent(("ps-scroll-" + up)));
    } else if (diff > 0) {
      element.dispatchEvent(createEvent(("ps-scroll-" + down)));
    }

    if (useScrollingClass) {
      setScrollingClassInstantly(i, y);
    }
  }

  if (i.reach[y] && (diff || forceFireReachEvent)) {
    element.dispatchEvent(createEvent(("ps-" + y + "-reach-" + (i.reach[y]))));
  }
}

function toInt(x) {
  return parseInt(x, 10) || 0;
}

function isEditable(el) {
  return (
    matches(el, 'input,[contenteditable]') ||
    matches(el, 'select,[contenteditable]') ||
    matches(el, 'textarea,[contenteditable]') ||
    matches(el, 'button,[contenteditable]')
  );
}

function outerWidth(element) {
  var styles = get(element);
  return (
    toInt(styles.width) +
    toInt(styles.paddingLeft) +
    toInt(styles.paddingRight) +
    toInt(styles.borderLeftWidth) +
    toInt(styles.borderRightWidth)
  );
}

var env = {
  isWebKit: typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style,
  supportsTouch:
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      (window.DocumentTouch && document instanceof window.DocumentTouch)),
  supportsIePointer: typeof navigator !== 'undefined' && navigator.msMaxTouchPoints,
  isChrome: typeof navigator !== 'undefined' && /Chrome/i.test(navigator && navigator.userAgent),
};

var updateGeometry = function(i) {
  var element = i.element;

  i.containerWidth = element.clientWidth;
  i.containerHeight = element.clientHeight;
  i.contentWidth = element.scrollWidth;
  i.contentHeight = element.scrollHeight;

  if (!element.contains(i.scrollbarXRail)) {
    // clean up and append
    queryChildren(element, cls.element.rail('x')).forEach(function (el) { return remove(el); }
    );
    element.appendChild(i.scrollbarXRail);
  }
  if (!element.contains(i.scrollbarYRail)) {
    // clean up and append
    queryChildren(element, cls.element.rail('y')).forEach(function (el) { return remove(el); }
    );
    element.appendChild(i.scrollbarYRail);
  }

  if (
    !i.settings.suppressScrollX &&
    i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth
  ) {
    i.scrollbarXActive = true;
    i.railXWidth = i.containerWidth - i.railXMarginWidth;
    i.railXRatio = i.containerWidth / i.railXWidth;
    i.scrollbarXWidth = getThumbSize(
      i,
      toInt(i.railXWidth * i.containerWidth / i.contentWidth)
    );
    i.scrollbarXLeft = toInt(
      (i.negativeScrollAdjustment + element.scrollLeft) *
        (i.railXWidth - i.scrollbarXWidth) /
        (i.contentWidth - i.containerWidth)
    );
  } else {
    i.scrollbarXActive = false;
  }

  if (
    !i.settings.suppressScrollY &&
    i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight
  ) {
    i.scrollbarYActive = true;
    i.railYHeight = i.containerHeight - i.railYMarginHeight;
    i.railYRatio = i.containerHeight / i.railYHeight;
    i.scrollbarYHeight = getThumbSize(
      i,
      toInt(i.railYHeight * i.containerHeight / i.contentHeight)
    );
    i.scrollbarYTop = toInt(
      element.scrollTop *
        (i.railYHeight - i.scrollbarYHeight) /
        (i.contentHeight - i.containerHeight)
    );
  } else {
    i.scrollbarYActive = false;
  }

  if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
    i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
  }
  if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
    i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
  }

  updateCss(element, i);

  if (i.scrollbarXActive) {
    element.classList.add(cls.state.active('x'));
  } else {
    element.classList.remove(cls.state.active('x'));
    i.scrollbarXWidth = 0;
    i.scrollbarXLeft = 0;
    element.scrollLeft = 0;
  }
  if (i.scrollbarYActive) {
    element.classList.add(cls.state.active('y'));
  } else {
    element.classList.remove(cls.state.active('y'));
    i.scrollbarYHeight = 0;
    i.scrollbarYTop = 0;
    element.scrollTop = 0;
  }
};

function getThumbSize(i, thumbSize) {
  if (i.settings.minScrollbarLength) {
    thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
  }
  if (i.settings.maxScrollbarLength) {
    thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
  }
  return thumbSize;
}

function updateCss(element, i) {
  var xRailOffset = { width: i.railXWidth };
  if (i.isRtl) {
    xRailOffset.left =
      i.negativeScrollAdjustment +
      element.scrollLeft +
      i.containerWidth -
      i.contentWidth;
  } else {
    xRailOffset.left = element.scrollLeft;
  }
  if (i.isScrollbarXUsingBottom) {
    xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
  } else {
    xRailOffset.top = i.scrollbarXTop + element.scrollTop;
  }
  set(i.scrollbarXRail, xRailOffset);

  var yRailOffset = { top: element.scrollTop, height: i.railYHeight };
  if (i.isScrollbarYUsingRight) {
    if (i.isRtl) {
      yRailOffset.right =
        i.contentWidth -
        (i.negativeScrollAdjustment + element.scrollLeft) -
        i.scrollbarYRight -
        i.scrollbarYOuterWidth;
    } else {
      yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
    }
  } else {
    if (i.isRtl) {
      yRailOffset.left =
        i.negativeScrollAdjustment +
        element.scrollLeft +
        i.containerWidth * 2 -
        i.contentWidth -
        i.scrollbarYLeft -
        i.scrollbarYOuterWidth;
    } else {
      yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
    }
  }
  set(i.scrollbarYRail, yRailOffset);

  set(i.scrollbarX, {
    left: i.scrollbarXLeft,
    width: i.scrollbarXWidth - i.railBorderXWidth,
  });
  set(i.scrollbarY, {
    top: i.scrollbarYTop,
    height: i.scrollbarYHeight - i.railBorderYWidth,
  });
}

var clickRail = function(i) {
  i.event.bind(i.scrollbarY, 'mousedown', function (e) { return e.stopPropagation(); });
  i.event.bind(i.scrollbarYRail, 'mousedown', function (e) {
    var positionTop =
      e.pageY -
      window.pageYOffset -
      i.scrollbarYRail.getBoundingClientRect().top;
    var direction = positionTop > i.scrollbarYTop ? 1 : -1;

    i.element.scrollTop += direction * i.containerHeight;
    updateGeometry(i);

    e.stopPropagation();
  });

  i.event.bind(i.scrollbarX, 'mousedown', function (e) { return e.stopPropagation(); });
  i.event.bind(i.scrollbarXRail, 'mousedown', function (e) {
    var positionLeft =
      e.pageX -
      window.pageXOffset -
      i.scrollbarXRail.getBoundingClientRect().left;
    var direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

    i.element.scrollLeft += direction * i.containerWidth;
    updateGeometry(i);

    e.stopPropagation();
  });
};

var dragThumb = function(i) {
  bindMouseScrollHandler(i, [
    'containerWidth',
    'contentWidth',
    'pageX',
    'railXWidth',
    'scrollbarX',
    'scrollbarXWidth',
    'scrollLeft',
    'x' ]);
  bindMouseScrollHandler(i, [
    'containerHeight',
    'contentHeight',
    'pageY',
    'railYHeight',
    'scrollbarY',
    'scrollbarYHeight',
    'scrollTop',
    'y' ]);
};

function bindMouseScrollHandler(
  i,
  ref
) {
  var containerHeight = ref[0];
  var contentHeight = ref[1];
  var pageY = ref[2];
  var railYHeight = ref[3];
  var scrollbarY = ref[4];
  var scrollbarYHeight = ref[5];
  var scrollTop = ref[6];
  var y = ref[7];

  var element = i.element;

  var startingScrollTop = null;
  var startingMousePageY = null;
  var scrollBy = null;

  function mouseMoveHandler(e) {
    element[scrollTop] =
      startingScrollTop + scrollBy * (e[pageY] - startingMousePageY);
    addScrollingClass(i, y);
    updateGeometry(i);

    e.stopPropagation();
    e.preventDefault();
  }

  function mouseUpHandler() {
    removeScrollingClass(i, y);
    i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
  }

  i.event.bind(i[scrollbarY], 'mousedown', function (e) {
    startingScrollTop = element[scrollTop];
    startingMousePageY = e[pageY];
    scrollBy =
      (i[contentHeight] - i[containerHeight]) /
      (i[railYHeight] - i[scrollbarYHeight]);

    i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
    i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

    e.stopPropagation();
    e.preventDefault();
  });
}

var keyboard = function(i) {
  var element = i.element;

  var elementHovered = function () { return matches(element, ':hover'); };
  var scrollbarFocused = function () { return matches(i.scrollbarX, ':focus') || matches(i.scrollbarY, ':focus'); };

  function shouldPreventDefault(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    if (deltaX === 0) {
      if (!i.scrollbarYActive) {
        return false;
      }
      if (
        (scrollTop === 0 && deltaY > 0) ||
        (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)
      ) {
        return !i.settings.wheelPropagation;
      }
    }

    var scrollLeft = element.scrollLeft;
    if (deltaY === 0) {
      if (!i.scrollbarXActive) {
        return false;
      }
      if (
        (scrollLeft === 0 && deltaX < 0) ||
        (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)
      ) {
        return !i.settings.wheelPropagation;
      }
    }
    return true;
  }

  i.event.bind(i.ownerDocument, 'keydown', function (e) {
    if (
      (e.isDefaultPrevented && e.isDefaultPrevented()) ||
      e.defaultPrevented
    ) {
      return;
    }

    if (!elementHovered() && !scrollbarFocused()) {
      return;
    }

    var activeElement = document.activeElement
      ? document.activeElement
      : i.ownerDocument.activeElement;
    if (activeElement) {
      if (activeElement.tagName === 'IFRAME') {
        activeElement = activeElement.contentDocument.activeElement;
      } else {
        // go deeper if element is a webcomponent
        while (activeElement.shadowRoot) {
          activeElement = activeElement.shadowRoot.activeElement;
        }
      }
      if (isEditable(activeElement)) {
        return;
      }
    }

    var deltaX = 0;
    var deltaY = 0;

    switch (e.which) {
      case 37: // left
        if (e.metaKey) {
          deltaX = -i.contentWidth;
        } else if (e.altKey) {
          deltaX = -i.containerWidth;
        } else {
          deltaX = -30;
        }
        break;
      case 38: // up
        if (e.metaKey) {
          deltaY = i.contentHeight;
        } else if (e.altKey) {
          deltaY = i.containerHeight;
        } else {
          deltaY = 30;
        }
        break;
      case 39: // right
        if (e.metaKey) {
          deltaX = i.contentWidth;
        } else if (e.altKey) {
          deltaX = i.containerWidth;
        } else {
          deltaX = 30;
        }
        break;
      case 40: // down
        if (e.metaKey) {
          deltaY = -i.contentHeight;
        } else if (e.altKey) {
          deltaY = -i.containerHeight;
        } else {
          deltaY = -30;
        }
        break;
      case 32: // space bar
        if (e.shiftKey) {
          deltaY = i.containerHeight;
        } else {
          deltaY = -i.containerHeight;
        }
        break;
      case 33: // page up
        deltaY = i.containerHeight;
        break;
      case 34: // page down
        deltaY = -i.containerHeight;
        break;
      case 36: // home
        deltaY = i.contentHeight;
        break;
      case 35: // end
        deltaY = -i.contentHeight;
        break;
      default:
        return;
    }

    if (i.settings.suppressScrollX && deltaX !== 0) {
      return;
    }
    if (i.settings.suppressScrollY && deltaY !== 0) {
      return;
    }

    element.scrollTop -= deltaY;
    element.scrollLeft += deltaX;
    updateGeometry(i);

    if (shouldPreventDefault(deltaX, deltaY)) {
      e.preventDefault();
    }
  });
};

var wheel = function(i) {
  var element = i.element;

  function shouldPreventDefault(deltaX, deltaY) {
    var isTop = element.scrollTop === 0;
    var isBottom =
      element.scrollTop + element.offsetHeight === element.scrollHeight;
    var isLeft = element.scrollLeft === 0;
    var isRight =
      element.scrollLeft + element.offsetWidth === element.offsetWidth;

    var hitsBound;

    // pick axis with primary direction
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      hitsBound = isTop || isBottom;
    } else {
      hitsBound = isLeft || isRight;
    }

    return hitsBound ? !i.settings.wheelPropagation : true;
  }

  function getDeltaFromEvent(e) {
    var deltaX = e.deltaX;
    var deltaY = -1 * e.deltaY;

    if (typeof deltaX === 'undefined' || typeof deltaY === 'undefined') {
      // OS X Safari
      deltaX = -1 * e.wheelDeltaX / 6;
      deltaY = e.wheelDeltaY / 6;
    }

    if (e.deltaMode && e.deltaMode === 1) {
      // Firefox in deltaMode 1: Line scrolling
      deltaX *= 10;
      deltaY *= 10;
    }

    if (deltaX !== deltaX && deltaY !== deltaY /* NaN checks */) {
      // IE in some mouse drivers
      deltaX = 0;
      deltaY = e.wheelDelta;
    }

    if (e.shiftKey) {
      // reverse axis with shift key
      return [-deltaY, -deltaX];
    }
    return [deltaX, deltaY];
  }

  function shouldBeConsumedByChild(target, deltaX, deltaY) {
    // FIXME: this is a workaround for <select> issue in FF and IE #571
    if (!env.isWebKit && element.querySelector('select:focus')) {
      return true;
    }

    if (!element.contains(target)) {
      return false;
    }

    var cursor = target;

    while (cursor && cursor !== element) {
      if (cursor.classList.contains(cls.element.consuming)) {
        return true;
      }

      var style = get(cursor);
      var overflow = [style.overflow, style.overflowX, style.overflowY].join(
        ''
      );

      // if scrollable
      if (overflow.match(/(scroll|auto)/)) {
        var maxScrollTop = cursor.scrollHeight - cursor.clientHeight;
        if (maxScrollTop > 0) {
          if (
            !(cursor.scrollTop === 0 && deltaY > 0) &&
            !(cursor.scrollTop === maxScrollTop && deltaY < 0)
          ) {
            return true;
          }
        }
        var maxScrollLeft = cursor.scrollLeft - cursor.clientWidth;
        if (maxScrollLeft > 0) {
          if (
            !(cursor.scrollLeft === 0 && deltaX < 0) &&
            !(cursor.scrollLeft === maxScrollLeft && deltaX > 0)
          ) {
            return true;
          }
        }
      }

      cursor = cursor.parentNode;
    }

    return false;
  }

  function mousewheelHandler(e) {
    var ref = getDeltaFromEvent(e);
    var deltaX = ref[0];
    var deltaY = ref[1];

    if (shouldBeConsumedByChild(e.target, deltaX, deltaY)) {
      return;
    }

    var shouldPrevent = false;
    if (!i.settings.useBothWheelAxes) {
      // deltaX will only be used for horizontal scrolling and deltaY will
      // only be used for vertical scrolling - this is the default
      element.scrollTop -= deltaY * i.settings.wheelSpeed;
      element.scrollLeft += deltaX * i.settings.wheelSpeed;
    } else if (i.scrollbarYActive && !i.scrollbarXActive) {
      // only vertical scrollbar is active and useBothWheelAxes option is
      // active, so let's scroll vertical bar using both mouse wheel axes
      if (deltaY) {
        element.scrollTop -= deltaY * i.settings.wheelSpeed;
      } else {
        element.scrollTop += deltaX * i.settings.wheelSpeed;
      }
      shouldPrevent = true;
    } else if (i.scrollbarXActive && !i.scrollbarYActive) {
      // useBothWheelAxes and only horizontal bar is active, so use both
      // wheel axes for horizontal bar
      if (deltaX) {
        element.scrollLeft += deltaX * i.settings.wheelSpeed;
      } else {
        element.scrollLeft -= deltaY * i.settings.wheelSpeed;
      }
      shouldPrevent = true;
    }

    updateGeometry(i);

    shouldPrevent = shouldPrevent || shouldPreventDefault(deltaX, deltaY);
    if (shouldPrevent && !e.ctrlKey) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  if (typeof window.onwheel !== 'undefined') {
    i.event.bind(element, 'wheel', mousewheelHandler);
  } else if (typeof window.onmousewheel !== 'undefined') {
    i.event.bind(element, 'mousewheel', mousewheelHandler);
  }
};

var touch = function(i) {
  if (!env.supportsTouch && !env.supportsIePointer) {
    return;
  }

  var element = i.element;

  function shouldPrevent(deltaX, deltaY) {
    var scrollTop = element.scrollTop;
    var scrollLeft = element.scrollLeft;
    var magnitudeX = Math.abs(deltaX);
    var magnitudeY = Math.abs(deltaY);

    if (magnitudeY > magnitudeX) {
      // user is perhaps trying to swipe up/down the page

      if (
        (deltaY < 0 && scrollTop === i.contentHeight - i.containerHeight) ||
        (deltaY > 0 && scrollTop === 0)
      ) {
        // set prevent for mobile Chrome refresh
        return window.scrollY === 0 && deltaY > 0 && env.isChrome;
      }
    } else if (magnitudeX > magnitudeY) {
      // user is perhaps trying to swipe left/right across the page

      if (
        (deltaX < 0 && scrollLeft === i.contentWidth - i.containerWidth) ||
        (deltaX > 0 && scrollLeft === 0)
      ) {
        return true;
      }
    }

    return true;
  }

  function applyTouchMove(differenceX, differenceY) {
    element.scrollTop -= differenceY;
    element.scrollLeft -= differenceX;

    updateGeometry(i);
  }

  var startOffset = {};
  var startTime = 0;
  var speed = {};
  var easingLoop = null;

  function getTouch(e) {
    if (e.targetTouches) {
      return e.targetTouches[0];
    } else {
      // Maybe IE pointer
      return e;
    }
  }

  function shouldHandle(e) {
    if (e.pointerType && e.pointerType === 'pen' && e.buttons === 0) {
      return false;
    }
    if (e.targetTouches && e.targetTouches.length === 1) {
      return true;
    }
    if (
      e.pointerType &&
      e.pointerType !== 'mouse' &&
      e.pointerType !== e.MSPOINTER_TYPE_MOUSE
    ) {
      return true;
    }
    return false;
  }

  function touchStart(e) {
    if (!shouldHandle(e)) {
      return;
    }

    var touch = getTouch(e);

    startOffset.pageX = touch.pageX;
    startOffset.pageY = touch.pageY;

    startTime = new Date().getTime();

    if (easingLoop !== null) {
      clearInterval(easingLoop);
    }
  }

  function shouldBeConsumedByChild(target, deltaX, deltaY) {
    if (!element.contains(target)) {
      return false;
    }

    var cursor = target;

    while (cursor && cursor !== element) {
      if (cursor.classList.contains(cls.element.consuming)) {
        return true;
      }

      var style = get(cursor);
      var overflow = [style.overflow, style.overflowX, style.overflowY].join(
        ''
      );

      // if scrollable
      if (overflow.match(/(scroll|auto)/)) {
        var maxScrollTop = cursor.scrollHeight - cursor.clientHeight;
        if (maxScrollTop > 0) {
          if (
            !(cursor.scrollTop === 0 && deltaY > 0) &&
            !(cursor.scrollTop === maxScrollTop && deltaY < 0)
          ) {
            return true;
          }
        }
        var maxScrollLeft = cursor.scrollLeft - cursor.clientWidth;
        if (maxScrollLeft > 0) {
          if (
            !(cursor.scrollLeft === 0 && deltaX < 0) &&
            !(cursor.scrollLeft === maxScrollLeft && deltaX > 0)
          ) {
            return true;
          }
        }
      }

      cursor = cursor.parentNode;
    }

    return false;
  }

  function touchMove(e) {
    if (shouldHandle(e)) {
      var touch = getTouch(e);

      var currentOffset = { pageX: touch.pageX, pageY: touch.pageY };

      var differenceX = currentOffset.pageX - startOffset.pageX;
      var differenceY = currentOffset.pageY - startOffset.pageY;

      if (shouldBeConsumedByChild(e.target, differenceX, differenceY)) {
        return;
      }

      applyTouchMove(differenceX, differenceY);
      startOffset = currentOffset;

      var currentTime = new Date().getTime();

      var timeGap = currentTime - startTime;
      if (timeGap > 0) {
        speed.x = differenceX / timeGap;
        speed.y = differenceY / timeGap;
        startTime = currentTime;
      }

      if (shouldPrevent(differenceX, differenceY)) {
        e.preventDefault();
      }
    }
  }
  function touchEnd() {
    if (i.settings.swipeEasing) {
      clearInterval(easingLoop);
      easingLoop = setInterval(function() {
        if (i.isInitialized) {
          clearInterval(easingLoop);
          return;
        }

        if (!speed.x && !speed.y) {
          clearInterval(easingLoop);
          return;
        }

        if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
          clearInterval(easingLoop);
          return;
        }

        applyTouchMove(speed.x * 30, speed.y * 30);

        speed.x *= 0.8;
        speed.y *= 0.8;
      }, 10);
    }
  }

  if (env.supportsTouch) {
    i.event.bind(element, 'touchstart', touchStart);
    i.event.bind(element, 'touchmove', touchMove);
    i.event.bind(element, 'touchend', touchEnd);
  } else if (env.supportsIePointer) {
    if (window.PointerEvent) {
      i.event.bind(element, 'pointerdown', touchStart);
      i.event.bind(element, 'pointermove', touchMove);
      i.event.bind(element, 'pointerup', touchEnd);
    } else if (window.MSPointerEvent) {
      i.event.bind(element, 'MSPointerDown', touchStart);
      i.event.bind(element, 'MSPointerMove', touchMove);
      i.event.bind(element, 'MSPointerUp', touchEnd);
    }
  }
};

var defaultSettings = function () { return ({
  handlers: ['click-rail', 'drag-thumb', 'keyboard', 'wheel', 'touch'],
  maxScrollbarLength: null,
  minScrollbarLength: null,
  scrollingThreshold: 1000,
  scrollXMarginOffset: 0,
  scrollYMarginOffset: 0,
  suppressScrollX: false,
  suppressScrollY: false,
  swipeEasing: true,
  useBothWheelAxes: false,
  wheelPropagation: false,
  wheelSpeed: 1,
}); };

var handlers = {
  'click-rail': clickRail,
  'drag-thumb': dragThumb,
  keyboard: keyboard,
  wheel: wheel,
  touch: touch,
};

var PerfectScrollbar = function PerfectScrollbar(element, userSettings) {
  var this$1 = this;
  if ( userSettings === void 0 ) userSettings = {};

  if (typeof element === 'string') {
    element = document.querySelector(element);
  }

  if (!element || !element.nodeName) {
    throw new Error('no element is specified to initialize PerfectScrollbar');
  }

  this.element = element;

  element.classList.add(cls.main);

  this.settings = defaultSettings();
  for (var key in userSettings) {
    this$1.settings[key] = userSettings[key];
  }

  this.containerWidth = null;
  this.containerHeight = null;
  this.contentWidth = null;
  this.contentHeight = null;

  var focus = function () { return element.classList.add(cls.state.focus); };
  var blur = function () { return element.classList.remove(cls.state.focus); };

  this.isRtl = get(element).direction === 'rtl';
  this.isNegativeScroll = (function () {
    var originalScrollLeft = element.scrollLeft;
    var result = null;
    element.scrollLeft = -1;
    result = element.scrollLeft < 0;
    element.scrollLeft = originalScrollLeft;
    return result;
  })();
  this.negativeScrollAdjustment = this.isNegativeScroll
    ? element.scrollWidth - element.clientWidth
    : 0;
  this.event = new EventManager();
  this.ownerDocument = element.ownerDocument || document;

  this.scrollbarXRail = div(cls.element.rail('x'));
  element.appendChild(this.scrollbarXRail);
  this.scrollbarX = div(cls.element.thumb('x'));
  this.scrollbarXRail.appendChild(this.scrollbarX);
  this.scrollbarX.setAttribute('tabindex', 0);
  this.event.bind(this.scrollbarX, 'focus', focus);
  this.event.bind(this.scrollbarX, 'blur', blur);
  this.scrollbarXActive = null;
  this.scrollbarXWidth = null;
  this.scrollbarXLeft = null;
  var railXStyle = get(this.scrollbarXRail);
  this.scrollbarXBottom = parseInt(railXStyle.bottom, 10);
  if (isNaN(this.scrollbarXBottom)) {
    this.isScrollbarXUsingBottom = false;
    this.scrollbarXTop = toInt(railXStyle.top);
  } else {
    this.isScrollbarXUsingBottom = true;
  }
  this.railBorderXWidth =
    toInt(railXStyle.borderLeftWidth) + toInt(railXStyle.borderRightWidth);
  // Set rail to display:block to calculate margins
  set(this.scrollbarXRail, { display: 'block' });
  this.railXMarginWidth =
    toInt(railXStyle.marginLeft) + toInt(railXStyle.marginRight);
  set(this.scrollbarXRail, { display: '' });
  this.railXWidth = null;
  this.railXRatio = null;

  this.scrollbarYRail = div(cls.element.rail('y'));
  element.appendChild(this.scrollbarYRail);
  this.scrollbarY = div(cls.element.thumb('y'));
  this.scrollbarYRail.appendChild(this.scrollbarY);
  this.scrollbarY.setAttribute('tabindex', 0);
  this.event.bind(this.scrollbarY, 'focus', focus);
  this.event.bind(this.scrollbarY, 'blur', blur);
  this.scrollbarYActive = null;
  this.scrollbarYHeight = null;
  this.scrollbarYTop = null;
  var railYStyle = get(this.scrollbarYRail);
  this.scrollbarYRight = parseInt(railYStyle.right, 10);
  if (isNaN(this.scrollbarYRight)) {
    this.isScrollbarYUsingRight = false;
    this.scrollbarYLeft = toInt(railYStyle.left);
  } else {
    this.isScrollbarYUsingRight = true;
  }
  this.scrollbarYOuterWidth = this.isRtl ? outerWidth(this.scrollbarY) : null;
  this.railBorderYWidth =
    toInt(railYStyle.borderTopWidth) + toInt(railYStyle.borderBottomWidth);
  set(this.scrollbarYRail, { display: 'block' });
  this.railYMarginHeight =
    toInt(railYStyle.marginTop) + toInt(railYStyle.marginBottom);
  set(this.scrollbarYRail, { display: '' });
  this.railYHeight = null;
  this.railYRatio = null;

  this.reach = {
    x:
      element.scrollLeft <= 0
        ? 'start'
        : element.scrollLeft >= this.contentWidth - this.containerWidth
          ? 'end'
          : null,
    y:
      element.scrollTop <= 0
        ? 'start'
        : element.scrollTop >= this.contentHeight - this.containerHeight
          ? 'end'
          : null,
  };

  this.isAlive = true;

  this.settings.handlers.forEach(function (handlerName) { return handlers[handlerName](this$1); });

  this.lastScrollTop = element.scrollTop; // for onScroll only
  this.lastScrollLeft = element.scrollLeft; // for onScroll only
  this.event.bind(this.element, 'scroll', function (e) { return this$1.onScroll(e); });
  updateGeometry(this);
};

PerfectScrollbar.prototype.update = function update () {
  if (!this.isAlive) {
    return;
  }

  // Recalcuate negative scrollLeft adjustment
  this.negativeScrollAdjustment = this.isNegativeScroll
    ? this.element.scrollWidth - this.element.clientWidth
    : 0;

  // Recalculate rail margins
  set(this.scrollbarXRail, { display: 'block' });
  set(this.scrollbarYRail, { display: 'block' });
  this.railXMarginWidth =
    toInt(get(this.scrollbarXRail).marginLeft) +
    toInt(get(this.scrollbarXRail).marginRight);
  this.railYMarginHeight =
    toInt(get(this.scrollbarYRail).marginTop) +
    toInt(get(this.scrollbarYRail).marginBottom);

  // Hide scrollbars not to affect scrollWidth and scrollHeight
  set(this.scrollbarXRail, { display: 'none' });
  set(this.scrollbarYRail, { display: 'none' });

  updateGeometry(this);

  processScrollDiff(this, 'top', 0, false, true);
  processScrollDiff(this, 'left', 0, false, true);

  set(this.scrollbarXRail, { display: '' });
  set(this.scrollbarYRail, { display: '' });
};

PerfectScrollbar.prototype.onScroll = function onScroll (e) {
  if (!this.isAlive) {
    return;
  }

  updateGeometry(this);
  processScrollDiff(this, 'top', this.element.scrollTop - this.lastScrollTop);
  processScrollDiff(
    this,
    'left',
    this.element.scrollLeft - this.lastScrollLeft
  );

  this.lastScrollTop = this.element.scrollTop;
  this.lastScrollLeft = this.element.scrollLeft;
};

PerfectScrollbar.prototype.destroy = function destroy () {
  if (!this.isAlive) {
    return;
  }

  this.event.unbindAll();
  remove(this.scrollbarX);
  remove(this.scrollbarY);
  remove(this.scrollbarXRail);
  remove(this.scrollbarYRail);
  this.removePsClasses();

  // unset elements
  this.element = null;
  this.scrollbarX = null;
  this.scrollbarY = null;
  this.scrollbarXRail = null;
  this.scrollbarYRail = null;

  this.isAlive = false;
};

PerfectScrollbar.prototype.removePsClasses = function removePsClasses () {
  this.element.className = this.element.className
    .split(' ')
    .filter(function (name) { return !name.match(/^ps([-_].+|)$/); })
    .join(' ');
};

/**
 * A collection of shims that provide minimal functionality of the ES6 collections.
 *
 * These implementations are not meant to be used outside of the ResizeObserver
 * modules as they cover only a limited range of use cases.
 */
/* eslint-disable require-jsdoc, valid-jsdoc */
var MapShim = (function () {
    if (typeof Map != 'undefined') {
        return Map;
    }

    /**
     * Returns index in provided array that matches the specified key.
     *
     * @param {Array<Array>} arr
     * @param {*} key
     * @returns {number}
     */
    function getIndex(arr, key) {
        var result = -1;

        arr.some(function (entry, index) {
            if (entry[0] === key) {
                result = index;

                return true;
            }

            return false;
        });

        return result;
    }

    return (function () {
        function anonymous() {
            this.__entries__ = [];
        }

        var prototypeAccessors = { size: {} };

        /**
         * @returns {boolean}
         */
        prototypeAccessors.size.get = function () {
            return this.__entries__.length;
        };

        /**
         * @param {*} key
         * @returns {*}
         */
        anonymous.prototype.get = function (key) {
            var index = getIndex(this.__entries__, key);
            var entry = this.__entries__[index];

            return entry && entry[1];
        };

        /**
         * @param {*} key
         * @param {*} value
         * @returns {void}
         */
        anonymous.prototype.set = function (key, value) {
            var index = getIndex(this.__entries__, key);

            if (~index) {
                this.__entries__[index][1] = value;
            } else {
                this.__entries__.push([key, value]);
            }
        };

        /**
         * @param {*} key
         * @returns {void}
         */
        anonymous.prototype.delete = function (key) {
            var entries = this.__entries__;
            var index = getIndex(entries, key);

            if (~index) {
                entries.splice(index, 1);
            }
        };

        /**
         * @param {*} key
         * @returns {void}
         */
        anonymous.prototype.has = function (key) {
            return !!~getIndex(this.__entries__, key);
        };

        /**
         * @returns {void}
         */
        anonymous.prototype.clear = function () {
            this.__entries__.splice(0);
        };

        /**
         * @param {Function} callback
         * @param {*} [ctx=null]
         * @returns {void}
         */
        anonymous.prototype.forEach = function (callback, ctx) {
            if ( ctx === void 0 ) ctx = null;

            for (var i = 0, list = this.__entries__; i < list.length; i += 1) {
                var entry = list[i];

                callback.call(ctx, entry[1], entry[0]);
            }
        };

        Object.defineProperties( anonymous.prototype, prototypeAccessors );

        return anonymous;
    }());
})();

/**
 * Detects whether window and document objects are available in current environment.
 */
var isBrowser = typeof window != 'undefined' && typeof document != 'undefined' && window.document === document;

/**
 * A shim for the requestAnimationFrame which falls back to the setTimeout if
 * first one is not supported.
 *
 * @returns {number} Requests' identifier.
 */
var requestAnimationFrame$1 = (function () {
    if (typeof requestAnimationFrame === 'function') {
        return requestAnimationFrame;
    }

    return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
})();

// Defines minimum timeout before adding a trailing call.
var trailingTimeout = 2;

/**
 * Creates a wrapper function which ensures that provided callback will be
 * invoked only once during the specified delay period.
 *
 * @param {Function} callback - Function to be invoked after the delay period.
 * @param {number} delay - Delay after which to invoke callback.
 * @returns {Function}
 */
var throttle = function (callback, delay) {
    var leadingCall = false,
        trailingCall = false,
        lastCallTime = 0;

    /**
     * Invokes the original callback function and schedules new invocation if
     * the "proxy" was called during current request.
     *
     * @returns {void}
     */
    function resolvePending() {
        if (leadingCall) {
            leadingCall = false;

            callback();
        }

        if (trailingCall) {
            proxy();
        }
    }

    /**
     * Callback invoked after the specified delay. It will further postpone
     * invocation of the original function delegating it to the
     * requestAnimationFrame.
     *
     * @returns {void}
     */
    function timeoutCallback() {
        requestAnimationFrame$1(resolvePending);
    }

    /**
     * Schedules invocation of the original function.
     *
     * @returns {void}
     */
    function proxy() {
        var timeStamp = Date.now();

        if (leadingCall) {
            // Reject immediately following calls.
            if (timeStamp - lastCallTime < trailingTimeout) {
                return;
            }

            // Schedule new call to be in invoked when the pending one is resolved.
            // This is important for "transitions" which never actually start
            // immediately so there is a chance that we might miss one if change
            // happens amids the pending invocation.
            trailingCall = true;
        } else {
            leadingCall = true;
            trailingCall = false;

            setTimeout(timeoutCallback, delay);
        }

        lastCallTime = timeStamp;
    }

    return proxy;
};

// Minimum delay before invoking the update of observers.
var REFRESH_DELAY = 20;

// A list of substrings of CSS properties used to find transition events that
// might affect dimensions of observed elements.
var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];

// Detect whether running in IE 11 (facepalm).
var isIE11 = typeof navigator != 'undefined' && /Trident\/.*rv:11/.test(navigator.userAgent);

// MutationObserver should not be used if running in Internet Explorer 11 as it's
// implementation is unreliable. Example: https://jsfiddle.net/x2r3jpuz/2/
//
// It's a real bummer that there is no other way to check for this issue but to
// use the UA information.
var mutationObserverSupported = typeof MutationObserver != 'undefined' && !isIE11;

/**
 * Singleton controller class which handles updates of ResizeObserver instances.
 */
var ResizeObserverController = function() {
    /**
     * Indicates whether DOM listeners have been added.
     *
     * @private {boolean}
     */
    this.connected_ = false;

    /**
     * Tells that controller has subscribed for Mutation Events.
     *
     * @private {boolean}
     */
    this.mutationEventsAdded_ = false;

    /**
     * Keeps reference to the instance of MutationObserver.
     *
     * @private {MutationObserver}
     */
    this.mutationsObserver_ = null;

    /**
     * A list of connected observers.
     *
     * @private {Array<ResizeObserverSPI>}
     */
    this.observers_ = [];

    this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
    this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
};

/**
 * Adds observer to observers list.
 *
 * @param {ResizeObserverSPI} observer - Observer to be added.
 * @returns {void}
 */
ResizeObserverController.prototype.addObserver = function (observer) {
    if (!~this.observers_.indexOf(observer)) {
        this.observers_.push(observer);
    }

    // Add listeners if they haven't been added yet.
    if (!this.connected_) {
        this.connect_();
    }
};

/**
 * Removes observer from observers list.
 *
 * @param {ResizeObserverSPI} observer - Observer to be removed.
 * @returns {void}
 */
ResizeObserverController.prototype.removeObserver = function (observer) {
    var observers = this.observers_;
    var index = observers.indexOf(observer);

    // Remove observer if it's present in registry.
    if (~index) {
        observers.splice(index, 1);
    }

    // Remove listeners if controller has no connected observers.
    if (!observers.length && this.connected_) {
        this.disconnect_();
    }
};

/**
 * Invokes the update of observers. It will continue running updates insofar
 * it detects changes.
 *
 * @returns {void}
 */
ResizeObserverController.prototype.refresh = function () {
    var changesDetected = this.updateObservers_();

    // Continue running updates if changes have been detected as there might
    // be future ones caused by CSS transitions.
    if (changesDetected) {
        this.refresh();
    }
};

/**
 * Updates every observer from observers list and notifies them of queued
 * entries.
 *
 * @private
 * @returns {boolean} Returns "true" if any observer has detected changes in
 *  dimensions of it's elements.
 */
ResizeObserverController.prototype.updateObservers_ = function () {
    // Collect observers that have active observations.
    var activeObservers = this.observers_.filter(function (observer) {
        return observer.gatherActive(), observer.hasActive();
    });

    // Deliver notifications in a separate cycle in order to avoid any
    // collisions between observers, e.g. when multiple instances of
    // ResizeObserver are tracking the same element and the callback of one
    // of them changes content dimensions of the observed target. Sometimes
    // this may result in notifications being blocked for the rest of observers.
    activeObservers.forEach(function (observer) { return observer.broadcastActive(); });

    return activeObservers.length > 0;
};

/**
 * Initializes DOM listeners.
 *
 * @private
 * @returns {void}
 */
ResizeObserverController.prototype.connect_ = function () {
    // Do nothing if running in a non-browser environment or if listeners
    // have been already added.
    if (!isBrowser || this.connected_) {
        return;
    }

    // Subscription to the "Transitionend" event is used as a workaround for
    // delayed transitions. This way it's possible to capture at least the
    // final state of an element.
    document.addEventListener('transitionend', this.onTransitionEnd_);

    window.addEventListener('resize', this.refresh);

    if (mutationObserverSupported) {
        this.mutationsObserver_ = new MutationObserver(this.refresh);

        this.mutationsObserver_.observe(document, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMSubtreeModified', this.refresh);

        this.mutationEventsAdded_ = true;
    }

    this.connected_ = true;
};

/**
 * Removes DOM listeners.
 *
 * @private
 * @returns {void}
 */
ResizeObserverController.prototype.disconnect_ = function () {
    // Do nothing if running in a non-browser environment or if listeners
    // have been already removed.
    if (!isBrowser || !this.connected_) {
        return;
    }

    document.removeEventListener('transitionend', this.onTransitionEnd_);
    window.removeEventListener('resize', this.refresh);

    if (this.mutationsObserver_) {
        this.mutationsObserver_.disconnect();
    }

    if (this.mutationEventsAdded_) {
        document.removeEventListener('DOMSubtreeModified', this.refresh);
    }

    this.mutationsObserver_ = null;
    this.mutationEventsAdded_ = false;
    this.connected_ = false;
};

/**
 * "Transitionend" event handler.
 *
 * @private
 * @param {TransitionEvent} event
 * @returns {void}
 */
ResizeObserverController.prototype.onTransitionEnd_ = function (ref) {
        var propertyName = ref.propertyName;

    // Detect whether transition may affect dimensions of an element.
    var isReflowProperty = transitionKeys.some(function (key) {
        return !!~propertyName.indexOf(key);
    });

    if (isReflowProperty) {
        this.refresh();
    }
};

/**
 * Returns instance of the ResizeObserverController.
 *
 * @returns {ResizeObserverController}
 */
ResizeObserverController.getInstance = function () {
    if (!this.instance_) {
        this.instance_ = new ResizeObserverController();
    }

    return this.instance_;
};

/**
 * Holds reference to the controller's instance.
 *
 * @private {ResizeObserverController}
 */
ResizeObserverController.instance_ = null;

/**
 * Defines non-writable/enumerable properties of the provided target object.
 *
 * @param {Object} target - Object for which to define properties.
 * @param {Object} props - Properties to be defined.
 * @returns {Object} Target object.
 */
var defineConfigurable = (function (target, props) {
    for (var i = 0, list = Object.keys(props); i < list.length; i += 1) {
        var key = list[i];

        Object.defineProperty(target, key, {
            value: props[key],
            enumerable: false,
            writable: false,
            configurable: true
        });
    }

    return target;
});

// Placeholder of an empty content rectangle.
var emptyRect = createRectInit(0, 0, 0, 0);

/**
 * Converts provided string to a number.
 *
 * @param {number|string} value
 * @returns {number}
 */
function toFloat(value) {
    return parseFloat(value) || 0;
}

/**
 * Extracts borders size from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @param {...string} positions - Borders positions (top, right, ...)
 * @returns {number}
 */
function getBordersSize(styles) {
    var positions = Array.prototype.slice.call(arguments, 1);

    return positions.reduce(function (size, position) {
        var value = styles['border-' + position + '-width'];

        return size + toFloat(value);
    }, 0);
}

/**
 * Extracts paddings sizes from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @returns {Object} Paddings box.
 */
function getPaddings(styles) {
    var positions = ['top', 'right', 'bottom', 'left'];
    var paddings = {};

    for (var i = 0, list = positions; i < list.length; i += 1) {
        var position = list[i];

        var value = styles['padding-' + position];

        paddings[position] = toFloat(value);
    }

    return paddings;
}

/**
 * Calculates content rectangle of provided SVG element.
 *
 * @param {SVGGraphicsElement} target - Element content rectangle of which needs
 *      to be calculated.
 * @returns {DOMRectInit}
 */
function getSVGContentRect(target) {
    var bbox = target.getBBox();

    return createRectInit(0, 0, bbox.width, bbox.height);
}

/**
 * Calculates content rectangle of provided HTMLElement.
 *
 * @param {HTMLElement} target - Element for which to calculate the content rectangle.
 * @returns {DOMRectInit}
 */
function getHTMLElementContentRect(target) {
    // Client width & height properties can't be
    // used exclusively as they provide rounded values.
    var clientWidth = target.clientWidth;
    var clientHeight = target.clientHeight;

    // By this condition we can catch all non-replaced inline, hidden and
    // detached elements. Though elements with width & height properties less
    // than 0.5 will be discarded as well.
    //
    // Without it we would need to implement separate methods for each of
    // those cases and it's not possible to perform a precise and performance
    // effective test for hidden elements. E.g. even jQuery's ':visible' filter
    // gives wrong results for elements with width & height less than 0.5.
    if (!clientWidth && !clientHeight) {
        return emptyRect;
    }

    var styles = getComputedStyle(target);
    var paddings = getPaddings(styles);
    var horizPad = paddings.left + paddings.right;
    var vertPad = paddings.top + paddings.bottom;

    // Computed styles of width & height are being used because they are the
    // only dimensions available to JS that contain non-rounded values. It could
    // be possible to utilize the getBoundingClientRect if only it's data wasn't
    // affected by CSS transformations let alone paddings, borders and scroll bars.
    var width = toFloat(styles.width),
        height = toFloat(styles.height);

    // Width & height include paddings and borders when the 'border-box' box
    // model is applied (except for IE).
    if (styles.boxSizing === 'border-box') {
        // Following conditions are required to handle Internet Explorer which
        // doesn't include paddings and borders to computed CSS dimensions.
        //
        // We can say that if CSS dimensions + paddings are equal to the "client"
        // properties then it's either IE, and thus we don't need to subtract
        // anything, or an element merely doesn't have paddings/borders styles.
        if (Math.round(width + horizPad) !== clientWidth) {
            width -= getBordersSize(styles, 'left', 'right') + horizPad;
        }

        if (Math.round(height + vertPad) !== clientHeight) {
            height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
        }
    }

    // Following steps can't be applied to the document's root element as its
    // client[Width/Height] properties represent viewport area of the window.
    // Besides, it's as well not necessary as the <html> itself neither has
    // rendered scroll bars nor it can be clipped.
    if (!isDocumentElement(target)) {
        // In some browsers (only in Firefox, actually) CSS width & height
        // include scroll bars size which can be removed at this step as scroll
        // bars are the only difference between rounded dimensions + paddings
        // and "client" properties, though that is not always true in Chrome.
        var vertScrollbar = Math.round(width + horizPad) - clientWidth;
        var horizScrollbar = Math.round(height + vertPad) - clientHeight;

        // Chrome has a rather weird rounding of "client" properties.
        // E.g. for an element with content width of 314.2px it sometimes gives
        // the client width of 315px and for the width of 314.7px it may give
        // 314px. And it doesn't happen all the time. So just ignore this delta
        // as a non-relevant.
        if (Math.abs(vertScrollbar) !== 1) {
            width -= vertScrollbar;
        }

        if (Math.abs(horizScrollbar) !== 1) {
            height -= horizScrollbar;
        }
    }

    return createRectInit(paddings.left, paddings.top, width, height);
}

/**
 * Checks whether provided element is an instance of the SVGGraphicsElement.
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
var isSVGGraphicsElement = (function () {
    // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
    // interface.
    if (typeof SVGGraphicsElement != 'undefined') {
        return function (target) { return target instanceof SVGGraphicsElement; };
    }

    // If it's so, then check that element is at least an instance of the
    // SVGElement and that it has the "getBBox" method.
    // eslint-disable-next-line no-extra-parens
    return function (target) { return target instanceof SVGElement && typeof target.getBBox === 'function'; };
})();

/**
 * Checks whether provided element is a document element (<html>).
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
function isDocumentElement(target) {
    return target === document.documentElement;
}

/**
 * Calculates an appropriate content rectangle for provided html or svg element.
 *
 * @param {Element} target - Element content rectangle of which needs to be calculated.
 * @returns {DOMRectInit}
 */
function getContentRect(target) {
    if (!isBrowser) {
        return emptyRect;
    }

    if (isSVGGraphicsElement(target)) {
        return getSVGContentRect(target);
    }

    return getHTMLElementContentRect(target);
}

/**
 * Creates rectangle with an interface of the DOMRectReadOnly.
 * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
 *
 * @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
 * @returns {DOMRectReadOnly}
 */
function createReadOnlyRect(ref) {
    var x = ref.x;
    var y = ref.y;
    var width = ref.width;
    var height = ref.height;

    // If DOMRectReadOnly is available use it as a prototype for the rectangle.
    var Constr = typeof DOMRectReadOnly != 'undefined' ? DOMRectReadOnly : Object;
    var rect = Object.create(Constr.prototype);

    // Rectangle's properties are not writable and non-enumerable.
    defineConfigurable(rect, {
        x: x, y: y, width: width, height: height,
        top: y,
        right: x + width,
        bottom: height + y,
        left: x
    });

    return rect;
}

/**
 * Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
 * Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
 *
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @param {number} width - Rectangle's width.
 * @param {number} height - Rectangle's height.
 * @returns {DOMRectInit}
 */
function createRectInit(x, y, width, height) {
    return { x: x, y: y, width: width, height: height };
}

/**
 * Class that is responsible for computations of the content rectangle of
 * provided DOM element and for keeping track of it's changes.
 */
var ResizeObservation = function(target) {
    /**
     * Broadcasted width of content rectangle.
     *
     * @type {number}
     */
    this.broadcastWidth = 0;

    /**
     * Broadcasted height of content rectangle.
     *
     * @type {number}
     */
    this.broadcastHeight = 0;

    /**
     * Reference to the last observed content rectangle.
     *
     * @private {DOMRectInit}
     */
    this.contentRect_ = createRectInit(0, 0, 0, 0);

    /**
     * Reference to the observed element.
     *
     * @type {Element}
     */
    this.target = target;
};

/**
 * Updates content rectangle and tells whether it's width or height properties
 * have changed since the last broadcast.
 *
 * @returns {boolean}
 */
ResizeObservation.prototype.isActive = function () {
    var rect = getContentRect(this.target);

    this.contentRect_ = rect;

    return rect.width !== this.broadcastWidth || rect.height !== this.broadcastHeight;
};

/**
 * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
 * from the corresponding properties of the last observed content rectangle.
 *
 * @returns {DOMRectInit} Last observed content rectangle.
 */
ResizeObservation.prototype.broadcastRect = function () {
    var rect = this.contentRect_;

    this.broadcastWidth = rect.width;
    this.broadcastHeight = rect.height;

    return rect;
};

var ResizeObserverEntry = function(target, rectInit) {
    var contentRect = createReadOnlyRect(rectInit);

    // According to the specification following properties are not writable
    // and are also not enumerable in the native implementation.
    //
    // Property accessors are not being used as they'd require to define a
    // private WeakMap storage which may cause memory leaks in browsers that
    // don't support this type of collections.
    defineConfigurable(this, { target: target, contentRect: contentRect });
};

var ResizeObserverSPI = function(callback, controller, callbackCtx) {
    if (typeof callback !== 'function') {
        throw new TypeError('The callback provided as parameter 1 is not a function.');
    }

    /**
     * Collection of resize observations that have detected changes in dimensions
     * of elements.
     *
     * @private {Array<ResizeObservation>}
     */
    this.activeObservations_ = [];

    /**
     * Registry of the ResizeObservation instances.
     *
     * @private {Map<Element, ResizeObservation>}
     */
    this.observations_ = new MapShim();

    /**
     * Reference to the callback function.
     *
     * @private {ResizeObserverCallback}
     */
    this.callback_ = callback;

    /**
     * Reference to the associated ResizeObserverController.
     *
     * @private {ResizeObserverController}
     */
    this.controller_ = controller;

    /**
     * Public ResizeObserver instance which will be passed to the callback
     * function and used as a value of it's "this" binding.
     *
     * @private {ResizeObserver}
     */
    this.callbackCtx_ = callbackCtx;
};

/**
 * Starts observing provided element.
 *
 * @param {Element} target - Element to be observed.
 * @returns {void}
 */
ResizeObserverSPI.prototype.observe = function (target) {
    if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
    }

    // Do nothing if current environment doesn't have the Element interface.
    if (typeof Element === 'undefined' || !(Element instanceof Object)) {
        return;
    }

    if (!(target instanceof Element)) {
        throw new TypeError('parameter 1 is not of type "Element".');
    }

    var observations = this.observations_;

    // Do nothing if element is already being observed.
    if (observations.has(target)) {
        return;
    }

    observations.set(target, new ResizeObservation(target));

    this.controller_.addObserver(this);

    // Force the update of observations.
    this.controller_.refresh();
};

/**
 * Stops observing provided element.
 *
 * @param {Element} target - Element to stop observing.
 * @returns {void}
 */
ResizeObserverSPI.prototype.unobserve = function (target) {
    if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
    }

    // Do nothing if current environment doesn't have the Element interface.
    if (typeof Element === 'undefined' || !(Element instanceof Object)) {
        return;
    }

    if (!(target instanceof Element)) {
        throw new TypeError('parameter 1 is not of type "Element".');
    }

    var observations = this.observations_;

    // Do nothing if element is not being observed.
    if (!observations.has(target)) {
        return;
    }

    observations.delete(target);

    if (!observations.size) {
        this.controller_.removeObserver(this);
    }
};

/**
 * Stops observing all elements.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.disconnect = function () {
    this.clearActive();
    this.observations_.clear();
    this.controller_.removeObserver(this);
};

/**
 * Collects observation instances the associated element of which has changed
 * it's content rectangle.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.gatherActive = function () {
        var this$1 = this;

    this.clearActive();

    this.observations_.forEach(function (observation) {
        if (observation.isActive()) {
            this$1.activeObservations_.push(observation);
        }
    });
};

/**
 * Invokes initial callback function with a list of ResizeObserverEntry
 * instances collected from active resize observations.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.broadcastActive = function () {
    // Do nothing if observer doesn't have active observations.
    if (!this.hasActive()) {
        return;
    }

    var ctx = this.callbackCtx_;

    // Create ResizeObserverEntry instance for every active observation.
    var entries = this.activeObservations_.map(function (observation) {
        return new ResizeObserverEntry(observation.target, observation.broadcastRect());
    });

    this.callback_.call(ctx, entries, ctx);
    this.clearActive();
};

/**
 * Clears the collection of active observations.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.clearActive = function () {
    this.activeObservations_.splice(0);
};

/**
 * Tells whether observer has active observations.
 *
 * @returns {boolean}
 */
ResizeObserverSPI.prototype.hasActive = function () {
    return this.activeObservations_.length > 0;
};

// Registry of internal observers. If WeakMap is not available use current shim
// for the Map collection as it has all required methods and because WeakMap
// can't be fully polyfilled anyway.
var observers = typeof WeakMap != 'undefined' ? new WeakMap() : new MapShim();

/**
 * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
 * exposing only those methods and properties that are defined in the spec.
 */
var ResizeObserver$1 = function(callback) {
    if (!(this instanceof ResizeObserver$1)) {
        throw new TypeError('Cannot call a class as a function');
    }

    if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
    }

    var controller = ResizeObserverController.getInstance();
    var observer = new ResizeObserverSPI(callback, controller, this);

    observers.set(this, observer);
};

// Expose public methods of ResizeObserver.
['observe', 'unobserve', 'disconnect'].forEach(function (method) {
    ResizeObserver$1.prototype[method] = function () {
        return (ref = observers.get(this))[method].apply(ref, arguments);
        var ref;
    };
});

var index = (function () {
    // Export existing implementation if available.
    if (typeof ResizeObserver != 'undefined') {
        // eslint-disable-next-line no-undef
        return ResizeObserver;
    }

    return ResizeObserver$1;
})();

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var PERFECT_SCROLLBAR_CONFIG = new core.InjectionToken('PERFECT_SCROLLBAR_CONFIG');
var Geometry = (function () {
    function Geometry(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    return Geometry;
}());
var Position = (function () {
    function Position(x, y) {
        this.x = x;
        this.y = y;
    }
    return Position;
}());

/**
 * @record
 */

var PerfectScrollbarConfig = (function () {
    function PerfectScrollbarConfig(config) {
        if (config === void 0) { config = {}; }
        this.assign(config);
    }
    /**
     * @param {?=} config
     * @return {?}
     */
    PerfectScrollbarConfig.prototype.assign = /**
     * @param {?=} config
     * @return {?}
     */
    function (config) {
        if (config === void 0) { config = {}; }
        for (var /** @type {?} */ key in config) {
            this[key] = config[key];
        }
    };
    return PerfectScrollbarConfig;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var PerfectScrollbarDirective = (function () {
    function PerfectScrollbarDirective(zone, elementRef, differs, defaults) {
        this.zone = zone;
        this.elementRef = elementRef;
        this.differs = differs;
        this.defaults = defaults;
        this.disabled = false;
        this.PS_SCROLL_Y = new core.EventEmitter();
        this.PS_SCROLL_X = new core.EventEmitter();
        this.PS_SCROLL_UP = new core.EventEmitter();
        this.PS_SCROLL_DOWN = new core.EventEmitter();
        this.PS_SCROLL_LEFT = new core.EventEmitter();
        this.PS_SCROLL_RIGHT = new core.EventEmitter();
        this.PS_Y_REACH_END = new core.EventEmitter();
        this.PS_Y_REACH_START = new core.EventEmitter();
        this.PS_X_REACH_END = new core.EventEmitter();
        this.PS_X_REACH_START = new core.EventEmitter();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.emit = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this[event.type.replace(/-/g, '_').toUpperCase()].emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psScrollY = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psScrollX = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psScrollUp = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.pscrollDown = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psScrollLeft = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psScrollRight = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psReachEndY = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psReachStartY = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psReachEndX = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.psReachStartX = /**
     * @param {?} event
     * @return {?}
     */
    function (event) { this.emit(event); };
    /**
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this.disabled) {
            var /** @type {?} */ config_1 = new PerfectScrollbarConfig(this.defaults);
            config_1.assign(this.config); // Custom configuration
            this.zone.runOutsideAngular(function () {
                _this.instance = new PerfectScrollbar(_this.elementRef.nativeElement, config_1);
            });
            if (!this.configDiff) {
                this.configDiff = this.differs.find(this.config || {}).create();
                this.configDiff.diff(this.config || {});
            }
            this.zone.runOutsideAngular(function () {
                _this.ro = new index(function (entries, observer) {
                    _this.update();
                });
                _this.ro.observe(_this.elementRef.nativeElement);
            });
        }
    };
    /**
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (this.ro) {
            this.ro.disconnect();
        }
        if (this.timeout) {
            window.clearTimeout(this.timeout);
        }
        if (this.instance) {
            this.zone.runOutsideAngular(function () {
                _this.instance.destroy();
            });
            this.instance = null;
        }
    };
    /**
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.ngDoCheck = /**
     * @return {?}
     */
    function () {
        if (!this.disabled && this.configDiff) {
            var /** @type {?} */ changes = this.configDiff.diff(this.config || {});
            if (changes) {
                this.ngOnDestroy();
                this.ngOnInit();
            }
        }
    };
    /**
     * @param {?} changes
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.ngOnChanges = /**
     * @param {?} changes
     * @return {?}
     */
    function (changes) {
        if (changes['disabled'] && !changes['disabled'].isFirstChange()) {
            if (changes['disabled'].currentValue !== changes['disabled'].previousValue) {
                if (changes['disabled'].currentValue === true) {
                    this.ngOnDestroy();
                }
                else if (changes['disabled'].currentValue === false) {
                    this.ngOnInit();
                }
            }
        }
    };
    /**
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.ps = /**
     * @return {?}
     */
    function () {
        return this.instance;
    };
    /**
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.update = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (this.timeout) {
            window.clearTimeout(this.timeout);
        }
        this.timeout = window.setTimeout(function () {
            if (!_this.disabled && _this.configDiff) {
                try {
                    _this.zone.runOutsideAngular(function () {
                        _this.instance.update();
                    });
                }
                catch (/** @type {?} */ error) {
                    // Update can be finished after destroy so catch errors
                }
            }
        }, 0);
    };
    /**
     * @param {?=} prefix
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.geometry = /**
     * @param {?=} prefix
     * @return {?}
     */
    function (prefix) {
        if (prefix === void 0) { prefix = 'scroll'; }
        return new Geometry(this.elementRef.nativeElement[prefix + 'Left'], this.elementRef.nativeElement[prefix + 'Top'], this.elementRef.nativeElement[prefix + 'Width'], this.elementRef.nativeElement[prefix + 'Height']);
    };
    /**
     * @param {?=} absolute
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.position = /**
     * @param {?=} absolute
     * @return {?}
     */
    function (absolute) {
        if (absolute === void 0) { absolute = false; }
        if (!absolute) {
            return new Position(this.instance.reach.x, this.instance.reach.y);
        }
        else {
            return new Position(this.elementRef.nativeElement.scrollLeft, this.elementRef.nativeElement.scrollTop);
        }
    };
    /**
     * @param {?=} direction
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollable = /**
     * @param {?=} direction
     * @return {?}
     */
    function (direction) {
        if (direction === void 0) { direction = 'any'; }
        var /** @type {?} */ element = this.elementRef.nativeElement;
        if (direction === 'any') {
            return element.classList.contains('ps--active-x') ||
                element.classList.contains('ps--active-y');
        }
        else if (direction === 'both') {
            return element.classList.contains('ps--active-x') &&
                element.classList.contains('ps--active-y');
        }
        else {
            return element.classList.contains('ps--active-' + direction);
        }
    };
    /**
     * @param {?} x
     * @param {?=} y
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollTo = /**
     * @param {?} x
     * @param {?=} y
     * @param {?=} speed
     * @return {?}
     */
    function (x, y, speed) {
        if (!this.disabled) {
            if (y == null && speed == null) {
                this.animateScrolling('scrollTop', x, speed);
            }
            else {
                if (x != null) {
                    this.animateScrolling('scrollLeft', x, speed);
                }
                if (y != null) {
                    this.animateScrolling('scrollTop', y, speed);
                }
            }
        }
    };
    /**
     * @param {?} x
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollToX = /**
     * @param {?} x
     * @param {?=} speed
     * @return {?}
     */
    function (x, speed) {
        this.animateScrolling('scrollLeft', x, speed);
    };
    /**
     * @param {?} y
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollToY = /**
     * @param {?} y
     * @param {?=} speed
     * @return {?}
     */
    function (y, speed) {
        this.animateScrolling('scrollTop', y, speed);
    };
    /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollToTop = /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    function (offset, speed) {
        this.animateScrolling('scrollTop', (offset || 0), speed);
    };
    /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollToLeft = /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    function (offset, speed) {
        this.animateScrolling('scrollLeft', (offset || 0), speed);
    };
    /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollToRight = /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    function (offset, speed) {
        var /** @type {?} */ left = this.elementRef.nativeElement.scrollWidth -
            this.elementRef.nativeElement.clientWidth;
        this.animateScrolling('scrollLeft', left - (offset || 0), speed);
    };
    /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.scrollToBottom = /**
     * @param {?=} offset
     * @param {?=} speed
     * @return {?}
     */
    function (offset, speed) {
        var /** @type {?} */ top = this.elementRef.nativeElement.scrollHeight -
            this.elementRef.nativeElement.clientHeight;
        this.animateScrolling('scrollTop', top - (offset || 0), speed);
    };
    /**
     * @param {?} target
     * @param {?} value
     * @param {?=} speed
     * @return {?}
     */
    PerfectScrollbarDirective.prototype.animateScrolling = /**
     * @param {?} target
     * @param {?} value
     * @param {?=} speed
     * @return {?}
     */
    function (target, value, speed) {
        var _this = this;
        if (!speed) {
            var /** @type {?} */ oldValue = this.elementRef.nativeElement[target];
            this.elementRef.nativeElement[target] = value;
            if (value !== oldValue) {
                this.instance.update();
            }
        }
        else if (value !== this.elementRef.nativeElement[target]) {
            var /** @type {?} */ newValue_1 = 0;
            var /** @type {?} */ scrollCount_1 = 0;
            var /** @type {?} */ oldTimestamp_1 = performance.now();
            var /** @type {?} */ oldValue_1 = this.elementRef.nativeElement[target];
            var /** @type {?} */ cosParameter_1 = (oldValue_1 - value) / 2;
            var /** @type {?} */ step_1 = function (newTimestamp) {
                scrollCount_1 += Math.PI / (speed / (newTimestamp - oldTimestamp_1));
                newValue_1 = Math.round(value + cosParameter_1 + cosParameter_1 * Math.cos(scrollCount_1));
                // Only continue animation if scroll position has not changed
                if (_this.elementRef.nativeElement[target] === oldValue_1) {
                    if (scrollCount_1 >= Math.PI) {
                        _this.animateScrolling(target, value, 0);
                    }
                    else {
                        _this.elementRef.nativeElement[target] = newValue_1;
                        // On a zoomed out page the resulting offset may differ
                        // On a zoomed out page the resulting offset may differ
                        oldValue_1 = _this.elementRef.nativeElement[target];
                        _this.instance.update();
                        oldTimestamp_1 = newTimestamp;
                        window.requestAnimationFrame(step_1);
                    }
                }
            };
            window.requestAnimationFrame(step_1);
        }
    };
    PerfectScrollbarDirective.decorators = [
        { type: core.Directive, args: [{
                    selector: '[perfectScrollbar]',
                    exportAs: 'ngxPerfectScrollbar'
                },] },
    ];
    /** @nocollapse */
    PerfectScrollbarDirective.ctorParameters = function () { return [
        { type: core.NgZone, },
        { type: core.ElementRef, },
        { type: core.KeyValueDiffers, },
        { type: undefined, decorators: [{ type: core.Optional }, { type: core.Inject, args: [PERFECT_SCROLLBAR_CONFIG,] },] },
    ]; };
    PerfectScrollbarDirective.propDecorators = {
        "disabled": [{ type: core.Input },],
        "config": [{ type: core.Input, args: ['perfectScrollbar',] },],
        "PS_SCROLL_Y": [{ type: core.Output, args: ['psScrollY',] },],
        "PS_SCROLL_X": [{ type: core.Output, args: ['psScrollX',] },],
        "PS_SCROLL_UP": [{ type: core.Output, args: ['psScrollUp',] },],
        "PS_SCROLL_DOWN": [{ type: core.Output, args: ['psScrollDown',] },],
        "PS_SCROLL_LEFT": [{ type: core.Output, args: ['psScrollLeft',] },],
        "PS_SCROLL_RIGHT": [{ type: core.Output, args: ['psScrollRight',] },],
        "PS_Y_REACH_END": [{ type: core.Output, args: ['psYReachEnd',] },],
        "PS_Y_REACH_START": [{ type: core.Output, args: ['psYReachStart',] },],
        "PS_X_REACH_END": [{ type: core.Output, args: ['psXReachEnd',] },],
        "PS_X_REACH_START": [{ type: core.Output, args: ['psXReachStart',] },],
        "psScrollY": [{ type: core.HostListener, args: ['ps-scroll-y', ['$event'],] },],
        "psScrollX": [{ type: core.HostListener, args: ['ps-scroll-x', ['$event'],] },],
        "psScrollUp": [{ type: core.HostListener, args: ['ps-scroll-up', ['$event'],] },],
        "pscrollDown": [{ type: core.HostListener, args: ['ps-scroll-down', ['$event'],] },],
        "psScrollLeft": [{ type: core.HostListener, args: ['ps-scroll-left', ['$event'],] },],
        "psScrollRight": [{ type: core.HostListener, args: ['ps-scroll-right', ['$event'],] },],
        "psReachEndY": [{ type: core.HostListener, args: ['ps-y-reach-end', ['$event'],] },],
        "psReachStartY": [{ type: core.HostListener, args: ['ps-y-reach-start', ['$event'],] },],
        "psReachEndX": [{ type: core.HostListener, args: ['ps-x-reach-end', ['$event'],] },],
        "psReachStartX": [{ type: core.HostListener, args: ['ps-x-reach-start', ['$event'],] },],
    };
    return PerfectScrollbarDirective;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var PerfectScrollbarComponent = (function () {
    function PerfectScrollbarComponent(cdRef, elementRef) {
        this.cdRef = cdRef;
        this.elementRef = elementRef;
        this.states = {};
        this.notify = null;
        this.userInteraction = false;
        this.allowPropagation = false;
        this.cancelEvent = null;
        this.timeoutState = null;
        this.timeoutScroll = null;
        this.usePropagationX = false;
        this.usePropagationY = false;
        this.statesSub = null;
        this.statesUpdate = new Subject.Subject();
        this.activeSub = null;
        this.activeUpdate = new Subject.Subject();
        this.disabled = false;
        this.usePSClass = true;
        this.autoPropagation = false;
        this.scrollIndicators = false;
        this.PS_SCROLL_Y = new core.EventEmitter();
        this.PS_SCROLL_X = new core.EventEmitter();
        this.PS_SCROLL_UP = new core.EventEmitter();
        this.PS_SCROLL_DOWN = new core.EventEmitter();
        this.PS_SCROLL_LEFT = new core.EventEmitter();
        this.PS_SCROLL_RIGHT = new core.EventEmitter();
        this.PS_Y_REACH_END = new core.EventEmitter();
        this.PS_Y_REACH_START = new core.EventEmitter();
        this.PS_X_REACH_END = new core.EventEmitter();
        this.PS_X_REACH_START = new core.EventEmitter();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.onGeneratedEvent = /**
     * @param {?} event
     * @return {?}
     */
    function (event) {
        // Stop the generated event from reaching window for PS to work correctly
        if (event['psGenerated']) {
            event.stopPropagation();
        }
    };
    /**
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.ngOnInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        this.activeSub = this.activeUpdate
            .pipe(operators.distinctUntilChanged())
            .subscribe(function (active) {
            _this.allowPropagation = active;
        });
        this.statesSub = this.statesUpdate
            .pipe(operators.distinctUntilChanged())
            .subscribe(function (state) {
            window.clearTimeout(_this.timeoutState);
            if (state !== 'x' && state !== 'y') {
                _this.notify = true;
                _this.states[state] = true;
                if (state === 'top') {
                    _this.states.bottom = false;
                }
                else if (state === 'bottom') {
                    _this.states.top = false;
                }
                else if (state === 'left') {
                    _this.states.rights = false;
                }
                else if (state === 'rights') {
                    _this.states.left = false;
                }
                _this.timeoutState = window.setTimeout(function () {
                    _this.notify = false;
                    if (_this.autoPropagation && _this.userInteraction &&
                        ((!_this.usePropagationX && (_this.states.left || _this.states.right)) ||
                            (!_this.usePropagationY && (_this.states.top || _this.states.bottom)))) {
                        _this.allowPropagation = true;
                    }
                    _this.cdRef.markForCheck();
                }, 300);
            }
            else {
                _this.notify = false;
                if (state === 'x') {
                    _this.states.left = false;
                    _this.states.right = false;
                }
                else if (state === 'y') {
                    _this.states.top = false;
                    _this.states.bottom = false;
                }
                _this.userInteraction = true;
                if (_this.autoPropagation &&
                    (!_this.usePropagationX || !_this.usePropagationY)) {
                    _this.allowPropagation = false;
                    if (_this.cancelEvent) {
                        _this.elementRef.nativeElement.dispatchEvent(_this.cancelEvent);
                        _this.cancelEvent = null;
                    }
                }
                else if (_this.scrollIndicators) {
                    _this.notify = true;
                    _this.timeoutState = window.setTimeout(function () {
                        _this.notify = false;
                        _this.cdRef.markForCheck();
                    }, 300);
                }
            }
            _this.cdRef.markForCheck();
            _this.cdRef.detectChanges();
        });
    };
    /**
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        if (this.activeSub) {
            this.activeSub.unsubscribe();
        }
        if (this.statesSub) {
            this.statesSub.unsubscribe();
        }
        if (this.timeoutState) {
            window.clearTimeout(this.timeoutState);
        }
        if (this.timeoutScroll) {
            window.clearTimeout(this.timeoutScroll);
        }
    };
    /**
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.ngDoCheck = /**
     * @return {?}
     */
    function () {
        if (!this.disabled && this.autoPropagation && this.directiveRef) {
            var /** @type {?} */ element = this.directiveRef.elementRef.nativeElement;
            this.usePropagationX = !element.classList.contains('ps--active-x');
            this.usePropagationY = !element.classList.contains('ps--active-y');
            this.activeUpdate.next(this.usePropagationX && this.usePropagationY);
        }
    };
    /**
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.getConfig = /**
     * @return {?}
     */
    function () {
        var /** @type {?} */ config = this.config || {};
        if (this.autoPropagation) {
            config.swipePropagation = true;
            config.wheelPropagation = true;
        }
        return config;
    };
    /**
     * @param {?=} event
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.onTouchEnd = /**
     * @param {?=} event
     * @return {?}
     */
    function (event) {
        if (event === void 0) { event = null; }
        if (!this.disabled && this.autoPropagation &&
            (!this.usePropagationX || !this.usePropagationY)) {
            this.cancelEvent = null;
            this.allowPropagation = false;
        }
    };
    /**
     * @param {?=} event
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.onTouchMove = /**
     * @param {?=} event
     * @return {?}
     */
    function (event) {
        if (event === void 0) { event = null; }
        if (!this.disabled && this.autoPropagation && !this.allowPropagation) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    /**
     * @param {?=} event
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.onTouchStart = /**
     * @param {?=} event
     * @return {?}
     */
    function (event) {
        if (event === void 0) { event = null; }
        if (!this.disabled && this.autoPropagation) {
            this.userInteraction = true;
            if (this.allowPropagation) {
                // PS stops the touchmove event so lets re-emit it here
                if (this.elementRef.nativeElement) {
                    var /** @type {?} */ newEvent = new MouseEvent('touchstart', event);
                    this.cancelEvent = new MouseEvent('touchmove', event);
                    newEvent['psGenerated'] = this.cancelEvent['psGenerated'] = true;
                    newEvent['touches'] = this.cancelEvent['touches'] = event['touches'];
                    newEvent['targetTouches'] = this.cancelEvent['targetTouches'] = event['targetTouches'];
                    this.elementRef.nativeElement.dispatchEvent(newEvent);
                }
            }
            this.cdRef.detectChanges();
        }
    };
    /**
     * @param {?=} event
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.onWheelEvent = /**
     * @param {?=} event
     * @return {?}
     */
    function (event) {
        if (event === void 0) { event = null; }
        if (!this.disabled && this.autoPropagation) {
            this.userInteraction = true;
            if (!this.allowPropagation) {
                event.preventDefault();
                event.stopPropagation();
            }
            else if (!this.usePropagationX || !this.usePropagationY) {
                this.allowPropagation = false;
            }
            this.cdRef.detectChanges();
        }
    };
    /**
     * @param {?=} event
     * @param {?=} state
     * @return {?}
     */
    PerfectScrollbarComponent.prototype.onScrollEvent = /**
     * @param {?=} event
     * @param {?=} state
     * @return {?}
     */
    function (event, state) {
        if (event === void 0) { event = null; }
        if (!this.disabled && (this.autoPropagation || this.scrollIndicators)) {
            this.statesUpdate.next(state);
        }
    };
    PerfectScrollbarComponent.decorators = [
        { type: core.Component, args: [{
                    selector: 'perfect-scrollbar',
                    template: '<div style="position: static" [class.ps]="usePSClass" [perfectScrollbar]="getConfig()" [disabled]="disabled" (wheel)="onWheelEvent($event)" (touchstart)="onTouchStart($event)" (touchmove)="onTouchMove($event)" (touchend)="onTouchEnd($event)" (ps-scroll-x)="onScrollEvent($event, \'x\')" (ps-scroll-y)="onScrollEvent($event, \'y\')" (ps-x-reach-end)="onScrollEvent($event, \'right\')" (ps-y-reach-end)="onScrollEvent($event, \'bottom\')" (ps-x-reach-start)="onScrollEvent($event, \'left\')" (ps-y-reach-start)="onScrollEvent($event, \'top\')" (psScrollY)="PS_SCROLL_Y.emit($event)" (psScrollX)="PS_SCROLL_X.emit($event)" (psScrollUp)="PS_SCROLL_UP.emit($event)" (psScrollDown)="PS_SCROLL_DOWN.emit($event)" (psScrollLeft)="PS_SCROLL_LEFT.emit($event)" (psScrollRight)="PS_SCROLL_RIGHT.emit($event)" (psYReachEnd)="PS_Y_REACH_END.emit($event)" (psYReachStart)="PS_Y_REACH_START.emit($event)" (psXReachEnd)="PS_X_REACH_END.emit($event)" (psXReachStart)="PS_X_REACH_START.emit($event)"><div class="ps-content"><ng-content></ng-content></div><div *ngIf="autoPropagation || scrollIndicators" class="ps-overlay" [class.ps-at-top]="states.top" [class.ps-at-left]="states.left" [class.ps-at-right]="states.right" [class.ps-at-bottom]="states.bottom"><div class="ps-indicator-top" [class.ps-notify]="notify && userInteraction"></div><div class="ps-indicator-left" [class.ps-notify]="notify && userInteraction"></div><div class="ps-indicator-right" [class.ps-notify]="notify && userInteraction"></div><div class="ps-indicator-bottom" [class.ps-notify]="notify && userInteraction"></div></div></div>',
                    styles: ['.ps{overflow:hidden!important;overflow-anchor:none;-ms-overflow-style:none;touch-action:auto;-ms-touch-action:auto}.ps__rail-x{display:none;opacity:0;transition:background-color .2s linear,opacity .2s linear;-webkit-transition:background-color .2s linear,opacity .2s linear;height:15px;bottom:0;position:absolute}.ps__rail-y{display:none;opacity:0;transition:background-color .2s linear,opacity .2s linear;-webkit-transition:background-color .2s linear,opacity .2s linear;width:15px;right:0;position:absolute}.ps--active-x>.ps__rail-x,.ps--active-y>.ps__rail-y{display:block;background-color:transparent}.ps--focus>.ps__rail-x,.ps--focus>.ps__rail-y,.ps--scrolling-x>.ps__rail-x,.ps--scrolling-y>.ps__rail-y,.ps:hover>.ps__rail-x,.ps:hover>.ps__rail-y{opacity:.6}.ps__rail-x:focus,.ps__rail-x:hover,.ps__rail-y:focus,.ps__rail-y:hover{background-color:#eee;opacity:.9}.ps__thumb-x{background-color:#aaa;border-radius:6px;transition:background-color .2s linear,height .2s ease-in-out;-webkit-transition:background-color .2s linear,height .2s ease-in-out;height:6px;bottom:2px;position:absolute}.ps__thumb-y{background-color:#aaa;border-radius:6px;transition:background-color .2s linear,width .2s ease-in-out;-webkit-transition:background-color .2s linear,width .2s ease-in-out;width:6px;right:2px;position:absolute}.ps__rail-x:focus>.ps__thumb-x,.ps__rail-x:hover>.ps__thumb-x{background-color:#999;height:11px}.ps__rail-y:focus>.ps__thumb-y,.ps__rail-y:hover>.ps__thumb-y{background-color:#999;width:11px}@supports (-ms-overflow-style:none){.ps{overflow:auto!important}}@media screen and (-ms-high-contrast:active),(-ms-high-contrast:none){.ps{overflow:auto!important}}perfect-scrollbar{position:relative;display:block;width:100%;height:100%;max-width:100%;max-height:100%}perfect-scrollbar[hidden]{display:none}perfect-scrollbar[fxflex]{display:flex;flex-direction:column;-webkit-box-orient:column;-webkit-box-direction:column;height:auto;min-width:0;min-height:0}perfect-scrollbar[fxflex]>.ps{flex:1 1 auto;-ms-flex:1 1 auto;-webkit-box-flex:1;width:auto;height:auto;min-width:0;min-height:0}perfect-scrollbar[fxlayout]>.ps,perfect-scrollbar[fxlayout]>.ps>.ps-content{display:flex;flex:1 1 auto;-ms-flex:1 1 auto;-webkit-box-flex:1;align-item:inherit;place-content:inherit;-webkit-box-pack:inherit;-webkit-box-align:inherit;flex-direction:inherit;-webkit-box-orient:inherit;-webkit-box-direction:inherit;width:100%;height:100%}perfect-scrollbar[fxlayout=row]>.ps,perfect-scrollbar[fxlayout=row]>.ps>.ps-content{flex-direction:row!important;-webkit-box-orient:row!important;-webkit-box-direction:row!important}perfect-scrollbar[fxlayout=column]>.ps,perfect-scrollbar[fxlayout=column]>.ps>.ps-content{flex-direction:column!important;-webkit-box-orient:column!important;-webkit-box-direction:column!important}perfect-scrollbar>.ps{position:static;display:block;width:inherit;height:inherit;max-width:inherit;max-height:inherit}perfect-scrollbar>.ps>.ps-overlay{position:absolute;top:0;right:0;bottom:0;left:0;display:block;overflow:hidden;pointer-events:none}perfect-scrollbar>.ps>.ps-overlay .ps-indicator-bottom,perfect-scrollbar>.ps>.ps-overlay .ps-indicator-left,perfect-scrollbar>.ps>.ps-overlay .ps-indicator-right,perfect-scrollbar>.ps>.ps-overlay .ps-indicator-top{position:absolute;opacity:0;transition:opacity .3s ease-in-out}perfect-scrollbar>.ps>.ps-overlay .ps-indicator-bottom,perfect-scrollbar>.ps>.ps-overlay .ps-indicator-top{left:0;min-width:100%;min-height:24px}perfect-scrollbar>.ps>.ps-overlay .ps-indicator-left,perfect-scrollbar>.ps>.ps-overlay .ps-indicator-right{top:0;min-width:24px;min-height:100%}perfect-scrollbar>.ps>.ps-overlay .ps-indicator-top{top:0}perfect-scrollbar>.ps>.ps-overlay .ps-indicator-left{left:0}perfect-scrollbar>.ps>.ps-overlay .ps-indicator-right{right:0}perfect-scrollbar>.ps>.ps-overlay .ps-indicator-bottom{bottom:0}perfect-scrollbar>.ps.ps--active-y>.ps__rail-y{top:0!important;right:0!important;width:10px;transition:width .2s linear,opacity .2s linear,background-color .2s linear}perfect-scrollbar>.ps.ps--active-y>.ps__rail-y:hover{width:15px}perfect-scrollbar>.ps.ps--active-x>.ps__rail-x{bottom:0!important;left:0!important;height:10px;transition:height .2s linear,opacity .2s linear,background-color .2s linear}perfect-scrollbar>.ps.ps--active-x>.ps__rail-x:hover{height:15px}perfect-scrollbar>.ps.ps--active-x.ps--active-y>.ps__rail-y{margin:0 0 10px}perfect-scrollbar>.ps.ps--active-x.ps--active-y>.ps__rail-x{margin:0 10px 0 0}perfect-scrollbar>.ps.ps--scrolling-y>.ps__rail-y{opacity:.9;background-color:#eee}perfect-scrollbar>.ps.ps--scrolling-x>.ps__rail-x{opacity:.9;background-color:#eee}perfect-scrollbar.ps-show-always>.ps.ps--active-y>.ps__rail-y{opacity:.6}perfect-scrollbar.ps-show-always>.ps.ps--active-x>.ps__rail-x{opacity:.6}perfect-scrollbar.ps-show-active>.ps.ps--active-y>.ps-overlay:not(.ps-at-top) .ps-indicator-top{opacity:1;background:linear-gradient(to bottom,rgba(255,255,255,.5) 0,rgba(255,255,255,0) 100%)}perfect-scrollbar.ps-show-active>.ps.ps--active-y>.ps-overlay:not(.ps-at-bottom) .ps-indicator-bottom{opacity:1;background:linear-gradient(to top,rgba(255,255,255,.5) 0,rgba(255,255,255,0) 100%)}perfect-scrollbar.ps-show-active>.ps.ps--active-x>.ps-overlay:not(.ps-at-left) .ps-indicator-left{opacity:1;background:linear-gradient(to right,rgba(255,255,255,.5) 0,rgba(255,255,255,0) 100%)}perfect-scrollbar.ps-show-active>.ps.ps--active-x>.ps-overlay:not(.ps-at-right) .ps-indicator-right{opacity:1;background:linear-gradient(to left,rgba(255,255,255,.5) 0,rgba(255,255,255,0) 100%)}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-y>.ps-overlay.ps-at-top .ps-indicator-top{background:linear-gradient(to bottom,rgba(170,170,170,.5) 0,rgba(170,170,170,0) 100%)}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-y>.ps-overlay.ps-at-top .ps-indicator-top.ps-notify{opacity:1}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-y>.ps-overlay.ps-at-bottom .ps-indicator-bottom{background:linear-gradient(to top,rgba(170,170,170,.5) 0,rgba(170,170,170,0) 100%)}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-y>.ps-overlay.ps-at-bottom .ps-indicator-bottom.ps-notify{opacity:1}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-x>.ps-overlay.ps-at-left .ps-indicator-left{background:linear-gradient(to right,rgba(170,170,170,.5) 0,rgba(170,170,170,0) 100%)}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-x>.ps-overlay.ps-at-left .ps-indicator-left.ps-notify{opacity:1}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-x>.ps-overlay.ps-at-right .ps-indicator-right{background:linear-gradient(to left,rgba(170,170,170,.5) 0,rgba(170,170,170,0) 100%)}perfect-scrollbar.ps-show-active.ps-show-limits>.ps.ps--active-x>.ps-overlay.ps-at-right .ps-indicator-right.ps-notify{opacity:1}'],
                    encapsulation: core.ViewEncapsulation.None
                },] },
    ];
    /** @nocollapse */
    PerfectScrollbarComponent.ctorParameters = function () { return [
        { type: core.ChangeDetectorRef, },
        { type: core.ElementRef, },
    ]; };
    PerfectScrollbarComponent.propDecorators = {
        "disabled": [{ type: core.Input },],
        "usePSClass": [{ type: core.Input },],
        "autoPropagation": [{ type: core.HostBinding, args: ['class.ps-show-limits',] }, { type: core.Input },],
        "scrollIndicators": [{ type: core.HostBinding, args: ['class.ps-show-active',] }, { type: core.Input },],
        "config": [{ type: core.Input },],
        "directiveRef": [{ type: core.ViewChild, args: [PerfectScrollbarDirective,] },],
        "PS_SCROLL_Y": [{ type: core.Output, args: ['psScrollY',] },],
        "PS_SCROLL_X": [{ type: core.Output, args: ['psScrollX',] },],
        "PS_SCROLL_UP": [{ type: core.Output, args: ['psScrollUp',] },],
        "PS_SCROLL_DOWN": [{ type: core.Output, args: ['psScrollDown',] },],
        "PS_SCROLL_LEFT": [{ type: core.Output, args: ['psScrollLeft',] },],
        "PS_SCROLL_RIGHT": [{ type: core.Output, args: ['psScrollRight',] },],
        "PS_Y_REACH_END": [{ type: core.Output, args: ['psYReachEnd',] },],
        "PS_Y_REACH_START": [{ type: core.Output, args: ['psYReachStart',] },],
        "PS_X_REACH_END": [{ type: core.Output, args: ['psXReachEnd',] },],
        "PS_X_REACH_START": [{ type: core.Output, args: ['psXReachStart',] },],
        "onGeneratedEvent": [{ type: core.HostListener, args: ['document:touchstart', ['$event'],] },],
    };
    return PerfectScrollbarComponent;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var PerfectScrollbarModule = (function () {
    function PerfectScrollbarModule() {
    }
    PerfectScrollbarModule.decorators = [
        { type: core.NgModule, args: [{
                    imports: [common.CommonModule],
                    declarations: [PerfectScrollbarComponent, PerfectScrollbarDirective],
                    exports: [common.CommonModule, PerfectScrollbarComponent, PerfectScrollbarDirective]
                },] },
    ];
    /** @nocollapse */
    PerfectScrollbarModule.ctorParameters = function () { return []; };
    return PerfectScrollbarModule;
}());

exports.PerfectScrollbarComponent = PerfectScrollbarComponent;
exports.PerfectScrollbarDirective = PerfectScrollbarDirective;
exports.Geometry = Geometry;
exports.Position = Position;
exports.PERFECT_SCROLLBAR_CONFIG = PERFECT_SCROLLBAR_CONFIG;
exports.PerfectScrollbarConfig = PerfectScrollbarConfig;
exports.PerfectScrollbarModule = PerfectScrollbarModule;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-perfect-scrollbar.umd.js.map