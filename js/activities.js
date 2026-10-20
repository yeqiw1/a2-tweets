function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	// Get completed tweets and count how many times each activity appears
	let completedTweets = tweet_array.filter(tweet =>
		tweet.source === 'completed_event' &&
		tweet.activityType !== 'unknown'
	);

	let counts = {};

	for (let tweet of completedTweets) {
		let type = tweet.activityType;
		counts[type] = (counts[type] || 0) + 1;
	}

	// Sort activities by popularity and get the top three
	let sortedActivities = Object.keys(counts).sort((a, b) =>
		counts[b] - counts[a]
	);

	let topThree = sortedActivities.slice(0, 3);

	document.getElementById('numberActivities').innerText = sortedActivities.length;
	document.getElementById('firstMost').innerText = topThree[0] || 'unknown';
	document.getElementById('secondMost').innerText = topThree[1] || 'unknown';
	document.getElementById('thirdMost').innerText = topThree[2] || 'unknown';

	// Prepare the data for the activity count chart
	let activityData = sortedActivities.map(type => ({
		activityType: type,
		count: counts[type]
	}));

	activity_vis_spec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"description": "A graph of the number of Tweets containing each type of activity.",
		"data": {
			"values": activityData
		},
		"mark": "bar",
		"encoding": {
			"x": {
				"field": "activityType",
				"type": "nominal",
				"sort": "-y",
				"title": "Activity Type"
			},
			"y": {
				"field": "count",
				"type": "quantitative",
				"title": "Number of Tweets"
			}
		}
	};

	vegaEmbed('#activityVis', activity_vis_spec, {actions:false});

	// Get the distances and days for the three most common activities
	let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	let distanceData = completedTweets
		.filter(tweet => topThree.includes(tweet.activityType) && tweet.distance > 0)
		.map(tweet => ({
			activityType: tweet.activityType,
			distance: tweet.distance,
			day: days[tweet.time.getUTCDay()]
		}));

	// Calculate the average distance for each activity
	let averages = topThree.map(type => {
		let activities = distanceData.filter(item => item.activityType === type);
		let total = activities.reduce((sum, item) => sum + item.distance, 0);

		return {
			type: type,
			average: activities.length > 0 ? total / activities.length : 0
		};
	});

	averages.sort((a, b) => b.average - a.average);

	document.getElementById('longestActivityType').innerText = averages[0]?.type || 'unknown';
	document.getElementById('shortestActivityType').innerText = averages[averages.length - 1]?.type || 'unknown';

	// Compare average distances between weekdays and weekends
	let weekdays = distanceData.filter(item =>
		item.day !== 'Saturday' && item.day !== 'Sunday'
	);

	let weekends = distanceData.filter(item =>
		item.day === 'Saturday' || item.day === 'Sunday'
	);

	let weekdayMean = weekdays.length > 0
		? weekdays.reduce((sum, item) => sum + item.distance, 0) / weekdays.length
		: 0;

	let weekendMean = weekends.length > 0
		? weekends.reduce((sum, item) => sum + item.distance, 0) / weekends.length
		: 0;

	document.getElementById('weekdayOrWeekendLonger').innerText =
		weekendMean > weekdayMean ? 'weekends' : 'weekdays';

	// Show individual distances for each activity by day of the week
	let distanceSpec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"data": {"values": distanceData},
		"mark": "point",
		"encoding": {
			"x": {
				"field": "day",
				"type": "ordinal",
				"sort": days,
				"title": "Day of Week"
			},
			"y": {
				"field": "distance",
				"type": "quantitative",
				"title": "Distance (miles)"
			},
			"color": {
				"field": "activityType",
				"type": "nominal",
				"title": "Activity Type"
			}
		}
	};

	// Show the average distance instead of every individual activity
	let aggregatedSpec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
		"data": {"values": distanceData},
		"mark": "point",
		"encoding": {
			"x": {
				"field": "day",
				"type": "ordinal",
				"sort": days,
				"title": "Day of Week"
			},
			"y": {
				"field": "distance",
				"type": "quantitative",
				"aggregate": "mean",
				"title": "Average Distance (miles)"
			},
			"color": {
				"field": "activityType",
				"type": "nominal",
				"title": "Activity Type"
			}
		}
	};

	vegaEmbed('#distanceVis', distanceSpec, {actions:false});
	vegaEmbed('#distanceVisAggregated', aggregatedSpec, {actions:false});

	document.getElementById('distanceVisAggregated').style.display = 'none';

	// Switch between individual distances and averages when the button is clicked
	document.getElementById('aggregate').addEventListener('click', function() {
		let normal = document.getElementById('distanceVis');
		let aggregated = document.getElementById('distanceVisAggregated');

		if (normal.style.display === 'none') {
			normal.style.display = 'block';
			aggregated.style.display = 'none';
			this.innerText = 'Show means';
		} else {
			normal.style.display = 'none';
			aggregated.style.display = 'block';
			this.innerText = 'Show individual distances';
		}
	});
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
