class Tweet {
    private text:string;
    time:Date;

    constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
        this.time = new Date(tweet_time);
    }

    // Figure out what kind of tweet this is
    get source():string {
        const text = this.text.toLowerCase();

        if (text.startsWith("just completed") || text.startsWith("just posted")) {
            return "completed_event";
        }

        if (text.includes("runkeeper live") || text.includes("#rklive")) {
            return "live_event";
        }

        if (text.includes("achieved") || text.includes("personal record")) {
            return "achievement";
        }

        return "miscellaneous";
    }

    // Check if the tweet has anything written by the user
    get written():boolean {
        return this.writtenText.length > 0;
    }

    // Remove the default RunKeeper text to get what the user wrote
    get writtenText():string {
        if (this.source !== 'completed_event') {
            return "";
        }

        let text = this.text
            .replace(/https?:\/\/\S+/g, "")
            .replace(/#Runkeeper/gi, "")
            .trim();

        if (text.toLowerCase().includes("with @runkeeper. check it out!")) {
            return "";
        }

        // User comments usually come after a dash
        const dashIndex = text.indexOf(" - ");

        if (dashIndex !== -1) {
            let userText = text.substring(dashIndex + 3).trim();

            if (userText.toLowerCase() === "tomtom mysports watch") {
                return "";
            }

            return userText;
        }

        return "";
    }

    // Get the activity name, like run, walk, bike, or meditation
    get activityType():string {
        if (this.source !== 'completed_event') {
            return "unknown";
        }

        let text = this.text.toLowerCase();

        let unitIndex = text.indexOf(" km ");
        if (unitIndex === -1) {
            unitIndex = text.indexOf(" mi ");
        }

        let activity = "";

        if (unitIndex !== -1) {
            activity = text.substring(unitIndex + 4);
        } else {
            // Some activities use time instead of distance
            activity = text;

            if (activity.startsWith("just posted an ")) {
                activity = activity.substring("just posted an ".length);
            } else if (activity.startsWith("just posted a ")) {
                activity = activity.substring("just posted a ".length);
            } else if (activity.startsWith("just completed an ")) {
                activity = activity.substring("just completed an ".length);
            } else if (activity.startsWith("just completed a ")) {
                activity = activity.substring("just completed a ".length);
            }
        }

        // Remove the extra text after the activity name
        activity = activity.split(" in ")[0];
        activity = activity.split(" with")[0];
        activity = activity.split(" -")[0];

        return activity.trim() || "unknown";
    }

    // Get the distance in miles
    get distance():number {
        if (this.source !== 'completed_event') {
            return 0;
        }

        let text = this.text.toLowerCase();

        let kmIndex = text.indexOf(" km ");
        let miIndex = text.indexOf(" mi ");

        if (kmIndex !== -1) {
            let start = text.lastIndexOf(" ", kmIndex - 1);
            let distance = parseFloat(text.substring(start + 1, kmIndex));

            // Convert kilometers to miles
            return isNaN(distance) ? 0 : distance / 1.609;
        }

        if (miIndex !== -1) {
            let start = text.lastIndexOf(" ", miIndex - 1);
            let distance = parseFloat(text.substring(start + 1, miIndex));
            return isNaN(distance) ? 0 : distance;
        }

        return 0;
    }

    // Bonus: check whether the user's message sounds positive or negative
    get sentiment():string {
        if (!this.written) {
            return "Neutral";
        }

        const positiveWords = [
            "good", "great", "amazing", "awesome", "happy",
            "love", "excellent", "wonderful", "beautiful",
            "fun", "best", "enjoy", "fantastic", "proud",
            "nice", "perfect", "strong", "better"
        ];

        const negativeWords = [
            "bad", "terrible", "awful", "tired", "exhausted",
            "pain", "hurt", "hard", "difficult", "worst",
            "hate", "sad", "slow", "sore", "horrible",
            "weak", "struggle", "painful"
        ];

        // Split the message into separate words
        const words = this.writtenText.toLowerCase().match(/[a-z]+/g) || [];

        let score = 0;

        // Add points for positive words and subtract for negative ones
        for (let word of words) {
            if (positiveWords.includes(word)) {
                score++;
            }

            if (negativeWords.includes(word)) {
                score--;
            }
        }

        if (score > 0) {
            return "Positive";
        }

        if (score < 0) {
            return "Negative";
        }

        return "Neutral";
    }

    // Make a table row for each tweet in the search results
    getHTMLTableRow(rowNumber:number):string {
        let text = this.text;

        // Find the activity link in the tweet
        let urlStart = text.indexOf("https://");
        let url = "";

        if (urlStart !== -1) {
            let urlEnd = text.indexOf(" ", urlStart);

            if (urlEnd === -1) {
                urlEnd = text.length;
            }

            let extractedUrl = text.substring(urlStart, urlEnd);

            try {
                let parsedUrl = new URL(extractedUrl);

                if (parsedUrl.protocol === "https:") {
                    url = parsedUrl.href;
                }
            } catch (error) {
                url = "";
            }
        }

        // Make sure special characters don't mess up the HTML
        let safeText = text
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");

        let safeActivity = this.activityType
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");

        // Turn the URL into a clickable link
        if (url) {
            safeText = safeText.replace(
                url,
                `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
            );
        }

        // Add the sentiment as the fourth column
        return `<tr>
            <td>${rowNumber}</td>
            <td>${safeActivity}</td>
            <td>${safeText}</td>
            <td>${this.sentiment}</td>
        </tr>`;
    }
}
