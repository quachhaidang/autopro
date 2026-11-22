document.addEventListener("DOMContentLoaded", () => {
    const usersKey = "autoProUsers";
    const sessionKey = "autoProUserSession";
    const tabs = [
        { button: document.getElementById("signin-tab"), panel: document.getElementById("signin-panel") },
        { button: document.getElementById("signup-tab"), panel: document.getElementById("signup-panel") }
    ];
    const signedInPanel = document.getElementById("signed-in-panel");
    const signInForm = document.getElementById("signin-panel");
    const signUpForm = document.getElementById("signup-panel");
    const signInMessage = document.getElementById("signin-message");
    const signUpMessage = document.getElementById("signup-message");
    const signOutButton = document.getElementById("signout-button");
    const changePasswordForm = document.getElementById("change-password-form");
    const changePasswordMessage = document.getElementById("change-password-message");
    const requestedReturnTo = new URLSearchParams(window.location.search).get("returnTo");

    function postAuthDestination() {
        if (!requestedReturnTo) return "index.html";
        const destination = new URL(requestedReturnTo, window.location.href);
        const bookingPage = new URL("booking.html", window.location.href);
        const allowedPages = ["booking.html", "my-bookings.html", "products.html"];
        const destinationPage = destination.pathname.split("/").pop();
        if (destination.origin !== window.location.origin || !allowedPages.includes(destinationPage)) {
            return "index.html";
        }
        return destination.href;
    }

    if (requestedReturnTo) {
        document.querySelector(".admin-intro").textContent =
            "Để đặt xe, hãy đăng nhập hoặc đăng ký tài khoản hội viên Auto Pro.";
    }

    function readUsers() {
        const stored = window.localStorage.getItem(usersKey);
        if (stored === null) return [];
        const users = JSON.parse(stored);
        if (!Array.isArray(users)) throw new Error("Danh sách tài khoản không hợp lệ.");
        return users;
    }

    function hexToBytes(hex) {
        if (typeof hex !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
        return Uint8Array.from(hex.match(/.{2}/g), (byte) => Number.parseInt(byte, 16));
    }

    function bytesToHex(bytes) {
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    async function hashPassword(password, salt) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("Trình duyệt không hỗ trợ mã hóa mật khẩu. Hãy mở trang qua máy chủ web cục bộ.");
        }
        const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
        const digest = await window.crypto.subtle.deriveBits(
            { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
            key,
            256
        );
        return bytesToHex(new Uint8Array(digest));
    }

    function showTab(index) {
        tabs.forEach((tab, tabIndex) => {
            const active = tabIndex === index;
            tab.button.classList.toggle("is-active", active);
            tab.button.setAttribute("aria-selected", String(active));
            tab.panel.hidden = !active;
        });
    }

    function showSignedIn(user) {
        signInForm.hidden = true;
        signUpForm.hidden = true;
        document.querySelector(".auth-tabs").hidden = true;
        document.getElementById("signed-in-name").textContent = user.name;
        signedInPanel.hidden = false;
        if (changePasswordForm) changePasswordForm.hidden = !window.autoProDB;
    }

    function setError(id, message) {
        document.getElementById(id).textContent = message;
    }

    function clearErrors(prefix, fields) {
        fields.forEach((field) => setError(`${prefix}-${field}-error`, ""));
    }

    function showAccountError(formMessage, error) {
        formMessage.textContent = error instanceof Error && error.message.startsWith("Trình duyệt không hỗ trợ")
            ? error.message
            : "Không thể hoàn tất thao tác tài khoản. Vui lòng kiểm tra bộ nhớ trình duyệt và thử lại.";
        console.error("Auto Pro account error:", error);
    }

    tabs.forEach((tab, index) => {
        tab.button.addEventListener("click", () => showTab(index));
    });

    try {
        const session = window.sessionStorage.getItem(sessionKey);
        if (session) {
            const user = JSON.parse(session);
            if (user && typeof user.name === "string" && typeof user.email === "string") {
                showSignedIn(user);
            } else {
                window.sessionStorage.removeItem(sessionKey);
            }
        }
    } catch (error) {
        showAccountError(signInMessage, error);
    }

    signInForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        signInMessage.textContent = "";
        clearErrors("signin", ["email", "password"]);

        const email = document.getElementById("signin-email").value.trim().toLocaleLowerCase("vi");
        const password = document.getElementById("signin-password").value;
        let valid = true;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("signin-email-error", "Vui lòng nhập email hợp lệ.");
            valid = false;
        }
        if (!password) {
            setError("signin-password-error", "Vui lòng nhập mật khẩu.");
            valid = false;
        }
        if (!valid) return;

        if (window.autoProDB) {
            try {
                const user = await window.autoProDB.login(email, password);
                window.sessionStorage.setItem(sessionKey, JSON.stringify(user));
                window.location.assign(postAuthDestination());
            } catch (error) {
                signInMessage.textContent = error instanceof Error ? error.message : "Không thể đăng nhập.";
            }
            return;
        }

        try {
            const users = readUsers();
            const user = users.find((item) => item.email === email);
            const salt = user && hexToBytes(user.passwordSalt);
            if (!user || !salt || user.passwordHash !== await hashPassword(password, salt)) {
                signInMessage.textContent = "Email hoặc mật khẩu chưa chính xác.";
                return;
            }
            const session = { name: user.name, email: user.email, phone: user.phone };
            window.sessionStorage.setItem(sessionKey, JSON.stringify(session));
            window.location.assign(postAuthDestination());
        } catch (error) {
            showAccountError(signInMessage, error);
        }
    });

    signUpForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        signUpMessage.textContent = "";
        clearErrors("signup", ["name", "email", "phone", "password", "confirm"]);

        const name = document.getElementById("signup-name").value.trim();
        const email = document.getElementById("signup-email").value.trim().toLocaleLowerCase("vi");
        const phone = document.getElementById("signup-phone").value.trim();
        const password = document.getElementById("signup-password").value;
        const confirmPassword = document.getElementById("signup-confirm").value;
        let valid = true;

        if (name.length < 2) {
            setError("signup-name-error", "Vui lòng nhập họ tên (ít nhất 2 ký tự).");
            valid = false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("signup-email-error", "Vui lòng nhập email hợp lệ.");
            valid = false;
        }
        if (!/^[0-9]{10,11}$/.test(phone)) {
            setError("signup-phone-error", "Số điện thoại cần có 10–11 chữ số.");
            valid = false;
        }
        if (password.length < 8) {
            setError("signup-password-error", "Mật khẩu cần có ít nhất 8 ký tự.");
            valid = false;
        }
        if (confirmPassword !== password) {
            setError("signup-confirm-error", "Mật khẩu xác nhận chưa khớp.");
            valid = false;
        }
        if (!valid) return;

        if (window.autoProDB) {
            try {
                const user = await window.autoProDB.register({ name, email, phone, password });
                window.sessionStorage.setItem(sessionKey, JSON.stringify(user));
                window.location.assign(postAuthDestination());
            } catch (error) {
                signUpMessage.textContent = error instanceof Error && error.message.includes("UNIQUE") ? "Email này đã được đăng ký." : (error.message || "Không thể đăng ký.");
            }
            return;
        }

        try {
            const users = readUsers();
            if (users.some((user) => user.email === email)) {
                setError("signup-email-error", "Email này đã được đăng ký.");
                return;
            }
            if (!window.crypto || !window.crypto.subtle) {
                throw new Error("Trình duyệt không hỗ trợ mã hóa mật khẩu. Hãy mở trang qua máy chủ web cục bộ.");
            }
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const user = {
                name,
                email,
                phone,
                passwordSalt: bytesToHex(salt),
                passwordHash: await hashPassword(password, salt)
            };
            users.push(user);
            window.localStorage.setItem(usersKey, JSON.stringify(users));
            const session = { name: user.name, email: user.email, phone: user.phone };
            window.sessionStorage.setItem(sessionKey, JSON.stringify(session));
            window.location.assign(postAuthDestination());
        } catch (error) {
            showAccountError(signUpMessage, error);
        }
    });

    signOutButton.addEventListener("click", () => {
        try {
            window.sessionStorage.removeItem(sessionKey);
            signedInPanel.hidden = true;
            document.querySelector(".auth-tabs").hidden = false;
            signInForm.reset();
            signUpForm.reset();
            signInMessage.textContent = "";
            signUpMessage.textContent = "";
            showTab(0);
        } catch (error) {
            showAccountError(signInMessage, error);
        }
    });

    changePasswordForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        changePasswordMessage.textContent = "";
        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-new-password").value;
        if (newPassword.length < 8) {
            changePasswordMessage.textContent = "Mật khẩu mới phải có ít nhất 8 ký tự.";
            return;
        }
        if (newPassword !== confirmPassword) {
            changePasswordMessage.textContent = "Mật khẩu xác nhận chưa khớp.";
            return;
        }
        try {
            const user = JSON.parse(window.sessionStorage.getItem(sessionKey) || "null");
            await window.autoProDB.changePassword({ userId: user?.userId, currentPassword, newPassword });
            changePasswordForm.reset();
            changePasswordMessage.textContent = "Đã cập nhật mật khẩu thành công.";
        } catch (error) {
            changePasswordMessage.textContent = error instanceof Error ? error.message : "Không thể đổi mật khẩu.";
        }
    });
});
