/**
 * Main UI Logic for Auto Pro
 */

// Khi chạy trong Electron, SQLite là nguồn dữ liệu duy nhất. Xoá dữ liệu demo
// cũ của website một lần ở phía renderer, không đụng tới file Data.db.
if (window.autoProDB) {
    window.autoProDB.legacyStorageKeys().then((keys) => {
        keys.forEach((key) => window.localStorage.removeItem(key));
    }).catch((error) => console.error("Không thể dọn dữ liệu localStorage cũ:", error));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Global toast function
const toast = document.getElementById("toast");
let toastTimer;
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 5000);
}

// Global Luxury Loading Overlay Controller for AutoPro Classic
window.showLoading = function(text = "Đang xử lý đặc quyền...") {
    let overlay = document.getElementById("loading-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "loading-overlay";
        overlay.className = "loading-overlay";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML = `
            <div class="loading-backdrop"></div>
            <div class="loading-card">
                <div class="luxury-loader">
                    <div class="loading-spinner"></div>
                </div>
                <div class="loading-details">
                    <span class="loading-eyebrow">✦ AUTOPRO CLASSIC ✦</span>
                    <div class="loading-text" id="loading-message">${escapeHTML(text)}</div>
                    <div class="loading-meter" aria-hidden="true">
                        <div class="loading-meter-bar"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        const msgEl = document.getElementById("loading-message");
        if (msgEl) msgEl.textContent = text;
    }
    void overlay.offsetWidth;
    overlay.classList.add("show");
};

window.hideLoading = function() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
        overlay.classList.remove("show");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const pageOrder = [
        "index.html",
        "products.html",
        "about.html",
        "contact.html",
        "booking.html",
        "my-bookings.html",
        "auth.html",
        "admin.html"
    ];
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    // Mobile Menu Toggle
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const open = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // Date logic for Index Page Booking Form
    const pickup = document.getElementById("pickup-date");
    const returnDate = document.getElementById("return-date");
    
    if (pickup && returnDate && !document.querySelector(".booking-page")) {
        const today = new Date();
        const localDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        pickup.min = localDate(today);
        returnDate.min = localDate(tomorrow);
        pickup.value = localDate(today);
        returnDate.value = localDate(tomorrow);
        
        pickup.addEventListener("change", () => {
            const selected = new Date(`${pickup.value}T00:00:00`);
            selected.setDate(selected.getDate() + 1);
            const earliestReturn = localDate(selected);
            returnDate.min = earliestReturn;
            if (!returnDate.value || returnDate.value <= pickup.value) {
                returnDate.value = earliestReturn;
            }
        });
    }

    // Index Page Filter Logic
    const filterButtons = document.querySelectorAll(".filter");
    const carCards = document.querySelectorAll(".car-card");
    const emptyState = document.getElementById("empty-state");

    function filterCars(brand) {
        let visible = 0;
        carCards.forEach((card) => {
            const matches = brand === "all" || card.dataset.brand === brand;
            card.hidden = !matches;
            if (matches) visible++;
        });
        filterButtons.forEach((button) => {
            if (button.dataset.filter) {
                const selected = button.dataset.filter === brand;
                button.classList.toggle("selected", selected);
                button.setAttribute("aria-pressed", String(selected));
            }
        });
        if (emptyState) {
            emptyState.classList.toggle("show", visible === 0);
        }
    }

    if (filterButtons.length > 0) {
        filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                if (button.dataset.filter) {
                    filterCars(button.dataset.filter);
                }
            });
        });
    }

    // Index Page Booking Form Submit
    const bookingForm = document.getElementById("booking-form");
    if (bookingForm && pickup && returnDate && document.getElementById("booking-brand")) {
        bookingForm.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!pickup.value || !returnDate.value || returnDate.value <= pickup.value) {
                showToast("Vui lòng chọn ngày trả xe sau ngày nhận xe.");
                return;
            }
            const brand = document.getElementById("booking-brand").value;
            filterCars(brand);
            const targetSection = document.getElementById("xe-cho-thue");
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: "smooth" });
            }
            showToast(brand === "all" ? "Đây là những xe đang sẵn sàng." : `Đã lọc xe ${brand}.`);
        });
    }

    const roadCanvas = document.querySelector("[data-road-animation]");
    if (roadCanvas) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
            roadCanvas.classList.add("is-in-view");
        } else {
            const roadObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-in-view");
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.15 });
            roadObserver.observe(roadCanvas);
        }
    }
});
