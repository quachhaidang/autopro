/**
 * Validation, Form Handling, Booking Management & Filtering Logic for Auto Pro Classic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Electron dùng booking.js/SQLite; không chạy lại logic mock localStorage cũ.
    if (window.autoProDB) return;
    // Helper function for toast notifications
    function triggerToast(message, isSuccess = true) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.borderColor = isSuccess ? 'rgba(212,175,55,.5)' : 'rgba(231,76,60,.5)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4500);
    }

    // Helper functions for loading overlay animations
    function showLoading(text = 'Đang xử lý đặc quyền...') {
        if (typeof window.showLoading === 'function') {
            return window.showLoading(text);
        }
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `<div class="loading-spinner"></div><div class="loading-text" id="loading-message">${text}</div>`;
            document.body.appendChild(overlay);
        } else {
            const msgEl = document.getElementById('loading-message');
            if (msgEl) msgEl.textContent = text;
        }
        overlay.classList.add('show');
    }

    function hideLoading() {
        if (typeof window.hideLoading === 'function') {
            return window.hideLoading();
        }
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    // 1. Main Booking Form Validation & Persistence (Form 1 - booking.html)
    const mainBookingForm = document.getElementById('main-booking-form');
    if (mainBookingForm) {
        const pickupDateInput = document.getElementById('pickup-date-main');
        const returnDateInput = document.getElementById('return-date-main');
        
        if (pickupDateInput && returnDateInput) {
            const today = new Date().toISOString().split('T')[0];
            pickupDateInput.min = today;
            pickupDateInput.value = today;
            
            // Set return date to tomorrow by default
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            returnDateInput.min = today;
            returnDateInput.value = tomorrow.toISOString().split('T')[0];
        }

        mainBookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            const fields = mainBookingForm.querySelectorAll('.field');
            fields.forEach(f => f.classList.remove('error'));

            // Fullname validation (text)
            const fullname = document.getElementById('fullname');
            if (fullname.value.trim() === '') {
                fullname.parentElement.classList.add('error');
                isValid = false;
            }

            // Email validation (email)
            const email = document.getElementById('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                email.parentElement.classList.add('error');
                isValid = false;
            }

            // Phone validation (tel)
            const phone = document.getElementById('phone');
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(phone.value.trim())) {
                phone.parentElement.classList.add('error');
                isValid = false;
            }

            // Password validation (password >= 6)
            const password = document.getElementById('password');
            if (password.value.length < 6) {
                password.parentElement.classList.add('error');
                isValid = false;
            }

            // Age validation (number >= 18)
            const age = document.getElementById('age');
            if (age.value < 18 || age.value === '') {
                age.parentElement.classList.add('error');
                isValid = false;
            }

            // Date validation (pickup date & return date)
            if (pickupDateInput && pickupDateInput.value === '') {
                pickupDateInput.parentElement.classList.add('error');
                isValid = false;
            }
            if (returnDateInput && returnDateInput.value === '') {
                returnDateInput.parentElement.classList.add('error');
                isValid = false;
            }
            if (pickupDateInput && returnDateInput && pickupDateInput.value >= returnDateInput.value) {
                returnDateInput.parentElement.classList.add('error');
                isValid = false;
            }

            // Car type select validation (select)
            const carType = document.getElementById('car-type');
            if (carType.value === '') {
                carType.parentElement.classList.add('error');
                isValid = false;
            }

            // Terms checkbox validation (checkbox)
            const terms = document.getElementById('terms');
            const termsField = terms ? terms.closest('.field') : null;
            if (terms && !terms.checked) {
                if (termsField) termsField.classList.add('error');
                isValid = false;
            } else if (termsField) {
                termsField.classList.remove('error');
            }

            if (isValid) {
                showLoading('Đang xử lý đơn đặt xe của quý khách...');
                
                setTimeout(() => {
                    hideLoading();
                    const orderId = 'AP-' + Math.floor(10000 + Math.random() * 90000);
                    const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
                    const deliveryVal = deliveryRadio ? deliveryRadio.value : 'Tại cửa hàng';
                    
                    const selectedExtras = Array.from(document.querySelectorAll('input[name="extra"]:checked'))
                        .map(cb => cb.value)
                        .join(', ') || 'Không có';

                    const noteVal = document.getElementById('note').value.trim() || 'Không có';

                    const newBooking = {
                        id: orderId,
                        fullname: fullname.value.trim(),
                        email: email.value.trim(),
                        phone: phone.value.trim(),
                        age: age.value,
                        pickupDate: pickupDateInput.value,
                        returnDate: returnDateInput.value,
                        carType: carType.value,
                        delivery: deliveryVal,
                        extras: selectedExtras,
                        note: noteVal,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    };

                    let bookings = JSON.parse(localStorage.getItem('autoProBookings')) || [];
                    bookings.unshift(newBooking);
                    localStorage.setItem('autoProBookings', JSON.stringify(bookings));

                    const successBox = document.createElement('div');
                    successBox.className = 'toast show';
                    successBox.style.background = '#111111';
                    successBox.style.borderColor = 'var(--accent)';
                    successBox.innerHTML = `🎉 <strong>Đặt xe thành công!</strong><br>Mã đơn: <span style="color:var(--accent);">${orderId}</span>.<br><a href="my-bookings.html" style="color:var(--accent);text-decoration:underline;margin-top:5px;display:inline-block;">Xem đơn hàng của bạn ↗</a>`;
                    document.body.appendChild(successBox);

                    setTimeout(() => {
                        mainBookingForm.reset();
                    }, 1000);
                }, 800);
            }
        });
    }

    // 2. Customer Booking Management Logic (my-bookings.html)
    const bookingsGrid = document.getElementById('bookings-grid');
    if (bookingsGrid) {
        if (!localStorage.getItem('autoProBookings')) {
            const defaultBookings = [
                {
                    id: "AP-83920",
                    fullname: "Nguyễn Văn Hoàng",
                    email: "hoang.nguyen@gmail.com",
                    phone: "0909123456",
                    age: 28,
                    pickupDate: "2026-06-10",
                    returnDate: "2026-06-15",
                    carType: "Honda Civic",
                    delivery: "Giao xe tận nơi",
                    extras: "Bảo hiểm toàn diện, Thiết bị phát Wifi 4G",
                    note: "Giao xe lúc 8h sáng.",
                    status: "pending",
                    createdAt: "2026-06-01T10:30:00.000Z"
                },
                {
                    id: "AP-48291",
                    fullname: "Trần Minh Thư",
                    email: "thu.tran@gmail.com",
                    phone: "0912345678",
                    age: 25,
                    pickupDate: "2026-05-15",
                    returnDate: "2026-05-18",
                    carType: "Hyundai Santa Fe",
                    delivery: "Nhận tại cửa hàng",
                    extras: "Ghế trẻ em",
                    note: "Đã cọc 30%.",
                    status: "active",
                    createdAt: "2026-05-10T14:20:00.000Z"
                }
            ];
            localStorage.setItem('autoProBookings', JSON.stringify(defaultBookings));
        }

        let currentStatusFilter = 'all';
        let currentSearchQuery = '';

        const statusLabels = {
            pending: 'Chờ duyệt',
            active: 'Đang thuê',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };

        function renderBookings() {
            showLoading('Đang tải danh sách đơn hàng...');
            setTimeout(() => {
                hideLoading();
                const bookings = JSON.parse(localStorage.getItem('autoProBookings')) || [];
                bookingsGrid.innerHTML = '';

                const filtered = bookings.filter(b => {
                    const matchesStatus = currentStatusFilter === 'all' || b.status === currentStatusFilter;
                    const query = currentSearchQuery.toLowerCase();
                    const matchesSearch = b.id.toLowerCase().includes(query) ||
                                          b.fullname.toLowerCase().includes(query) ||
                                          b.carType.toLowerCase().includes(query);
                    return matchesStatus && matchesSearch;
                });

                const emptyState = document.getElementById('empty-bookings');
                if (filtered.length === 0) {
                    if (emptyState) emptyState.style.display = 'block';
                    return;
                } else {
                    if (emptyState) emptyState.style.display = 'none';
                }

                filtered.forEach(b => {
                    const card = document.createElement('article');
                    card.className = 'booking-card';

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'booking-info';
                    infoDiv.innerHTML = `
                        <span class="booking-code">${b.id}</span>
                        <h3>${b.carType}</h3>
                        <div class="booking-meta">
                            <p>👤 Khách hàng: <strong>${b.fullname}</strong> (${b.phone})</p>
                            <p>📅 Thời gian: ${b.pickupDate} đến ${b.returnDate}</p>
                        </div>
                    `;

                    const statusDiv = document.createElement('div');
                    statusDiv.innerHTML = `<span class="badge ${b.status}">${statusLabels[b.status] || b.status}</span>`;

                    const metaDiv = document.createElement('div');
                    metaDiv.className = 'booking-meta';
                    metaDiv.innerHTML = `
                        <p>🚗 Hình thức: ${b.delivery}</p>
                        <p>🛠 Dịch vụ: ${b.extras}</p>
                    `;

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'booking-actions';

                    const detailBtn = document.createElement('button');
                    detailBtn.className = 'button button-outline';
                    detailBtn.textContent = 'Chi tiết';
                    detailBtn.addEventListener('click', () => showOrderDetails(b));
                    actionsDiv.appendChild(detailBtn);

                    if (b.status === 'pending') {
                        const cancelBtn = document.createElement('button');
                        cancelBtn.className = 'button button-outline';
                        cancelBtn.style.color = '#ff4d4d';
                        cancelBtn.style.borderColor = 'rgba(255,77,77,.3)';
                        cancelBtn.textContent = 'Hủy đơn';
                        cancelBtn.addEventListener('click', () => cancelBooking(b.id));
                        actionsDiv.appendChild(cancelBtn);
                    }

                    card.appendChild(infoDiv);
                    card.appendChild(statusDiv);
                    card.appendChild(metaDiv);
                    card.appendChild(actionsDiv);

                    bookingsGrid.appendChild(card);
                });
            }, 300);
        }

        const searchInput = document.getElementById('order-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearchQuery = e.target.value;
                renderBookings();
            });
        }

        const statusButtons = document.querySelectorAll('.status-btn');
        statusButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                statusButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentStatusFilter = btn.dataset.status;
                renderBookings();
            });
        });

        renderBookings();

        const modal = document.getElementById('order-modal');
        const modalClose = document.getElementById('modal-close');
        const modalBody = document.getElementById('modal-body');

        if (modalClose && modal) {
            modalClose.addEventListener('click', () => modal.classList.remove('show'));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('show');
            });
        }

        window.showOrderDetails = function(b) {
            if (!modalBody || !modal) return;
            modalBody.innerHTML = `
                <div class="detail-row"><span>Mã đơn hàng:</span><strong style="color:var(--accent);">${b.id}</strong></div>
                <div class="detail-row"><span>Họ và tên:</span><span>${b.fullname}</span></div>
                <div class="detail-row"><span>Email:</span><span>${b.email}</span></div>
                <div class="detail-row"><span>Số điện thoại:</span><span>${b.phone}</span></div>
                <div class="detail-row"><span>Độ tuổi:</span><span>${b.age} tuổi</span></div>
                <div class="detail-row"><span>Dòng xe:</span><span>${b.carType}</span></div>
                <div class="detail-row"><span>Thời gian thuê:</span><span>${b.pickupDate} đến ${b.returnDate}</span></div>
                <div class="detail-row"><span>Hình thức nhận:</span><span>${b.delivery}</span></div>
                <div class="detail-row"><span>Dịch vụ kèm theo:</span><span>${b.extras}</span></div>
                <div class="detail-row"><span>Ghi chú:</span><span>${b.note}</span></div>
                <div class="detail-row"><span>Trạng thái:</span><span class="badge ${b.status}">${statusLabels[b.status] || b.status}</span></div>
                <div class="detail-row"><span>Thời gian tạo:</span><span>${new Date(b.createdAt).toLocaleString('vi-VN')}</span></div>
            `;
            modal.classList.add('show');
        };

        window.cancelBooking = function(id) {
            if (confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${id}?`)) {
                showLoading('Đang xử lý hủy đơn...');
                setTimeout(() => {
                    hideLoading();
                    let bookings = JSON.parse(localStorage.getItem('autoProBookings')) || [];
                    bookings = bookings.map(b => {
                        if (b.id === id) {
                            b.status = 'cancelled';
                        }
                        return b;
                    });
                    localStorage.setItem('autoProBookings', JSON.stringify(bookings));
                    renderBookings();
                    triggerToast(`Đã hủy thành công đơn hàng ${id}.`, false);
                }, 400);
            }
        };
    }

    // 3. Contact Form Handling (contact.html)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value;
            showLoading('Đang gửi tin nhắn...');
            setTimeout(() => {
                hideLoading();
                triggerToast(`Cảm ơn ${name}! Tin nhắn của bạn đã được gửi thành công.`);
                contactForm.reset();
            }, 500);
        });
    }

    // 4. Form 2: Search and Filter Handling (products.html) - No page reload
    const searchInput = document.getElementById('search-input');
    const priceFilter = document.getElementById('price-filter');
    const searchBtn = document.getElementById('search-btn');
    const filters = document.querySelectorAll('.filters .filter');

    let currentBrandFilter = 'all';

    function performSearchAndFilter() {
        showLoading('Đang lọc danh sách xe...');
        setTimeout(() => {
            hideLoading();
            const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const priceVal = priceFilter ? priceFilter.value : 'all';
            const cards = document.querySelectorAll('.car-card');
            let foundCount = 0;

            cards.forEach(card => {
                const name = card.dataset.name.toLowerCase();
                const brand = card.dataset.brand;
                const price = parseInt(card.dataset.price || '0', 10);

                // Match keyword
                const matchesKeyword = name.includes(keyword) || brand.toLowerCase().includes(keyword);

                // Match brand filter
                const matchesBrand = currentBrandFilter === 'all' || brand === currentBrandFilter;

                // Match price filter
                let matchesPrice = true;
                if (priceVal === 'under-1m') {
                    matchesPrice = price < 1000000;
                } else if (priceVal === '1m-1.5m') {
                    matchesPrice = price >= 1000000 && price <= 1500000;
                } else if (priceVal === 'above-1.5m') {
                    matchesPrice = price > 1500000;
                }

                if (matchesKeyword && matchesBrand && matchesPrice) {
                    card.style.display = 'block';
                    foundCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.classList.toggle('show', foundCount === 0);
            }
        }, 300);
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearchAndFilter);
    }
    if (searchInput) {
        searchInput.addEventListener('input', performSearchAndFilter);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', performSearchAndFilter);
    }

    if (filters.length > 0) {
        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                currentBrandFilter = btn.dataset.filter;
                performSearchAndFilter();
            });
        });
    }
});
