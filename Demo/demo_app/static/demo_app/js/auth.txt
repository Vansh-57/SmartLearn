/* =====================================================================
   SIMPLE AUTHENTICATION FOR SMARTLEARN
   Step 1: User clicks "Sign In" button
   Step 2: Modal pops up
   Step 3: User enters email and password
   Step 4: We save it and show their name
   ===================================================================== */

let currentUser = null; // This stores WHO is logged in

// ===== STEP 1: WHEN PAGE LOADS, CHECK IF SOMEONE IS ALREADY LOGGED IN =====
function loadCurrentUser() {
  console.log('Step 1: Checking if user already logged in...');
  try {
    const saved = localStorage.getItem('smartlearn_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      console.log('✅ User found:', currentUser.email);
      return true;
    } else {
      console.log('❌ No user logged in');
    }
  } catch (e) {
    console.error('Error loading user:', e);
  }
  return false;
}

// ===== STEP 2: SAVE USER TO COMPUTER MEMORY =====
function saveCurrentUser(user) {
  console.log('Step 2: Saving user to computer...');
  try {
    localStorage.setItem('smartlearn_user', JSON.stringify(user));
    currentUser = user;
    console.log('✅ User saved:', user.email);
    return true;
  } catch (e) {
    console.error('Error saving user:', e);
  }
  return false;
}

// ===== STEP 3: WHEN USER CLICKS LOGOUT =====
function logout() {
  console.log('Step 3: User logged out');
  try {
    localStorage.removeItem('smartlearn_user');
    currentUser = null;
    location.reload(); // Refresh page
  } catch (e) {
    console.error('Logout error:', e);
  }
}

// ===== STEP 4: CHECK IF EMAIL IS VALID =====
function isValidEmail(email) {
  console.log('Checking email:', email);
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===== STEP 5: CHECK IF PASSWORD IS LONG ENOUGH (at least 6 letters) =====
function isValidPassword(password) {
  console.log('Checking password length:', password.length);
  return password.length >= 6;
}

// ===== STEP 6: WHEN USER SIGNS IN =====
function handleSignIn(email, password) {
  console.log('=== SIGN IN START ===');
  console.log('Email:', email);
  console.log('Password length:', password.length);

  // Check if they entered something
  if (!email || !password) {
    console.log('❌ Empty email or password');
    showError('signinMsg', '❌ Please enter email and password!');
    return false;
  }

  // Check if email is correct format
  if (!isValidEmail(email)) {
    console.log('❌ Invalid email format');
    showError('signinMsg', '❌ Email is not valid!');
    return false;
  }

  // Get list of all users stored on computer
  console.log('Looking for user in database...');
  const allUsers = JSON.parse(localStorage.getItem('smartlearn_all_users') || '[]');
  console.log('Total users in system:', allUsers.length);

  // Find user with this email
  const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log('❌ User not found');
    showError('signinMsg', '❌ Email not found! Sign up first.');
    return false;
  }

  console.log('✅ User found:', user.email);

  // Check if password is correct (we stored it as password123 -> btoa(password123))
  if (btoa(password) !== user.password) {
    console.log('❌ Wrong password');
    showError('signinMsg', '❌ Wrong password!');
    return false;
  }

  console.log('✅ Password correct!');

  // Save user as logged in
  saveCurrentUser({ id: user.id, email: user.email, name: user.name });

  console.log('✅ USER LOGGED IN SUCCESSFULLY');
  showSuccess('signinMsg', '✅ Welcome ' + user.name + '!');

  // After 1 second, close the modal and refresh
  setTimeout(() => {
    closeAuthModal();
    updateUserHeader();
    location.reload();
  }, 1000);

  return true;
}

// ===== STEP 7: WHEN USER SIGNS UP =====
function handleSignUp(name, email, password) {
  console.log('=== SIGN UP START ===');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Password length:', password.length);

  // Check if they entered everything
  if (!name || !email || !password) {
    console.log('❌ Missing fields');
    showError('signupMsg', '❌ Please fill all fields!');
    return false;
  }

  // Check email format
  if (!isValidEmail(email)) {
    console.log('❌ Invalid email');
    showError('signupMsg', '❌ Email is not valid!');
    return false;
  }

  // Check password is long enough
  if (!isValidPassword(password)) {
    console.log('❌ Password too short');
    showError('signupMsg', '❌ Password must be at least 6 characters!');
    return false;
  }

  // Get all users
  const allUsers = JSON.parse(localStorage.getItem('smartlearn_all_users') || '[]');
  console.log('Total users before signup:', allUsers.length);

  // Check if email already exists
  if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    console.log('❌ Email already registered');
    showError('signupMsg', '❌ This email is already registered!');
    return false;
  }

  console.log('✅ Email is new and available');

  // Create new user object
  const newUser = {
    id: Date.now(), // Use current time as user ID
    name: name,
    email: email,
    password: btoa(password), // Convert password to code (NOT SECURE but okay for demo)
    createdAt: new Date().toISOString()
  };

  console.log('New user created:', newUser);

  // Add to all users list
  allUsers.push(newUser);
  localStorage.setItem('smartlearn_all_users', JSON.stringify(allUsers));

  console.log('Total users after signup:', allUsers.length);

  // Log them in automatically
  saveCurrentUser({ id: newUser.id, email: newUser.email, name: newUser.name });

  console.log('✅ USER SIGNED UP AND LOGGED IN');
  showSuccess('signupMsg', '✅ Account created! Welcome ' + name + '!');

  // After 1 second, close the modal
  setTimeout(() => {
    closeAuthModal();
    updateUserHeader();
    location.reload();
  }, 1000);

  return true;
}

