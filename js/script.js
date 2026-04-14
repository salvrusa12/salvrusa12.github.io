(function() {
    "use strict";

    // ---------- MAPA DE PRUEBAS Y FUNCIONES AUXILIARES ----------
    const testMap = new Map();
    individualTests.forEach(test => {
        const normalized = test.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        testMap.set(normalized, test);
    });

    function getTestDetails(testName) {
        const normalized = testName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (testMap.has(normalized)) {
            return testMap.get(normalized);
        }
        for (let [key, value] of testMap.entries()) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return value;
            }
        }
        return { id: "No disponible", name: testName, sample: "Variable", category: "General" };
    }

    function getInstructions(testName) {
        const lower = testName.toLowerCase();
        if (lower.includes("glucosa") && !lower.includes("glicosilada") && !lower.includes("curva")) return ["Ayuno de 8 a 12 horas.", "No consumir alcohol 24 horas antes.", "Solo agua permitida durante el ayuno.", "Tomar muestra preferentemente entre 7:00 y 9:00 AM."];
        if (lower.includes("glucosa") && (lower.includes("basal") || lower.includes("1h") || lower.includes("2 h") || lower.includes("3 h"))) return ["Ayuno de 8 a 12 horas para la muestra basal.", "Las muestras posteriores se toman después de la carga de glucosa.", "Permanecer en el laboratorio durante todo el procedimiento."];
        if (lower.includes("hemoglobina glicosilada")) return ["No requiere ayuno.", "Se puede realizar a cualquier hora del día."];
        if (lower.includes("colesterol") || lower.includes("triglicéridos") || lower.includes("lipidos")) return ["Ayuno estricto de 12 horas.", "No consumir alimentos grasos ni alcohol 24 horas antes.", "Solo agua simple durante el ayuno."];
        if (lower.includes("tsh") || lower.includes("t3") || lower.includes("t4")) return ["No requiere ayuno en la mayoría de casos.", "Tomar la muestra antes de la dosis diaria de medicamento tiroideo.", "Preferentemente en horario matutino."];
        if (lower.includes("biometría") || lower.includes("hemática")) return ["No requiere ayuno.", "Acudir bien hidratado.", "Informar si ha tenido infecciones, sangrados o transfusiones recientes."];
        if (lower.includes("orina") && !lower.includes("cultivo")) return ["Recolectar la primera orina de la mañana.", "Realizar aseo genital previo.", "Recolectar el chorro medio en frasco estéril.", "Entregar en el laboratorio en menos de 1 hora."];
        if (lower.includes("urocultivo")) return ["Recolectar la primera orina de la mañana con aseo genital.", "Chorro medio en frasco estéril.", "No haber tomado antibióticos 48 horas antes (salvo indicación médica)."];
        if (lower.includes("heces") || lower.includes("coproparasitoscópico") || lower.includes("coprológico")) return ["Recolectar una muestra de evacuación reciente.", "No mezclar con orina ni agua.", "Evitar laxantes, antibióticos y antiparasitarios 72 horas antes.", "Entregar en frasco estéril en menos de 2 horas."];
        if (lower.includes("sangre oculta")) return ["Evitar carnes rojas, antiinflamatorios y suplementos de hierro 72 horas antes.", "Recolectar muestra de evacuación en frasco limpio."];
        if (lower.includes("psa")) return ["Ayuno de 4 horas.", "Evitar eyaculación 48 horas previas.", "No realizar biopsia prostática reciente (esperar 6 semanas)."];
        if (lower.includes("ferritina") || lower.includes("hierro") || lower.includes("tibc")) return ["Ayuno de 8 horas.", "Evitar suplementos de hierro 48 horas antes.", "Muestra matutina preferente."];
        if (lower.includes("troponina") || lower.includes("cpk") || lower.includes("ck-mb")) return ["No requiere ayuno.", "Realizar ante sospecha de daño miocárdico.", "Informar si ha realizado ejercicio intenso reciente."];
        if (lower.includes("prolactina")) return ["Ayuno de 8 horas.", "Evitar ejercicio, estrés y estimulación mamaria 24 horas antes.", "Tomar muestra entre 7:00 y 9:00 AM."];
        if (lower.includes("cortisol")) return ["Ayuno de 8 horas.", "Tomar muestra entre 7:00 y 9:00 AM (ritmo circadiano).", "Evitar estrés físico y emocional previo."];
        if (lower.includes("insulina") || lower.includes("homa")) return ["Ayuno de 8 a 12 horas.", "No fumar ni hacer ejercicio antes de la toma."];
        if (lower.includes("exudado faríngeo")) return ["No comer ni beber 2 horas antes.", "No usar enjuagues bucales el día del estudio."];
        if (lower.includes("exudado vaginal")) return ["No usar óvulos, duchas vaginales ni tener relaciones sexuales 48 horas antes.", "Evitar el periodo menstrual."];
        if (lower.includes("exudado uretral")) return ["No orinar 2 horas antes de la toma.", "Evitar antibióticos antes del estudio."];
        if (lower.includes("cultivo de esputo")) return ["Recolectar muestra matutina después de enjuagar la boca con agua.", "Toser profundamente para obtener secreción bronquial, no saliva."];
        if (lower.includes("semen") || lower.includes("espermocultivo")) return ["Abstinencia sexual de 3 a 5 días.", "Recolectar por masturbación en frasco estéril.", "Entregar la muestra en el laboratorio en menos de 1 hora."];
        if (lower.includes("prueba rápida")) return ["No requiere ayuno.", "Realizar preferentemente en presencia de síntomas."];
        if (lower.includes("citoquímico") || lower.includes("líquido")) return ["La toma de muestra es realizada por personal médico.", "Seguir las indicaciones específicas del procedimiento."];
        return ["Seguir las instrucciones proporcionadas por el laboratorio.", "Consultar si requiere ayuno o preparación especial.", "Presentar orden médica e identificación oficial."];
    }

    function escapeHtml(str) {
        return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
    }

    // ---------- POPUP ----------
    const popup = document.getElementById("testPopup");
    const overlay = document.getElementById("popupOverlay");
    const popupTestName = document.getElementById("popupTestName");
    const popupCatalogId = document.getElementById("popupCatalogId");
    const popupInstructions = document.getElementById("popupInstructions");
    const popupSampleType = document.getElementById("popupSampleType");

    function showPopup(testName, x, y) {
        const details = getTestDetails(testName);
        popupTestName.innerText = testName;
        popupCatalogId.innerHTML = details.id || "No disponible";
        const instructions = getInstructions(testName);
        popupInstructions.innerHTML = instructions.map(item => 
            `<li><i class="fas fa-circle" style="font-size:0.4rem; color:var(--secondary); margin-right:8px;"></i> ${item}</li>`
        ).join('');
        popupSampleType.innerHTML = details.sample || "Variable";
        popup.style.display = "block";
        overlay.style.display = "block";

        let left = x + 15, top = y - 10;
        const rect = popup.getBoundingClientRect();
        if (left + 420 > window.innerWidth) left = x - 420;
        if (left < 10) left = 10;
        if (top + rect.height > window.innerHeight) top = y - rect.height - 20;
        popup.style.left = left + "px";
        popup.style.top = top + "px";
    }

    function hidePopup() {
        popup.style.display = "none";
        overlay.style.display = "none";
    }

    document.getElementById("closePopupBtn").addEventListener("click", hidePopup);
    overlay.addEventListener("click", hidePopup);

    // ---------- EVENTOS DE CLICK EN PRUEBAS ----------
    function clickHandler(e) {
        e.stopPropagation();
        const raw = e.currentTarget.innerText.trim();
        const testName = raw.split('\n')[0].trim();
        showPopup(testName, e.clientX, e.clientY);
    }

    function attachClickToTestElements() {
        document.querySelectorAll('.study-card, .package-studies-list li').forEach(el => {
            el.removeEventListener('click', clickHandler);
            el.addEventListener('click', clickHandler);
        });
    }

    // ---------- FILTROS Y RENDERIZADO ----------
    let selectedCategory = null;
    let currentSearch = "";

    function buildCategoryFilter() {
        const categoriesSet = new Set();
        individualTests.forEach(t => categoriesSet.add(t.category));
        const sortedCategories = Array.from(categoriesSet).sort();
        const container = document.getElementById("categoryFilter");
        let html = `<div class="category-chip todos ${selectedCategory === null ? 'active' : ''}" data-category="">Todos</div>`;
        sortedCategories.forEach(cat => {
            html += `<div class="category-chip ${selectedCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${cat}</div>`;
        });
        container.innerHTML = html;
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const cat = chip.getAttribute('data-category');
                selectedCategory = cat === "" ? null : cat;
                buildCategoryFilter();
                renderIndividual(currentSearch);
            });
        });
    }

    function renderIndividual(search = "") {
        currentSearch = search;
        const container = document.getElementById("individualStudiesContainer");
        const term = search.trim().toLowerCase();
        let filtered = [...individualTests];
        if (term) {
            filtered = filtered.filter(t => t.name.toLowerCase().includes(term));
        }
        if (selectedCategory) {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }
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
                html += `<div class="study-card"><i class="fas fa-vial"></i> ${display}</div>`;
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
        let filtered = [...packages];
        if (term) {
            filtered = filtered.filter(pkg => 
                pkg.name.toLowerCase().includes(term) || 
                pkg.tests.some(t => t.toLowerCase().includes(term))
            );
        }
        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-result"><i class="fas fa-search-minus"></i> No se encontraron paquetes con "${escapeHtml(term)}".</div>`;
            document.getElementById("statsPackages").innerHTML = "";
            return;
        }
        let html = "";
        filtered.forEach(pkg => {
            html += `
                <div class="package-card">
                    <div class="package-header">
                        <div class="package-name"><i class="fas fa-cube"></i> ${pkg.name}</div>
                        <div class="package-badge"><i class="fas fa-list-ul"></i> ${pkg.tests.length} pruebas</div>
                    </div>
                    <div class="package-studies-list">
                        <ul>${pkg.tests.map(t => `<li><i class="fas fa-check-circle"></i> ${t}</li>`).join('')}</ul>
                    </div>
                    <div class="package-footer-note"><i class="fas fa-clock"></i> Requiere preparación según cada prueba individual.</div>
                </div>
            `;
        });
        container.innerHTML = html;
        document.getElementById("statsPackages").innerHTML = `📦 ${filtered.length} paquetes disponibles.`;
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

    // ---------- CAMBIO DE PESTAÑAS ----------
    const tabs = document.querySelectorAll(".tab-btn");
    const indivDiv = document.getElementById("individualTab");
    const packDiv = document.getElementById("packagesTab");
    const prepDiv = document.getElementById("prepTab");
    let currentTab = "individual";

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
            renderPackages(currentSearch);
        } else {
            renderInstructions();
        }
    }

    tabs.forEach(btn => btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab"))));

    const searchInput = document.getElementById("globalSearch");
    searchInput.addEventListener("input", (e) => {
        currentSearch = e.target.value;
        if (currentTab === "individual") renderIndividual(currentSearch);
        else if (currentTab === "packages") renderPackages(currentSearch);
    });

    // ---------- INICIALIZACIÓN ----------
    buildCategoryFilter();
    renderIndividual("");
    renderPackages("");
    renderInstructions();
    switchTab("individual");
})();