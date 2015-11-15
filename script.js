function changeNet() {
 var net = document.forms[0].net.value;
  for(var i=0; i < 6; i++)
  {
    document.getElementById('side'+i).style.backgroundImage = 'url("markers/'+net+'_'+i+'.svg")';
  }
}

var events = new Events();
events.add = function(obj) {
  obj.events = { };
}
events.implement = function(fn) {
  fn.prototype = Object.create(Events.prototype);
}

function Events() {
  this.events = { };
}
Events.prototype.on = function(name, fn) {
  var events = this.events[name];
  if (events == undefined) {
    this.events[name] = [ fn ];
    this.emit('event:on', fn);
  } else {
    if (events.indexOf(fn) == -1) {
      events.push(fn);
      this.emit('event:on', fn);
    }
  }
  return this;
}
Events.prototype.once = function(name, fn) {
  var events = this.events[name];
  fn.once = true;
  if (!events) {
    this.events[name] = [ fn ];
    this.emit('event:once', fn);
  } else {
    if (events.indexOf(fn) == -1) {
      events.push(fn);
      this.emit('event:once', fn);
    }
  }
  return this;
}
Events.prototype.emit = function(name, args) {
  var events = this.events[name];
  if (events) {
    var i = events.length;
    while(i--) {
      if (events[i]) {
        events[i].call(this, args);
        if (events[i].once) {
          delete events[i];
        }
      }
    }
  }
  return this;
}
Events.prototype.unbind = function(name, fn) {
  if (name) {
    var events = this.events[name];
    if (events) {
      if (fn) {
        var i = events.indexOf(fn);
        if (i != -1) {
          delete events[i];
        }
      } else {
        delete this.events[name];
      }
    }
  } else {
    delete this.events;
    this.events = { };
  }
  return this;
}

var userPrefix;

