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
};