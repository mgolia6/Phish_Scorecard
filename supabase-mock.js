// Mock Supabase client for testing purposes
window.supabase = {
  createClient: function(url, key) {
    return {
      auth: {
        getUser: async function() {
          // Mock user data - simulate a logged in user for testing
          const mockUser = {
            id: 'test-user-123',
            email: 'test@example.com',
            created_at: '2024-01-01T00:00:00.000Z'
          };
          
          // Check if we have a mock login state
          const isLoggedIn = localStorage.getItem('mock-auth') === 'true';
          
          return {
            data: {
              user: isLoggedIn ? mockUser : null
            },
            error: null
          };
        },
        signInWithPassword: async function({ email, password }) {
          // Mock login - accept any credentials for testing
          if (email && password) {
            localStorage.setItem('mock-auth', 'true');
            localStorage.setItem('mock-user-email', email);
            return {
              data: {
                user: {
                  id: 'test-user-123',
                  email: email,
                  created_at: '2024-01-01T00:00:00.000Z'
                }
              },
              error: null
            };
          } else {
            return {
              data: { user: null },
              error: { message: 'Invalid credentials' }
            };
          }
        },
        signUp: async function({ email, password }) {
          // Mock signup
          return {
            data: {
              user: {
                id: 'test-user-new',
                email: email,
                created_at: new Date().toISOString()
              }
            },
            error: null
          };
        },
        signOut: async function() {
          localStorage.removeItem('mock-auth');
          localStorage.removeItem('mock-user-email');
          return { error: null };
        }
      },
      from: function(table) {
        return {
          select: function(fields) {
            return {
              eq: function(column, value) {
                return {
                  single: async function() {
                    // Mock profile data
                    if (table === 'profiles') {
                      return {
                        data: {
                          id: 'test-user-123',
                          first_name: 'Test',
                          last_name: 'User',
                          username: 'testuser',
                          avatar_url: null,
                          created_at: '2024-01-01T00:00:00.000Z'
                        },
                        error: null
                      };
                    }
                    return { data: null, error: null };
                  }
                };
              }
            };
          },
          insert: async function(data) {
            // Mock insert
            console.log('Mock insert to', table, ':', data);
            return { data: data, error: null };
          },
          update: function(data) {
            return {
              eq: function(column, value) {
                // Mock update - simulate updating profile with avatar
                console.log('Mock update to', table, ':', data);
                return Promise.resolve({ data: data, error: null });
              }
            };
          },
          delete: function() {
            return {
              eq: function(column, value) {
                return {
                  eq: function(column2, value2) {
                    return Promise.resolve({ error: null });
                  }
                };
              }
            };
          }
        };
      }
    };
  }
};