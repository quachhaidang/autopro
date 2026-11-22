document.addEventListener("DOMContentLoaded", () => {
    const loginPanel = document.getElementById("login-panel");
    const dashboard = document.getElementById("dashboard");
    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("login-message");
    const logoutButton = document.getElementById("logout-button");
    const ordersList = document.getElementById("admin-orders");
    const ordersEmpty = document.getElementById("orders-empty");
    const fleetList = document.getElementById("admin-fleet");
    const fleetForm = document.getElementById("fleet-form");
    const fleetMessage = document.getElementById("fleet-message");
    const toast = document.getElementById("admin-toast");
    const fleetImageInput = document.getElementById("fleet-image");
    const fleetImagePreview = document.getElementById("fleet-image-preview");
    const fleetImagePreviewLabel = document.getElementById("fleet-image-preview-label");
    const fleetImagePreviewWrap = document.getElementById("fleet-image-preview-wrap");
    const sessionKey = "autoProManagerDemo";
    const bookingKey = "autoProBookings";
    const statusLabels = {
        pending: "Chờ duyệt",
        confirmed: "Đã xác nhận",
        active: "Đang thuê",
        completed: "Hoàn thành",
        cancelled: "Đã hủy"
    };
    let toastTimer;
    let bookingsCache = null;
    let previewObjectUrl = "";
    let pendingImage = "";
    const bookingsReady = window.autoProDB
        ? window.autoProDB.bookings().then((bookings) => { bookingsCache = bookings; return bookings; })
        : Promise.resolve();

    function imageSource(image) {
        const value = String(image || "");
        if (/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(value)) return value;
        if (/^[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g|gif)$/i.test(value)) return `images/${value}`;
        if (/^images\/[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g|gif)$/i.test(value)) return value;
        return "images/autopro.gif";
    }

    function showImagePreview(source, label) {
        fleetImagePreview.src = source;
        fleetImagePreviewLabel.textContent = label;
        fleetImagePreviewWrap.hidden = false;
    }

    function releasePreviewUrl() {
        if (!previewObjectUrl) return;
        window.URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = "";
    }

    function resizeImage(file) {
        return createImageBitmap(file).then((bitmap) => {
            const maxDimension = 1400;
            const initialScale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
            let width = Math.max(1, Math.round(bitmap.width * initialScale));
            let height = Math.max(1, Math.round(bitmap.height * initialScale));
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) {
                bitmap.close();
                throw new Error("Không thể xử lý ảnh này trên trình duyệt.");
            }

            const maxBytes = 400 * 1024;
            let attempt = 0;
            function encode() {
                canvas.width = width;
                canvas.height = height;
                context.clearRect(0, 0, width, height);
                context.drawImage(bitmap, 0, 0, width, height);
                return new Promise((resolve, reject) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error("Không thể nén ảnh đã chọn."));
                            return;
                        }
                        if (blob.size <= maxBytes) {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = () => reject(new Error("Không thể đọc ảnh đã xử lý."));
                            reader.readAsDataURL(blob);
                            return;
                        }
                        attempt += 1;
                        if (attempt >= 5) {
                            reject(new Error("Ảnh vẫn quá lớn sau khi nén. Vui lòng chọn ảnh nhỏ hơn."));
                            return;
                        }
                        width = Math.max(320, Math.round(width * 0.82));
                        height = Math.max(320, Math.round(height * 0.82));
                        encode().then(resolve, reject);
                    }, "image/webp", Math.max(0.55, 0.84 - attempt * 0.07));
                });
            }

            return encode().finally(() => bitmap.close());
        });
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

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
    }

    function readBookings() {
        if (window.autoProDB) return bookingsCache || [];
        const stored = window.localStorage.getItem(bookingKey);
        if (stored === null) return [];
        const bookings = JSON.parse(stored);
        if (!Array.isArray(bookings)) {
            throw new Error("Dữ liệu đơn đặt xe không hợp lệ.");
        }
        return bookings;
    }

    function updateOverview(bookings, fleet, dashboardStats = {}) {
        document.getElementById("stat-orders").textContent = String(bookings.length);
        document.getElementById("stat-pending").textContent = String(bookings.filter((booking) => booking.status === "pending").length);
        document.getElementById("stat-active").textContent = String(bookings.filter((booking) => booking.status === "active").length);
        document.getElementById("stat-fleet").textContent = String(fleet.length);
        const revenueElement = document.getElementById("stat-revenue");
        if (revenueElement) revenueElement.textContent = `${Number(dashboardStats.revenue || 0).toLocaleString("vi-VN")} đ`;
        const chart = document.getElementById("dashboard-chart");
        const monthly = Array.isArray(dashboardStats.monthly) ? dashboardStats.monthly : [];
        if (chart) {
            const maxRevenue = Math.max(1, ...monthly.map((item) => Number(item.revenue) || 0));
            chart.innerHTML = monthly.length ? monthly.map((item) => {
                const revenue = Number(item.revenue) || 0;
                const height = Math.max(8, Math.round((revenue / maxRevenue) * 100));
                return `<div class="chart-bar-item"><div class="chart-bar-value">${revenue.toLocaleString("vi-VN")} đ · ${Number(item.orders) || 0} đơn</div><div class="chart-bar" style="--bar-height:${height}%" title="${escapeHTML(item.month)}"></div><span>${escapeHTML(item.month)}</span></div>`;
            }).join("") : '<p class="section-hint">Chưa có dữ liệu doanh thu theo tháng.</p>';
        }
    }

    function renderOrders(bookings) {
        const query = document.getElementById("order-search").value.trim().toLocaleLowerCase("vi");
        const statusFilter = document.getElementById("order-status-filter")?.value || "all";
        const visibleBookings = bookings.filter((booking) => [
            booking.id,
            booking.fullname,
            booking.email,
            booking.carType
        ].some((value) => String(value || "").toLocaleLowerCase("vi").includes(query)) && (statusFilter === "all" || booking.status === statusFilter));

        ordersList.innerHTML = visibleBookings.map((booking) => {
            const id = escapeHTML(booking.id);
            const status = Object.hasOwn(statusLabels, booking.status) ? booking.status : "pending";
            return `<article class="admin-order">
                <div>
                    <span class="order-code">${id}</span>
                    <h3>${escapeHTML(booking.carType || "Chưa chọn xe")}</h3>
                    <p>Khách hàng: ${escapeHTML(booking.fullname || "Chưa cập nhật")} · ${escapeHTML(booking.phone || booking.email || "Chưa có liên hệ")}</p>
                    <p>Thời gian: ${escapeHTML(booking.pickupDate || "—")} đến ${escapeHTML(booking.returnDate || "—")}</p>
                </div>
                <div class="order-controls">
                    <label class="sr-only" for="status-${escapeHTML(id)}">Trạng thái đơn ${id}</label>
                    <select class="order-status" id="status-${escapeHTML(id)}" data-order-id="${id}">
                        ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}"${value === status ? " selected" : ""}>${label}</option>`).join("")}
                    </select>
                </div>
            </article>`;
        }).join("");

        ordersEmpty.hidden = visibleBookings.length > 0;
    }

    function renderFleet(fleet) {
        fleetList.innerHTML = fleet.map((car) => `<article class="admin-car" data-car-id="${escapeHTML(car.id)}">
            ${car.image ? `<img src="${escapeHTML(imageSource(car.image))}" alt="${escapeHTML(car.name)}">` : ""}
            <div>
                <h3>${escapeHTML(car.name)}</h3>
                <p>${escapeHTML(car.brand)} · ${escapeHTML(car.category)} · ${escapeHTML(car.year || "—")} · ${escapeHTML(car.license || "—")}</p>
                <p>${Number(car.price).toLocaleString("vi-VN")}đ / ngày${car.featured ? " · Nổi bật" : ""}</p>
            </div>
            <div class="admin-car-actions">
                <button class="button button-outline" type="button" data-action="edit" data-car-id="${escapeHTML(car.id)}">Sửa</button>
                <button class="button button-danger" type="button" data-action="delete" data-car-id="${escapeHTML(car.id)}">Xóa</button>
            </div>
        </article>`).join("");
    }

    async function refreshDashboard() {
        await Promise.all([window.AutoProFleet.ready, bookingsReady]);
        const bookings = readBookings();
        const fleet = window.AutoProFleet.load();
        const dashboardStats = window.autoProDB ? await window.autoProDB.dashboard() : {};
        updateOverview(bookings, fleet, dashboardStats);
        renderOrders(bookings);
        renderFleet(fleet);
    }

    async function showDashboard() {
        loginPanel.hidden = true;
        dashboard.hidden = false;
        logoutButton.hidden = false;
        await refreshDashboard();
    }

    function resetFleetForm() {
        fleetForm.reset();
        pendingImage = "";
        releasePreviewUrl();
        fleetImagePreviewWrap.hidden = true;
        document.getElementById("fleet-id").value = "";
        document.getElementById("fleet-form-title").textContent = "Thêm xe mới";
        document.getElementById("fleet-save").textContent = "Thêm xe vào dàn";
        document.getElementById("fleet-cancel").hidden = true;
        fleetMessage.textContent = "";
    }

    function reportError(message) {
        loginMessage.textContent = message;
        fleetMessage.textContent = message;
        console.error(message);
    }

    if (loginForm) {
        try {
            const storedSession = window.sessionStorage.getItem(sessionKey);
            if (storedSession === "signed-in" || (storedSession && JSON.parse(storedSession).roleId === 1)) {
                showDashboard();
            }
        } catch (error) {
            reportError("Không thể truy cập phiên đăng nhập của trình duyệt. Vui lòng mở trang bằng máy chủ web cục bộ.");
        }

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            loginMessage.textContent = "";
            document.getElementById("username-error").textContent = "";
            document.getElementById("password-error").textContent = "";

            const username = document.getElementById("admin-username").value.trim();
            const password = document.getElementById("admin-password").value;
            let valid = true;

            if (!username) {
                document.getElementById("username-error").textContent = "Vui lòng nhập tài khoản.";
                valid = false;
            }
            if (!password) {
                document.getElementById("password-error").textContent = "Vui lòng nhập mật khẩu.";
                valid = false;
            }
            if (!valid) return;

            if (window.autoProDB) {
                try {
                    const user = await window.autoProDB.login(username, password);
                    if (![1, 2].includes(Number(user.roleId))) throw new Error("Tài khoản không có quyền quản trị.");
                    window.sessionStorage.setItem(sessionKey, JSON.stringify(user));
                    await showDashboard();
                } catch (error) {
                    loginMessage.textContent = error instanceof Error ? error.message : "Tài khoản hoặc mật khẩu chưa đúng.";
                }
                return;
            }

            loginMessage.textContent = "Trang quản trị cần được mở bằng ứng dụng Electron để xác thực qua SQLite.";
        });
    }

    logoutButton.addEventListener("click", () => {
        try {
            window.sessionStorage.removeItem(sessionKey);
            dashboard.hidden = true;
            loginPanel.hidden = false;
            logoutButton.hidden = true;
            loginForm.reset();
            loginMessage.textContent = "";
        } catch (error) {
            reportError("Không thể kết thúc phiên đăng nhập demo.");
        }
    });

    document.getElementById("order-search").addEventListener("input", () => {
        try {
            renderOrders(readBookings());
        } catch (error) {
            reportError("Không thể tìm đơn hàng. Dữ liệu lưu trữ có thể không hợp lệ.");
        }
    });

    document.getElementById("order-status-filter")?.addEventListener("change", () => {
        try { renderOrders(readBookings()); } catch (error) { reportError("Không thể lọc đơn hàng."); }
    });

    document.getElementById("export-orders")?.addEventListener("click", () => {
        const rows = readBookings();
        const header = ["Mã đơn", "Khách hàng", "Điện thoại", "Email", "Xe", "Nhận xe", "Trả xe", "Trạng thái", "Tổng tiền"];
        const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const data = rows.map((booking) => [booking.id, booking.fullname, booking.phone, booking.email, booking.carType, `${booking.pickupDate} ${booking.pickupTime || ""}`, `${booking.returnDate} ${booking.returnTime || ""}`, statusLabels[booking.status] || booking.status, booking.total].map(csvCell).join(","));
        const blob = new Blob(["\uFEFF" + [header.map(csvCell).join(","), ...data].join("\r\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `autopro-don-hang-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    });

    fleetImageInput?.addEventListener("change", async () => {
        const file = fleetImageInput.files?.[0];
        if (!file) return;
        if (!/^image\/(?:png|jpe?g|webp|gif)$/i.test(file.type)) {
            fleetMessage.textContent = "Vui lòng chọn ảnh PNG, JPG, WEBP hoặc GIF.";
            fleetImageInput.value = "";
            return;
        }
        try {
            pendingImage = await resizeImage(file);
            showImagePreview(pendingImage, file.name);
            fleetMessage.textContent = "Ảnh đã sẵn sàng để lưu.";
        } catch (error) {
            pendingImage = "";
            fleetMessage.textContent = error.message || "Không thể xử lý ảnh.";
        }
    });

    ordersList.addEventListener("change", async (event) => {
        const select = event.target.closest(".order-status");
        if (!select) return;

        try {
            const bookings = readBookings();
            const booking = bookings.find((item) => item.id === select.dataset.orderId);
            if (!booking) {
                showToast("Không tìm thấy đơn hàng cần cập nhật.");
                return;
            }
            if (window.autoProDB) {
                await window.autoProDB.updateBookingStatus(booking.id, select.value);
                bookingsCache = await window.autoProDB.bookings();
            } else {
                booking.status = select.value;
                window.localStorage.setItem(bookingKey, JSON.stringify(bookings));
            }
            await refreshDashboard();
            showToast(`Đã cập nhật trạng thái đơn ${booking.id}.`);
        } catch (error) {
            reportError("Không thể lưu trạng thái đơn. Vui lòng kiểm tra quyền lưu trữ của trình duyệt.");
        }
    });

    fleetList.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        try {
            const fleet = window.AutoProFleet.load();
            const car = fleet.find((item) => String(item.id) === button.dataset.carId);
            if (!car) {
                showToast("Không tìm thấy xe cần thao tác.");
                return;
            }

            if (button.dataset.action === "edit") {
                document.getElementById("fleet-id").value = car.id;
                document.getElementById("fleet-brand").value = car.brand;
                document.getElementById("fleet-name").value = car.name;
                document.getElementById("fleet-category").value = car.category;
                document.getElementById("fleet-year").value = car.year || "";
                document.getElementById("fleet-owner").value = car.owner || "";
                document.getElementById("fleet-license").value = car.license || "";
                document.getElementById("fleet-price").value = String(car.price);
                pendingImage = car.image || "";
                if (pendingImage) showImagePreview(imageSource(pendingImage), "Ảnh hiện tại");
                document.getElementById("fleet-form-title").textContent = "Chỉnh sửa thông tin xe";
                document.getElementById("fleet-save").textContent = "Lưu thay đổi";
                document.getElementById("fleet-cancel").hidden = false;
                fleetForm.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }

            if (window.confirm(`Xóa ${car.name} khỏi dàn xe?`)) {
                if (window.autoProDB) { await window.autoProDB.deleteFleet(car.id); await window.AutoProFleet.refreshCache(); }
                else window.AutoProFleet.save(fleet.filter((item) => item.id !== car.id));
                await refreshDashboard();
                showToast(`Đã xóa ${car.name} khỏi dàn xe.`);
            }
        } catch (error) {
            reportError("Không thể cập nhật dàn xe. Vui lòng kiểm tra dữ liệu lưu trữ.");
        }
    });

    fleetForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        fleetMessage.textContent = "";
        if (!fleetForm.reportValidity()) return;

        const editingId = document.getElementById("fleet-id").value;
        const fleet = window.AutoProFleet.load();
        const oldCar = fleet.find((item) => String(item.id) === editingId);
        const car = {
            id: editingId || `${document.getElementById("fleet-brand").value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
            brand: document.getElementById("fleet-brand").value.trim(),
            name: document.getElementById("fleet-name").value.trim(),
            category: document.getElementById("fleet-category").value,
            year: Number(document.getElementById("fleet-year").value),
            owner: document.getElementById("fleet-owner").value.trim(),
            license: document.getElementById("fleet-license").value,
            price: Number(document.getElementById("fleet-price").value),
            image: pendingImage || (oldCar ? oldCar.image : ""),
            featured: oldCar ? Boolean(oldCar.featured) : false
        };

        try {
            const existingIndex = fleet.findIndex((item) => String(item.id) === editingId);
            if (!editingId && fleet.some((item) => item.name.toLocaleLowerCase("vi") === car.name.toLocaleLowerCase("vi"))) {
                fleetMessage.textContent = "Tên xe này đã có trong dàn. Vui lòng chọn tên khác.";
                return;
            }
            if (editingId && existingIndex === -1) {
                fleetMessage.textContent = "Không tìm thấy xe cần cập nhật. Hãy tải lại trang.";
                return;
            }

            if (window.autoProDB) {
                if (editingId) await window.autoProDB.updateFleet(editingId, car);
                else await window.autoProDB.createFleet(car);
                await window.AutoProFleet.refreshCache();
            } else {
                if (editingId) fleet[existingIndex] = car;
                else fleet.push(car);
                window.AutoProFleet.save(fleet);
            }
            resetFleetForm();
            await refreshDashboard();
            showToast(editingId ? "Đã lưu thay đổi thông tin xe." : "Đã thêm xe vào dàn.");
        } catch (error) {
            reportError("Không thể lưu dàn xe. Vui lòng kiểm tra quyền lưu trữ của trình duyệt.");
        }
    });

    document.getElementById("fleet-cancel").addEventListener("click", resetFleetForm);

    window.addEventListener("storage", (event) => {
        if (event.key === bookingKey || event.key === window.AutoProFleet.storageKey) {
            try {
                refreshDashboard();
            } catch (error) {
                reportError("Không thể đồng bộ dữ liệu cửa hàng từ tab khác.");
            }
        }
    });
});
