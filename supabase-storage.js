// Supabase-based storage functions
// This will replace localStorage functionality with Supabase

// Mock implementation when Supabase is not available (for development/demo)
const mockSupabaseClient = {
    auth: {
        getUser: () => Promise.resolve({ 
            data: { 
                user: { 
                    id: 'demo-user-id', 
                    email: 'demo@example.com' 
                } 
            } 
        })
    },
    from: (table) => ({
        select: (cols) => ({
            eq: (col, val) => ({
                eq: (col2, val2) => ({
                    order: (col3, opts) => mockQuery(table, 'select', { cols, filters: [[col, val], [col2, val2]], order: [col3, opts] }),
                    single: () => mockQuery(table, 'select', { cols, filters: [[col, val], [col2, val2]], single: true })
                }),
                order: (col3, opts) => mockQuery(table, 'select', { cols, filters: [[col, val]], order: [col3, opts] }),
                single: () => mockQuery(table, 'select', { cols, filters: [[col, val]], single: true })
            }),
            not: (col, op, val) => ({
                order: (col3, opts) => mockQuery(table, 'select', { cols, filters: [['not', col, op, val]], order: [col3, opts] })
            }),
            order: (col, opts) => mockQuery(table, 'select', { cols, order: [col, opts] })
        }),
        insert: (data) => mockQuery(table, 'insert', { data }),
        upsert: (data) => mockQuery(table, 'upsert', { data }),
        delete: () => ({
            eq: (col, val) => ({
                eq: (col2, val2) => mockQuery(table, 'delete', { filters: [[col, val], [col2, val2]] })
            })
        })
    })
};

function mockQuery(table, operation, params) {
    // For demo purposes, return appropriate mock data
    return new Promise((resolve) => {
        setTimeout(() => {
            if (table === 'show_ratings' && operation === 'select') {
                resolve({ 
                    data: [
                        { show_date: '2023-12-31', average_rating: 4.5, user_id: 'user1' },
                        { show_date: '2023-12-30', average_rating: 4.2, user_id: 'user2' },
                        { show_date: '2023-12-29', average_rating: 3.8, user_id: 'user1' }
                    ], 
                    error: null 
                });
            } else if (table === 'song_ratings' && operation === 'select') {
                if (params.cols === 'song_name, rating') {
                    resolve({ 
                        data: [
                            { song_name: 'Fluffhead', rating: 5 },
                            { song_name: 'You Enjoy Myself', rating: 4 },
                            { song_name: 'Tweezer', rating: 5 },
                            { song_name: 'Harry Hood', rating: 4 },
                            { song_name: 'Fluffhead', rating: 4 },
                            { song_name: 'Tweezer', rating: 5 }
                        ], 
                        error: null 
                    });
                } else if (params.cols === 'song_name, show_date, rating, user_id, notes') {
                    resolve({ 
                        data: [
                            { song_name: 'Fluffhead', show_date: '2023-12-31', rating: 5, user_id: 'user1', notes: 'Amazing version' },
                            { song_name: 'You Enjoy Myself', show_date: '2023-12-31', rating: 4, user_id: 'user1', notes: 'Great jam' },
                            { song_name: 'Tweezer', show_date: '2023-12-30', rating: 5, user_id: 'user2', notes: 'Mind-blowing' },
                            { song_name: 'Harry Hood', show_date: '2023-12-29', rating: 4, user_id: 'user1', notes: 'Classic' }
                        ], 
                        error: null 
                    });
                } else {
                    resolve({ data: [], error: null });
                }
            } else {
                resolve({ data: null, error: null });
            }
        }, 500); // Simulate network delay
    });
}

