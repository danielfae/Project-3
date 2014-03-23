// We're going to try something new in these comments. Different comments are 
// targeted at different levels of expertise.  In an effort to help you 
// ignore things that don't matter, we've labeled these:
// (1) Need-to-know -- You won't know what's going on without this.
// (2) Want-to-know -- If you wanted to recreate this, you'd need this.
// (3) Nice-to-know -- A subtlety or advanced feature you may want to explore.

var tracklist = document.getElementById('tracklist');

// (1) An initially empty variable we'll use to point to the current track
var currentTrack = null;

// (1) An array to hold all the tracks we'll be playing with
var tracks = [];

// (1) We're going to construct our search using Spotify's API, in our case
// searching for Kanye West and limiting our results to 10 tracks
var search = 'Kanye West';
var maxTracks = 10;



//////////////////////////////////////////////////////////////////////////////
// Loading the page

// (1) When everything is loaded, then--
window.onload = function () {
	// (1) Grab the tracks from Spotify's search results
	tracks = SPSearch('track', search).tracks;

	// (1) Limit our results list
	var numTracks = Math.min(maxTracks, tracks.length);
	tracks = tracks.slice(0, numTracks);

	// (1) Iterate over our tracks and 
	for (var i = 0; i < numTracks; i++) {
		var div = trackDiv(tracks[i]);  // (1) create a div to hold it
		insertTrackDiv(div, tracklist); // (1) put it into our list
	}

	// (1) Add click handlers to the sorting controls
	var sortArrows = tracklist.querySelectorAll('a.sort');
	for (var j = 0; j < sortArrows.length; j++) {
		sortArrows[j].addEventListener('click', sortByMe, false);
	}
};



//////////////////////////////////////////////////////////////////////////////
// Generating the tracklist rows

function trackDiv(track) {
	// (1) This function generates a div from a given track
	
	analyse(track); // (1) Grab all the Spotify and Echonest data we need and 
					// put it into the track object

	var attrs = rowAttrsFromTrack(track); // (1) generate the data- attributes
										  // we'll be using for the trackDiv

	var row = entag(
		'div', // (1) Create a div
		attrs, // with these attributes
		cellsFromTrackAndAttrs(track, attrs)); // which contains these cells
	
	rowBackground(row); // (1) and add a background to the row

	return row;
}


function rowAttrsFromTrack(track) {
	// (1) We're using http://ejohn.org/blog/html-5-data-attributes/ to store 
	// information about each track in attributes of the div itself.  This
	// function generates those attributes we'll attach later

	var attrs = {
			'class': 'track row',
			'id': track.href,
			'data-album': track.album.name,
			'data-artist': artists(track),
			'data-title': track.name,
			// (3) This is the conditional operator, which can be used as a 
			// shortcut for writing out a full if/else statement.  You can read
			// more about it at:
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator
			'data-tempo': track.echo ? track.echo.audio_summary.tempo : -1
		};

	return attrs;
}


function insertTrackDiv(trackDiv, tracklist) {
	// (1) This function actually inserts the div we make into the tracklist
	var tracklistBody = tracklist.getElementsByClassName('body')[0];
	var numTracks = tracklistBody.children.length;

	// (1) We keep track of the playlist position in a data-attribute
	trackDiv.setAttribute('data-playlist-position', numTracks);
	placeRow(trackDiv); // and have a function to place it spatially
	tracklistBody.appendChild(trackDiv);

	return trackDiv;
}


function placeRow(trackDiv) {
	// (2) Naively, you'd want to control placement and ordering of tracks just
	// by controlling the ordering of the tracklists children; however, since
	// we're dealing with embedded content (the play embeds Spotify offers),
	// a subtlety is involved.  Whenever an iframe's position in the DOM 
	// changes, its content reloads.  This means that when we reordered the
	// rows, we'd be incurring a delay as we wait for the refresh on all the
	// iframes.
	//
	// Instead, we decouple the ordering in the DOM from the position, and 
	// manually calculate the position we use--

	if (trackDiv.hasAttribute('data-playlist-position')) {
		var pos = trackDiv.getAttribute('data-playlist-position');
		trackDiv.style.top = "calc(" + pos + "*(80px + 1em + 1px)" + ")";
	}
	else {
		console.log(trackDiv.id, "missing 'data-playlist-position' attribute.");
	}
}



