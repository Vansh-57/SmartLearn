/* =====================================================================
   DJANGO-BASED AUTHENTICATION - AUTO SHOW LOGIN MODAL (NO CLOSE BUTTON)
   ===================================================================== */

// ===== HELPER: CHECK IF EMAIL IS VALID =====
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===== HELPER: CHECK IF PASSWORD IS LONG ENOUGH =====
function isValidPassword(password) {
  return password.length >= 6;
}

// ===== HELPER: SHOW ERROR MESSAGE =====
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    el.style.color = '#ef4444';
    el.style.padding = '8px';
    el.style.borderRadius = '8px';
    el.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    el.style.marginBottom = '12px';
    el.style.border = '1px solid #ef4444';
  }
  
  if (typeof showNotification === 'function') {
    showNotification(message, 3000);
  }
}

// ===== HELPER: SHOW SUCCESS MESSAGE =====
function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    el.style.color = '#22c55e';
    el.style.padding = '8px';
    el.style.borderRadius = '8px';
    el.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
    el.style.marginBottom = '12px';
    el.style.border = '1px solid #22c55e';
  }
  
  if (typeof showNotification === 'function') {
    showNotification(message, 2000);
  }
}

// ===== HELPER: HIDE MESSAGE =====
function hideMessage(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.style.display = 'none';
  }
}

// ===== PASSWORD TOGGLE (EYE ICON) =====
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const button = input.parentElement.querySelector('.toggle-password');
  
  if (input.type === 'password') {
    input.type = 'text';
    if (button) button.textContent = '🙈';
  } else {
    input.type = 'password';
    if (button) button.textContent = '👁️';
  }
}

// ===== GET CSRF TOKEN =====
function getCSRFToken() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return value;
    }
  }
  return null;
}