var prefix = (function () {
  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('')
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
  userPrefix = {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();

function bindEvent(element, type, handler) {
  if(element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    element.attachEvent('on' + type, handler);
  }
}

function Viewport(data) {
  events.add(this);

  var self = this;

  this.viewport = data.viewport;
  this.element = data.element;
  this.fps = data.fps;
  this.sensivity = data.sensivity;
  this.sensivityFade = data.sensivityFade;
  this.touchSensivity = data.touchSensivity;
  this.speed = data.speed;

  this.lastX = 0;
  this.lastY = 0;
  this.mouseX = 0;
  this.mouseY = 0;
  this.distanceX = 0;
  this.distanceY = 0;
  this.positionX = 1122;
  this.positionY = 136;
  this.torqueX = 0;
  this.torqueY = 0;
  
  this.scrollDelta = 0;
  this.size = 500;
  this.perspective = 1000;
  
  this.pinch = false;
  this.pinchDist = 0;
  this.pinchDistStart = 0;

  this.down = false;
  this.upsideDown = false;

  this.previousPositionX = 0;
  this.previousPositionY = 0;


  bindEvent(document, 'mousewheel', function(e) { // IE9, Chrome, Safari, Opera
	  self.scrollDelta += Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  });
  bindEvent(document, 'DOMMouseScroll', function(e) { // Firefox
	  self.scrollDelta += Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  });
  bindEvent(document, 'onmousewheel', function() { // IE 6/7/8
    var e = window.event;
	  self.scrollDelta += Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  });
  
  bindEvent(document, 'mousedown', function() {
    self.down = true;
  });

  bindEvent(document, 'mouseup', function() {
    self.down = false;
  });

  bindEvent(document, 'keyup', function() {
    self.down = false;
  });

  bindEvent(document, 'mousemove', function(e) {
    self.mouseX = e.pageX;
    self.mouseY = e.pageY;
  });

  bindEvent(document, 'touchstart', function(e) {
  
    if(e.touches.length == 1) {
      self.down = true;
      e.touches ? e = e.touches[0] : null;
      self.mouseX = e.pageX / self.touchSensivity;
      self.mouseY = e.pageY / self.touchSensivity;
      self.lastX  = self.mouseX;
      self.lastY  = self.mouseY;
    } else if (e.touches.length == 2) {
      self.pinchDistStart = Math.sqrt(
        (e.touches[0].pageX-e.touches[1].pageX) * (e.touches[0].pageX-e.touches[1].pageX) +
        (e.touches[0].pageY-e.touches[1].pageY) * (e.touches[0].pageY-e.touches[1].pageY));
      self.pinchDist = self.pinchDistStart;
    }
    
  });

  bindEvent(document, 'touchmove', function(e) {
    if(e.preventDefault) {
      e.preventDefault();
    }

    if (e.touches.length == 2) {
      self.pinchDist = Math.sqrt(
        (e.touches[0].pageX-e.touches[1].pageX) * (e.touches[0].pageX-e.touches[1].pageX) +
        (e.touches[0].pageY-e.touches[1].pageY) * (e.touches[0].pageY-e.touches[1].pageY));
    }
    
    if(e.touches.length == 1) {
      e.touches ? e = e.touches[0] : null;
      self.mouseX = e.pageX / self.touchSensivity;
      self.mouseY = e.pageY / self.touchSensivity;
    }
  });

  bindEvent(document, 'touchend', function(e) {
    self.down = false;
  });

  setInterval(this.animate.bind(this), this.fps);

}
events.implement(Viewport);
Viewport.prototype.animate = function() {

  this.distanceX = (this.mouseX - this.lastX);
  this.distanceY = (this.mouseY - this.lastY);

  this.lastX = this.mouseX;
  this.lastY = this.mouseY;

  if(this.down) {
    this.torqueX = this.torqueX * this.sensivityFade + (this.distanceX * this.speed - this.torqueX) * this.sensivity;
    this.torqueY = this.torqueY * this.sensivityFade + (this.distanceY * this.speed - this.torqueY) * this.sensivity;
  }

  if(Math.abs(this.torqueX) > 1.0 || Math.abs(this.torqueY) > 1.0) {
    if(!this.down) {
      this.torqueX *= this.sensivityFade;
      this.torqueY *= this.sensivityFade;
    }

    this.positionY -= this.torqueY;

    if(this.positionY > 360) {
      this.positionY -= 360;
    } else if(this.positionY < 0) {
      this.positionY += 360;
    }

    if(this.positionY > 90 && this.positionY < 270) {
      this.positionX -= this.torqueX;
    } else {
      this.positionX += this.torqueX;
    }

    if(this.positionX > 360) {
      this.positionX -= 360;
    } else if(this.positionX < 0) {
      this.positionX += 360;
    }
  }

  this.element.style[userPrefix.js + 'Transform'] = 'rotateX(' + this.positionY + 'deg) rotateY(' + this.positionX + 'deg)';
  
  if (this.scrollDelta != 0 || (this.pinchDist > 0 && this.pinchDistStart > 0)) {
    
    var scale = (this.pinchDist / this.pinchDistStart);
    this.pinchDistStart = this.pinchDist;    
    
    if (this.scrollDelta != 0) {
      scale = 1 + 0.02*this.scrollDelta;
      this.scrollDelta = 0;
    }
    
    this.size *= scale;
    this.touchSensivity *= scale;
    this.perspective *= scale; // don't distort the cube while zooming
    
  }
  
  this.viewport.style[userPrefix.js + 'Perspective'] = this.perspective + "px";
  this.element.style.height = this.size + "px";
  this.element.style.width  = this.size + "px";
  
  var rotateStyle = ['rotate(180deg) rotateX(-90deg)', 'rotate(180deg)', 'rotate(180deg) rotateY(90deg)', 'rotate(180deg) rotateY(180deg)', 'rotate(180deg) rotateY(-90deg)', 'rotateX(-90deg)'];
  for (var i=0; i<6; i++) {
    document.getElementById('side'+i).style.transform = rotateStyle[i] + ' translateZ(' + this.size/2 + 'px)';
  }

}
var viewport = new Viewport({
  viewport: document.getElementsByClassName('viewport')[0],
  element: document.getElementsByClassName('cube')[0],
  fps: 20,
  sensivity: .1,
  sensivityFade: .93,
  speed: 2,
  touchSensivity: 4
});

