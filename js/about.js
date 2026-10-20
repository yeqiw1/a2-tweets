function parseTweets(runkeeper_tweets) {
	// Check if the tweets were loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	// Show the total number of tweets
	document.getElementById('numberTweets').innerText = tweet_array.length;

	if (tweet_array.length === 0) {
		return;
	}

	let earliest = tweet_array[0].time;
	let latest = tweet_array[0].time;

	let counts = {
		completed_event: 0,
		live_event: 0,
		achievement: 0,
		miscellaneous: 0
	};

	let written = 0;

	// Go through the tweets to find the dates and count each category
	for (let tweet of tweet_array) {
		if (tweet.time < earliest) earliest = tweet.time;
		if (tweet.time > latest) latest = tweet.time;

		counts[tweet.source]++;

		if (tweet.source === 'completed_event' && tweet.written) {
			written++;
		}
	}

	// Format the dates so they are easier to read
	const dateOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC'
	};

	document.getElementById('firstDate').innerText =
		earliest.toLocaleDateString('en-US', dateOptions);

	document.getElementById('lastDate').innerText =
		latest.toLocaleDateString('en-US', dateOptions);

	const categories = {
		completed_event: 'completedEvents',
		live_event: 'liveEvents',
		achievement: 'achievements',
		miscellaneous: 'miscellaneous'
	};

	// Display the number and percentage of tweets in each category
	for (let category in categories) {
		const className = categories[category];
		const count = counts[category];
		const percent = (count / tweet_array.length * 100).toFixed(2);

		document.querySelectorAll('.' + className).forEach(element => {
			element.innerText = count;
		});

		document.querySelector('.' + className + 'Pct').innerText = percent + '%';
	}

	// Show how many completed tweets include user-written text
	document.querySelector('.written').innerText = written;
	document.querySelector('.writtenPct').innerText =
		(counts.completed_event > 0
			? (written / counts.completed_event * 100).toFixed(2)
			: '0.00') + '%';
}

// Wait for the page to load before getting the tweets
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