//////////////////////////////////////////////////////////////////////////////
// Generating individual cells

function cellsFromTrackAndAttrs(track, attrs) {
	var cells = [	// A list of pairs containing the 1) class we want in a cell,
					// and 2) the content we want in the cell
	['spotify-embed', SPIframe(track, 'compact')],
	['artist', attrs['data-artist']],
	['title', attrs['data-title']],
	['tempo', attrs['data-tempo'] > 0 ? // if we have a number
				Math.round(attrs['data-tempo']) : // round it
				'-'] // otherwise, display it as '-'
	];

	// (1) Iterate over those cells & wrap that content in an appropriate Node
	for (var i = 0; i < cells.length; i++) {
	cells[i][1] = entag('div',					// (2) Reset the second element
		{'class': 'cell' + ' ' + cells[i][0]},	// use the 1st element as class
		cells[i][1]);							// and 2nd as content
	}

	// (2) a list of just each item's _2nd_ element (the wrapped content)
	// You can read more about map at:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
	return cells.map(function(c) { return c[1]; });
}



//////////////////////////////////////////////////////////////////////////////
// Playback functionality

function setCurrentTrack(track) {
	// (1) This function implements the interface functionality to change the 
	// content of our info-container and animating the slide-down transition
	// (as well as, via CSS, the highlighted track change) when we select a
	// track by clicking on its .inter.

	if (currentTrack) {
		// (1) If there is a currentTrack, unhighlight it
		var currentTR = document.getElementById(currentTrack.href);
		currentTR.classList.remove('current-track');
	}

	// (1) Highlight the new track
	currentTrack = track;
	var trackDiv = document.getElementById(track.href);
	trackDiv.classList.add('current-track');

	// (1) Set the cover album art to the URL grabbed from Spotify metadata
	document.getElementById('cover').style.backgroundImage = 'url(' + coverURL(track) + ')';

	// (1) Modify the displayed artist and track name
	document.getElementById('track-artist').innerHTML = artists(track);
	document.getElementById('track-name').innerHTML = track.name;

	// (1) Fade in all the children of #info-container-- i.e. our track
	// info and album cover	
	document.getElementById('cover-container').style.opacity = 1;
	document.getElementById('track-data-container').style.opacity = 1;

	// (1) Move our container down to display the info-container
	document.getElementById('container').style.top = (240 + 10) + 'px';
}


function inter() {
	// (1) This function generates a simple div we'll use as an overlay to
	// intercept events

	var interstitial = document.createElement('div');
	interstitial.setAttribute('class', 'inter');
	interstitial.addEventListener('click', setInters);

	return interstitial;
}


function setInters(e) {
	// (1) Every time an .inter is clicked, we want to change the currentTrack
	// reset the other .inters, and hide the one just clicked.

	var href = e.toElement.parentNode.getAttribute('data-contained-track');
	var track = trackByHref(href);
	setCurrentTrack(track);

	var inters = document.getElementsByClassName('inter');
	for (var i = 0; i < inters.length; i++) {
		inters[i].style.display = 'initial';
	}
	e.toElement.style.display = 'none';
}



//////////////////////////////////////////////////////////////////////////////
// Sorting the tracklist by various headings

function sortByMe(e) {
	// (1) This function is a click handler which coordinates sorting a column

	var arrow = e.toElement; // Which element received this event?
	var heading = arrow.id.split('-')[1]; // Find out which heading is ours

	var ascending = null;
	if (arrow.classList.contains('up')) { ascending = 'ascending'; }
	else { ascending = 'descending'; }

	sortTableBy(tracklist, sortBy(heading, ascending));
}


function sortTableBy(table, sortingFunction) {
	// (1) This function actually sorts the table

	// (3) Since our elements aren't ordered in the DOM, to find their 
	// current order, we need to sort by their playlist-position when we grab
	// them
	var toSort = Array.prototype.slice.call(
		table.getElementsByClassName('track row')).sort(
			sortBy('playlist-position', 'ascending'));

	toSort.sort(sortingFunction);	// Note that sort can take an argument used
									// used to determine order

	// (2) Now that we've sorted the list, change the playlist position attributes
	for (var i = 0; i < toSort.length; i++) {
		toSort[i].setAttribute('data-playlist-position', i);
		placeRow(toSort[i]);
	}
}


