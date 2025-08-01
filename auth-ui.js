// --- Supabase Setup ---
const SUPABASE_URL = 'https://hbmnbcvuqhfutehmcezg.supabase.co'; // <-- YOUR Supabase Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibW5iY3Z1cWhmdXRlaG1jZXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Mjg2MTMsImV4cCI6MjA2OTUwNDYxM30.4Jq5BWqBftnUK05AzP1y9rSzRKpiRTL3XRcfm7aj_VM'; // <-- YOUR Supabase anon key
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Modal UI Elements ---
const modalOverlay = document.getElementById('auth-modal-overlay');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toSignupLink = document.getElementById('to-signup-link');
const toLoginLink = document.getElementById('to-login-link');
const closeModalBtn = document.getElementById('close-auth-modal');
const headerAuth = document.getElementById('header-auth');

// --- Modal workflow ---
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
toSignupLink.onclick = e => { e.preventDefault(); openAuthModal('signup'); };
toLoginLink.onclick = e => { e.preventDefault(); openAuthModal('login'); };
closeModalBtn.onclick = closeAuthModal;
modalOverlay.onclick = e => { if (e.target === modalOverlay) closeAuthModal(); };
window.addEventListener('keydown', e => { if(e.key === "Escape") closeAuthModal(); });

// --- Navbar render ---
async function renderHeaderAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  headerAuth.innerHTML = '';
  if (user) {
    // Fetch profile
    let username = '';
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    username = profile ? profile.username : '';
    // User info and logout
    const userSpan = document.createElement('span');
    userSpan.className = 'user-info';
    userSpan.textContent = username ? `${username}` : user.email;
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.textContent = "Logout";
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      renderHeaderAuth();
    };
    headerAuth.appendChild(userSpan);
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

// --- Auth logic ---
loginForm.onsubmit = async e => {
  e.preventDefault();
  document.getElementById('login-error').textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('login-error').textContent = error.message;
  } else {
    closeAuthModal();
    renderHeaderAuth();
  }
};

signupForm.onsubmit = async e => {
  e.preventDefault();
  document.getElementById('signup-error').textContent = '';
  const firstName = document.getElementById('signup-first-name').value.trim();
  const lastName = document.getElementById('signup-last-name').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  // Sign up user
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById('signup-error').textContent = error.message;
    return;
  }
  // Insert profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          username: username,
        }
      ]);
    if (profileError) {
      document.getElementById('signup-error').textContent = profileError.message;
      return;
    }
    closeAuthModal();
    renderHeaderAuth();
  } else {
    document.getElementById('signup-error').textContent = 'Check your email to confirm sign up!';
  }
};

// On page load, render auth status
renderHeaderAuth();
