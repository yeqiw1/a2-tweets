let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Only keep tweets that include text written by the user
	writtenTweets = runkeeper_tweets
		.map(tweet => new Tweet(tweet.text, tweet.created_at))
		.filter(tweet => tweet.written);
}

function addEventHandlerForSearch() {
	// Set the initial search results to zero
	document.getElementById('searchCount').innerText = 0;
	document.getElementById('searchText').innerText = '';

	// Update the results whenever the user types in the search box
	document.getElementById('textFilter').addEventListener('input', function() {
		let searchText = this.value.trim().toLowerCase();
		let table = document.getElementById('tweetTable');

		table.innerHTML = '';
		document.getElementById('searchText').innerText = this.value;

		// Clear the results when the search box is empty
		if (searchText === '') {
			document.getElementById('searchCount').innerText = 0;
			return;
		}

		// Find tweets containing the search text, ignoring capitalization
		let matches = writtenTweets.filter(tweet =>
			tweet.writtenText.toLowerCase().includes(searchText)
		);

		document.getElementById('searchCount').innerText = matches.length;

		// Add the matching tweets to the table
		matches.forEach((tweet, index) => {
			table.innerHTML += tweet.getHTMLTableRow(index + 1);
		});
	});
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
