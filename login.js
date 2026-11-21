const authForm = document.querySelector("#auth-form");
const authFormContainer = document.querySelector("#auth-form-container");
const accountPanel = document.querySelector("#account-panel");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#toggle-password");
const submitButton = document.querySelector("#auth-submit");
const modeToggle = document.querySelector("#auth-mode-toggle");
const signOutButton = document.querySelector("#sign-out");
const accountEmail = document.querySelector("#account-email");
const loginMessage = document.querySelector("#login-message");

let supabaseClient;
let isSignUpMode = false;
const returnToCommunityFinds =
  new URLSearchParams(window.location.search).get("returnTo") === "community-finds";

const setMessage = (message, type = "info") => {
  loginMessage.textContent = message;
  loginMessage.dataset.state = type;
};

const renderSession = (session) => {
  const isSignedIn = Boolean(session);
  authFormContainer.hidden = isSignedIn;
  accountPanel.hidden = !isSignedIn;
  if (session) {
    accountEmail.textContent = session.user.email;
  }
};

const setMode = (signUpMode) => {
  isSignUpMode = signUpMode;
  document.querySelector("#login-title").textContent = signUpMode
    ? "Create your account"
    : "Sign in";
  document.querySelector("#login-intro").textContent = signUpMode
    ? "Create an account to join the community."
    : "Sign in to continue exploring with the community.";
  submitButton.textContent = signUpMode ? "Create account" : "Sign in";
  modeToggle.textContent = signUpMode
    ? "Already have an account? Sign in"
    : "New here? Create an account";
  passwordInput.autocomplete = signUpMode ? "new-password" : "current-password";
  setMessage("");
};

const setBusy = (busy) => {
  submitButton.disabled = busy;
  modeToggle.disabled = busy;
  signOutButton.disabled = busy;
};

if (passwordInput && passwordToggle) {
  passwordToggle.addEventListener("click", () => {
    const shouldShowPassword = passwordInput.type === "password";
    passwordInput.type = shouldShowPassword ? "text" : "password";
    passwordToggle.textContent = shouldShowPassword ? "Hide" : "Show";
    passwordToggle.setAttribute(
      "aria-label",
      shouldShowPassword ? "Hide password" : "Show password"
    );
    passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
  });
}

if (
  authForm &&
  authFormContainer &&
  accountPanel &&
  emailInput &&
  passwordInput &&
  submitButton &&
  modeToggle &&
  signOutButton &&
  accountEmail &&
  loginMessage
) {
  modeToggle.addEventListener("click", () => {
    setMode(!isSignUpMode);
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      return;
    }

    setBusy(true);
    setMessage(isSignUpMode ? "Creating your account..." : "Signing in...");

    try {
      const result = isSignUpMode
        ? await supabaseClient.auth.signUp({
            email: emailInput.value.trim(),
            password: passwordInput.value,
            options: {
              emailRedirectTo: window.location.href,
            },
          })
        : await supabaseClient.auth.signInWithPassword({
            email: emailInput.value.trim(),
            password: passwordInput.value,
          });

      if (result.error) {
        throw result.error;
      }

      passwordInput.value = "";
      if (isSignUpMode && !result.data.session) {
        setMessage(
          "Account created. Check your email for a confirmation link before signing in.",
          "success"
        );
      } else {
        if (result.data.session && returnToCommunityFinds) {
          window.location.assign("index.html#community-finds");
          return;
        }

        renderSession(result.data.session);
        setMessage(
          isSignUpMode ? "Your account is ready." : "You are signed in.",
          "success"
        );
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      setMessage(error.message || "Authentication failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  });

  signOutButton.addEventListener("click", async () => {
    setBusy(true);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
      renderSession(null);
      passwordInput.value = "";
      setMessage("You have signed out.");
    } catch (error) {
      console.error("Sign out failed:", error);
      setMessage(error.message || "Sign out failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  });

  const initializeAuth = async () => {
    const config = window.SUPABASE_CONFIG;
    if (
      !config ||
      typeof config.url !== "string" ||
      typeof config.publishableKey !== "string" ||
      !config.url.trim() ||
      !config.publishableKey.trim() ||
      config.url.includes("YOUR_PROJECT_ID") ||
      config.publishableKey.includes("YOUR_SUPABASE")
    ) {
      setMessage(
        "Supabase is not configured yet. Follow BACKEND_SETUP.md to connect your project.",
        "error"
      );
      return;
    }

    try {
      const { createClient } = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
      );
      supabaseClient = createClient(config.url, config.publishableKey);
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        renderSession(session);
      });

      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        throw error;
      }
      renderSession(data.session);
      setBusy(false);
      setMessage("");
    } catch (error) {
      console.error("Could not initialize Supabase Auth:", error);
      setMessage(
        "Could not connect to Supabase Auth. Check your project URL, key, and network connection.",
        "error"
      );
    }
  };

  initializeAuth();
}
