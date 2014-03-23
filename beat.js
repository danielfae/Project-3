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
window.onload = function() {
    // (1) Grab the tracks from Spotify's search results
    tracks = SPSearch('track', search).tracks;

    // (1) Limit our results list
    var numTracks = Math.min(maxTracks, tracks.length);
    tracks = tracks.slice(0, numTracks);

    // (1) Iterate over our tracks and 
    for (var i = 0; i < numTracks; i++) {
        var div = trackDiv(tracks[i]); // (1) create a div to hold it
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
    } else {
        console.log(trackDiv.id, "missing 'data-playlist-position' attribute.");
    }
}



//////////////////////////////////////////////////////////////////////////////
// Generating individual cells

function cellsFromTrackAndAttrs(track, attrs) {
    var cells = [ // A list of pairs containing the 1) class we want in a cell,
        // and 2) the content we want in the cell
        ['spotify-embed', SPIframe(track, 'compact')],
        ['artist', attrs['data-artist']],
        ['title', attrs['data-title']],
        ['tempo', attrs['data-tempo'] > 0 ? // if we have a number
            Math.round(attrs['data-tempo']) : // round it
            '-'
        ] // otherwise, display it as '-'
    ];

    // (1) Iterate over those cells & wrap that content in an appropriate Node
    for (var i = 0; i < cells.length; i++) {
        cells[i][1] = entag('div', // (2) Reset the second element
            {
                'class': 'cell' + ' ' + cells[i][0]
            }, // use the 1st element as class
            cells[i][1]); // and 2nd as content
    }

    // (2) a list of just each item's _2nd_ element (the wrapped content)
    // You can read more about map at:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    return cells.map(function(c) {
        return c[1];
    });
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
    if (arrow.classList.contains('up')) {
        ascending = 'ascending';
    } else {
        ascending = 'descending';
    }

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

    toSort.sort(sortingFunction); // Note that sort can take an argument used
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

    var directions = {
        'ascending': -1,
        'descending': 1
    };
    var sortDirection = directions[direction];

    function sortFunction(track1, track2) {
        var attr1 = track1.getAttribute('data-' + whichClass);
        var attr2 = track2.getAttribute('data-' + whichClass);

        // (2) Check to see if attrs can be interpreted numerically, if so treat
        // them as such
        attr1 = parseFloat(attr1) ? parseFloat(attr1) : attr1;
        attr2 = parseFloat(attr2) ? parseFloat(attr2) : attr2;

        // Array.sort is expecting to receive something < 0, 0, or > 0
        if (attr1 == attr2) {
            return 0;
        } else if (attr1 < attr2) {
            return 1 * sortDirection;
        }
        // else
        return -1 * sortDirection;
    }

    return sortFunction;
}



//////////////////////////////////////////////////////////////////////////////
// Spotify & EchoNest data collection

function analyse(track) {
    // This function is where the bulk of the API calls are being made from,
    // it gathers the info from Spotify and EchoNest which we load into the
    // track object in tracks[]

    track.echo = ENSearch(track) || null; // This lets us set a variable to 
    // the results of ENSearch, or if
    // there are no results, null
    if (track.echo) { // if we had results
        track.echo.audio_summary = ENAudioSummary(track);
        track.echo.audio_analysis = ENAudioAnalysis(track);
    }

    track.spotify = track.spotify || SPMetadata(track);
}

// The remainder of the Spotify and EchoNest functionality is in spotify.js
// and echonest.js, respectively.



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
    for (var key in attributes) {
        element.setAttribute(key, attributes[key]);
    }

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
    } else if (content instanceof Node) {
        // if we have a Node, just insert it
        container.appendChild(content);
    } else {
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
    var x = points.map(function(e) {
        return e[0];
    });
    var y = points.map(function(e) {
        return e[1];
    });

    // Find the biggest and smallest x to get the range of each
    var xRange = Math.max.apply(this, x) - Math.min.apply(this, x);
    var yRange = Math.max.apply(this, y) - Math.min.apply(this, y);

    // Figuring out how much we need to shrink our x's and y's by
    var xRatio = xRange / xRangeMax;
    var yRatio = yRange / yRangeMax;

    // Actually shrinking our x's and y's
    var newX = x.map(function(e) {
        return e / xRatio;
    });
    var newY = y.map(function(e) {
        return e / yRatio;
    });

    // Stitch our x's and y's back together into our scaled points list
    var scaled = [];
    for (var i = 0; i < points.length; i++) {
        scaled.push([newX[i], newY[i]]);
    }

    return scaled;
}