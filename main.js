var fs = require("fs"),
    streamz = require("./streamz"),
    scraper = require("./scraper"),
    http = require("http");

http.globalAgent.maxSockets = 50; 

var þingflokkur = {
    doc : "þingflokkur",
    fields : ["id","heiti","stuttskammstöfun","löngskammstöfun","fyrstaþing","síðastaþing"],
    fn : {
      þingflokkur : function(d,res) {
        res.id = d.id;
      }
    }
  };

scraper.parse("http://www.althingi.is/altext/xml/thingflokkar/",þingflokkur)
  .pipe(scraper.toCsv("data/þingflokkar.csv"));

var nefndir = {
  doc : "nefnd",
  fields : ["id","heiti","stuttskammstöfun","löngskammstöfun","fyrstaþing","síðastaþing"],
  fn : {
    nefnd : function(d,res) {
      res.id = d.id;
    }
  }
};

scraper.parse("http://www.althingi.is/altext/xml/nefndir/",nefndir)
  .pipe(scraper.toCsv("data/nefndir.csv"));


var þing = {
  doc : "þing",
  fields : ["id","tímabil","þingsetning","þinglok"],
  fn : {
    þing: function(d,res) {
      res.id = d.númer;
    }
  }
};

var atkvæðagreiðslur = {
  doc : "atkvæðagreiðsla",
  fields : ["id","málsnúmer","þingnúmer","málsflokkur","málsheiti","tími","tegund"],
  fn : {
    atkvæðagreiðsla : function(d,res) {
      res.málsnúmer = d.málsnúmer;
      res.þingnúmer = d.þingnúmer;
      res.id = d.atkvæðagreiðslunúmer;
    }
  }
};

var atkvæðaskrá = {
  doc : "þingmaður",
  fields : ["atkvæðagreiðsla_id","þingmaður_id","atkvæði"],
  fn : {
    þingmaður : function(d,res,related) {
      res.þingmaður_id = d.id;
      res.atkvæðagreiðsla_id = related.id;
    },
    finalize : function(res) {
      res.atkvæði = res.atkvæði[0];
    }
  }
};



pþ = scraper.parse("http://www.althingi.is/altext/xml/loggjafarthing/",þing);

pþ.pipe(scraper.toCsv("data/þing.csv"));

var fAtkvæðagreiðslur = scraper.toCsv("data/atkvæðagreiðslur.csv"),
    fAtkvæðaskrá = scraper.toCsv("data/atkvæðaskrá.csv");

pþ.pipe(streamz(function(d) {
  var pa = scraper.parse("http://www.althingi.is/altext/xml/atkvaedagreidslur/?lthing="+d.id,atkvæðagreiðslur);

  pa.pipe(fAtkvæðagreiðslur);

  pa.pipe(streamz(function(d) {
    scraper.parse("http://www.althingi.is/altext/xml/atkvaedagreidslur/atkvaedagreidsla/?numer="+d.id,atkvæðaskrá,{atkvæðagreiðsla_id:d.id})
      .pipe(fAtkvæðaskrá);
  }));
}));
