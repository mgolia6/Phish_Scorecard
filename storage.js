const storage = {
  saveRatings: function(showDate, ratings) {
    const data = this.getAllRatings();
    data[showDate] = ratings;
    localStorage.setItem('phishowRatings', JSON.stringify(data));
  },

  getAllRatings: function() {
    const data = localStorage.getItem('phishowRatings');
    return data ? JSON.parse(data) : {};
  },

  getSongRankings: function() {
    const allRatings = this.getAllRatings();
    // Process ratings to get song averages
    // Implementation to be added
  },

  getShowRankings: function() {
    const allRatings = this.getAllRatings();
    // Process ratings to get show averages
    // Implementation to be added
  }
};
