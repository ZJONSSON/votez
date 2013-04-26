/*jshint node:true*/
"use strict";
var fs = require("fs"),
    http = require("http"),
    request = require("request"),
    iconv = require("iconv-lite"),
    cheerio = require("cheerio");

http.globalAgent.maxSockets = 30; // Be Nice... the higher number, the more concurrent requests

var reId = /.*\=(\d*)/,
    reKt = /.*knt\=(\d*)/,
    reTimabil = /\<tt\>(\d*?)\s([^<]*?)\s-\s([^<]*?)\:\s\<\/tt\>(\d*)\.\s(.*?)\.\s(.*?)\,\s(.*?)\s.*?\<br\>/g;

var fMembers = fs.createWriteStream("./data/members.csv",'utf8'),
    fPeriods = fs.createWriteStream("./data/periods.csv",'utf8');

fMembers.write("name,member_id,kt\n");
fPeriods.write("member_id,session_id,from,to,pos,type,region,party,sub\n");

var letters = ['A','%C1','B','D','E','F','G','H','I','%CD','J','K','L','M','N','O','%D3','P','R','S','T','U','V','%DE','%D6'];

var members = {};

letters.forEach(function(letter) {
  request({url:"http://www.althingi.is/cv.php4/?cstafur="+letter+"&bnuverandi=0",encoding:null},function(e,r,body) {
    var $ = cheerio.load(iconv.decode(body,'iso-8859-1'));
    $(".FyrirsognSv")
      .filter(function() { return this.attr("HREF").indexOf("nfaerslunr") > -1; })
      .each(function(d,i) {
        var memberId = reId.exec(this.attr("HREF"))[1];
        loadThingStorf(members[memberId] = {name: this.text(), id: memberId});
        console.log(memberId,this.text());
    });
  });
});

function loadThingStorf(member) {
  request({url:"http://www.althingi.is/vefur/thmstorf.html?nfaerslunr="+member.id,encoding:null},function(e,r,body) {
    if (e) return console.log(e);
    var $ = cheerio.load(iconv.decode(body,'iso-8859-1')),kt;
    $("a").each(function(d) {
      if (member.kt) return;
      var kt = reKt.exec(this.attr("HREF"));
      if (kt) {
        member.kt = kt[1];
        fMembers.write(member.name+","+member.id+","+member.kt+"\n");
        loadThingSeta(member);
        return;
      }
    });
  });
}

function loadThingSeta(member) {
  request({url:"http://www.althingi.is/dba-bin/thms.pl?ktmenu=1&knt="+member.kt,encoding:null},function(e,r,body) {
    body = iconv.decode(body,'iso-8859-1').replace(/\<\/*a[^]*?\>/g,"");
    if(e) return console.log(member.id);
    var match;
    while ((match = reTimabil.exec(body)) !== null) {
      match.push(match[0].indexOf('varaþm') > -1 ? 1 : 0);  // If substitute - raise flag
      fPeriods.write(member.id+","+match.slice(1).join(",")+"\n");
    }
    process.stdout.write(".");
  });
}