(() => {
    "use strict";

    const BOOKINGS_KEY = "autoProBookings";
    const form = document.getElementById("booking-form");
    const lookupForm = document.getElementById("lookup-form");
    const overlay = document.getElementById("message-overlay");
    const modal = overlay && overlay.querySelector(".message-box");
    let activeModalResolver = null;
    let previousFocus = null;
    let currentFleet = [];
    let bookingsCache = null;
    let lastLookupBooking = null;
    const bookingsReady = window.autoProDB
        ? window.autoProDB.bookings().then((bookings) => { bookingsCache = bookings; return bookings; })
        : Promise.resolve();
    let busy = false;

    const money = (amount) => `${Number(amount).toLocaleString("vi-VN")} VNĐ`;

    function currentAccount() {
        try {
            const session = JSON.parse(window.sessionStorage.getItem("autoProUserSession") || "null");
            if (session && typeof session.name === "string" && typeof session.email === "string") return session;
        } catch (error) {
            console.error("Auto Pro account session error:", error);
        }
        return null;
    }

    function redirectToSignIn() {
        const returnTo = `${window.location.pathname.split("/").pop()}${window.location.search}${window.location.hash}`;
        window.location.replace(`auth.html?returnTo=${encodeURIComponent(returnTo)}`);
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

    function readBookings() {
        if (window.autoProDB) return bookingsCache || [];
        const stored = window.localStorage.getItem(BOOKINGS_KEY);
        if (stored === null) return [];
        const bookings = JSON.parse(stored);
        if (!Array.isArray(bookings)) throw new Error("Dữ liệu đơn đặt xe không hợp lệ.");
        return bookings;
    }

    async function loadFleetForBooking() {
        let lastError = null;
        if (window.autoProDB) {
            try {
                const fleet = await window.autoProDB.fleet();
                if (Array.isArray(fleet)) return fleet;
                lastError = new Error("API đội xe trả về dữ liệu không hợp lệ.");
            } catch (error) {
                lastError = error;
                console.error("Không thể tải đội xe trực tiếp từ SQLite:", error);
            }
        }
        try {
            await window.AutoProFleet.ready;
            const fleet = window.AutoProFleet.load();
            if (Array.isArray(fleet)) return fleet;
        } catch (error) {
            lastError = error;
            console.error("Lần đầu tải đội xe thất bại:", error);
        }
        throw lastError || new Error("Dữ liệu đội xe không hợp lệ.");
    }

    function normalizePhone(value) {
        let digits = String(value || "").replace(/\D/g, "");
        if (digits.startsWith("84")) digits = `0${digits.slice(2)}`;
        return digits;
    }

    function showMessage({ type = "info", title, content, actions = [] }) {
        if (!overlay || !modal) return Promise.resolve(null);
        if (activeModalResolver) activeModalResolver(null);
        previousFocus = document.activeElement;
        modal.dataset.type = type;
        document.getElementById("message-icon").textContent =
            type === "success" ? "✓" : type === "error" ? "!" : "?";
        document.getElementById("message-eyebrow").textContent =
            type === "success" ? "AUTOPRO · THÀNH CÔNG" : type === "error" ? "AUTOPRO · CẦN KIỂM TRA" : "AUTOPRO · XÁC NHẬN";
        document.getElementById("message-title").textContent = title;
        document.getElementById("message-content").innerHTML = content;

        const actionContainer = document.getElementById("message-actions");
        actionContainer.replaceChildren();
        actions.forEach((action, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = action.primary ? "button" : "button message-secondary";
            button.textContent = action.label;
            button.addEventListener("click", () => {
                closeMessage(action.value ?? index);
                if (action.onClick) action.onClick();
            });
            actionContainer.append(button);
        });

        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        const firstAction = actionContainer.querySelector("button");
        (firstAction || document.getElementById("message-close")).focus();
        return new Promise((resolve) => {
            activeModalResolver = resolve;
        });
    }

    function closeMessage(value = null) {
        if (!overlay) return;
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        const resolve = activeModalResolver;
        activeModalResolver = null;
        if (resolve) resolve(value);
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    }

    function bindModal() {
        if (!overlay) return;
        document.getElementById("message-close").addEventListener("click", () => closeMessage());
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeMessage();
        });
        document.addEventListener("keydown", (event) => {
            if (!overlay.classList.contains("is-open")) return;
            if (event.key === "Escape") {
                closeMessage();
                return;
            }
            if (event.key !== "Tab") return;
            const focusable = [...modal.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled)")];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });
    }

    function imageSource(image) {
        const value = String(image || "");
        if (/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(value)) return value;
        if (/^(?:honda|hyundai|mazda3|mercedes|mg5|mitsubishi|vinfast)\.webp$/i.test(value)) return `images/${value}`;
        if (/^images\/(?:honda|hyundai|mazda3|mercedes|mg5|mitsubishi|vinfast)\.webp$/i.test(value)) return value;
        return "images/autopro.gif";
    }

    function vehicleOptions(selected = "") {
        return '<option value="">-- Chọn dòng xe --</option>' + currentFleet.map((car) => `<option value="${escapeHTML(car.name)}"${car.name === selected || String(car.id) === selected ? " selected" : ""}>${escapeHTML(car.name)} (${escapeHTML(car.category)})</option>`).join("");
    }

    function addVehiclePicker(selected = "") {
        const rows = document.getElementById("rental-vehicles");
        if (rows.children.length >= 4) return;
        const row = document.createElement("div");
        row.className = "rental-vehicle-row";
        row.innerHTML = `<select class="booking-car-picker" required>${vehicleOptions(selected)}</select><button class="button button-outline remove-vehicle" type="button">Xóa</button>`;
        rows.append(row);
        row.querySelector("select").addEventListener("change", () => { renderCar(selectedCar()); updatePrice(); });
        row.querySelector(".remove-vehicle").addEventListener("click", () => { row.remove(); renderCar(selectedCar()); updatePrice(); });
    }

    function selectedCar() {
        const picker = document.getElementById("booking-car");
        return currentFleet.find((car) => car.name === picker.value) || null;
    }

    function selectedCars() {
        return [...document.querySelectorAll(".booking-car-picker")]
            .map((picker) => currentFleet.find((car) => car.name === picker.value))
            .filter(Boolean);
    }

    function carHasConflict(car, start, end, bookings) {
        const cancelledStatuses = new Set(["đã hủy", "hủy", "hoàn thành", "cancelled", "canceled", "rejected", "completed"]);
        return bookings.some((booking) => {
            if (booking.carId !== car.id && booking.carType !== car.name) return false;
            if (cancelledStatuses.has(String(booking.status || "").trim().toLocaleLowerCase("vi"))) return false;
            const bookingStart = Date.parse(`${booking.pickupDate}T${booking.pickupTime || "00:00"}:00`);
            const bookingEnd = Date.parse(`${booking.returnDate}T${booking.returnTime || "23:59"}:00`);
            return Number.isFinite(bookingStart) && Number.isFinite(bookingEnd) && start < bookingEnd && end > bookingStart;
        });
    }

    function bookingPeriod() {
        const pickupDate = document.getElementById("pickup-date").value;
        const pickupTime = document.getElementById("pickup-time").value;
        const returnDate = document.getElementById("return-date").value;
        const returnTime = document.getElementById("return-time").value;
        if (!pickupDate || !pickupTime || !returnDate || !returnTime) return null;
        const start = Date.parse(`${pickupDate}T${pickupTime}:00`);
        const end = Date.parse(`${returnDate}T${returnTime}:00`);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
        return { start, end, pickupDate, pickupTime, returnDate, returnTime };
    }

    function rentalDays(period) {
        if (!period) return 0;
        return Math.max(1, Math.ceil((period.end - period.start) / (24 * 60 * 60 * 1000)));
    }

    function currentPrice() {
        const cars = selectedCars();
        const car = cars[0] || null;
        const period = bookingPeriod();
        const days = rentalDays(period);
        const dailyPrice = cars.reduce((sum, item) => sum + Number(item.price), 0);
        const delivery = document.querySelector('input[name="delivery"]:checked');
        const deliveryPrice = delivery ? Number(delivery.dataset.price) : 0;
        const account = currentAccount();
        const bookings = readBookings();
        const familiar = Boolean(account && bookings.some((booking) => (booking.accountEmail || booking.email) === account.email));
        const holiday = period && ["1/1", "14/2", "30/4", "1/5", "2/9"].includes(`${String(new Date(period.start).getDate())}/${String(new Date(period.start).getMonth() + 1)}`);
        const maintenanceFee = cars.length && !familiar && !holiday ? dailyPrice * 0.05 : 0;
        const discount = familiar ? dailyPrice * days * 0.05 : 0;
        const rentalSubtotal = dailyPrice * days;
        const total = rentalSubtotal + deliveryPrice + maintenanceFee - discount;
        return {
            car,
            cars,
            period,
            days,
            dailyPrice,
            rentalSubtotal,
            deliveryPrice,
            serviceTotal: 0,
            maintenanceFee,
            discount,
            customerType: familiar ? "quen" : "mới",
            total
        };
    }

    function renderCar(car) {
        const container = document.getElementById("selected-car");
        const summaryName = document.getElementById("summary-car-name");
        if (!car) {
            container.className = "selected-car selected-car--empty";
            container.innerHTML = '<div class="selected-car-placeholder" aria-hidden="true">AP</div><div><strong>Chọn xe để xem thông tin</strong><span>Giá xe được lấy trực tiếp từ danh mục hiện tại.</span></div>';
            summaryName.textContent = "Chưa chọn xe";
            return;
        }
        try {
            const source = escapeHTML(imageSource(car.image));
            const description = [car.category, Number(car.seats) > 0 ? `${car.seats} chỗ` : "", car.transmission].filter(Boolean).join(" · ");
            container.className = "selected-car";
            container.innerHTML = `<img src="${source}" alt="${escapeHTML(car.name)}"><div class="selected-car-copy"><span class="selected-car-brand">${escapeHTML(car.brand)} · ${escapeHTML(car.category)}</span><strong>${escapeHTML(car.name)}</strong><p>${escapeHTML(description)}</p><span class="selected-car-price">${money(car.price)} / ngày</span></div>`;
            summaryName.textContent = car.name;
        } catch (error) {
            showMessage({ type: "error", title: "Không thể hiển thị xe", content: "<p>Ảnh của xe không hợp lệ. Vui lòng liên hệ quản trị viên để cập nhật danh mục.</p>", actions: [{ label: "Đóng", primary: true }] });
        }
    }

    function updatePrice() {
        const price = currentPrice();
        const amountElement = document.getElementById("summary-total");
        const previousAmount = amountElement.textContent;
        document.getElementById("summary-rental").textContent = price.car && price.days ? money(price.rentalSubtotal) : "—";
        document.getElementById("summary-duration-label").textContent = "Thời lượng";
        document.getElementById("summary-days").textContent = price.days ? `${price.days} ngày` : "—";
        document.getElementById("summary-delivery").textContent = money(price.deliveryPrice);
        document.getElementById("summary-services").textContent = money(price.serviceTotal);
        document.getElementById("summary-pickup").textContent = money(price.maintenanceFee);
        document.getElementById("summary-discount").textContent = `−${money(price.discount)}`;
        amountElement.textContent = price.car && price.days ? money(price.total) : "—";
        if (previousAmount !== amountElement.textContent) {
            amountElement.classList.remove("price-updated");
            window.requestAnimationFrame(() => amountElement.classList.add("price-updated"));
            window.setTimeout(() => amountElement.classList.remove("price-updated"), 220);
        }
        document.getElementById("rental-duration").textContent = price.days ? `${price.days} ngày (tối thiểu 1 ngày)` : "Chọn ngày và giờ để tính";
        return price;
    }

    function setDateLimits() {
        const pickupDate = document.getElementById("pickup-date");
        const returnDate = document.getElementById("return-date");
        const today = new Date();
        const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        pickupDate.min = localToday;
        returnDate.min = pickupDate.value || localToday;
    }

    function clearErrors() {
        document.querySelectorAll(".booking-field-error").forEach((error) => { error.textContent = ""; });
        document.querySelectorAll("#booking-form [aria-invalid='true']").forEach((input) => input.removeAttribute("aria-invalid"));
    }

    function setFieldError(inputId, message) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(`${inputId}-error`);
        if (input) input.setAttribute("aria-invalid", "true");
        if (error) error.textContent = message;
    }

    function validateBooking(price) {
        clearErrors();
        const name = document.getElementById("customer-name").value.trim();
        const phone = document.getElementById("customer-phone").value.trim();
        const email = document.getElementById("customer-email").value.trim();
        const address = document.getElementById("pickup-address").value.trim();
        const customerId = document.getElementById("customer-id").value.trim();
        const license = document.getElementById("driver-license").value;
        const pickupDate = document.getElementById("pickup-date").value;
        const pickupTime = document.getElementById("pickup-time").value;
        const returnDate = document.getElementById("return-date").value;
        const returnTime = document.getElementById("return-time").value;
        let firstError = null;
        const mark = (id, message) => {
            setFieldError(id, message);
            firstError ||= document.getElementById(id);
        };

        if (!price.car) {
            mark("booking-car", "Vui lòng chọn xe.");
        }
        if (price.customerType === "mới" && price.cars.length > 1) {
            mark("booking-car", "Khách hàng mới chỉ được thuê 1 xe.");
        }
        if (price.cars.length > 4) {
            mark("booking-car", "Tối đa được thuê 4 xe cùng lúc.");
        }
        if (!name) mark("customer-name", "Vui lòng nhập họ và tên.");
        if (!phone) {
            mark("customer-phone", "Vui lòng nhập số điện thoại.");
        } else if (!/^0[35789]\d{8}$/.test(normalizePhone(phone))) {
            mark("customer-phone", "Số điện thoại Việt Nam chưa hợp lệ.");
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) mark("customer-email", "Địa chỉ email chưa hợp lệ.");
        if (!address) mark("pickup-address", "Vui lòng nhập địa chỉ nhận xe.");
        if (!customerId) mark("customer-id", "Vui lòng nhập CMND.");
        if (!license) mark("driver-license", "Vui lòng chọn bằng lái.");

        const period = price.period;
        if (!pickupDate) mark("pickup-date", "Vui lòng chọn ngày nhận xe.");
        if (!pickupTime) mark("pickup-time", "Vui lòng chọn giờ nhận xe.");
        if (!returnDate) mark("return-date", "Vui lòng chọn ngày trả xe.");
        if (!returnTime) mark("return-time", "Vui lòng chọn giờ trả xe.");
        if (period && period.start < Date.now()) mark("pickup-date", "Thời điểm nhận xe không thể ở trong quá khứ.");
        if (pickupDate && returnDate && pickupTime && returnTime && !period) {
            mark("return-date", "Ngày và giờ trả xe phải sau thời điểm nhận xe.");
        }
        if (price.car && price.days) {
            const isMotorbike = price.car.category === "Xe máy";
            if (isMotorbike && price.days > 10) mark("return-date", "Xe máy chỉ được thuê tối đa 10 ngày.");
            if (!isMotorbike && price.days > 30) mark("return-date", "Ô tô chỉ được thuê tối đa 30 ngày.");
        }
        if (price.car && price.days && (!Number.isFinite(price.total) || price.total <= 0)) {
            mark("booking-car", "Không thể tính tổng tiền. Vui lòng kiểm tra giá xe.");
        }
        if (!document.getElementById("booking-terms").checked && !firstError) {
            showMessage({ type: "info", title: "Vui lòng xác nhận điều khoản", content: "<p>Hãy xác nhận đã đọc và đồng ý với điều khoản thuê xe trước khi tiếp tục.</p>", actions: [{ label: "Đã hiểu", primary: true }] });
            document.getElementById("booking-terms").focus();
            return false;
        }
        if (firstError) {
            const label = firstError.labels && firstError.labels[0] ? firstError.labels[0].textContent.replace("*", "").trim() : "thông tin";
            showMessage({ type: "error", title: "Thông tin chưa hợp lệ", content: `<p>Vui lòng kiểm tra <strong>${escapeHTML(label)}</strong> và hoàn thiện các trường được đánh dấu.</p>`, actions: [{ label: "Kiểm tra lại", primary: true, onClick: () => firstError.focus() }] });
            firstError.focus();
            return false;
        }
        return true;
    }

    function nextBookingId(bookings) {
        const year = new Date().getFullYear();
        const prefix = `AP${year}`;
        const maxSequence = bookings.reduce((max, booking) => {
            const match = String(booking.id || "").match(new RegExp(`^${prefix}(\\d+)$`));
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        return `${prefix}${String(maxSequence + 1).padStart(4, "0")}`;
    }

    function setSubmitting(isSubmitting) {
        busy = isSubmitting;
        const button = document.getElementById("booking-submit");
        button.disabled = isSubmitting;
        button.textContent = isSubmitting ? "Đang gửi đơn…" : "Xác nhận đặt xe";
    }

    function resetVehicleRows() {
        const rows = document.getElementById("rental-vehicles");
        if (!rows) return;
        [...rows.children].slice(1).forEach((row) => row.remove());
    }

    async function submitBooking(event) {
        event.preventDefault();
        const account = currentAccount();
        if (!account) {
            redirectToSignIn();
            return;
        }
        if (busy) return;
        const price = updatePrice();
        if (!validateBooking(price)) return;

        const confirmation = await showMessage({
            title: "Xác nhận thông tin đặt xe",
            content: `<p>Đặt <strong>${escapeHTML(price.car.name)}</strong> trong <strong>${price.days} ngày</strong> với tổng dự kiến <strong>${money(price.total)}</strong>?</p><p>Đơn sẽ được lưu và Auto Pro sẽ liên hệ để xác nhận.</p>`,
            actions: [
                { label: "Quay lại kiểm tra", value: false },
                { label: "Gửi yêu cầu", value: true, primary: true }
            ]
        });
        if (confirmation !== true || busy) return;

        setSubmitting(true);
        try {
            await new Promise((resolve) => window.setTimeout(resolve, 180));
            const period = price.period;
            const bookings = readBookings();
            if (carHasConflict(price.car, period.start, period.end, bookings)) {
                throw new Error("Xe này đã có đơn trong khoảng thời gian bạn chọn. Vui lòng chọn thời gian khác hoặc dòng xe khác.");
            }

            const delivery = document.querySelector('input[name="delivery"]:checked');
            const booking = {
                id: nextBookingId(bookings),
                accountEmail: account.email,
                fullname: document.getElementById("customer-name").value.trim(),
                email: document.getElementById("customer-email").value.trim(),
                phone: normalizePhone(document.getElementById("customer-phone").value),
                customerId: document.getElementById("customer-id").value.trim(),
                driverLicense: document.getElementById("driver-license").value,
                customerType: price.customerType,
                carType: price.car.name,
                carId: price.car.id,
                carBrand: price.car.brand,
                pickupDate: period.pickupDate,
                pickupTime: period.pickupTime,
                returnDate: period.returnDate,
                returnTime: period.returnTime,
                pickupAddress: document.getElementById("pickup-address").value.trim(),
                rentalDays: price.days,
                delivery: delivery ? delivery.value : "Tại cửa hàng Auto Pro",
                selectedServices: [],
                rentalSubtotal: price.rentalSubtotal,
                serviceTotal: price.serviceTotal + price.deliveryPrice,
                maintenanceFee: price.maintenanceFee,
                discount: price.discount,
                total: price.total,
                extras: "",
                note: document.getElementById("booking-note").value.trim(),
                status: "pending",
                createdAt: new Date().toISOString()
            };
            if (window.autoProDB) {
                const created = await window.autoProDB.createBookings({
                    userId: account.userId,
                    fullname: booking.fullname,
                    email: booking.email,
                    phone: booking.phone,
                    customerId: booking.customerId,
                    driverLicense: booking.driverLicense,
                    pickupAddress: booking.pickupAddress,
                    items: price.cars.map((carItem) => ({ carId: carItem.id, pickupDate: booking.pickupDate, pickupTime: booking.pickupTime, returnDate: booking.returnDate, returnTime: booking.returnTime, rentalSubtotal: Number(carItem.price) * price.days, serviceTotal: (price.serviceTotal + price.deliveryPrice) / price.cars.length, maintenanceFee: price.maintenanceFee / price.cars.length, discount: price.discount / price.cars.length, total: (Number(carItem.price) * price.days) + ((price.serviceTotal + price.deliveryPrice) / price.cars.length) + (price.maintenanceFee / price.cars.length) - (price.discount / price.cars.length), note: booking.note }))
                });
                booking.id = created[0].id;
                bookingsCache = await window.autoProDB.bookings();
            } else {
                const updatedBookings = [...bookings, booking];
                window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updatedBookings));
            }
            const verified = readBookings();
            if (!verified.some((saved) => saved.id === booking.id && normalizePhone(saved.phone) === booking.phone)) {
                throw new Error("Không thể xác minh đơn đã lưu. Vui lòng kiểm tra lại trước khi gửi yêu cầu lần nữa.");
            }
            setSubmitting(false);
            form.reset();
            resetVehicleRows();
            renderCar(null);
            setDateLimits();
            updatePrice();
            await showMessage({
                type: "success",
                title: "Đặt xe thành công!",
                content: `<p>Đơn đặt xe của bạn đã được ghi nhận.</p><p>Mã đặt xe: <strong>${escapeHTML(booking.id)}</strong></p><p>Tổng chi phí dự kiến: <strong>${money(booking.total)}</strong></p><p>Chúng tôi sẽ liên hệ với bạn để xác nhận đơn hàng.</p>`,
                actions: [
                    { label: "Tra cứu đơn hàng", primary: true, onClick: () => { window.location.href = `my-bookings.html?code=${encodeURIComponent(booking.id)}`; } },
                    { label: "Đóng" }
                ]
            });
        } catch (error) {
            setSubmitting(false);
            const message = error instanceof Error ? error.message : "Vui lòng thử lại sau.";
            showMessage({ type: "error", title: "Không thể gửi đơn", content: `<p>${escapeHTML(message)}</p>`, actions: [{ label: "Đóng", primary: true }] });
        }
    }

    async function initBooking() {
        if (!form) return;
        const account = currentAccount();
        if (!account) {
            redirectToSignIn();
            return;
        }
        document.getElementById("customer-name").value = account.name;
        document.getElementById("customer-email").value = account.email;
        if (typeof account.phone === "string") {
            document.getElementById("customer-phone").value = account.phone;
        }
        const picker = document.getElementById("booking-car");
        try {
            currentFleet = await loadFleetForBooking();
            try {
                await bookingsReady;
            } catch (error) {
                bookingsCache = [];
                console.error("Không thể tải lịch sử đơn khi khởi tạo form đặt xe:", error);
            }
            const requestedCar = new URLSearchParams(window.location.search).get("car");
            picker.innerHTML = vehicleOptions(requestedCar);
            renderCar(selectedCar());
            updatePrice();
        } catch (error) {
            console.error("Không thể tải đội xe cho form đặt xe:", error);
            picker.innerHTML = '<option value="">Không thể tải danh sách xe</option>';
            const detail = error instanceof Error ? error.message : String(error || "Lỗi không xác định");
            showMessage({ type: "error", title: "Không thể tải danh sách xe", content: `<p>Vui lòng thử tải lại trang.</p><details><summary>Chi tiết kỹ thuật</summary><p>${escapeHTML(detail)}</p></details>`, actions: [{ label: "Tải lại", primary: true, onClick: () => window.location.reload() }, { label: "Đóng" }] });
        }
        setDateLimits();
        picker.addEventListener("change", () => {
            renderCar(selectedCar());
            updatePrice();
        });
        document.getElementById("add-vehicle").addEventListener("click", () => addVehiclePicker());
        ["pickup-date", "pickup-time", "return-date", "return-time"].forEach((id) => {
            document.getElementById(id).addEventListener("change", () => {
                if (id === "pickup-date") setDateLimits();
                updatePrice();
            });
        });
        document.querySelectorAll('input[name="delivery"]').forEach((input) => input.addEventListener("change", updatePrice));
        form.addEventListener("submit", submitBooking);
    }

    function renderLookupResult(booking) {
        lastLookupBooking = booking;
        const result = document.getElementById("lookup-result");
        const serviceNames = Array.isArray(booking.selectedServices) ? booking.selectedServices.join(", ") : "";
        const services = [booking.delivery, serviceNames].filter((value) => value && value !== "Tại cửa hàng Auto Pro").join(", ") || "Không có dịch vụ tính phí";
        const rows = [
            ["Mã đặt xe", booking.id],
            ["Trạng thái", booking.status || "Chờ xác nhận"],
            ["Xe đã đặt", booking.carType || "—"],
            ["Thời gian nhận", `${booking.pickupDate || "—"}${booking.pickupTime ? ` · ${booking.pickupTime}` : ""}`],
            ["Thời gian trả", `${booking.returnDate || "—"}${booking.returnTime ? ` · ${booking.returnTime}` : ""}`],
            ["Địa chỉ nhận xe", booking.pickupAddress || "Theo lịch hẹn với Auto Pro"],
            ["Khách hàng", booking.customerType === "quen" ? "Khách hàng quen" : "Khách hàng mới"],
            ["CMND", booking.customerId || "—"],
            ["Phí bảo dưỡng", money(booking.maintenanceFee || 0)],
            ["Tổng tiền", money(booking.total || 0)],
            ["Dịch vụ đi kèm", services],
            ["Thời lượng thuê", booking.rentalDays ? `${booking.rentalDays} ngày` : "—"],
            ["Tổng chi phí dự kiến", money(booking.total || 0)]
        ];
        document.getElementById("lookup-result-content").innerHTML = rows.map(([label, value], index) =>
            `<div class="lookup-result-item${index === 5 || index === 6 ? " lookup-result-item--full" : ""}"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`
        ).join("");
        document.getElementById("lookup-result-code").textContent = `Mã ${booking.id}`;
        document.getElementById("lookup-result-status").textContent = booking.status || "Chờ xác nhận";
        result.hidden = false;
        const paymentForm = document.getElementById("payment-form");
        if (paymentForm) {
            paymentForm.hidden = !window.autoProDB;
            document.getElementById("payment-amount").value = String(booking.total || 0);
        }
    }

    async function submitLookup(event) {
        event.preventDefault();
        const code = document.getElementById("lookup-code").value.trim().toUpperCase();
        const phone = normalizePhone(document.getElementById("lookup-phone").value);
        const result = document.getElementById("lookup-result");
        result.hidden = true;
        if (!code || !phone) {
            showMessage({ type: "error", title: "Thiếu thông tin tra cứu", content: "<p>Vui lòng nhập cả mã đặt xe và số điện thoại dùng khi đặt xe.</p>", actions: [{ label: "Đã hiểu", primary: true }] });
            return;
        }
        if (!/^0[35789]\d{8}$/.test(phone)) {
            showMessage({ type: "error", title: "Số điện thoại chưa hợp lệ", content: "<p>Vui lòng kiểm tra lại số điện thoại đã dùng khi đặt xe.</p>", actions: [{ label: "Đã hiểu", primary: true }] });
            return;
        }
        try {
            const booking = readBookings().find((item) =>
                String(item.id || "").toUpperCase() === code && normalizePhone(item.phone) === phone
            );
            if (!booking) {
                showMessage({ type: "error", title: "Không tìm thấy đơn hàng", content: "<p>Không có đơn đặt xe khớp với mã và số điện thoại này. Vui lòng kiểm tra lại thông tin.</p>", actions: [{ label: "Thử lại", primary: true }] });
                return;
            }
            renderLookupResult(booking);
            showMessage({ type: "success", title: "Tra cứu đơn thành công", content: "<p>Thông tin đơn hàng đã được xác minh bằng mã đặt xe và số điện thoại.</p>", actions: [{ label: "Xem chi tiết", primary: true, onClick: () => result.scrollIntoView({ behavior: "smooth", block: "start" }) }] });
        } catch (error) {
            showMessage({ type: "error", title: "Lỗi tra cứu đơn", content: "<p>Không thể đọc dữ liệu đặt xe trên trình duyệt này. Vui lòng thử lại sau.</p>", actions: [{ label: "Đóng", primary: true }] });
        }
    }

    function initLookup() {
        if (!lookupForm) return;
        const codeInput = document.getElementById("lookup-code");
        const params = new URLSearchParams(window.location.search);
        if (params.get("code")) codeInput.value = params.get("code");
        lookupForm.addEventListener("submit", submitLookup);
        const paymentForm = document.getElementById("payment-form");
        if (paymentForm) paymentForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const message = document.getElementById("payment-message");
            try {
                const session = JSON.parse(window.sessionStorage.getItem("autoProUserSession") || "null");
                const result = await window.autoProDB.createPayment({ bookingId: lastLookupBooking.id, userId: session && session.userId, amount: document.getElementById("payment-amount").value, method: document.getElementById("payment-method").value });
                message.textContent = `Đã lập phiếu thanh toán ${result.transaction}.`;
                paymentForm.reset();
            } catch (error) {
                message.textContent = error instanceof Error ? error.message : "Không thể lập phiếu thanh toán.";
            }
        });
    }

    bindModal();
    initBooking();
    initLookup();
})();
