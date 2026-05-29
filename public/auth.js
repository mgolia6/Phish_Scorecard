// ============================================
// AUTHENTICATION MODULE
// ============================================

let currentUser = null;
let authToken = null;

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeAuth();
  setupAuthEventListeners();
});

// Initialize authentication state
async function initializeAuth() {
  // Check if token exists in localStorage
  authToken = localStorage.getItem('authToken');
  
  if (authToken) {
    try {
      // Verify token is still valid
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        currentUser = await response.json();
        renderAuthUI();
      } else {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        authToken = null;
        renderAuthUI();
      }
    } catch (error) {
      console.error('Error verifying auth:', error);
      renderAuthUI();
    }
  } else {
    renderAuthUI();
  }
}

// Setup authentication event listeners
function setupAuthEventListeners() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Modal close button
  const closeBtn = document.getElementById('close-auth-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAuthModal);
  }

  // Modal overlay click
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAuthModal();
  });
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');

  errorDiv.textContent = '';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    authToken = data.token;
    currentUser = data;

    // Store token
    localStorage.setItem('authToken', authToken);

    // Close modal and update UI
    closeAuthModal();
    renderAuthUI();
    
    // Load user's shows
    loadUserShows();
  } catch (error) {
    errorDiv.textContent = error.message;
    console.error('Login error:', error);
  }
}

// Handle signup
async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const firstName = document.getElementById('signup-first-name').value;
  const lastName = document.getElementById('signup-last-name').value;
  const errorDiv = document.getElementById('signup-error');

  errorDiv.textContent = '';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password, firstName, lastName })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    authToken = data.token;
    currentUser = data.user;

    // Store token
    localStorage.setItem('authToken', authToken);

    // Close modal and update UI
    closeAuthModal();
    renderAuthUI();
  } catch (error) {
    errorDiv.textContent = error.message;
    console.error('Signup error:', error);
  }
}

// Logout
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  renderAuthUI();
  
  // Clear UI
  document.getElementById('setlist-container').innerHTML = '';
  document.getElementById('show-details').innerHTML = '';
  document.getElementById('show-rating').innerHTML = '';
}

// Render authentication UI
function renderAuthUI() {
  const headerAuth = document.getElementById('header-auth');
  
  if (!headerAuth) return;

  if (currentUser && authToken) {
    // User is logged in
    headerAuth.innerHTML = `
      <span class="user-info">Welcome, <strong>${currentUser.username}</strong></span>
      <button class="btn-secondary" onclick="logout()">Logout</button>
    `;
  } else {
    // User is not logged in
    headerAuth.innerHTML = `
      <button class="btn-primary" onclick="openAuthModal('login')">Login</button>
      <button class="btn-secondary" onclick="openAuthModal('signup')">Sign Up</button>
    `;
  }
}

// Open auth modal
function openAuthModal(mode = 'login') {
  const overlay = document.getElementById('auth-modal-overlay');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (mode === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  }

  if (overlay) {
    overlay.classList.add('active');
  }
}

// Close auth modal
function closeAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// Switch between login and signup
function switchToSignup(e) {
  e.preventDefault();
  openAuthModal('signup');
}

function switchToLogin(e) {
  e.preventDefault();
  openAuthModal('login');
}

// Make API calls with authentication
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired
    logout();
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// Check if user is authenticated
function isAuthenticated() {
  return !!authToken && !!currentUser;
}

// Require authentication for certain actions
function requireAuth() {
  if (!isAuthenticated()) {
    openAuthModal('login');
    return false;
  }
  return true;
}