function sortBy(whichClass, direction) {
	// (2) This function returns a function which Array.sort can use to 
	// determine whether one thing is 'less' or 'greater' than another--
	//
	// (3) This ability to change the sort order means that we can sort
	// arbitrary collections of things that don't have a natural order--
	// For numbers and words, we have a notion of order (numeric and 
	// alphabetical, respectively).  This lets us sort in ascending or 
	// descending order by writing our own sort function.
	//
	// (3) You can read more about Array.sort at:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort

	var directions = {'ascending': -1, 'descending': 1};
	var sortDirection = directions[direction];

	function sortFunction(track1, track2)  {
		var attr1 = track1.getAttribute('data-' + whichClass);
		var attr2 = track2.getAttribute('data-' + whichClass);

		// (2) Check to see if attrs can be interpreted numerically, if so treat
		// them as such
		attr1 = parseFloat(attr1) ? parseFloat(attr1) : attr1;
		attr2 = parseFloat(attr2) ? parseFloat(attr2) : attr2;

		// Array.sort is expecting to receive something < 0, 0, or > 0
		if (attr1 == attr2) { return 0; }
		else if (attr1 < attr2) { return 1*sortDirection; }
		// else
		return -1*sortDirection;
	}

	return sortFunction;
}



//////////////////////////////////////////////////////////////////////////////
// Spotify & EchoNest data collection

function analyse(track) {
	// This function is where the bulk of the API calls are being made from,
	// it gathers the info from Spotify and EchoNest which we load into the
	// track object in tracks[]

	track.echo = ENSearch(track) || null;	// This lets us set a variable to 
											// the results of ENSearch, or if
											// there are no results, null
	if (track.echo) { // if we had results
		track.echo.audio_summary = ENAudioSummary(track);
		track.echo.audio_analysis = ENAudioAnalysis(track);
	}

	track.spotify = track.spotify || SPMetadata(track);
}



//////////////////////////////////////
// Spotify functionality

function SPSearch(type, query) {
	// (1) This function interfaces with Spotify's basic search API
	//
	// Sample query: http://ws.spotify.com/search/1/track.json?q=beyonc%C3%A9
	//
	// You can read more about it at:
	// https://developer.spotify.com/technologies/web-api/

	var url = [
		'https://ws.spotify.com/search/1/', // Spotify's API "endpoint"
		type + '.json', // we want our results in JSON
		'?q=' + encodeURIComponent(query)].join('');
	// Oftentimes, when you're constructing a URL, you need to make sure that 
	// things you are putting in the URL (like spaces or slashes) are formatted
	// appropriately; this is what encodeURIComponent does.

	return JSON.parse(httpGET(url)); // Actually GET and parse the results
}


function SPIframe(track) {
	// (1) This function creates the iframe element we use to add embed
	// functionality--
	//
	//	Sample iframe embed code:
	// <iframe src="https://embed.spotify.com/?uri=spotify:track:4bz7uB4edifWKJXSDxwHcs" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>

	var iframe = document.createElement('iframe');

	var attrs = SPIframeAttrs(track);
	for (var attr in attrs) { iframe.setAttribute(attr, attrs[attr]); }

	var embedContainer = document.createElement('div');
	embedContainer.setAttribute('class', 'embed-container');
	// (2) We're storing the track.href in the data-contained-track attribute
	// of the iframe so we can easily find out which track is in the iframe
	embedContainer.setAttribute('data-contained-track', iframe.id);


	// (3) A lot of complexities are introduced when dealing with iframes or 
	// cross posted/hosted scripts or content.  Many of the things you 
	// expect to be able to do--like listen for a click event--you can't
	// because it poses a security risk.  You can read more about this:
	// https://en.wikipedia.org/wiki/Cross-site_scripting
	//
	// For us, it means that we needed to basically insert another div
	// in between our user and the iframe and force people to 'double-click'
	// so that we can detect events with some reasonableness.
	//
	// This is what the 'inter' element (short for interstitial) does--it's a
	// transparent overlay we use to detect events.
	embedContainer.appendChild(iframe);
	embedContainer.appendChild(inter());

	return embedContainer;
}


