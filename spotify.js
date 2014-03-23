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
        '?q=' + encodeURIComponent(query)
    ].join('');
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
    for (var attr in attrs) {
        iframe.setAttribute(attr, attrs[attr]);
    }

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
    var sizes = {
        'large': 300,
        'compact': 80
    };


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
    trackByHref(metadata[0]).spotify = metadata[1]; // Load the metadata into
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

    var artistNames = track.artists.map(function(t) {
        return t.name;
    });
    return artistNames.join(separator);
}


function trackByHref(href) {
    // (2) This function simply lets us grab the track object by spotify URL

    return tracks.filter(function(t) {
        return (t.href == href);
    })[0];
}


function coverURL(track) {
    // (1) This function grabs the cover thumbnail URL that the Spotify API 
    // provides us with and modifies it to grab the hi-res, unbranded version

    return track.spotify.thumbnail_url.replace('/cover/', '/640/');
}