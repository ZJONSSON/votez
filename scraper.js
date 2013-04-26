var streamz = require("./streamz"),
    expat = require("node-expat"),
    request = require("request"),
    fs = require("fs");

var fError = fs.createWriteStream("data/errors.txt");

module.exports.parse = function(url,elements,related) {
  var fields ={},
      res = {},
      elem;

  var header = elements.fields.map(function(d) { return '"'+d+'"';}).join(",")+"\n";


  function error(e) {
    var msg = e+" in "+url+"\n";
    console.log(msg);
    fError.write(msg);
    this.end();
  }

  // Create an temporary associative array (faster lookup than indexOf)
  elements.fields.forEach(function(d) {
    fields[d] = true;
  });

  // functions are optional.  Default to empty object
  elements.fn = elements.fn || {};
  related = related || {};

  var selector = streamz();

  selector.on("pipe",function(src) {
      src.on("startElement",function(d,e) {
        // Run a function on the element, if such function is defined
        if (elements.fn[d]) elements.fn[d](e,res,related);
        // If this element is not part of selected we return, leaving elem blank
        if (!fields[d]) return;
        elem = d;
        res[elem] = "";
      });

      src.on("endElement",function(d) {
        // If the element that ended is the doc element, we push the results
        if (d == elements.doc) {
          if (elements.fn.finalize) elements.fn.finalize(res);
          res._header_ = header;
          res._text_ = elements.fields.map(function(key) {
            return '"'+(res[key] || related[key] || "")+'"';
          }).join(",")+"\n";
          selector.push(res);
          res = {};
        }
        elem = null;
      });

      src.on("text",function(d) {
        // If this is an element of interest, we append the text to the property
        if (elem && d != "\n") res[elem] += d;
      });
    })
  .on("error",error)
  .on("end",function() { process.stdout.write(".");});

  var parser = new expat.Parser("UTF-8").on("error",error);

  return request(url)
    .pipe(parser)
    .pipe(selector);

};


// Transform object into a string (with header at top) and store in filestream
module.exports.toCsv = function(f) {
  var first=true;
  var s = streamz(function(d) {
    this.push((first ? d._header_ : "") +d._text_);
    first = false;
  });
  s.pipe(fs.createWriteStream(f));
  s.on("end",function(d) { process.stdout.write(".");});
  return s;
};