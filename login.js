const loginForm = document.querySelector("#login-form");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#toggle-password");
const loginMessage = document.querySelector("#login-message");

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

if (loginForm && passwordInput && loginMessage) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    passwordInput.value = "";
    passwordInput.type = "password";
    if (passwordToggle) {
      passwordToggle.textContent = "Show";
      passwordToggle.setAttribute("aria-label", "Show password");
      passwordToggle.setAttribute("aria-pressed", "false");
    }
    loginMessage.textContent =
      "This is a visual demo only. No account system is connected, and your details were not sent or saved.";
  });
}
