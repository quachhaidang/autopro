(() => {
    const storageKey = "autoProFleet";
    let fleetCache = null;
    const defaultFleet = [
        { id: "honda-civic", brand: "Honda", name: "Honda Civic", category: "Xe 5 chỗ", year: "", owner: "", license: "", price: 1200000, image: "honda.webp", featured: true },
        { id: "hyundai-santa-fe", brand: "Hyundai", name: "Hyundai Santa Fe", category: "Xe 7 chỗ", year: "", owner: "", license: "", price: 1800000, image: "hyundai.webp", featured: true },
        { id: "mazda-3", brand: "Mazda", name: "Mazda 3", category: "Xe 5 chỗ", year: "", owner: "", license: "", price: 1100000, image: "mazda3.webp", featured: false },
        { id: "mercedes-c-class", brand: "Mercedes-Benz", name: "Mercedes-Benz C-Class", category: "Xe 5 chỗ", year: "", owner: "", license: "", price: 2800000, image: "mercedes.webp", featured: true },
        { id: "mg5", brand: "MG", name: "MG5", category: "Xe 5 chỗ", year: "", owner: "", license: "", price: 850000, image: "mg5.webp", featured: false },
        { id: "mitsubishi-xpander", brand: "Mitsubishi", name: "Mitsubishi Xpander", category: "Xe 7 chỗ", year: "", owner: "", license: "", price: 950000, image: "mitsubishi.webp", featured: false },
        { id: "vinfast-vf-8", brand: "VinFast", name: "VinFast VF 8", category: "Xe 5 chỗ", year: "", owner: "", license: "", price: 1600000, image: "vinfast.webp", featured: false }
    ];

    function load() {
        if (window.autoProDB) {
            if (!fleetCache) throw new Error("Dữ liệu SQLite chưa sẵn sàng.");
            return fleetCache.map((car) => ({ ...car }));
        }
        const stored = window.localStorage.getItem(storageKey);
        if (stored === null) {
            save(defaultFleet);
            return defaultFleet.map((car) => ({ ...car }));
        }

        const fleet = JSON.parse(stored);
        if (!Array.isArray(fleet)) {
            throw new Error("Dữ liệu danh sách xe không hợp lệ.");
        }
        return fleet;
    }

    const ready = window.autoProDB
        ? window.autoProDB.fleet().then((fleet) => { fleetCache = fleet; return fleet; })
        : Promise.resolve(load());

    function save(fleet) {
        if (window.autoProDB) throw new Error("Dữ liệu xe được quản lý trong SQLite.");
        window.localStorage.setItem(storageKey, JSON.stringify(fleet));
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function imageSource(image) {
        const value = String(image || "");
        if (!value) return "";
        if (/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(value)) return value;
        if (/^[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g|gif)$/i.test(value)) return `images/${value}`;
        if (/^images\/[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g|gif)$/i.test(value)) return value;
        return "images/autopro.gif";
    }

    function renderCard(car) {
        const name = escapeHTML(car.name);
        const brand = escapeHTML(car.brand);
        const category = escapeHTML(car.category);
        const tag = escapeHTML(car.tag || category);
        const image = escapeHTML(imageSource(car.image));
        const price = Number(car.price).toLocaleString("vi-VN");
        const href = `booking.html?car=${encodeURIComponent(car.name)}`;

        return `<article class="car-card" data-brand="${brand}" data-name="${name}" data-price="${Number(car.price)}">
            <div class="car-image"><img src="${image}" alt="${name}" loading="lazy"><span class="car-tag">${tag}</span></div>
            <div class="car-body">
                <div class="car-make"><span>${brand.toUpperCase()} · ${category.toUpperCase()}</span></div>
                <h3>${name}</h3>
                <div class="car-specs"><span>${escapeHTML(car.year || "—")}</span><span>${escapeHTML(car.license || "—")}</span></div>
                <div class="car-bottom"><div class="price">${price}đ <small>/ ngày</small></div><a href="${href}" class="button">Thuê ngay</a></div>
            </div>
        </article>`;
    }

    function renderBM3Row(car, index) {
        return `<tr><td>${index + 1}</td><td>${escapeHTML(car.name)}</td><td>${Number(car.price).toLocaleString("vi-VN")}đ</td><td>${escapeHTML(car.category)}</td><td>${escapeHTML(car.brand)}</td><td>${escapeHTML(car.license || "—")}</td></tr>`;
    }

    function renderFilters(fleet) {
        const filterGroup = document.getElementById("brand-filters");
        if (!filterGroup) return;

        const brands = [...new Set(fleet.map((car) => car.brand))];
        filterGroup.innerHTML = [
            '<button class="filter selected" type="button" data-filter="all">Tất cả hãng</button>',
            ...brands.map((brand) => `<button class="filter" type="button" data-filter="${escapeHTML(brand)}">${escapeHTML(brand)}</button>`)
        ].join("");
    }

    function applyCollectionFilter() {
        const productGrid = document.getElementById("car-grid");
        if (!productGrid) return;
        const search = String(document.getElementById("fleet-search")?.value || "").trim().toLocaleLowerCase("vi");
        const selected = document.querySelector("#brand-filters .filter.selected")?.dataset.filter || "all";
        const cards = [...productGrid.querySelectorAll(".car-card")];
        let visible = 0;
        cards.forEach((card) => {
            const matchesBrand = selected === "all" || card.dataset.brand === selected;
            const haystack = `${card.dataset.name || ""} ${card.dataset.brand || ""}`.toLocaleLowerCase("vi");
            const matchesSearch = !search || haystack.includes(search);
            const visibleCard = matchesBrand && matchesSearch;
            card.hidden = !visibleCard;
            if (visibleCard) visible += 1;
        });
        const emptyState = document.getElementById("empty-state");
        if (emptyState) emptyState.classList.toggle("show", visible === 0);
    }

    function bindCollectionControls() {
        const filterGroup = document.getElementById("brand-filters");
        const search = document.getElementById("fleet-search");
        if (filterGroup && !filterGroup.dataset.bound) {
            filterGroup.dataset.bound = "true";
            filterGroup.addEventListener("click", (event) => {
                const button = event.target.closest("button[data-filter]");
                if (!button) return;
                filterGroup.querySelectorAll(".filter").forEach((item) => item.classList.toggle("selected", item === button));
                applyCollectionFilter();
            });
        }
        if (search && !search.dataset.bound) {
            search.dataset.bound = "true";
            search.addEventListener("input", applyCollectionFilter);
        }
        applyCollectionFilter();
    }

    function renderFleet() {
        const fleet = load();
        const productGrid = document.getElementById("car-grid");
        if (productGrid) {
            productGrid.innerHTML = fleet.map(renderCard).join("");
            renderFilters(fleet);
            bindCollectionControls();
            const emptyState = document.getElementById("empty-state");
            if (emptyState) emptyState.classList.toggle("show", fleet.length === 0);
        }

        const bm3Body = document.getElementById("bm3-body");
        if (bm3Body) bm3Body.innerHTML = fleet.map(renderBM3Row).join("");

        const featuredGrid = document.getElementById("featured-cars");
        if (featuredGrid) {
            const featured = fleet.filter((car) => car.featured).slice(0, 3);
            const visibleCars = featured.length ? featured : fleet.slice(0, 3);
            featuredGrid.innerHTML = visibleCars.map(renderCard).join("");
        }

        const carType = document.getElementById("car-type");
        if (carType) {
            const selectedValue = new URLSearchParams(window.location.search).get("car");
            carType.innerHTML = '<option value="">-- Chọn dòng xe --</option>' +
                fleet.map((car) => {
                    const name = escapeHTML(car.name);
                    return `<option value="${name}"${car.name === selectedValue ? " selected" : ""}>${name} (${escapeHTML(car.category)})</option>`;
                }).join("");
        }
    }

    async function refreshCache() {
        if (window.autoProDB) {
            fleetCache = await window.autoProDB.fleet();
        }
    }

    window.AutoProFleet = { storageKey, defaultFleet, load, save, renderFleet, ready, refreshCache };

    ready.then(() => renderFleet()).catch((error) => console.error("Không thể tải danh sách xe:", error));
})();
