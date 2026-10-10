import { supabase } from './supabaseClient.js';

const message = document.querySelector('#auth-message');
const loginForm = document.querySelector('#login-form');
const createForm = document.querySelector('#create-account-form');

function showMessage(text, kind = 'info') {
  if (!message) return;
  message.textContent = text;
  message.dataset.kind = kind;
}

function setSubmitting(form, submitting, label) {
  const button = form?.querySelector('button[type="submit"]');
  if (!button) return;
  if (submitting) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = label;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

function readableError(error) {
  const text = String(error?.message || 'Something went wrong. Please try again.');
  if (/invalid login credentials/i.test(text)) return 'Email or password is incorrect.';
  if (/user already registered/i.test(text)) return 'An account with this email already exists. Sign in instead.';
  if (/email not confirmed/i.test(text)) return 'Please confirm your email address before signing in.';
  if (/password should be at least/i.test(text)) return 'Choose a longer password.';
  return text;
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) { showMessage('Authentication is not configured yet. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.', 'error'); return; }
  const form = new FormData(loginForm);
  setSubmitting(loginForm, true, 'Signing in…');
  showMessage('');
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
    });
    if (error) throw error;
    window.location.assign('index.html');
  } catch (error) { showMessage(readableError(error), 'error'); }
  finally { setSubmitting(loginForm, false); }
});

createForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(createForm);
  const fullName = String(form.get('fullName') || '').trim();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const confirmPassword = String(form.get('confirmPassword') || '');
  if (fullName.length < 2) { showMessage('Enter your full name.', 'error'); return; }
  if (password.length < 8) { showMessage('Your password must be at least 8 characters.', 'error'); return; }
  if (password !== confirmPassword) { showMessage('The passwords do not match.', 'error'); return; }
  if (!form.get('terms')) { showMessage('Please accept the terms to continue.', 'error'); return; }
  if (!supabase) { showMessage('Authentication is not configured yet. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.', 'error'); return; }
  setSubmitting(createForm, true, 'Creating account…');
  showMessage('');
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: new URL('index.html', window.location.href).href },
    });
    if (error) throw error;
    if (data.session) {
      window.location.assign('index.html');
    } else {
      showMessage('Account request received. Check your email for a confirmation link, then sign in.', 'success');
      createForm.reset();
    }
  } catch (error) { showMessage(readableError(error), 'error'); }
  finally { setSubmitting(createForm, false); }
});