
Inspired by [rynir](https://github.com/BjarniRunar/rynir), votez is a fast asynchronous scraper that fetches individual votes from the [Icelandic parliament](http://www.althingi.is) for every session 1992-2013.

The output from the first complete run can be downloaded [here](https://dl.dropboxusercontent.com/u/10755342/votes.zip)

Please keep in mind that the package is still experimental.

##Installation and usage
The scraper runs on [node.js](http://www.nodejs.org). Download the package and install dependencies by:

`npm install` 

First run the members scraper:

`node members.js`

and then fetch the votes:

`node votes.js`

All results are saved in the `/data/` subfolder.


##Intro

Old historical data faces more challenges than fetching only the most recent years  Members of parliament change parties and parties change over time.  For this reason I save down a chronological journal of party involvement for each individual member of congress.

To determine statistics group by party for any vote, one must first look the votes for that `vote_id`, look up all the members of parliament that participated, and determine from the journal which party they belonged to at the time of that vote.

The scraper is asynchronous and non-blocking.  It can therefore be scaled drastically, even on a single thread.   The number of outstanding HTTP requests outstanding at any point is controlled by: `http.globalAgent.maxSockets`.   My general rule is to be polite and avoid problems on the other side.  Please be respectful.

## Output

The data is normalized and saved to csv files, but can be easily recombined in browser or on server as needed.

There are two scrapers, one to fetch member's names, id's and chronological party involvement.   The other scraper fetches all voting results with reference to case names and case id's.

The `members.js` scraper must be run before `votes.js`, as the normalization process of voting results relies on looking up `member_id` for any individual member of parliament from the `members.csv` file.

### Members.csv
* `name`
* `member_id`  (the official reference number on Parliament web)
* `kt` (Icelandic social security)

### periods.csv
 * `member_id`
 * `session_id`
 * `from` (date entry started)
 * `to` (date entry ende)
 * `pos` (the rank within region)
 * `type` (disregard, always Þingm)
 * `region` 
 * `party`  (key field)
 * `sub` (substitute flag)

### meeting.csv
* `voting_id`
* `parliament_id`
* `session_id`
* `case_id`
* `case`
* `subtopic`
* `doc_id`
* `timestamp`
* `result`

### votes.csv
* `voting_id`
* `member_id`
* `vote`   (j = yes, n = no, g=pass, f=absent)




