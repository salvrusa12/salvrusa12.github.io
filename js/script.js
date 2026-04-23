(function() {
    "use strict";

    // ---------- VARIABLES GLOBALES ----------
    let catalogData = { individualTests: [], packages: [] };
    const testMap = new Map();
    let selectedCategory = null;
    let selectedPackageCategory = null;
    let currentSearch = "";
    let currentTab = "individual";

    // Elementos del DOM
    const popup = document.getElementById("testPopup");
    const overlay = document.getElementById("popupOverlay");
    const popupTestName = document.getElementById("popupTestName");
    const popupCatalogId = document.getElementById("popupCatalogId");
    const popupInstructions = document.getElementById("popupInstructions");
    const popupSampleType = document.getElementById("popupSampleType");
    const popupCost = document.getElementById("popupCost");

    const tabs = document.querySelectorAll(".tab-btn");
    const indivDiv = document.getElementById("individualTab");
    const packDiv = document.getElementById("packagesTab");
    const prepDiv = document.getElementById("prepTab");
    const searchInput = document.getElementById("globalSearch");

    // ---------- FUNCIONES AUXILIARES ----------
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
    }

    function formatCost(cost) {
        if (cost === null || cost === undefined) return "Cotizar en caja";
        if (typeof cost === 'number') {
            return '$' + cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return "Cotizar en caja";
    }

    function getPackageCategory(pkg) {
        const name = pkg.name.toLowerCase();
        if (name.includes("check up")) return "Check Up";
        if (name.includes("química sanguínea")) return "Química Sanguínea";
        if (name.includes("electrolitos séricos")) return "Electrolitos";
        if (name.includes("perfil de lípidos")) return "Perfiles Lipídicos";
        if (name.includes("perfil hepático")) return "Perfiles Hepáticos";
        if (name.includes("perfil de hierro")) return "Perfiles de Minerales";
        if (name.includes("perfil tiroideo")) return "Perfiles Tiroideos";
        if (name.includes("perfil ginecológico")) return "Perfiles Hormonales";
        if (name.includes("perfil de andrógenos")) return "Perfiles Hormonales";
        if (name.includes("perfil reumático")) return "Perfiles Reumáticos";
        if (name.includes("perfil control de diabetes")) return "Perfiles Metabólicos";
        if (name.includes("curva de tolerancia")) return "Curvas de Glucosa";
        if (name.includes("enzimas pancreáticas")) return "Enzimas";
        if (name.includes("tiempos de coagulación")) return "Coagulación";
        if (name.includes("preoperatorios")) return "Preoperatorios";
        if (name.includes("anticuerpos anti tiroideos")) return "Autoinmunidad Tiroidea";
        if (name.includes("antidoping")) return "Antidoping";
        if (name.includes("tamiz neonatal")) return "Tamiz Neonatal";
        return "Otros Perfiles";
    }

    function buildTestMap() {
        testMap.clear();
        catalogData.individualTests.forEach(test => {
            const normalized = test.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            testMap.set(normalized, test);
        });
    }

    function getTestDetails(testName) {
        const normalized = testName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (testMap.has(normalized)) return testMap.get(normalized);
        for (let [key, value] of testMap.entries()) {
            if (normalized.includes(key) || key.includes(normalized)) return value;
        }
        return { id: "No disponible", name: testName, sample: "Variable", category: "General", cost: null, instructions: [] };
    }

    function getInstructions(testName) {
        const details = getTestDetails(testName);
        return details.instructions && details.instructions.length
            ? details.instructions
            : ["Seguir las instrucciones proporcionadas por el laboratorio.", "Consultar si requiere ayuno o preparación especial."];
    }

    function getPackageCost(pkg) {
        if (pkg.cost !== null && pkg.cost !== undefined) return pkg.cost;
        return "Cotizar en caja";
    }

    function showPackagePopup(pkg, event) {
        if (event) event.stopPropagation();
        popupTestName.innerText = pkg.name;
        popupCatalogId.innerHTML = pkg.id || "No disponible";
        const packageCost = getPackageCost(pkg);
        popupCost.innerText = formatCost(packageCost);
        
        const descriptionElement = document.getElementById("popupDescription");
        if (descriptionElement) {
            descriptionElement.innerHTML = escapeHtml(pkg.description || "Sin descripción adicional.");
        } else {
            const popupBody = document.querySelector("#testPopup .popup-body");
            if (popupBody && !document.getElementById("popupDescriptionSection")) {
                const descSection = document.createElement("div");
                descSection.className = "popup-section";
                descSection.id = "popupDescriptionSection";
                descSection.innerHTML = `<strong><i class="fas fa-info-circle"></i> Descripción del paquete</strong>
                                          <p id="popupDescription">${escapeHtml(pkg.description || "Sin descripción adicional.")}</p>`;
                const firstSection = popupBody.querySelector(".popup-section");
                if (firstSection) popupBody.insertBefore(descSection, firstSection.nextSibling);
                else popupBody.appendChild(descSection);
            } else if (document.getElementById("popupDescription")) {
                document.getElementById("popupDescription").innerHTML = escapeHtml(pkg.description || "Sin descripción adicional.");
            }
        }
        
        const instructions = pkg.instructions && pkg.instructions.length
            ? pkg.instructions
            : ["Paquete de estudios clínicos.", "Consulte los requisitos de cada prueba incluida."];
        popupInstructions.innerHTML = instructions.map(item => 
            `<li><i class="fas fa-circle" style="font-size:0.4rem; color:var(--secondary); margin-right:8px;"></i> ${escapeHtml(item)}</li>`
        ).join('');
        
        popupSampleType.innerHTML = "Múltiples tipos (según pruebas incluidas)";
        popup.style.display = "block";
        overlay.style.display = "block";
        popup.style.left = "";
        popup.style.top = "";
    }

    function showPopup(testName, x, y) {
        const details = getTestDetails(testName);
        popupTestName.innerText = testName;
        popupCatalogId.innerHTML = details.id || "No disponible";
        popupCost.innerText = formatCost(details.cost);
        const instructions = getInstructions(testName);
        popupInstructions.innerHTML = instructions.map(item => 
            `<li><i class="fas fa-circle" style="font-size:0.4rem; color:var(--secondary); margin-right:8px;"></i> ${item}</li>`
        ).join('');
        popupSampleType.innerHTML = details.sample || "Variable";
        popup.style.display = "block";
        overlay.style.display = "block";
        popup.style.left = "";
        popup.style.top = "";
    }

    function hidePopup() {
        popup.style.display = "none";
        overlay.style.display = "none";
    }

    document.getElementById("closePopupBtn").addEventListener("click", hidePopup);
    overlay.addEventListener("click", hidePopup);

    function clickHandler(e) {
        e.stopPropagation();
        const testName = e.currentTarget.getAttribute('data-testname');
        if (testName) showPopup(testName, e.clientX, e.clientY);
    }

    function attachClickToTestElements() {
        document.querySelectorAll('.study-card, .package-studies-list li').forEach(el => {
            el.removeEventListener('click', clickHandler);
            el.addEventListener('click', clickHandler);
        });
    }

    function buildCategoryFilter() {
        const categoriesSet = new Set();
        catalogData.individualTests.forEach(t => categoriesSet.add(t.category));
        const sortedCategories = Array.from(categoriesSet).sort();
        const container = document.getElementById("categoryFilter");
        let html = `<div class="category-chip todos ${selectedCategory === null ? 'active' : ''}" data-category="">Todos</div>`;
        sortedCategories.forEach(cat => {
            html += `<div class="category-chip ${selectedCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${cat}</div>`;
        });
        container.innerHTML = html;
        document.querySelectorAll('#categoryFilter .category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const cat = chip.getAttribute('data-category');
                selectedCategory = cat === "" ? null : cat;
                buildCategoryFilter();
                renderIndividual(currentSearch);
            });
        });
    }

    function buildPackageCategoryFilter() {
        const categoriesSet = new Set();
        catalogData.packages.forEach(pkg => {
            categoriesSet.add(getPackageCategory(pkg));
        });
        const sortedCategories = Array.from(categoriesSet).sort();
        const container = document.getElementById("packageCategoryFilter");
        if (!container) return;
        let html = `<div class="category-chip todos ${selectedPackageCategory === null ? 'active' : ''}" data-pkg-category="">Todos</div>`;
        sortedCategories.forEach(cat => {
            html += `<div class="category-chip ${selectedPackageCategory === cat ? 'active' : ''}" data-pkg-category="${escapeHtml(cat)}">${cat}</div>`;
        });
        container.innerHTML = html;
        document.querySelectorAll('#packageCategoryFilter .category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const cat = chip.getAttribute('data-pkg-category');
                selectedPackageCategory = cat === "" ? null : cat;
                buildPackageCategoryFilter();
                renderPackages(currentSearch);
            });
        });
    }

    function renderIndividual(search = "") {
        currentSearch = search;
        const container = document.getElementById("individualStudiesContainer");
        const term = search.trim().toLowerCase();
        let filtered = [...catalogData.individualTests];
        if (term) filtered = filtered.filter(t => t.name.toLowerCase().includes(term));
        if (selectedCategory) filtered = filtered.filter(t => t.category === selectedCategory);
        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-result"><i class="fas fa-search-minus"></i> No se encontraron estudios con los filtros actuales.</div>`;
            document.getElementById("statsIndividual").innerHTML = "";
            return;
        }
        const grouped = {};
        filtered.forEach(test => {
            const cat = test.category;
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(test);
        });
        let html = "";
        for (const [cat, tests] of Object.entries(grouped).sort()) {
            html += `<div class="category-section"><div class="category-title">${cat}</div><div class="studies-grid">`;
            tests.forEach(test => {
                let display = test.name;
                if (term) {
                    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
                    display = test.name.replace(regex, `<span class="highlight">$1</span>`);
                }
                html += `<div class="study-card" data-testname="${escapeHtml(test.name)}">
                    <i class="fas fa-vial"></i> 
                    <span>${display}</span>
                    <span class="test-cost">${formatCost(test.cost)}</span>
                </div>`;
            });
            html += `</div></div>`;
        }
        container.innerHTML = html;
        const filterText = selectedCategory ? ` · Categoría: ${selectedCategory}` : "";
        document.getElementById("statsIndividual").innerHTML = `📊 ${filtered.length} estudios individuales disponibles${filterText}.`;
        attachClickToTestElements();
    }

    function renderPackages(search = "") {
        const container = document.getElementById("packagesGridContainer");
        const term = search.trim().toLowerCase();
        let filtered = [...catalogData.packages];
        if (term) {
            filtered = filtered.filter(pkg => 
                pkg.name.toLowerCase().includes(term) || 
                pkg.tests.some(t => t.toLowerCase().includes(term))
            );
        }
        if (selectedPackageCategory) {
            filtered = filtered.filter(pkg => getPackageCategory(pkg) === selectedPackageCategory);
        }
        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-result"><i class="fas fa-search-minus"></i> No se encontraron paquetes con los filtros actuales.</div>`;
            document.getElementById("statsPackages").innerHTML = "";
            return;
        }
        let html = "";
        filtered.forEach(pkg => {
            const packageCost = getPackageCost(pkg);
            html += `
                <div class="package-card" data-package-name="${escapeHtml(pkg.name)}">
                    <div class="package-header">
                        <div class="package-name">
                            <i class="fas fa-cube"></i> ${pkg.name}
                        </div>
                        <div class="package-badge"><i class="fas fa-list-ul"></i> ${pkg.tests.length} pruebas</div>
                    </div>
                    <div class="package-studies-list">
                        <ul>${pkg.tests.map(t => `<li><i class="fas fa-check-circle"></i> ${t}</li>`).join('')}</ul>
                    </div>
                    <div class="package-cost">${formatCost(packageCost)}</div>
                    <div class="package-footer-note"><i class="fas fa-clock"></i> Requiere preparación según cada prueba individual.</div>
                </div>
            `;
        });
        container.innerHTML = html;
        document.getElementById("statsPackages").innerHTML = `📦 ${filtered.length} paquetes disponibles.${selectedPackageCategory ? ` · Categoría: ${selectedPackageCategory}` : ''}`;
    }

    function renderInstructions() {
        const container = document.getElementById("instructionsDynamic");
        const items = [
            { title: "🔬 QUÍMICA SANGUÍNEA & LÍPIDOS", tips: ["Ayuno 8-12h.", "No alcohol 24h antes.", "Muestra matutina preferente."] },
            { title: "🩸 HORMONAS", tips: ["Ayuno 8h (cuando aplica).", "Muestra entre 7-9 am.", "Evitar estrés físico."] },
            { title: "🧪 EXÁMEN DE ORINA", tips: ["Primera orina de la mañana.", "Aseo genital, chorro medio.", "Entregar en <1 hora."] },
            { title: "🦠 HECES & PARASITOLÓGICOS", tips: ["Muestra fresca, tamaño nuez.", "No mezclar con orina.", "Evitar laxantes 72h antes."] },
            { title: "🩸 COAGULACIÓN", tips: ["No requiere ayuno.", "Informar uso de anticoagulantes."] }
        ];
        let html = "";
        items.forEach(i => {
            html += `<div class="instru-card"><div class="instru-title"><i class="fas fa-notes-medical"></i> ${i.title}</div>
                     <div class="instru-body"><ul>${i.tips.map(t => `<li><i class="fas fa-circle" style="font-size:0.5rem; color:var(--secondary);"></i> ${t}</li>`).join('')}</ul></div></div>`;
        });
        html += `<div class="instru-card"><div class="instru-title"><i class="fas fa-shield-alt"></i> Normas generales</div>
                 <div class="instru-body"><ul><li>Presentar identificación oficial.</li><li>Informar medicamentos, embarazo o enfermedades.</li><li>Ropa cómoda para la toma de muestra.</li></ul></div></div>`;
        container.innerHTML = html;
    }

    function switchTab(tab) {
        indivDiv.classList.remove("active");
        packDiv.classList.remove("active");
        prepDiv.classList.remove("active");
        if (tab === "individual") indivDiv.classList.add("active");
        else if (tab === "packages") packDiv.classList.add("active");
        else prepDiv.classList.add("active");
        tabs.forEach(btn => {
            if (btn.getAttribute("data-tab") === tab) btn.classList.add("active");
            else btn.classList.remove("active");
        });
        currentTab = tab;
        if (tab === "individual") {
            buildCategoryFilter();
            renderIndividual(currentSearch);
        } else if (tab === "packages") {
            buildPackageCategoryFilter();
            renderPackages(currentSearch);
        } else {
            renderInstructions();
        }
    }

    tabs.forEach(btn => btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab"))));

    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value;
            if (currentTab === "individual") renderIndividual(currentSearch);
            else if (currentTab === "packages") renderPackages(currentSearch);
        }, 250);
    });

    async function loadCatalog() {
        try {
            const response = await fetch('js/catalog.json');
            catalogData = await response.json();
            buildTestMap();
            buildCategoryFilter();
            buildPackageCategoryFilter();
            renderIndividual("");
            renderPackages("");
            renderInstructions();
            switchTab("packages");
        } catch (error) {
            console.error("Error cargando catálogo:", error);
            document.getElementById("individualStudiesContainer").innerHTML = `<div class="no-result">Error al cargar el catálogo. Por favor recargue la página.</div>`;
        }
    }

    loadCatalog();

    const packagesContainer = document.getElementById("packagesGridContainer");
    if (packagesContainer) {
        packagesContainer.addEventListener('click', (e) => {
            const packageCard = e.target.closest('.package-card');
            if (packageCard) {
                const packageName = packageCard.getAttribute('data-package-name');
                if (packageName) {
                    const pkg = catalogData.packages.find(p => p.name === packageName);
                    if (pkg) showPackagePopup(pkg, e);
                }
            }
        });
    }

    // ---------- BOTÓN VOLVER ARRIBA ----------
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
})();