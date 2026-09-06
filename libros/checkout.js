(function () {
  "use strict";

  const CHECKOUT_ENDPOINT = "https://api.tuimagenstudios.com/api/checkout";

  function setButtonState(button, busy) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.textContent;
    }
    button.disabled = busy;
    button.setAttribute("aria-busy", busy ? "true" : "false");
    button.style.pointerEvents = busy ? "none" : "";
    button.textContent = busy ? "Preparando pago…" : button.dataset.originalLabel;
  }

  async function startCheckout(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    if (!productId || button.disabled) return;

    setButtonState(button, true);

    try {
      const response = await fetch(CHECKOUT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "No se recibió el enlace de pago");
      }
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      console.error("checkout_error", error);
      setButtonState(button, false);
      window.alert("No pudimos iniciar el pago. Intentá nuevamente en unos segundos.");
    }
  }

  document.querySelectorAll("[data-product-id]").forEach((button) => {
    button.addEventListener("click", startCheckout);
  });
})();
