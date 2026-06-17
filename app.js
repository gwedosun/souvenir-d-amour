// Initial seed data format provided by the user
const initialData = [
    {
        "comment il s'appelle?": "m, mullet boy",
        "formation professionnelle ou universitaire": "avocat",
        "l'âge": "24",
        "hauteur": "1,74m",
        "nombre de rencontres": "> 5",
        "intimité physique": "false",
        "intimité émotionelle": "false",
        "beauté": "4/5",
        "note finale": "3/5",
        "je le ferai à noveau?": "true"
    }
];

// Load dataset from LocalStorage or use fallback seed
let database = JSON.parse(localStorage.getItem('date_diary_db')) || initialData;

// Persist data locally
function saveToStorage() {
    localStorage.setItem('date_diary_db', JSON.stringify(database));
}

// Convert "X/5" style rating strings into safe integers
function parseRating(ratingStr) {
    if (!ratingStr) return 0;
    const num = parseInt(ratingStr.split('/')[0]);
    return isNaN(num) ? 0 : num;
}

// Dynamically compute layout statistics
function updateDashboardStats(dataList) {
    const total = dataList.length;
    document.getElementById('stat-total-dates').innerText = total;

    if (total === 0) {
        document.getElementById('stat-repeat-rate').innerText = "0%";
        document.getElementById('stat-avg-beauty').innerText = "0/5";
        document.getElementById('stat-avg-final').innerText = "0/5";
        return;
    }

    const repeatCount = dataList.filter(item => String(item["je le ferai à noveau?"]).toLowerCase() === 'true').length;
    const repeatRate = Math.round((repeatCount / total) * 100);
    document.getElementById('stat-repeat-rate').innerText = `${repeatRate}%`;

    const totalBeauty = dataList.reduce((sum, item) => sum + parseRating(item["beauté"]), 0);
    const totalFinal = dataList.reduce((sum, item) => sum + parseRating(item["note finale"]), 0);

    document.getElementById('stat-avg-beauty').innerText = `${(totalBeauty / total).toFixed(1)}/5`;
    document.getElementById('stat-avg-final').innerText = `${(totalFinal / total).toFixed(1)}/5`;
}

// Search, filtering and sorting controller
function filterAndRender() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const filterRepeat = document.getElementById('filter-repeat').value;
    const filterIntimacy = document.getElementById('filter-intimacy').value;
    const sortBy = document.getElementById('sort-by').value;

    let filtered = database.filter(item => {
        const name = (item["comment il s'appelle?"] || "").toLowerCase();
        const job = (item["formation professionnelle ou universitaire"] || "").toLowerCase();
        const matchesSearch = name.includes(searchQuery) || job.includes(searchQuery);

        const repeatVal = String(item["je le ferai à noveau?"]).toLowerCase();
        const matchesRepeat = (filterRepeat === 'all') || (repeatVal === filterRepeat);

        const intimacyVal = String(item["intimité physique"]).toLowerCase();
        const matchesIntimacy = (filterIntimacy === 'all') || (intimacyVal === filterIntimacy);

        return matchesSearch && matchesRepeat && matchesIntimacy;
    });

    // Sorting Strategies
    if (sortBy === 'note-desc') {
        filtered.sort((a, b) => parseRating(b["note finale"]) - parseRating(a["note finale"]));
    } else if (sortBy === 'beauty-desc') {
        filtered.sort((a, b) => parseRating(b["beauté"]) - parseRating(a["beauté"]));
    }

    renderCards(filtered);
    updateDashboardStats(database);
}

// Render date cards to the interface DOM
function renderCards(dataList) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    if (dataList.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Aucune rencontre ne correspond à vos critères.</div>`;
        return;
    }

    dataList.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'date-card';

        const repeat = String(item["je le ferai à noveau?"]).toLowerCase() === 'true';

        card.innerHTML = `
            <button class="btn-delete" onclick="deleteEntry(${index})" title="Supprimer">&times;</button>
            <div class="card-header">
                <div class="name">${item["comment il s'appelle?"]}</div>
                <div class="job">💼 ${item["formation professionnelle ou universitaire"]}</div>
            </div>
            <div class="card-badges">
                <span class="badge badge-info">🎂 ${item["l'âge"]} ans</span>
                <span class="badge badge-info">📏 ${item["hauteur"]}</span>
                <span class="badge badge-accent">🔄 Renc: ${item["nombre de rencontres"]}</span>
            </div>
            <div class="card-metrics">
                <div class="metric-row">
                    <span class="metric-label">Esthétique / Beauté</span>
                    <span class="metric-value rating-stars">${item["beauté"]}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Intimité Physique</span>
                    <span class="metric-value">${String(item["intimité physique"]).toLowerCase() === 'true' ? '✅ Oui' : '❌ Non'}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Intimité Émotionnelle</span>
                    <span class="metric-value">${String(item["intimité émotionelle"]).toLowerCase() === 'true' ? '✅ Oui' : '❌ Non'}</span>
                </div>
                <div class="metric-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0e6e2;">
                    <span class="metric-label" style="font-weight: 600; color: var(--accent);">Note Finale</span>
                    <span class="metric-value rating-stars" style="font-size: 1.05rem;">${item["note finale"]}</span>
                </div>
            </div>
            <div class="card-decision ${repeat ? 'decision-yes' : 'decision-no'}">
                ${repeat ? '🔥 Je le ferai à nouveau' : '🛑 Expérience unique (Pas de retour)'}
            </div>
        `;
        container.appendChild(card);
    });
}

// Handle dynamic entry submissions
function handleFormSubmit(e) {
    e.preventDefault();

    const newEntry = {
        "comment il s'appelle?": document.getElementById('form-name').value,
        "formation professionnelle ou universitaire": document.getElementById('form-job').value,
        "l'âge": document.getElementById('form-age').value,
        "hauteur": document.getElementById('form-height').value,
        "nombre de rencontres": document.getElementById('form-encounters').value,
        "intimité physique": document.getElementById('form-physical').value,
        "intimité émotionelle": document.getElementById('form-emotional').value,
        "beauté": document.getElementById('form-beauty').value,
        "note finale": document.getElementById('form-final').value,
        "je le ferai à noveau?": document.getElementById('form-again').value
    };

    database.unshift(newEntry);
    saveToStorage();
    filterAndRender();
    document.getElementById('date-form').reset();
    showToast("Rencontre enregistrée localement !");
}

// Remove an entry tracking map
function deleteEntry(index) {
    if(confirm("Voulez-vous supprimer cette rencontre ?")) {
        database.splice(index, 1);
        saveToStorage();
        filterAndRender();
        showToast("Entrée supprimée !");
    }
}

// Package state back into downloadable JSON format
function exportJSON() {
    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(database, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "dates.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Fichier 'dates.json' généré avec succès !");
}

// UI notification utility
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Initial operational load
filterAndRender();