// ===== SIGN IN HANDLER =====
async function handleSignIn(email, password) {
  console.log('=== SIGN IN START ===');
  hideMessage('signinMsg');
  
  email = email.trim().toLowerCase();
  
  if (!email || !password) {
    showError('signinMsg', '❌ Please enter both email and password');
    return false;
  }
  
  if (!isValidEmail(email)) {
    showError('signinMsg', '❌ Please enter a valid email address');
    return false;
  }
  
  const btnSignIn = document.getElementById('btnSignIn');
  if (btnSignIn) {
    btnSignIn.disabled = true;
    btnSignIn.textContent = 'Signing in...';
  }
  
  try {
    const csrftoken = getCSRFToken();
    
    const response = await fetch('/auth/signin/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || ''
      },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    console.log('✅ Sign in response:', data);
    
    if (data.success) {
      if (data.user) {
        const userData = {
          ...data.user,
          streak: data.streak || null
        };
        sessionStorage.setItem('smartlearn_current_user', JSON.stringify(userData));
        console.log('✅ User saved to sessionStorage');
      }
      
      showSuccess('signinMsg', '✅ Welcome back, ' + data.user.name + '!');
      
      setTimeout(() => {
        closeAuthModal();
        updateUserHeader(data.user, data.streak);
        
        if (typeof window.loadSearchHistory === 'function') {
          console.log('🔵 Loading search history...');
          window.loadSearchHistory().then(() => {
            console.log('✅ History loaded successfully');
          }).catch(err => {
            console.error('❌ History load failed:', err);
          });
        }
        
        if (data.streak && data.streak.current_streak > 0) {
          setTimeout(() => {
            if (typeof showNotification === 'function') {
              showNotification(`🔥 ${data.streak.current_streak} day streak! Keep it up!`, 3000);
            }
          }, 500);
        }
      }, 1500);
      
      return true;
    } else {
      showError('signinMsg', '❌ ' + data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Signin error:', error);
    showError('signinMsg', '❌ Network error. Please check your connection.');
    return false;
  } finally {
    if (btnSignIn) {
      btnSignIn.disabled = false;
      btnSignIn.textContent = 'Sign In';
    }
  }
}

// ===== SIGN UP HANDLER =====
async function handleSignUp(name, email, password) {
  console.log('=== SIGN UP START ===');
  hideMessage('signupMsg');
  
  name = name.trim();
  email = email.trim().toLowerCase();
  
  if (!name || !email || !password) {
    showError('signupMsg', '❌ Please fill in all fields');
    return false;
  }
  
  if (name.length < 2) {
    showError('signupMsg', '❌ Name must be at least 2 characters');
    return false;
  }
  
  if (!isValidEmail(email)) {
    showError('signupMsg', '❌ Please enter a valid email address');
    return false;
  }
  
  if (!isValidPassword(password)) {
    showError('signupMsg', '❌ Password must be at least 8 characters');
    return false;
  }
  
  const btnSignUp = document.getElementById('btnSignUp');
  if (btnSignUp) {
    btnSignUp.disabled = true;
    btnSignUp.textContent = 'Creating account...';
  }
  
  try {
    const csrftoken = getCSRFToken();
    
    const response = await fetch('/auth/signup/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || ''
      },
      credentials: 'same-origin',
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    console.log('✅ Sign up response:', data);
    
    if (data.success) {
      if (data.user) {
        const userData = {
          ...data.user,
          streak: data.streak || null
        };
        sessionStorage.setItem('smartlearn_current_user', JSON.stringify(userData));
        console.log('✅ User saved with streak:', userData);
      }
      
      showSuccess('signupMsg', '✅ Account created! Welcome, ' + data.user.name + '!');
      
      setTimeout(() => {
        closeAuthModal();
        updateUserHeader(data.user, data.streak);
        
        if (typeof window.loadSearchHistory === 'function') {
          console.log('🔵 Loading search history...');
          window.loadSearchHistory().then(() => {
            console.log('✅ History loaded successfully');
          }).catch(err => {
            console.error('❌ History load failed:', err);
          });
        }
        
        if (data.streak && data.streak.current_streak > 0) {
          setTimeout(() => {
            if (typeof showNotification === 'function') {
              showNotification(`🔥 Day ${data.streak.current_streak}! Start your learning streak!`, 3000);
            }
          }, 500);
        }
      }, 1500);
      
      return true;
    } else {
      showError('signupMsg', '❌ ' + data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Signup error:', error);
    showError('signupMsg', '❌ Network error. Please check your connection.');
    return false;
  } finally {
    if (btnSignUp) {
      btnSignUp.disabled = false;
      btnSignUp.textContent = 'Create Account';
    }
  }
}

// ===== LOGOUT =====
async function logout() {
  try {
    const csrftoken = getCSRFToken();
    
    const response = await fetch('/auth/logout/', {
      method: 'GET',
      headers: {
        'X-CSRFToken': csrftoken || ''
      },
      credentials: 'same-origin'
    });
    
    const data = await response.json();
    
    sessionStorage.removeItem('smartlearn_current_user');
    localStorage.removeItem('smartlearn_current_user');
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('smartlearn_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    if (typeof showNotification === 'function') {
      showNotification('👋 Logged out successfully!', 2000);
    }
    
    setTimeout(() => {
      location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.clear();
    localStorage.clear();
    location.reload();
  }
}

// ===== CLOSE AUTH MODAL (Only works after login) =====
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// ===== CHECK AUTH STATUS =====
async function checkAuthStatus() {
  try {
    const localUser = sessionStorage.getItem('smartlearn_current_user');
    if (localUser) {
      const userData = JSON.parse(localUser);
      updateUserHeader(userData, userData.streak);
      console.log('✅ User restored from sessionStorage:', userData.email);
      return; // User is logged in, don't show modal
    }
    
    const response = await fetch('/auth/check-auth/', {
      credentials: 'same-origin'
    });
    const data = await response.json();
    
    console.log('Auth status:', data);
    
    if (data.authenticated) {
      sessionStorage.setItem('smartlearn_current_user', JSON.stringify(data.user));
      updateUserHeader(data.user, data.user.streak);
    } else {
      // ✅ USER NOT LOGGED IN - SHOW MODAL AUTOMATICALLY
      console.log('🔐 User not authenticated - showing login modal');
      setTimeout(() => {
        showAuthModal();
      }, 500); // Small delay for smooth experience
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // On error, also show modal
    setTimeout(() => {
      showAuthModal();
    }, 500);
  }
}

// ===== SHOW AUTH MODAL (NO CLOSE BUTTON) =====
function showAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    
    // ✅ HIDE THE CLOSE BUTTON
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.style.display = 'none';
    }
    
    // ✅ DISABLE BACKDROP CLICK
    const backdrop = document.getElementById('authBackdrop');
    if (backdrop) {
      backdrop.style.pointerEvents = 'none';
    }
    
    // ✅ DISABLE ESC KEY
    document.removeEventListener('keydown', handleEscapeKey);
    
    console.log('✅ Login modal shown (no close option)');
  }
}

// ===== UPDATE HEADER WITH USER INFO =====
function updateUserHeader(user, streak) {
  console.log('🔵 Updating header for user:', user, 'Streak:', streak);
  
  const openAuthBtn = document.getElementById('openAuth');
  if (!openAuthBtn) {
    console.error('❌ openAuth button not found!');
    return;
  }
  
  if (openAuthBtn && user) {
    const newBtn = document.createElement('button');
    newBtn.id = 'openAuth';
    newBtn.className = openAuthBtn.className;
    newBtn.style.cssText = openAuthBtn.style.cssText;
    
    const streakBadge = streak && streak.current_streak > 0 
      ? `<span class="ml-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">🔥 ${streak.current_streak}</span>`
      : '';
    
    newBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
      <span class="text-sm">${user.name || 'User'}</span>
      ${streakBadge}
    `;
    
    newBtn.title = 'Click to see account options';
    newBtn.style.cursor = 'pointer';
    
    openAuthBtn.parentNode.replaceChild(newBtn, openAuthBtn);
    
    console.log('✅ Button replaced with streak display');
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showLogoutMenu(e, user, streak);
    });
    
    newBtn.setAttribute('data-logged-in', 'true');
  }
}

// ===== SHOW LOGOUT DROPDOWN MENU =====
function showLogoutMenu(event, user, streak) {
  event.stopPropagation();
  
  const existingMenu = document.getElementById('userDropdown');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }
  
  const menu = document.createElement('div');
  menu.id = 'userDropdown';
  menu.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: var(--panel, rgba(255,255,255,0.95));
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 10001;
    padding: 8px;
    min-width: 220px;
    color: var(--text, #1a1a2e);
  `;
  
  const streakHTML = streak && streak.current_streak > 0 ? `
    <div style="padding: 12px; background: linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,88,12,0.05)); border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(249,115,22,0.2);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 20px;">🔥</span>
        <div>
          <div style="font-weight: 700; font-size: 16px; color: #ea580c;">${streak.current_streak} Day Streak!</div>
          <div style="font-size: 10px; color: var(--muted, #6b7280);">Best: ${streak.longest_streak} days</div>
        </div>
      </div>
    </div>
  ` : '';
  
  menu.innerHTML = `
    <div style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 4px;">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${user.name || 'User'}</div>
      <div style="font-size: 11px; color: var(--muted, #6b7280); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.email || ''}</div>
    </div>
    ${streakHTML}
    <button id="logoutBtn" style="
      width: 100%;
      padding: 10px 12px;
      text-align: left;
      font-size: 13px;
      border-radius: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ef4444;
      transition: all 0.2s;
    " onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='transparent'">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>
      Logout
    </button>
  `;
  
  document.body.appendChild(menu);
  
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      menu.remove();
      await logout();
    });
  }
  
  setTimeout(() => {
    const closeHandler = function(e) {
      if (!menu.contains(e.target) && !e.target.closest('#openAuth')) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

// ===== ESC KEY HANDLER (DISABLED FOR AUTH MODAL) =====
function handleEscapeKey(e) {
  // Do nothing - ESC key disabled for auth modal
}

// ===== INITIALIZE AUTH HANDLERS =====
function initializeAuthHandlers() {
  console.log('Initializing auth handlers...');
  
  // Sign In Form
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail')?.value.trim() || '';
      const password = document.getElementById('signinPassword')?.value || '';
      await handleSignIn(email, password);
    });
  }
  
  // Sign Up Form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName')?.value.trim() || '';
      const email = document.getElementById('signupEmail')?.value.trim() || '';
      const password = document.getElementById('signupPassword')?.value || '';
      await handleSignUp(name, email, password);
    });
  }
  
  // Button handlers
  const btnSignIn = document.getElementById('btnSignIn');
  if (btnSignIn) {
    btnSignIn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail')?.value.trim() || '';
      const password = document.getElementById('signinPassword')?.value || '';
      await handleSignIn(email, password);
    });
  }
  
  const btnSignUp = document.getElementById('btnSignUp');
  if (btnSignUp) {
    btnSignUp.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName')?.value.trim() || '';
      const email = document.getElementById('signupEmail')?.value.trim() || '';
      const password = document.getElementById('signupPassword')?.value || '';
      await handleSignUp(name, email, password);
    });
  }
  
  console.log('✅ Auth handlers initialized');
}

// ===== INITIALIZE ON PAGE LOAD =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus(); // This will auto-show modal if not logged in
    initializeAuthHandlers();
  });
} else {
  checkAuthStatus(); // This will auto-show modal if not logged in
  initializeAuthHandlers();
}

// Make functions globally available
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.togglePassword = togglePassword;
window.logout = logout;
window.closeAuthModal = closeAuthModal;