function SPIframeAttrs(track) {
	// (2) This function creates a dictionary of the attributes we want our 
	// embedded spotify player to have

	// Sizes Spotify supports
	var sizes = {'large': 300, 'compact': 80};


	var attrs = {
		'src': 'https://embed.spotify.com/?uri=' + track.href,
		'width': 80,
		'height': sizes['compact'],
		'frameborder': 0,
		'allowtransparency': 'true',
		'class': 'track-container',
		// (3) Our trackDiv's _also_ have this id, however, the iframe is 
		// a separate document, so they do not conflict--
		'id': track.href
	};

	return attrs;
}


function SPMetadata(track) {
	// (1) This function queries Spotify's metadata API for information _about_
	// songs, like album covers or artists or. . .
	//
	// You can read more about it at:
	// https://developer.spotify.com/technologies/web-api/
	//
	// (1) We need to use https://en.wikipedia.org/wiki/JSONP to 
	// grab the data-- Basically, we tell the server the name of a function
	// (loadSPMetadata) for us which they'll return a .js file running it,
	// passing the data we asked for as an argument.
	//
	// This lets us load the metadata in a <script> tag, which when run, calls
	// our function with Spotify's data
	
	// Construct the URL
	var url = 'https://embed.spotify.com/oembed/?url=' + track.href + '&callback=loadSPMetadata';
	
	// Make a script element which will load that URL
	script = document.createElement("script");
	script.type = "text/javascript";
	script.src = url;
	
	// And insert that script element into our document
	document.getElementsByTagName('html')[0].appendChild(script);

	return track.spotify || null;
}


function loadSPMetadata(rawMetadata) {
	// (1) This is the function we're asking Spotify to run on its data; it 
	// takes Spotify's raw response as an argument

	var metadata = parseSPMetadata(rawMetadata);
	trackByHref(metadata[0]).spotify = metadata[1];	// Load the metadata into
													// the track.spotify attr 

	return metadata[1];
}


function parseSPMetadata(metadata) {
	// (1) This is a function to, given some metadata, figure out which 
	// song the metadata belongs to.

	var href = trackHash(metadata.html);
	return [href, metadata];
}


function trackHash(SPIframe) {
	// (2) This is a function to, given Spotify's metadata--which includes
	// the html needed to embed an iframe--extract the track's unique
	// spotify URL.
	//
	// (3) To do this, we use "regular expressions"--these let you search
	// for, match, and extract bits of text based on arbitrary patterns--
	//
	// (3) You can read more about them at:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions

	var trackHashRE = /.+(spotify:track:[A-Za-z0-9]+).+/;
	return SPIframe.replace(trackHashRE, '$1');
}


function artists(track, separator) {
	// (2) This is a basic function to give us a string for a track's artist.
	// Since there can be multiple artists, we need to concatenate the
	// track.artist object

	if (typeof(separator) === "undefined") {
		// This lets us have a default argument/separator; if you don't pass
		// one we assume '&'
		separator = ' & ';
	}

	var artistNames = track.artists.map(function(t) { return t.name; });
	return artistNames.join(separator);
}


function trackByHref(href) {
	// (2) This function simply lets us grab the track object by spotify URL
	
	return tracks.filter(function(t) { return (t.href == href); })[0];
}


function coverURL(track) {
	// (1) This function grabs the cover thumbnail URL that the Spotify API 
	// provides us with and modifies it to grab the hi-res, unbranded version

	return track.spotify.thumbnail_url.replace('/cover/', '/640/');
}



//////////////////////////////////////
// EchoNest functionality

// (1) Spotify's API is open to anyone, for EchoNest's you need to sign up for 
// your own API key -- this is a credential that lets EchoNest keep track of 
// who is using their API how.  You can read more about EchoNest's API, 
// including how to get a key, at http://developer.echonest.com/docs/v4

var ENAPI = 'https://developer.echonest.com/api/v4/';
var ENAPIKey = '0TPFPI9TGBX5CJU49';


function ENSearch(track) {
	// (1) This function takes a track (which you may remember we got from 
	// Spotify's API) and searches EchoNest for it, returning the first
	// result if there is one

	var artistQuery = artists(track, ' ');
	var titleQuery = track.name;

	var ENResults = ENSongSearch({'artist': artistQuery, 'title': titleQuery});

	if (ENResults[0]) { return ENResults[0]; }
	// else
	return null;
}


