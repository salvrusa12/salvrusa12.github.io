(function() {
    "use strict";

    // ---------- VARIABLES GLOBALES ----------
    let catalogData = { individualTests: [], packages: [] };
    const testMap = new Map();
    let selectedCategory = null;
    let selectedPackageCategory = null;
    let currentSearch = "";
    let currentTab = "individual";
    let currentModalFilter = 'individual';

    // Carrito de estudios seleccionados para la cita
    let selectedTests = []; // array de nombres de estudios

    // NUEVO: Mapa para almacenar detalles (ID, costo, tipo) de cada estudio/paquete por nombre
    let studyDetailsMap = new Map();

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
    const appointmentDiv = document.getElementById("appointmentTab");
    const searchInput = document.getElementById("globalSearch");

    function updateTotalDisplay() {
        const totalElement = document.getElementById("totalCostDisplay");
        if (totalElement) {
            const total = calculateTotalCost();
            totalElement.innerText = formatCost(total);
        }
    }

    // ---------- FUNCIONES AUXILIARES ----------
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
    }

    function formatCost(cost) {
        if (cost === null || cost === undefined) return "Cotizar en caja";
        if (typeof cost === 'number') {
            return '$' + cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return "Cotizar en caja";
    }

    // NUEVA: Obtener detalles (id, costo, tipo) por nombre
    function getStudyDetails(studyName) {
        if (studyDetailsMap.has(studyName)) {
            return studyDetailsMap.get(studyName);
        }
        // Fallback
        return { id: "N/D", cost: null, type: 'unknown' };
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

    // Construye el mapa de detalles (ID, costo, tipo)
    function buildStudyDetailsMap() {
        studyDetailsMap.clear();
        if (catalogData.individualTests) {
            catalogData.individualTests.forEach(test => {
                studyDetailsMap.set(test.name, {
                    id: test.id || "N/D",
                    cost: test.cost,
                    type: 'individual'
                });
            });
        }
        if (catalogData.packages) {
            catalogData.packages.forEach(pkg => {
                studyDetailsMap.set(pkg.name, {
                    id: pkg.id || "N/D",
                    cost: pkg.cost,
                    type: 'package'
                });
            });
        }
    }

    function getTestDetails(testName) {
        const normalized = testName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (testMap.has(normalized)) return testMap.get(normalized);
        for (let [key, value] of testMap.entries()) {
            if (normalized.includes(key) || key.includes(normalized)) return value;
        }
        return { id: "No disponible", name: testName, sample: "Variable", category: "General", cost: null, instructions: [], description: "Sin descripción disponible." };
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

    function ensureDescriptionSection() {
        let descSection = document.getElementById("popupDescriptionSection");
        if (!descSection) {
            const popupBody = document.querySelector("#testPopup .popup-body");
            if (popupBody) {
                descSection = document.createElement("div");
                descSection.className = "popup-section";
                descSection.id = "popupDescriptionSection";
                descSection.innerHTML = `<strong id="popupDescriptionTitle"><i class="fas fa-info-circle"></i> Descripción</strong>
                                         <p id="popupDescription"></p>`;
                const firstSection = popupBody.querySelector(".popup-section");
                if (firstSection) {
                    popupBody.insertBefore(descSection, firstSection.nextSibling);
                } else {
                    popupBody.appendChild(descSection);
                }
            }
        }
        return descSection;
    }

    function showPackagePopup(pkg, event) {
        if (event) event.stopPropagation();
        popupTestName.innerText = pkg.name;
        popupCatalogId.innerHTML = pkg.id || "No disponible";
        const packageCost = getPackageCost(pkg);
        popupCost.innerText = formatCost(packageCost);
        
        ensureDescriptionSection();
        const descriptionTitle = document.getElementById("popupDescriptionTitle");
        const descriptionElement = document.getElementById("popupDescription");
        if (descriptionTitle) descriptionTitle.innerHTML = '<i class="fas fa-info-circle"></i> Descripción del paquete';
        if (descriptionElement) descriptionElement.innerHTML = escapeHtml(pkg.description || "Sin descripción adicional.");
        
        const instructions = pkg.instructions && pkg.instructions.length
            ? pkg.instructions
            : ["Paquete de estudios clínicos.", "Consulte los requisitos de cada prueba incluida."];
        popupInstructions.innerHTML = instructions.map(item => 
            `<li><i class="fas fa-circle" style="font-size:0.4rem; color:var(--secondary); margin-right:8px;"></i> ${escapeHtml(item)}</li>`
        ).join('');
        popupSampleType.innerHTML = pkg.sample || "Variable según pruebas incluidas";
        
        popup.style.display = "block";
        overlay.style.display = "block";
    }

    function showPopup(testName, x, y) {
        const details = getTestDetails(testName);
        popupTestName.innerText = testName;
        popupCatalogId.innerHTML = details.id || "No disponible";
        popupCost.innerText = formatCost(details.cost);
        
        ensureDescriptionSection();
        const descriptionTitle = document.getElementById("popupDescriptionTitle");
        const descriptionElement = document.getElementById("popupDescription");
        if (descriptionTitle) descriptionTitle.innerHTML = '<i class="fas fa-info-circle"></i> Descripción del estudio';
        if (descriptionElement) descriptionElement.innerHTML = escapeHtml(details.description || "Sin descripción disponible.");
        
        const instructions = getInstructions(testName);
        popupInstructions.innerHTML = instructions.map(item => 
            `<li><i class="fas fa-circle" style="font-size:0.4rem; color:var(--secondary); margin-right:8px;"></i> ${escapeHtml(item)}</li>`
        ).join('');
        popupSampleType.innerHTML = details.sample || "Variable";
        
        popup.style.display = "block";
        overlay.style.display = "block";
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

    function getStudyCost(studyName) {
        const details = getStudyDetails(studyName);
        return details.cost;
    }

    function calculateTotalCost() {
        let total = 0;
        selectedTests.forEach(studyName => {
            const cost = getStudyCost(studyName);
            if (typeof cost === 'number') {
                total += cost;
            }
        });
        return total;
    }

    // ---------- CATEGORY FILTERS ----------
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

    // ---------- RENDER INDIVIDUAL & PACKAGES ----------
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
                            <i class="fa-solid fa-vials"></i> ${pkg.name}
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
        attachClickToTestElements();
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

    // ---------- FORMULARIO Y CARRITO ----------
    function renderSelectedTestsList() {
        const container = document.getElementById("selectedTestsList");
        if (!container) return;

        if (selectedTests.length === 0) {
            container.innerHTML = '<div class="empty-selected">No hay estudios seleccionados. Use el botón "Agregar estudios" para elegir.</div>';
            updateTotalDisplay();
            return;
        }

        let html = '';
        selectedTests.forEach((test, index) => {
            html += `<div class="selected-test-item">
                        <span><i class="fas fa-flask"></i> ${escapeHtml(test)}</span>
                        <button class="remove-test" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                    </div>`;
        });
        container.innerHTML = html;

        document.querySelectorAll('.remove-test').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                if (!isNaN(idx)) {
                    selectedTests.splice(idx, 1);
                    renderSelectedTestsList();
                }
            });
        });

        updateTotalDisplay();
    }

    // Modal de selección de estudios
    const studySelectorModal = document.getElementById("studySelectorModal");
    const openStudySelectorBtn = document.getElementById("openStudySelectorBtn");
    const closeModalBtns = [document.getElementById("closeModalBtn"), document.getElementById("closeModalFooterBtn")];
    const modalSearchInput = document.getElementById("modalSearchInput");
    const modalResultsList = document.getElementById("modalResultsList");

    function openModal() {
        studySelectorModal.style.display = "flex";
        modalSearchInput.value = "";
        currentModalFilter = 'individual';
        const filterBtns = document.querySelectorAll('.modal-filter-btn');
        filterBtns.forEach(btn => {
            if (btn.getAttribute('data-filter-type') === 'individual') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        renderModalResults("");
    }

    function closeModal() {
        studySelectorModal.style.display = "none";
    }

    function renderModalResults(searchTerm) {
        if (!modalResultsList) return;
        const term = searchTerm.trim().toLowerCase();

        let items = [];
        if (currentModalFilter === 'individual') {
            items = catalogData.individualTests.map(test => ({ type: 'individual', name: test.name }));
        } else {
            items = catalogData.packages.map(pkg => ({ type: 'package', name: pkg.name }));
        }

        if (term) {
            items = items.filter(item => item.name.toLowerCase().includes(term));
        }
        items.sort((a, b) => a.name.localeCompare(b.name));

        if (items.length === 0) {
            modalResultsList.innerHTML = '<div class="no-result">No se encontraron estudios</div>';
            return;
        }

        let html = '';
        items.forEach(item => {
            const alreadySelected = selectedTests.includes(item.name);
            html += `<div class="modal-study-item">
                        <span class="modal-study-name">${escapeHtml(item.name)}</span>
                        <button class="btn-add-modal" data-name="${escapeHtml(item.name)}" ${alreadySelected ? 'disabled style="opacity:0.5;"' : ''}>
                            ${alreadySelected ? '✓ Agregado' : '+ Agregar'}
                        </button>
                    </div>`;
        });
        modalResultsList.innerHTML = html;

        document.querySelectorAll('.btn-add-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const testName = btn.getAttribute('data-name');
                if (testName && !selectedTests.includes(testName)) {
                    selectedTests.push(testName);
                    renderSelectedTestsList();
                    renderModalResults(modalSearchInput.value);
                }
            });
        });
    }

    if (openStudySelectorBtn) {
        openStudySelectorBtn.addEventListener('click', openModal);
    }
    closeModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', closeModal);
    });
    if (modalSearchInput) {
        modalSearchInput.addEventListener('input', (e) => {
            renderModalResults(e.target.value);
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === studySelectorModal) closeModal();
    });

    const filterBtns = document.querySelectorAll('.modal-filter-btn');
    if (filterBtns.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filterValue = btn.getAttribute('data-filter-type');
                if (filterValue === 'individual' || filterValue === 'package') {
                    currentModalFilter = filterValue;
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderModalResults(modalSearchInput.value);
                }
            });
        });
    }

    // ---------- ENVÍO DE FORMULARIO CON EMAILJS (INCLUYE ID) ----------
    const appointmentForm = document.getElementById("appointmentForm");
    const formMessage = document.getElementById("formMessage");

    const serviceID = 'service_n899ono';   // Ajusta si es necesario
    const templateID = 'template_25vn2ml'; // Ajusta si es necesario

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let nombreRaw = document.getElementById("patientName").value.trim();
            let telefonoRaw = document.getElementById("patientPhone").value.trim();
            let correoRaw = document.getElementById("patientEmail").value.trim();
            let fechaPref = document.getElementById("preferredDate").value;
            let horaPref = document.getElementById("preferredTime").value;
            let comentarioRaw = document.getElementById("patientComments").value;

            const limpiar = (str) => (str || "").replace(/[\n\r\t]+/g, ' ').trim();
            const nombre = limpiar(nombreRaw) || "No especificado";
            const telefono = limpiar(telefonoRaw) || "No especificado";
            const correo = limpiar(correoRaw) || "No especificado";
            const comentario = limpiar(comentarioRaw) || "Sin comentarios adicionales";

            if (!nombre || nombre === "No especificado" || !telefono || telefono === "No especificado" || !correo || correo === "No especificado") {
                formMessage.innerHTML = '<div class="form-message error">Por favor complete todos los campos obligatorios (*).</div>';
                return;
            }
            if (selectedTests.length === 0) {
                formMessage.innerHTML = '<div class="form-message error">Debe seleccionar al menos un estudio.</div>';
                return;
            }

            // --- IMPORTANTE: Ahora incluimos el ID de cada estudio ---
            const estudiosConPrecio = selectedTests.map((nombreEstudio, idx) => {
                const details = getStudyDetails(nombreEstudio);
                const id = details.id && details.id !== "N/D" ? details.id : "Sin ID";
                const costo = details.cost;
                const costoFormateado = formatCost(costo);
                return `${idx+1}. [ID: ${id}] ${nombreEstudio} - ${costoFormateado}`;
            }).join('\n');

            const horaClean = horaPref ? horaPref : "";
            const totalCotizacion = formatCost(calculateTotalCost());

            const templateParams = {
                nombre: nombre,
                telefono: telefono,
                correo: correo,
                estudios: estudiosConPrecio,
                comentario: comentario,
                fecha: fechaPref || "No especificada",
                hora: horaClean,
                total: totalCotizacion
            };

            const submitBtn = document.getElementById("sendRequestBtn");
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
            submitBtn.disabled = true;

            try {
                const response = await emailjs.send(serviceID, templateID, templateParams);
                if (response.status === 200) {
                    formMessage.innerHTML = '<div class="form-message success"><i class="fas fa-check-circle"></i> Solicitud enviada correctamente. En breve nos pondremos en contacto.</div>';
                    appointmentForm.reset();
                    selectedTests = [];
                    renderSelectedTestsList();
                } else {
                    throw new Error('Error en el envío');
                }
            } catch (error) {
                console.error('EmailJS error:', error);
                formMessage.innerHTML = '<div class="form-message error"><i class="fas fa-exclamation-triangle"></i> Ocurrió un error al enviar. Por favor intente más tarde o contacte directamente por teléfono.</div>';
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ---------- SWITCH TABS ----------
    function switchTab(tab) {
        indivDiv.classList.remove("active");
        packDiv.classList.remove("active");
        prepDiv.classList.remove("active");
        if (appointmentDiv) appointmentDiv.classList.remove("active");
        if (tab === "individual") indivDiv.classList.add("active");
        else if (tab === "packages") packDiv.classList.add("active");
        else if (tab === "prep") prepDiv.classList.add("active");
        else if (tab === "appointment" && appointmentDiv) appointmentDiv.classList.add("active");
        
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
        } else if (tab === "prep") {
            renderInstructions();
        } else if (tab === "appointment") {
            renderSelectedTestsList();
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
            buildStudyDetailsMap();   // Llena el mapa de IDs
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

    document.addEventListener('DOMContentLoaded', function() {
        const backToTopBtn = document.getElementById('backToTopBtn');
        if (backToTopBtn) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 400) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            });
            backToTopBtn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    });
})();