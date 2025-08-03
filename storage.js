import { supabase } from './supabaseClient.js'; // Adjust path as needed

const storage = {
    // Save ratings for a specific show to Supabase (one row per rating in 'ratings' table)
    async saveRatings(showDate, ratings, user_id = null) {
        // Add user_id to each rating if provided
        const supabaseRatings = ratings.map(r => ({
            ...r,
            show_date: showDate,
            user_id: user_id || r.user_id || null,
        }));

        try {
            // Remove any prior ratings for this user/show
            if (user_id) {
                await supabase
                    .from('ratings')
                    .delete()
                    .eq('show_date', showDate)
                    .eq('user_id', user_id);
            }
            // Insert all ratings (bulk)
            const { error } = await supabase
                .from('ratings')
                .insert(supabaseRatings);

            if (error) throw error;
        } catch (e) {
            // Fallback: localStorage
            const data = this.getAllRatings();
            data[showDate] = ratings;
            localStorage.setItem('phishowRatings', JSON.stringify(data));
        }
    },

    // Get ratings for a specific show from Supabase (all users, or filter by user_id)
    async getRatings(showDate, user_id = null) {
        try {
            let query = supabase
                .from('ratings')
                .select('*')
                .eq('show_date', showDate);
            if (user_id) query = query.eq('user_id', user_id);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (e) {
            // Fallback: localStorage
            const data = this.getAllRatings();
            return data[showDate] || null;
        }
    },

    // Get all ratings from Supabase (all users, all shows)
    async getAllRatings() {
        try {
            let { data, error } = await supabase
                .from('ratings')
                .select('*');
            if (error) throw error;
            // Group by show_date as in localStorage schema
            const grouped = {};
            data.forEach(r => {
                if (!grouped[r.show_date]) grouped[r.show_date] = [];
                grouped[r.show_date].push(r);
            });
            return grouped;
        } catch (e) {
            // Fallback: localStorage
            const local = localStorage.getItem('phishowRatings');
            return local ? JSON.parse(local) : {};
        }
    },

    // Save overall show rating (aggregates) to Supabase 'shows' table
    async saveShowRating(showDate, rating) {
        try {
            const { error } = await supabase
                .from('shows')
                .upsert([{
                    show_date: showDate,
                    average: rating.average,
                    set_ratings: rating.setRatings,
                    timestamp: rating.timestamp || new Date().toISOString()
                }], { onConflict: ['show_date'] });
            if (error) throw error;
        } catch (e) {
            // Fallback: localStorage
            const data = this.getAllShowRatings();
            data[showDate] = {
                average: rating.average,
                setRatings: rating.setRatings,
                timestamp: rating.timestamp || new Date().toISOString()
            };
            localStorage.setItem('phishowShowRatings', JSON.stringify(data));
        }
    },

    // Get all show ratings/aggregates
    async getAllShowRatings() {
        try {
            let { data, error } = await supabase
                .from('shows')
                .select('show_date, average, set_ratings, timestamp');
            if (error) throw error;
            const result = {};
            data.forEach(entry => {
                result[entry.show_date] = {
                    average: entry.average,
                    setRatings: entry.set_ratings,
                    timestamp: entry.timestamp
                };
            });
            return result;
        } catch (e) {
            // Fallback: localStorage
            const local = localStorage.getItem('phishowShowRatings');
            return local ? JSON.parse(local) : {};
        }
    },

    // Update song statistics locally (if you want to keep this, otherwise remove)
    getAllSongStats() {
        const data = localStorage.getItem('phishowSongStats');
        return data ? JSON.parse(data) : {};
    },

    getSongStats(song) {
        const stats = this.getAllSongStats();
        return stats[song] || null;
    },

    // Save user notes to Supabase (as a field in 'shows' table)
    async saveNotes(showDate, notes) {
        try {
            const { error } = await supabase
                .from('shows')
                .upsert([{ show_date: showDate, notes, notes_timestamp: new Date().toISOString() }], { onConflict: ['show_date'] });
            if (error) throw error;
        } catch (e) {
            // Fallback: localStorage
            const data = this.getAllNotes();
            data[showDate] = {
                notes: notes,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('phishowNotes', JSON.stringify(data));
        }
    },

    // Get all notes from Supabase
    async getAllNotes() {
        try {
            let { data, error } = await supabase
                .from('shows')
                .select('show_date, notes, notes_timestamp');
            if (error) throw error;
            const result = {};
            data.forEach(entry => {
                result[entry.show_date] = {
                    notes: entry.notes,
                    timestamp: entry.notes_timestamp
                };
            });
            return result;
        } catch (e) {
            // Fallback: localStorage
            const local = localStorage.getItem('phishowNotes');
            return local ? JSON.parse(local) : {};
        }
    },

    // Clear all stored data (local only)
    clearAllData() {
        localStorage.removeItem('phishowRatings');
        localStorage.removeItem('phishowShowRatings');
        localStorage.removeItem('phishowSongStats');
        localStorage.removeItem('phishowNotes');
    },

    // Export all data (local only)
    exportData() {
        return {
            ratings: this.getAllRatings(),
            showRatings: this.getAllShowRatings(),
            songStats: this.getAllSongStats(),
            notes: this.getAllNotes()
        };
    },

    // Import data (local only)
    importData(data) {
        if (data.ratings) localStorage.setItem('phishowRatings', JSON.stringify(data.ratings));
        if (data.showRatings) localStorage.setItem('phishowShowRatings', JSON.stringify(data.showRatings));
        if (data.songStats) localStorage.setItem('phishowSongStats', JSON.stringify(data.songStats));
        if (data.notes) localStorage.setItem('phishowNotes', JSON.stringify(data.notes));
    }
};

export default storage;
