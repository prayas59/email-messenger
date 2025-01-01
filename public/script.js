document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("to", document.getElementById("to").value);
  formData.append("cc", document.getElementById("cc").value);
  formData.append("bcc", document.getElementById("bcc").value);
  formData.append("subject", document.getElementById("subject").value);
  formData.append("message", document.getElementById("message").value);

  // Append attachments
  const attachments = document.getElementById("attachments").files;
  for (const file of attachments) {
    formData.append("attachments", file);
  }

  try {
    const response = await fetch("/send", {
      method: "POST",
      body: formData, // FormData handles multipart requests
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
