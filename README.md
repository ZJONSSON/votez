
Inspired by [rynir](https://github.com/BjarniRunar/rynir), votez is a fast asynchronous scraper that fetches individual votes from the [Icelandic parliament](http://www.althingi.is) for every session 1992-2013.

The output from the first complete run can be downloaded [here](https://dl.dropboxusercontent.com/u/10755342/votes.zip)

Please keep in mind that the package is still experimental.

##Installation and usage
The scraper runs on [node.js](http://www.nodejs.org). Download the package and install dependencies by:

`npm install` 

And run scraper with: 

`node main.js`

##Intro

Old historical data faces more challenges than fetching only the most recent years  Members of parliament change parties and parties change over time.  For this reason I save down a chronological journal of party involvement for each individual member of congress.

To determine statistics group by party for any vote, one must first look the votes for that `vote_id`, look up all the members of parliament that participated, and determine from the journal which party they belonged to at the time of that vote.

The scraper is asynchronous and non-blocking.  It can therefore be scaled drastically, even on a single thread.   The number of outstanding HTTP requests outstanding at any point is controlled by: `http.globalAgent.maxSockets`.   My general rule is to be polite and avoid problems on the other side.  Please be respectful.

## Output

The data is normalized and saved to csv files, but can be easily recombined in browser or on server as needed.

(work still in progress, csv files to mirror XML as much as possible)