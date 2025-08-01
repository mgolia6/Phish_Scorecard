const storage = {
    // Save ratings for a specific show
    saveRatings: function(showDate, ratings) {
        console.log('storage.saveRatings called with:', {
            showDate: showDate,
            ratingsCount: ratings ? ratings.length : 0,
            ratings: ratings
        });
        
        try {
            const data = this.getAllRatings();
            data[showDate] = ratings;
            localStorage.setItem('phishowRatings', JSON.stringify(data));
            console.log('Ratings saved successfully to localStorage');
        } catch (error) {
            console.error('Error in storage.saveRatings:', {
                error: error,
                showDate: showDate,
                ratingsData: ratings
            });
            throw error; // Re-throw to let the calling function handle it
        }
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
        data[showDate] = {
            average: rating.average,
            setRatings: rating.setRatings,
            timestamp: rating.timestamp || new Date().toISOString()
        };
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
                ratings: [],
                lastUpdated: null
            };
        }
        stats[song].count++;
        stats[song].totalRating += rating;
        stats[song].ratings.push({
            rating: rating,
            timestamp: new Date().toISOString()
        });
        stats[song].lastUpdated = new Date().toISOString();
        localStorage.setItem('phishowSongStats', JSON.stringify(stats));
    },

    // Get all song statistics
    getAllSongStats: function() {
        const data = localStorage.getItem('phishowSongStats');
        return data ? JSON.parse(data) : {};
    },

    // Get stats for a specific song
    getSongStats: function(song) {
        const stats = this.getAllSongStats();
        return stats[song] || null;
    },

    // Save user notes
    saveNotes: function(showDate, notes) {
        const data = this.getAllNotes();
        data[showDate] = {
            notes: notes,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('phishowNotes', JSON.stringify(data));
    },

    // Get all notes
    getAllNotes: function() {
        const data = localStorage.getItem('phishowNotes');
        return data ? JSON.parse(data) : {};
    },

    // Clear all stored data
    clearAllData: function() {
        localStorage.removeItem('phishowRatings');
        localStorage.removeItem('phishowShowRatings');
        localStorage.removeItem('phishowSongStats');
        localStorage.removeItem('phishowNotes');
    },

    // Export all data
    exportData: function() {
        return {
            ratings: this.getAllRatings(),
            showRatings: this.getAllShowRatings(),
            songStats: this.getAllSongStats(),
            notes: this.getAllNotes()
        };
    },

    // Import data
    importData: function(data) {
        if (data.ratings) localStorage.setItem('phishowRatings', JSON.stringify(data.ratings));
        if (data.showRatings) localStorage.setItem('phishowShowRatings', JSON.stringify(data.showRatings));
        if (data.songStats) localStorage.setItem('phishowSongStats', JSON.stringify(data.songStats));
        if (data.notes) localStorage.setItem('phishowNotes', JSON.stringify(data.notes));
    }
};
