import { supabase } from './supabaseClient.js';

const form = document.querySelector('#auth-form');
const email = document.querySelector('#auth-email');
const password = document.querySelector('#auth-password');
const nameField = document.querySelector('#auth-name');
const confirmField = document.querySelector('#confirm-field');
const submit = document.querySelector('#auth-submit');
const status = document.querySelector('#auth-status');
const signInTab = document.querySelector('#signin-tab');
const signUpTab = document.querySelector('#signup-tab');
const googleButton = document.querySelector('#google-signin');
let mode = 'signin';

function message(text, kind = '') {
  status.textContent = text;
  status.dataset.kind = kind;
}
function setMode(next) {
  mode = next;
  const signingUp = mode === 'signup';
  signInTab.classList.toggle('active', !signingUp);
  signUpTab.classList.toggle('active', signingUp);
  signInTab.setAttribute('aria-selected', String(!signingUp));
  signUpTab.setAttribute('aria-selected', String(signingUp));
  confirmField.hidden = !signingUp;
  password.autocomplete = signingUp ? 'new-password' : 'current-password';
  submit.innerHTML = signingUp ? 'Create account <span aria-hidden="true">→</span>' : 'Sign in <span aria-hidden="true">→</span>';
  message('');
}
signInTab.addEventListener('click', () => setMode('signin'));
signUpTab.addEventListener('click', () => setMode('signup'));

if (!supabase) {
  message('Account sign-in needs the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY settings. You can still browse sample books below.', 'error');
  googleButton.addEventListener('click', () => message('Google sign-in is unavailable until Supabase is configured.', 'error'));
} else {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) location.replace('discover.html');
  }).catch(() => {});
  googleButton.addEventListener('click', async () => {
    googleButton.disabled = true;
    message('Connecting to Google…');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: new URL('discover.html', location.href).href },
      });
      if (error) throw error;
    } catch (error) {
      message(error.message || 'Google sign-in could not start. Check that Google is enabled in Supabase Auth.', 'error');
      googleButton.disabled = false;
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    const oldLabel = mode === 'signup' ? 'Creating account…' : 'Signing in…';
    submit.textContent = oldLabel;
    message('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.value.trim(),
          password: password.value,
          options: { data: { display_name: nameField.value.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          location.assign('discover.html');
          return;
        }
        message('Account request received. Check your email for the confirmation link, then return to sign in.', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.value.trim(),
          password: password.value,
        });
        if (error) throw error;
        location.assign('discover.html');
      }
    } catch (error) {
      message(error.message || 'We could not complete that request. Please try again.', 'error');
    } finally {
      submit.disabled = false;
      submit.innerHTML = mode === 'signup' ? 'Create account <span aria-hidden="true">→</span>' : 'Sign in <span aria-hidden="true">→</span>';
    }
  });
}
