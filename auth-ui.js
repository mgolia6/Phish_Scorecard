// --- Auth UI Toggle ---
// Set to false to hide login/signup functionality, true to show it.
const SHOW_AUTH = true;

// --- Supabase Setup ---
const SUPABASE_URL = 'https://hbmnbcvuqhfutehmcezg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibW5iY3Z1cWhmdXRlaG1jZXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Mjg2MTMsImV4cCI6MjA2OTUwNDYxM30.4Jq5BWqBftnUK05AzP1y9rSzRKpiRTL3XRcfm7aj_VM';

// Gracefully handle missing Supabase client
let supabase = null;
if (window.supabase && window.supabase.createClient) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase client not available. Auth features will be limited.');
}

// Modal UI Elements
const modalOverlay = document.getElementById('auth-modal-overlay');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toSignupLink = document.getElementById('to-signup-link');
const toLoginLink = document.getElementById('to-login-link');
const closeModalBtn = document.getElementById('close-auth-modal');
const headerAuth = document.getElementById('header-auth');

// Profile Modal Elements
const profileModalOverlay = document.getElementById('profile-modal-overlay');
const closeProfileModalBtn = document.getElementById('close-profile-modal');
const avatarUpload = document.getElementById('avatar-upload');

// Quick toggle: disables/hides all auth UI and logic if SHOW_AUTH is false
function toggleAuthUI() {
  if (!SHOW_AUTH) {
    if (headerAuth) headerAuth.style.display = 'none';
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (profileModalOverlay) profileModalOverlay.style.display = 'none';
    // Optionally, prevent auth modal opening
    window.openAuthModal = () => {};
    window.closeAuthModal = () => {};
    window.openProfileModal = () => {};
    window.closeProfileModal = () => {};
    // Disable event listeners
    if (toSignupLink) toSignupLink.onclick = null;
    if (toLoginLink) toLoginLink.onclick = null;
    if (closeModalBtn) closeModalBtn.onclick = null;
    if (closeProfileModalBtn) closeProfileModalBtn.onclick = null;
    if (modalOverlay) modalOverlay.onclick = null;
    if (profileModalOverlay) profileModalOverlay.onclick = null;
    window.removeEventListener('keydown', handleEscapeClose);
    return false;
  } else {
    // Re-enable UI if needed (optional: refresh page or re-render)
    if (headerAuth) headerAuth.style.display = '';
    if (modalOverlay) modalOverlay.style.display = '';
    if (profileModalOverlay) profileModalOverlay.style.display = '';
    if (toSignupLink) toSignupLink.onclick = (e) => { e.preventDefault(); openAuthModal('signup'); };
    if (toLoginLink) toLoginLink.onclick = (e) => { e.preventDefault(); openAuthModal('login'); };
    if (closeModalBtn) closeModalBtn.onclick = closeAuthModal;
    if (closeProfileModalBtn) closeProfileModalBtn.onclick = closeProfileModal;
    if (modalOverlay) modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeAuthModal(); };
    if (profileModalOverlay) profileModalOverlay.onclick = (e) => { if (e.target === profileModalOverlay) closeProfileModal(); };
    window.addEventListener('keydown', handleEscapeClose);
    return true;
  }
}

function handleEscapeClose(e) {
  if (e.key === "Escape") {
    if (profileModalOverlay && profileModalOverlay.classList.contains('active')) {
      closeProfileModal();
    } else if (modalOverlay && modalOverlay.classList.contains('active')) {
      closeAuthModal();
    }
  }
}

// Modal workflow
function openAuthModal(mode = 'login') {
  modalOverlay.classList.add('active');
  if (mode === 'signup') {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  } else {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  }
  document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
  modalOverlay.classList.remove('active');
  loginForm.reset();
  signupForm.reset();
  document.getElementById('login-error').textContent = '';
  document.getElementById('signup-error').textContent = '';
  document.body.style.overflow = '';
}

// Profile Modal functions
function openProfileModal() {
  if (profileModalOverlay) {
    profileModalOverlay.classList.add('active');
    loadUserProfile();
    document.body.style.overflow = 'hidden';
  }
}