function ENSongSearch(parameters) {
	// (1) This function searches _just_ EchoNest's song API and returns the 
	// parsed JSON object
	//
	// An example query URL:
	// http://developer.echonest.com/api/v4/song/search?api_key=0TPFPI9TGBX5CJU49&format=json&results=1&artist=radiohead&title=karma%20police

	// Constructing the URL we'll use 
	parameters['format'] = 'json';
	var songSearchAPI = ENAPI + 'song/search';
	var url = [
		songSearchAPI,
		'?api_key=' + ENAPIKey,
		urlEncodeParams(parameters)].join('');

	return JSON.parse(httpGET(url)).response.songs; // grabbing just songs info
}


function ENAudioAnalysis(audioSummariedTrack) {
	// (1) This function takes a track which _already has an audio_summary_ to
	// go get a full audio_analysis from EchoNest.  You can read more about
	// the audio_analysis at:
	// http://developer.echonest.com/docs/v4/_static/AnalyzeDocumentation.pdf

	return JSON.parse(httpGET(audioSummariedTrack.echo.audio_summary.analysis_url));
}


function ENAudioSummary(echoedTrack) {
	// (1) This function runs on a track which _already has the basic EchoNest
	// info_ to grab the audio_summary.  You can read more about the summary:
	// https://developer.echonest.com/raw_tutorials/faqs/faq_04.html

	var audioResult = ENSongMetadata(echoedTrack.echo.id, 'audio_summary');

	if (audioResult.audio_summary) { return audioResult.audio_summary; }
	// else
	return null;
}


function ENSongMetadata(ENid, bucket) {
	// (1) This function takes an EchoNest ID and a type of metadata to get
	// (EchoNest calls this a 'bucket').
	//
	// Sample query:
	// http://developer.echonest.com/api/v4/track/profile?api_key=FILDTEOIK2HBORODV&format=json&id=TRTLKZV12E5AC92E11&bucket=audio_summary

	// Constructing the URL
	parameters = {
		'id': ENid,
		'bucket': bucket,
		'format': 'json'};
	var songMetadataEndpoint = ENAPI + 'song/profile';
	var url = [
		songMetadataEndpoint,
		'?api_key=',
		ENAPIKey,
		urlEncodeParams(parameters)].join('');

	// Grabbing the metadata
	return JSON.parse(httpGET(url)).response.songs[0];
}



////////////////////////////////////////
// Sketching loudness from EchoNest data

function loudnessAt(track, time) {
	// (1) This function finds the EchoNest measurement of how long a given
	// track is at a given time.

	// (3) "segments" are EchoNests objects for small bits of a song which are 
	// acoustically pretty constant.  Read more about them at:
	// http://developer.echonest.com/docs/v4/_static/AnalyzeDocumentation.pdf
	var segments = track.echo.audio_analysis.segments;
	
	var timeCovered = 0;
	
	// (2) Search through and find the segment containing the time we seek;
	// each segment is _not_ the same duration 
	for (var i = 0; i < segments.length; i++) {
		timeCovered += segments[i].duration;
		if (timeCovered > time) { return segments[i].loudness_max; }
	}
	// else
	return -1;
}


function loudnessSketch(track) {
	// (2) This function _returns a function_ which Processing runs to make 
	// our sketch.

	function sketchProc(P) {
		var myTrack = track;
		
		// (2) We'll plot loudness every 0.25 seconds
		var dt = 0.25;
		var numPoints = Math.round(myTrack.length)/dt;
		
		var loud = [];   // (2) an array to hold loudnesses
		var points = []; // (2) an array to hold the points we'll plot

		P.setup = function() {
			P.size(640, 80);
			if (track.echo) {
				for (var i = 0; i < numPoints; i++) {
					loud[i] = loudnessAt(track, dt*i);
					points[i] = [i, loud[i]];
				}

				// (2) Scale our points down to fill up our width and height
				points = scalePoints(points, P.width, P.height);


				// (1) Draw our points in a slightly transparent black
				P.noFill();
				P.stroke(0, 0.25*255);
				P.beginShape();
				for (var j = 0; j < points.length; j++) {
					var x = points[j][0];
					var y = P.height + points[j][1];
					P.curveVertex(x, y);
				}
				P.endShape();
			}
			else { console.log(track.name, "has no EchoNest data."); }
		};

		P.draw = function() {
			// (2) Since we're not animating, we don't need anything in draw
		};
	}

	return sketchProc;
}


