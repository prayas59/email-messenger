document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    to: document.getElementById("to").value,
    cc: document.getElementById("cc").value,
    bcc: document.getElementById("bcc").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value,
  };

  try {
    const response = await fetch("/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    const responseElement = document.getElementById("response");

    if (result.success) {
      responseElement.style.color = "green";
      responseElement.textContent = result.message;
    } else {
      responseElement.style.color = "red";
      responseElement.textContent = result.message;
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("response").textContent = "Error sending email.";
  }
});
