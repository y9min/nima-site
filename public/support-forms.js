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

    if (form.dataset.mailto) {
      const formData = new FormData(form);
      const subject = form.dataset.mailSubject || "Support request";
      const body = Array.from(formData.entries())
        .map(([name, value]) => `${name}: ${value}`)
        .join("\n\n");

      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    success.textContent = form.dataset.successMessage || "Thanks. Your details are ready.";
    form.reset();
  });
});