function plotLoudness(track) {
	// (1) In this function we actually attach the Processing sketch to our canvas

	var P = new Processing(track.canvas, loudnessSketch(track));
	
	return P;
}


function rowBackground(row) {
	// (1) This function actually plots the loudness in an orphaned canvas
	// element--_i.e._ a canvas element not in the DOM--and then converts it
	// to https://en.wikipedia.org/wiki/Base64 to construct an image we use
	// as the background of a row, on the fly

	var trackCanvas = document.createElement('canvas');
	var track = trackByHref(row.id);
	track.canvas = trackCanvas;
	
	plotLoudness(track);

	// You can read more about this technique at:
	// http://www.html5canvastutorials.com/advanced/html5-canvas-get-image-data-url/
	var binaryImageData = trackCanvas.toDataURL("image/png");
	row.style.backgroundImage = "url(" + binaryImageData + ")";

	return binaryImageData;
}



//////////////////////////////////////////////////////////////////////////////
// Utility functions

function entag(tag, attributes, content) {
	// (2) This function lets us intelligently stick some content into a tag
	// with a given set of attributes without having to go through the node 
	// creation manually each time.
	//
	// Generating a table, there are a lot of times we want to wrap some
	// content in a particular type of tag with a particular set of attributes
	//
	// Generalizing this lets us avoid walking through this loop each time and
	// just think about what element we want to end up with.

	var element = document.createElement(tag);
	for (var key in attributes) { element.setAttribute(key, attributes[key]); }

	smartInsert(content, element);

	return element;
}


function smartInsert(content, container) {
	// (2) Depending on the type of content (an array, a string, a node) we
	// want to do insertion a little differently.

	if (content instanceof Array) {
		// If we have an array
		for (var i = 0; i < content.length; i++) {
			// smartInsert each element of that array
			smartInsert(content[i], container);
		}
	}
	else if (content instanceof Node) {
		// if we have a Node, just insert it
		container.appendChild(content);
	}
	else {
		// Otherwise, wrap it in a span (a Node) and insert it
		var stringContent = String(content);
		var span = document.createElement('span');
		span.innerHTML = stringContent;
		smartInsert(span, container);
	}
}


function httpGET(url) {
	// (1) This function lets us, in some ways, simulate a browser and go
	// visit a particular URL programmatically, and returns the results.
	//
	// You can read more about it at:
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send();

    return xhr.responseText;
}


function urlEncodeParams(parameters) {
	// (1) This function, given a set of parameters for a query, returns a
	// string which we can append to the end of a URL to pass parameters
	// for a query in the URL

	var string = '';

	for (var key in parameters) {
		// You can read more about encodeURIComponent at:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
		var cleanKey = encodeURIComponent(key);
		var cleanParam = encodeURIComponent(parameters[key]);
		string += ('&' + cleanKey + '=' + cleanParam);
	}

	return string;
}


function scalePoints(points, xRangeMax, yRangeMax) {
	// (2) This function takes a set of pairs of numbers (points), and scales
	// them to fit as well as possible into a box with dimensions
	// xRangeMax and yRangeMax
	//
	// (3) In it, we use techniques often found in 'functional programming',
	// https://en.wikipedia.org/wiki/Functional_programming wherein
	// 
	// (3) Specifically, we rely on map and apply, which you can read about
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
	// and
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
	// respectively


	// Grabbing our x- and y- points separately
	var x = points.map(function(e) { return e[0]; });
	var y = points.map(function(e) { return e[1]; });
	
	// Find the biggest and smallest x to get the range of each
	var xRange = Math.max.apply(this, x) - Math.min.apply(this, x);
	var yRange = Math.max.apply(this, y) - Math.min.apply(this, y);

	// Figuring out how much we need to shrink our x's and y's by
	var xRatio = xRange/xRangeMax;
	var yRatio = yRange/yRangeMax;

	// Actually shrinking our x's and y's
	var newX = x.map(function(e) { return e/xRatio; });
	var newY = y.map(function(e) { return e/yRatio; });

	// Stitch our x's and y's back together into our scaled points list
	var scaled = [];
	for (var i = 0; i < points.length; i++) {
		scaled.push([newX[i], newY[i]]);
	}

	return scaled;
}