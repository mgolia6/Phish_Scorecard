// Mock data for testing the Show Rating functionality
window.mockShows = [
    {
        showdate: "2023-07-28",
        venue: "Madison Square Garden",
        city: "New York",
        state: "NY",
        country: "USA"
    },
    {
        showdate: "2023-12-29",
        venue: "Madison Square Garden", 
        city: "New York",
        state: "NY",
        country: "USA"
    }
];

window.mockSetlists = {
    "2023-07-28": [
        {
            showdate: "2023-07-28",
            venue: "Madison Square Garden",
            city: "New York",
            state: "NY",
            country: "USA",
            setlistnotes: "Great show with extended Tweezer jam in Set 2. First 'Destiny Unbound' since 2019."
        },
        { set: "1", song: "AC/DC Bag", position: 1, isjamchart: true, gap: 5 },
        { set: "1", song: "Destiny Unbound", position: 2, isjamchart: false, gap: 100 },
        { set: "1", song: "Wilson", position: 3, isjamchart: false, gap: 10 },
        { set: "2", song: "Tweezer", position: 1, isjamchart: true, gap: 2 },
        { set: "2", song: "Light", position: 2, isjamchart: true, gap: 5 },
        { set: "E", song: "Loving Cup", position: 1, isjamchart: false, gap: 10 }
    ],
    "2023-12-29": [
        {
            showdate: "2023-12-29",
            venue: "Madison Square Garden",
            city: "New York", 
            state: "NY",
            country: "USA",
            setlistnotes: "New Year's run opener with massive 'Ghost' jam and rare 'Fluffhead'."
        },
        { set: "1", song: "Fluffhead", position: 1, isjamchart: true, gap: 15 },
        { set: "1", song: "Sample in a Jar", position: 2, isjamchart: false, gap: 20 },
        { set: "2", song: "Ghost", position: 1, isjamchart: true, gap: 1 },
        { set: "2", song: "Harry Hood", position: 2, isjamchart: false, gap: 3 },
        { set: "E", song: "Run Like an Antelope", position: 1, isjamchart: false, gap: 8 }
    ]
};