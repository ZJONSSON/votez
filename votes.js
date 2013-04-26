var fs = require("fs"),
    iconv = require("iconv-lite"),
    streamz = require("./streams"),
    http = require("http"),
    request = require("request");

http.globalAgent.maxSockets = 50;  // be nice

// Members cache
var members = {},
    memberId = 0;

// Regex patterns
var reResults = /[^] 09.10.2002 Ingvi([^]*?)<div style='clear:both[^]/,
    reVote = /<nobr>(.*):<\/nobr>\s(.*),+/gi,
    reMeeting = /Alþingi (.*)\. löggjafarþing. (.*)\. fundur[^]*?\<BR\>\n(.*)\. mál\.\s(.*)\<BR\>\n(.*)\<BR\>\n(Þskj\.\s(.*)\.[^]*\<BR\>\n)?(.*)\<BR\>\n(.*?)\<BR\>/,
    reAll = /nafnak=(.*?)\"\>(.*)\<\/a\>\:\s(\d*)\sj/g;

// Output files
var fMeeting = fs.createWriteStream('./data/meeting.csv','utf8'),
    fVotes = fs.createWriteStream('./data/votes.csv','utf8');

// CSV headers
fMeeting.write("voting_id,parliament_id,session_id,case_id,case,subtopic,doc_id,timestamp,result\n");
fVotes.write("voting_id,member_id,vote\n");

 
// Stream functions
var decodeStream = function(num) {
  return streamz(function(d) {
    d = iconv.decode(d,'iso-8859-1');
    if (d.indexOf("<nobr>") == -1) return console.log("Voting no :"+num+" does not exists");
    this.push({text:d,num:num});
  });
};

function parseMeeting(d) {
  var m = reMeeting.exec(d.text);
  if (!m) return console.log("Meeting not matched: "+d.num);
  m.splice(6,1);
  m = m.slice(1)
    .map(function(d) {
      return (d && d.replace(/,/g,'')) || '';
    });
  
  this.push(d.num+","+m+"\n");
  process.stdout.write(".");
}

function parseVotes(d) {
  var s = d.text.match(reResults),match;
  if (!s) return console.log("Votes not matched: "+d.num);
  if (!reVote.exec(s[1])) return console.log("no match votes "+d.num);
  while ( ( match = reVote.exec(s[1])) !== null) {
    var memberId = members[match[1]];
    if (!memberId) return console.log(match[1]+" not found");  
    vote = match[2].slice(0,1);
    this.push(d.num+","+memberId+","+vote+"\n");
  }
}

// Page reading, parsing and piping
function parse(num) {
  var file = streamz(),
      page = file.pipe(decodeStream(num));
    
    page.pipe(streamz(parseVotes))
      .pipe(fVotes);

    page.pipe(streamz(parseMeeting))
      .pipe(fMeeting);
  
  request({url:"http://www.althingi.is/dba-bin/atkvgr.pl?nnafnak="+num,encoding:null},function(err,res,body) {
    if (!body) return;
    file.push(body);
    file.end();
  });
}


var members = {};
fs.readFileSync("./data/members.csv",'utf8')
  .split("\n")
  .slice(1)
  .forEach(function(d) {
    d = d.split(",");
    d && (members[d[0]] = d[1]);
  })
    

// List of all activity since 1991 - downloaded on 4/25/2013
var all = fs.readFileSync("./all.html",'utf-8'),
    cases = [],c;

// Select vote_ids where the id exists and number of votes is > 0
while ((c = reAll.exec(all)) !== null)
  if (c[3] && c[1]>0)
   cases.push(c[1]);

 cases.forEach(parse);
  