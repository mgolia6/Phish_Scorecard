const storage = {
    // Save ratings for a specific show
    saveRatings: function(showDate, ratings) {
        const data = this.getAllRatings();
        data[showDate] = ratings;
        localStorage.setItem('phishowRatings', JSON.stringify(data));
    },

    // Get ratings for a specific show
    getRatings: function(showDate) {
        const data = this.getAllRatings();
        return data[showDate] || null;
    },

    // Get all ratings
    getAllRatings: function() {
        const data = localStorage.getItem('phishowRatings');
        return data ? JSON.parse(data) : {};
    },

    // Save overall show rating
    saveShowRating: function(showDate, rating) {
        const data = this.getAllShowRatings();
        data[showDate] = rating;
        localStorage.setItem('phishowShowRatings', JSON.stringify(data));
    },

    // Get all show ratings
    getAllShowRatings: function() {
        const data = localStorage.getItem('phishowShowRatings');
        return data ? JSON.parse(data) : {};
    },

    // Update song statistics
    updateSongStats: function(song, rating) {
        const stats = this.getAllSongStats();
        if (!stats[song]) {
            stats[song] = {
                count: 0,
                totalRating: 0,
                jamChartCount: 0
            };
        }
        stats[song].count++;
        stats[song].totalRating += rating;
        localStorage.setItem('phishowSongStats', JSON.stringify(stats));
    },

    // Get all song statistics
    getAllSongStats: function() {
        const data = localStorage.getItem('phishowSongStats');
        return data ? JSON.parse(data) : {};
    },

    // Clear all stored data (useful for testing)
    clearAllData: function() {
        localStorage.removeItem('phishowRatings');
        localStorage.removeItem('phishowShowRatings');
        localStorage.removeItem('phishowSongStats');
    }
};