// Wait for supabase to be available and get the client from auth-ui.js
function getSupabaseClient() {
    // First try to get from auth-ui.js global variable
    if (typeof window.supabase !== 'undefined' && window.supabase) {
        const SUPABASE_URL = 'https://hbmnbcvuqhfutehmcezg.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibW5iY3Z1cWhmdXRlaG1jZXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Mjg2MTMsImV4cCI6MjA2OTUwNDYxM30.4Jq5BWqBftnUK05AzP1y9rSzRKpiRTL3XRcfm7aj_VM';
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    // Check for the global supabase variable (from auth-ui.js)
    if (typeof window.supabase_global !== 'undefined' && window.supabase_global) {
        return window.supabase_global;
    }
    // Fallback to mock client for demo purposes
    console.log('Using mock Supabase client for demo');
    return mockSupabaseClient;
}

const supabaseStorage = {
    // Get current user
    getCurrentUser: async function() {
        try {
            const client = getSupabaseClient();
            const { data: { user } } = await client.auth.getUser();
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Save ratings for a specific show (tied to user)
    saveRatings: async function(showDate, ratings) {
        const client = getSupabaseClient();
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in to save ratings');
        }

        // First, delete existing ratings for this show and user
        await client
            .from('song_ratings')
            .delete()
            .eq('user_id', user.id)
            .eq('show_date', showDate);

        // Insert new ratings
        const ratingsToInsert = ratings.map(rating => ({
            user_id: user.id,
            show_date: showDate,
            song_name: rating.song,
            set_number: rating.set,
            rating: rating.rating,
            notes: rating.notes,
            jam_chart: rating.jamChart,
            gap: rating.gap,
            created_at: new Date().toISOString()
        }));

        const { error } = await client
            .from('song_ratings')
            .insert(ratingsToInsert);

        if (error) throw error;
    },

    // Get ratings for a specific show and user
    getRatings: async function(showDate) {
        try {
            const client = getSupabaseClient();
            const user = await this.getCurrentUser();
            if (!user) return null;

            const { data, error } = await client
                .from('song_ratings')
                .select('*')
                .eq('user_id', user.id)
                .eq('show_date', showDate);

            if (error) throw error;

            // Convert back to the format expected by the UI
            return data ? data.map(rating => ({
                song: rating.song_name,
                set: rating.set_number,
                rating: rating.rating,
                notes: rating.notes,
                jamChart: rating.jam_chart,
                gap: rating.gap,
                date: rating.show_date,
                timestamp: rating.created_at
            })) : null;
        } catch (error) {
            console.error('Error getting ratings:', error);
            return null;
        }
    },

    // Save overall show rating (tied to user)
    saveShowRating: async function(showDate, rating) {
        const client = getSupabaseClient();
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in to save show ratings');
        }

        // Upsert show rating
        const { error } = await client
            .from('show_ratings')
            .upsert({
                user_id: user.id,
                show_date: showDate,
                average_rating: rating.average,
                set_ratings: rating.setRatings,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
    },

    // Get all show ratings for current user
    getAllShowRatings: async function() {
        try {
            const client = getSupabaseClient();
            const user = await this.getCurrentUser();
            if (!user) return {};

            const { data, error } = await client
                .from('show_ratings')
                .select('*')
                .eq('user_id', user.id)
                .order('show_date', { ascending: false });

            if (error) throw error;

            // Convert to the format expected by existing code
            const result = {};
            data?.forEach(row => {
                result[row.show_date] = {
                    average: row.average_rating,
                    setRatings: row.set_ratings,
                    timestamp: row.created_at
                };
            });

            return result;
        } catch (error) {
            console.error('Error getting show ratings:', error);
            return {};
        }
    },

    // Get aggregated show ratings (across all users)
    getAggregatedShowRatings: async function() {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('show_ratings')
                .select('show_date, average_rating, user_id')
                .order('show_date', { ascending: false });

            if (error) throw error;

            // Group by show and calculate aggregates
            const showAggregates = {};
            data?.forEach(row => {
                if (!showAggregates[row.show_date]) {
                    showAggregates[row.show_date] = {
                        ratings: [],
                        userCount: 0
                    };
                }
                showAggregates[row.show_date].ratings.push(row.average_rating);
                showAggregates[row.show_date].userCount++;
            });

            // Calculate averages
            Object.keys(showAggregates).forEach(showDate => {
                const ratings = showAggregates[showDate].ratings;
                showAggregates[showDate].average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            });

            return showAggregates;
        } catch (error) {
            console.error('Error getting aggregated show ratings:', error);
            return {};
        }
    },

    // Get aggregated song rankings (across all users)
    getAggregatedSongRankings: async function() {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('song_ratings')
                .select('song_name, rating')
                .not('rating', 'is', null);

            if (error) throw error;

            // Group by song and calculate stats
            const songStats = {};
            data?.forEach(row => {
                if (!songStats[row.song_name]) {
                    songStats[row.song_name] = {
                        count: 0,
                        totalRating: 0,
                        ratings: []
                    };
                }
                songStats[row.song_name].count++;
                songStats[row.song_name].totalRating += row.rating;
                songStats[row.song_name].ratings.push(row.rating);
            });

            // Calculate averages
            Object.keys(songStats).forEach(song => {
                const stats = songStats[song];
                stats.average = stats.totalRating / stats.count;
            });

            return songStats;
        } catch (error) {
            console.error('Error getting aggregated song rankings:', error);
            return {};
        }
    },

    // Get unique song performances (specific songs in specific shows)
    getUniqueSongRankings: async function() {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('song_ratings')
                .select('song_name, show_date, rating, user_id, notes')
                .not('rating', 'is', null)
                .order('show_date', { ascending: false });

            if (error) throw error;

            // Group by song_name + show_date combination
            const uniquePerformances = {};
            data?.forEach(row => {
                const key = `${row.song_name}|${row.show_date}`;
                if (!uniquePerformances[key]) {
                    uniquePerformances[key] = {
                        song: row.song_name,
                        showDate: row.show_date,
                        ratings: [],
                        userCount: 0
                    };
                }
                uniquePerformances[key].ratings.push({
                    rating: row.rating,
                    userId: row.user_id,
                    notes: row.notes
                });
                uniquePerformances[key].userCount++;
            });

            // Calculate averages for each unique performance
            Object.keys(uniquePerformances).forEach(key => {
                const performance = uniquePerformances[key];
                const ratings = performance.ratings.map(r => r.rating);
                performance.average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            });

            return uniquePerformances;
        } catch (error) {
            console.error('Error getting unique song rankings:', error);
            return {};
        }
    },

    // Update song statistics (for backward compatibility)
    updateSongStats: async function(song, rating) {
        // This is handled automatically by the song_ratings table
        // No separate action needed
        return true;
    },

    // Get stats for a specific song (for backward compatibility)
    getSongStats: async function(song) {
        const allStats = await this.getAggregatedSongRankings();
        return allStats[song] || null;
    },

    // Clear all data for current user
    clearAllData: async function() {
        try {
            const client = getSupabaseClient();
            const user = await this.getCurrentUser();
            if (!user) return;

            // Delete all ratings for current user
            await client.from('song_ratings').delete().eq('user_id', user.id);
            await client.from('show_ratings').delete().eq('user_id', user.id);
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }
};

// Make it available globally
window.supabaseStorage = supabaseStorage;