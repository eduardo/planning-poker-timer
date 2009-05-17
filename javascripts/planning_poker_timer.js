var Counter = {

  init: function() {
    this.query = new Hash(window.location.search.toQueryParams());
    this.time = (this.query.get('time') || 10) * 1;
    this.precision = (this.query.get('precision') || 2) * 1;
    this.initialColor = '#' + (this.query.get('initialColour') || '00ff00');
    this.restartAt = this.query.get('restartAt');
    if(this.restartAt) this.restartAt *= 1;
    this.colours = this.getColours();
    this.highlightDuration = 2;
    
    this.restart();

    new PeriodicalExecuter(function() {
      Counter.step();
    }, 0.25);
  },

  restart: function() {
    this.currentColor = this.initialColor;
    this.started = new Date();
    this.notified = false;
    this.cancelEffects();
    this.colorQueue = this.colours.clone();
    $('body').setStyle({backgroundColor: this.currentColor});
    $('time').innerHTML = this.formatTime(this.time);
  },
  
  cancelEffects: function() {
    if(this.effect) {
      this.effect.cancel();
    }
    this.effect = null;
    Effect.Queues.get('highlights').each(function(e) { 
      e.cancel();
    });
  },

  nextEffect: function(secs) {
    var effectEnd = secs - this.highlightDuration;
    var nextColor = this.colorQueue.unset(effectEnd);
    if(nextColor) {
      this.effect = new Effect.Highlight('body', {
        duration: this.highlightDuration,
        startcolor: this.currentColor, 
        endcolor: nextColor,
        restorecolor: nextColor,
        queue: 'end',
        scope: 'highlights'
      });
      this.currentColor = nextColor;
    }
  },

  step: function() {
    var secs = this.secs();
    this.nextEffect(secs);

    $('time').innerHTML = this.formatTime(secs);
    if(secs <= 0 && !this.notified) {
      Sound.play('sounds/ring.mp3');
      this.notified = true;
    }

    if(this.restartAt == secs) {
      this.restart();
    }
  },

  secs: function() {
    var diff = (this.started.getTime() - new Date()) / 1000;
    var secs = diff + this.time;
    return Math.ceil(secs);
  },

  formatTime: function(secs) {
    var precisionSecs = this.precision * Math.ceil(secs / this.precision);
    var sign = '';
    if(precisionSecs < 0) {
      sign = '-';
      precisionSecs = -precisionSecs;
    }
    var min = Math.floor(precisionSecs / 60);
    var sec = precisionSecs % 60;
    if(sec < 10) {
      sec = '0' + sec;
    }
    var val = sign + min + ":" + sec;
    return val;
  },

  getColours: function() {
    var colours = new Hash();
    this.query.each(function(pair) {
      var m;
      if(m = pair.key.match(/colours\[(.*)\]/)) {
        colours.set(m[1], '#' + pair.value);
      }
    });
    if(!colours.get(0)) {
      colours.set(0, '#ff0000');
    }
    return colours;
  }

};

Event.observe(window, 'load', function() {
  Counter.init();
});

Event.observe(document, 'keydown', function(event) {
  if(event.keyCode == 32) { // SPACE
    $('info').hide();
    Counter.restart();
  }
});