// ===== STEP 8: SHOW ERROR MESSAGE IN RED =====
function showError(elementId, message) {
  console.log('Showing error:', message);
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.color = '#ef4444'; // Red color
  }
}

// ===== STEP 9: SHOW SUCCESS MESSAGE IN GREEN =====
function showSuccess(elementId, message) {
  console.log('Showing success:', message);
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.color = '#22c55e'; // Green color
  }
}

// ===== STEP 10: OPEN THE LOGIN/SIGNUP BOX =====
function openAuthModal() {
  console.log('Opening auth modal...');
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('hidden');
    // Show Sign In by default
    document.getElementById('formSignIn')?.classList.remove('hidden');
    document.getElementById('formSignUp')?.classList.add('hidden');
  }
}

// ===== STEP 11: CLOSE THE LOGIN/SIGNUP BOX =====
function closeAuthModal() {
  console.log('Closing auth modal...');
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// ===== STEP 12: CHANGE SIGN IN BUTTON TO SHOW USER NAME =====
function updateUserHeader() {
  console.log('Updating header...');
  const openAuthBtn = document.getElementById('openAuth');
  if (openAuthBtn) {
    if (isLoggedIn()) {
      console.log('User is logged in, showing name:', currentUser.name);
      openAuthBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span class="text-sm">${currentUser.name}</span>
      `;
    } else {
      console.log('User is NOT logged in');
      openAuthBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span class="text-sm">Sign In</span>
      `;
    }
  }
}

// ===== STEP 13: CHECK IF SOMEONE IS LOGGED IN =====
function isLoggedIn() {
  return currentUser !== null;
}

// ===== STEP 14: SETUP ALL BUTTON CLICKS =====
function setupAuthListeners() {
  console.log('Setting up button clicks...');

  // When user clicks the "Sign In" button in top right
  const openAuthBtn = document.getElementById('openAuth');
  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', () => {
      console.log('User clicked Sign In button');
      if (isLoggedIn()) {
        // Already logged in, ask to logout
        if (confirm('Logout?')) {
          logout();
        }
      } else {
        // Not logged in, show login box
        openAuthModal();
      }
    });
    console.log('✅ Sign In button hooked up');
  }

  // When user clicks X to close modal
  const closeAuthBtn = document.getElementById('closeAuth');
  if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', closeAuthModal);
    console.log('✅ Close button hooked up');
  }

  // When user clicks gray background to close
  const authBackdrop = document.getElementById('authBackdrop');
  if (authBackdrop) {
    authBackdrop.addEventListener('click', closeAuthModal);
    console.log('✅ Backdrop click hooked up');
  }

  // Switch between Sign In and Sign Up tabs
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  
  if (tabSignIn) {
    tabSignIn.addEventListener('click', () => {
      console.log('User clicked Sign In tab');
      document.getElementById('formSignIn')?.classList.remove('hidden');
      document.getElementById('formSignUp')?.classList.add('hidden');
      tabSignIn.classList.add('tab-active');
      tabSignUp?.classList.remove('tab-active');
    });
  }

  if (tabSignUp) {
    tabSignUp.addEventListener('click', () => {
      console.log('User clicked Sign Up tab');
      document.getElementById('formSignUp')?.classList.remove('hidden');
      document.getElementById('formSignIn')?.classList.add('hidden');
      tabSignUp.classList.add('tab-active');
      tabSignIn?.classList.remove('tab-active');
    });
  }

  // Sign In button click
  const btnSignIn = document.getElementById('btnSignIn');
  if (btnSignIn) {
    btnSignIn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('User clicked Sign In button in form');
      const email = document.getElementById('signinEmail')?.value || '';
      const password = document.getElementById('signinPassword')?.value || '';
      handleSignIn(email, password);
    });
    console.log('✅ Sign In form button hooked up');
  }

  // Sign Up button click
  const btnSignUp = document.getElementById('btnSignUp');
  if (btnSignUp) {
    btnSignUp.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('User clicked Sign Up button in form');
      const name = document.getElementById('signupName')?.value || '';
      const email = document.getElementById('signupEmail')?.value || '';
      const password = document.getElementById('signupPassword')?.value || '';
      handleSignUp(name, email, password);
    });
    console.log('✅ Sign Up form button hooked up');
  }

  console.log('✅ All buttons are ready!');
}

// ===== STEP 15: WHEN PAGE LOADS, RUN EVERYTHING =====
function initializeAuth() {
  console.log('');
  console.log('🚀 ========== SMARTLEARN AUTH SYSTEM STARTING ==========');
  console.log('');
  
  loadCurrentUser();
  setupAuthListeners();
  updateUserHeader();
  
  console.log('');
  console.log('✅ AUTH SYSTEM READY!');
  console.log('💾 Current user:', currentUser);
  console.log('');
}

// Run when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  initializeAuth();
}