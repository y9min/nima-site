const staticForms = document.querySelectorAll("[data-static-form]");

staticForms.forEach((form) => {
  const error = form.querySelector("[data-form-error]");
  const success = form.querySelector("[data-form-success]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    error.textContent = "";
    success.textContent = "";

    const requiredFields = Array.from(form.querySelectorAll("[required]"));
    const firstEmpty = requiredFields.find((field) => !field.value.trim());

    if (firstEmpty) {
      error.textContent = "Please fill in all required fields.";
      firstEmpty.focus();
      return;
    }

    const email = form.querySelector('input[type="email"]');
    const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

    if (!validEmail) {
      error.textContent = "Enter a valid email address.";
      email.focus();
      return;
    }

    success.textContent = form.dataset.successMessage || "Thanks. Your details are ready.";
    form.reset();
  });
});