function closeProfileModal() {
  if (profileModalOverlay) {
    profileModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

async function loadUserProfile() {
  if (!supabase) {
    document.getElementById('profile-name').textContent = 'N/A';
    document.getElementById('profile-username').textContent = 'N/A';
    document.getElementById('profile-email').textContent = 'N/A';
    document.getElementById('profile-member-since').textContent = 'N/A';
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Load profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, username, avatar_url, created_at')
      .eq('id', user.id)
      .single();

    if (profile) {
      document.getElementById('profile-name').textContent = 
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A';
      document.getElementById('profile-username').textContent = profile.username || 'N/A';
      document.getElementById('profile-email').textContent = user.email || 'N/A';
      
      // Format member since date
      const memberSince = profile.created_at ? 
        new Date(profile.created_at).toLocaleDateString() : 
        new Date(user.created_at).toLocaleDateString();
      document.getElementById('profile-member-since').textContent = memberSince;

      // Handle avatar
      if (profile.avatar_url) {
        document.getElementById('profile-avatar-img').src = profile.avatar_url;
        document.getElementById('profile-avatar-img').style.display = 'block';
        document.getElementById('profile-avatar-placeholder').style.display = 'none';
      } else {
        document.getElementById('profile-avatar-img').style.display = 'none';
        document.getElementById('profile-avatar-placeholder').style.display = 'flex';
      }
    } else {
      document.getElementById('profile-name').textContent = 'N/A';
      document.getElementById('profile-username').textContent = 'N/A';
      document.getElementById('profile-email').textContent = user.email || 'N/A';
      document.getElementById('profile-member-since').textContent = 
        new Date(user.created_at).toLocaleDateString();
    }
  }
}

// Navbar render
async function renderHeaderAuth() {
  if (!supabase) {
    // Fallback when Supabase isn't available
    headerAuth.innerHTML = `
      <span class="user-info">Auth unavailable</span>
      <button class="auth-btn" onclick="openAuthModal('login')">Login / Sign Up</button>
    `;
    return;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  headerAuth.innerHTML = '';
  if (user) {
    let username = '';
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();
    username = profile ? profile.username : '';
    
    // Create clickable user info container
    const userContainer = document.createElement('div');
    userContainer.style.display = 'flex';
    userContainer.style.alignItems = 'center';
    userContainer.style.gap = '10px';
    userContainer.style.cursor = 'pointer';
    userContainer.onclick = openProfileModal;
    
    // User avatar
    if (profile && profile.avatar_url) {
      const avatarImg = document.createElement('img');
      avatarImg.src = profile.avatar_url;
      avatarImg.style.width = '32px';
      avatarImg.style.height = '32px';
      avatarImg.style.borderRadius = '50%';
      avatarImg.style.border = '2px solid #33ff33';
      userContainer.appendChild(avatarImg);
    } else {
      const avatarPlaceholder = document.createElement('div');
      avatarPlaceholder.style.width = '32px';
      avatarPlaceholder.style.height = '32px';
      avatarPlaceholder.style.borderRadius = '50%';
      avatarPlaceholder.style.border = '2px solid #33ff33';
      avatarPlaceholder.style.background = '#222';
      avatarPlaceholder.style.display = 'flex';
      avatarPlaceholder.style.alignItems = 'center';
      avatarPlaceholder.style.justifyContent = 'center';
      avatarPlaceholder.style.color = '#33ff33';
      avatarPlaceholder.style.fontSize = '16px';
      avatarPlaceholder.textContent = '👤';
      userContainer.appendChild(avatarPlaceholder);
    }
    
    // User info and logout
    const userSpan = document.createElement('span');
    userSpan.className = 'user-info';
    userSpan.textContent = username ? `${username}` : user.email;
    userContainer.appendChild(userSpan);
    
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.textContent = "Logout";
    logoutBtn.onclick = async (e) => {
      e.stopPropagation(); // Prevent profile modal from opening
      await supabase.auth.signOut();
      renderHeaderAuth();
    };
    
    headerAuth.appendChild(userContainer);
    headerAuth.appendChild(logoutBtn);
  } else {
    // Login/SignUp button
    const loginBtn = document.createElement('button');
    loginBtn.className = 'auth-btn';
    loginBtn.textContent = "Login / Sign Up";
    loginBtn.onclick = () => openAuthModal('login');
    headerAuth.appendChild(loginBtn);
  }
}

// Auth logic

// Updated Login handler
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!supabase) {
    document.getElementById('login-error').textContent = 'Authentication service unavailable';
    return;
  }
  
  document.getElementById('login-error').textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('login-error').textContent = error.message;
  } else {
    // Get user info
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // If profile does NOT exist, create it using signup form info (stored in localStorage or ask user)
      if (!profile) {
        const firstName = localStorage.getItem('signup-first-name') || "";
        const lastName = localStorage.getItem('signup-last-name') || "";
        const username = localStorage.getItem('signup-username') || "";

        if (firstName && lastName && username) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              first_name: firstName,
              last_name: lastName,
              username: username,
            }]);
          if (insertError) {
            document.getElementById('login-error').textContent = insertError.message;
            return;
          }
        }
      }
    }
    closeAuthModal();
    renderHeaderAuth();
  }
};

// Updated Signup handler
signupForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!supabase) {
    document.getElementById('signup-error').textContent = 'Authentication service unavailable';
    return;
  }
  
  document.getElementById('signup-error').textContent = '';
  const firstName = document.getElementById('signup-first-name').value.trim();
  const lastName = document.getElementById('signup-last-name').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  // Save to localStorage for post-confirmation use
  localStorage.setItem('signup-first-name', firstName);
  localStorage.setItem('signup-last-name', lastName);
  localStorage.setItem('signup-username', username);

  // Sign up user
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById('signup-error').textContent = error.message;
    return;
  }

  // Show notification - do NOT create profile yet!
  document.getElementById('signup-error').textContent =
    "Thanks for signing up! Please check your email and confirm your account before logging in.";

  // Optionally, switch to login modal
  setTimeout(() => {
    openAuthModal('login');
  }, 3000);
};

// --- Call the toggle on page load ---
toggleAuthUI();

// Only render the auth header if auth is enabled
if (SHOW_AUTH) renderHeaderAuth();
