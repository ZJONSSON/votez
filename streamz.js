/*jshint node:true*/
"use strict";
var stream = require("stream"),
    util = require("util");

function Stream(fn,concurrentCap,options) {
  if (!(this instanceof Stream))
    return new Stream(fn,concurrentCap);

  options = options || {};
  options.objectMode = true;
  options.highWaterMark = options.highWaterMark || 10;

  stream.Transform.call(this,options);

  this._concurrentCap = concurrentCap || 1;

  if (fn) this._fn = fn;
  
  this._incomingPipes = 0;
  this._concurrent = 0;
  this._endEmitted = false;

  this.on("pipe",function() {
    this._incomingPipes++;
  });

  this.on("unpipe",function() {
    this._incomingPipes--;
  });
}

util.inherits(Stream,stream.Transform);

Stream.prototype._transform = function(d,e,cb) {
  var self = this;

  var callback = function() {
    setImmediate(cb);
  };
  callback = cb;

  // If the function has only one argument it must be syncronous
  if (this._fn.length < 2) {
    this._fn(d);
    self.checkEnd();
    return callback();
   }

  // If we haven't reached the cap, we callback immediately
  this._concurrent+=1;
  if (this._concurrent < this._concurrentCap) {
    callback();
    callback = null;
  }

    self._fn(d,function() {
      self._concurrent--;
      self.checkEnd();
      if (callback) callback();
    });
};

Stream.prototype._fn = function(d) {
  // The default is a simple passthrough. 
  this.push(d);
};

Stream.prototype.checkEnd = function() {
  // End is only emitted when incoming pipes have end()ed
  // and no concurrent function calls are outstanding
  if (!this._incomingPipes && !this._concurrent && !this._endEmitted) {
    var self = this;
    this.endEmitted = true;
    this._ended(function() {
      self.emit("end");
    });
  }
};

// Overwrite this function for any final cleanup
Stream.prototype._ended = function(callback) {
  return callback();
};

Stream.prototype.end = function() {
  this._incomingPipes--;
  this.checkEnd();
};

module.exports = Stream;