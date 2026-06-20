// app.js
// ─── VARIÁVEL GLOBAL ───
let data = [];
let dadosCarregados = false;

// ─── FUNÇÃO PARA CARREGAR DADOS DO DISCO (NATIVO ELECTRON) ───
async function carregarDados() {
    try {
        console.log('📡 Chargement des données depuis le disque...');
        
        // Chama a ponte nativa do Electron para ler o arquivo do HD
        const dadosDoDisco = await window.desktopAPI.loadDates();
        
        if (dadosDoDisco) {
            data = dadosDoDisco;
            dadosCarregados = true;
            console.log('✅ Dados carregados com sucesso!', data.length, 'cards encontrados');
            
            // Renderiza tudo após carregar
            renderCards();
            updateHomeStats();
            
            if (document.getElementById('page-stats').classList.contains('active')) {
                updateStatsDetails();
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados do disco:', error);
        dadosCarregados = false;
        data = [];
        
        // Mostra mensagem de erro no lugar dos cards usando estilos inline
        const container = document.getElementById('cardsContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    ⚠️ Erro ao carregar dados nativos: ${error.message}<br>
                    <small style="display:block; margin-top: 0.5rem;">
                        Verifique a integridade do arquivo arquivo <strong>dates.json</strong> na raiz do sistema.
                    </small>
                </div>
            `;
        }
    }
}

// ─── FUNÇÃO PARA SALVAR DADOS NO DISCO (NATIVO ELECTRON) ───
async function salvarDadosLocal() {
    try {
        // Envia o array atualizado para o processo principal gravar no arquivo físico
        const result = await window.desktopAPI.saveDates(data);
        if (result && result.success) {
            console.log('💾 Dados gravados com sucesso no arquivo do computador');
        } else {
            console.warn('⚠️ Falha ao gravar dados:', result ? result.error : 'Erro desconhecido');
        }
    } catch (error) {
        console.error('❌ Erro de comunicação IPC ao tentar salvar:', error);
    }
}

// ─── ATUALIZAR NOTA (NATIVO & ASSÍNCRONO) ───
async function atualizarNota(index, valor) {
    if (data[index]) {
        data[index].notes = valor;
        await salvarDadosLocal(); // Grava direto no HD de forma automática
        console.log('📝 Nota atualizada para card', index);
    }
}

// ─── AJOUTER CARD (NATIVO & ASSÍNCRONO) ───
async function ajouterCard() {
    const nouveau = {
        "comment il s'appelle?": prompt("Nom du rendez-vous ?", "Nouveau rencontre"),
        "formation professionnelle ou universitaire": prompt("Profession ?", "métier"),
        "l'âge": prompt("Âge ?", "25"),
        "hauteur": prompt("Taille ?", "1,75m"),
        "nombre de rencontres": prompt("Nombre de rencontres ?", "1"),
        "intimité physique": confirm("Intimité physique ?") ? "true" : "false",
        "intimité émotionelle": confirm("Intimité émotionnelle ?") ? "true" : "false",
        "beauté": prompt("Note de beauté (0-5) ?", "4/5"),
        "note finale": prompt("Note finale ?", "3.5/5"),
        "je le ferai à noveau?": confirm("Recommencerais-tu ?") ? "true" : "false",
        "notes": prompt("Notes supplémentaires ?", "Mes impressions...")
    };
    
    data.push(nouveau);
    await salvarDadosLocal(); // Grava direto no HD de forma automática
    renderCards();
    
    // Se estiver na página stats, atualizar
    if (document.getElementById('page-stats').classList.contains('active')) {
        updateStatsDetails();
    }
    
    console.log('➕ Novo card adicionado! Total:', data.length);
}

// ─── RENDER CARDS ───
function renderCards() {
    const container = document.getElementById('cardsContainer');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="empty-state">✨ aucun rendez-vous enregistré pour l'instant</div>`;
        return;
    }

    let html = '';

    data.forEach((rencontre, index) => {
        const nom = rencontre["comment il s'appelle?"] || "—";
        const formation = rencontre["formation professionnelle ou universitaire"] || "—";
        const age = rencontre["l'âge"] || "—";
        const taille = rencontre["hauteur"] || "—";
        const nbRencontres = rencontre["nombre de rencontres"] || "—";
        const physique = rencontre["intimité physique"] || "false";
        const emotionnel = rencontre["intimité émotionelle"] || "false";
        const beaute = rencontre["beauté"] || "—";
        const noteFinale = rencontre["note finale"] || "—";
        const recommencer = rencontre["je le ferai à noveau?"] || "false";
        const notes = rencontre["notes"] || "Aucune note pour ce rendez-vous.";

        // Estrelas
        let etoilesHtml = '';
        if (beaute !== '—') {
            const noteBeaute = parseInt(beaute);
            if (!isNaN(noteBeaute) && noteBeaute >= 0 && noteBeaute <= 5) {
                const etoiles = '★'.repeat(noteBeaute) + '☆'.repeat(5 - noteBeaute);
                etoilesHtml = `<span class="beauty-stars">${etoiles}</span>`;
            } else {
                etoilesHtml = `<span class="beauty-stars">☆☆☆☆☆</span>`;
            }
        } else {
            etoilesHtml = `<span class="beauty-stars">☆☆☆☆☆</span>`;
        }

        const physiqueIcon = physique === 'true' ? '💚' : '🤍';
        const emotionnelIcon = emotionnel === 'true' ? '💗' : '🤍';
        const physiqueLabel = physique === 'true' ? 'oui' : 'non';
        const emotionnelLabel = emotionnel === 'true' ? 'oui' : 'non';
        const recommencerIcon = recommencer === 'true' ? '🔄' : '⏸️';
        const recommencerText = recommencer === 'true' ? 'oui' : 'non';

        html += `
            <div class="card-flip-container">
                <div class="card-flip">
                    <div class="card-face card-front">
                        <div class="card-header">
                            <span class="card-nom">${nom} <small>${formation}</small></span>
                            <span class="card-age">${age} ans</span>
                        </div>

                        <div class="card-details">
                            <div class="detail-item">
                                <span class="detail-label">taille</span>
                                <span class="detail-value">${taille}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">rencontres</span>
                                <span class="detail-value">${nbRencontres}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">physique</span>
                                <span class="detail-value alt">${physiqueIcon} ${physiqueLabel}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">émotionnel</span>
                                <span class="detail-value alt">${emotionnelIcon} ${emotionnelLabel}</span>
                            </div>
                        </div>

                        <div class="card-flags">
                            <div class="flag-group">
                                <span class="flag-badge ${physique === 'true' ? 'true' : 'false'}">
                                    <span class="icon">💞</span> physique
                                </span>
                                <span class="flag-badge ${emotionnel === 'true' ? 'true' : 'false'}">
                                    <span class="icon">🧠</span> émotion.
                                </span>
                            </div>
                            ${etoilesHtml}
                        </div>

                        <div class="card-footer">
                            <span class="note-finale">${noteFinale}</span>
                            <span class="repeat-badge">
                                <span class="icon">${recommencerIcon}</span> ${recommencerText}
                            </span>
                        </div>
                        <span class="flip-hint">🔄 passez la souris</span>
                    </div>

                    <div class="card-face card-back">
                        <div class="card-back-content">
                            <div class="card-back-title">📝 Détails & notes</div>
                            
                            <div class="card-back-field">
                                <span class="card-back-label">👤 Nom</span>
                                <span class="card-back-value">${nom}</span>
                            </div>
                            
                            <div class="card-back-field">
                                <span class="card-back-label">💼 Profession</span>
                                <span class="card-back-value">${formation}</span>
                            </div>
                            
                            <div class="card-back-field">
                                <span class="card-back-label">📅 Âge / Taille</span>
                                <span class="card-back-value">${age} ans · ${taille}</span>
                            </div>
                            
                            <div class="card-back-field">
                                <span class="card-back-label">📌 Rencontres</span>
                                <span class="card-back-value">${nbRencontres}</span>
                            </div>
                            
                            <div class="card-back-field card-back-notes">
                                <span class="card-back-label">✏️ Mes notes</span>
                                <textarea onchange="atualizarNota(${index}, this.value)" placeholder="Ajoutez vos notes ici...">${notes}</textarea>
                            </div>
                            
                            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                                <span style="font-size: 0.7rem; color: var(--cor-texto-secundario);">
                                    ${physique === 'true' ? '💚 physique' : '🤍 physique'} · 
                                    ${emotionnel === 'true' ? '💗 émotionnel' : '🤍 émotionnel'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ─── HOME STATS ───
function updateHomeStats() {
    const container = document.getElementById('homeStats');
    if (!container) return;
    
    const total = data.length;
    const repeated = data.filter(d => d["je le ferai à noveau?"] === "true").length;
    const avgBeauty = data.reduce((acc, d) => {
        const b = parseInt(d["beauté"]);
        return acc + (isNaN(b) ? 0 : b);
    }, 0) / (total || 1);
    const avgNote = data.reduce((acc, d) => {
        const n = parseFloat(d["note finale"]);
        return acc + (isNaN(n) ? 0 : n);
    }, 0) / (total || 1);

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${total}</div>
            <div class="stat-label">Rendez-vous</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${repeated}</div>
            <div class="stat-label">À refaire ❤️</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${avgBeauty.toFixed(1)}/5</div>
            <div class="stat-label">Beauté moyenne</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${avgNote.toFixed(1)}/5</div>
            <div class="stat-label">Note moyenne</div>
        </div>
    `;
}

// ─── STATS DÉTAILLÉES ───
function updateStatsDetails() {
    const container = document.getElementById('statsDetails');
    if (!container) return;
    
    const total = data.length;
    const repeated = data.filter(d => d["je le ferai à noveau?"] === "true").length;
    const notRepeated = total - repeated;
    const withPhysique = data.filter(d => d["intimité physique"] === "true").length;
    const withEmotionnel = data.filter(d => d["intimité émotionelle"] === "true").length;
    const both = data.filter(d => d["intimité physique"] === "true" && d["intimité émotionelle"] === "true").length;

    const ages = data.map(d => parseInt(d["l'âge"])).filter(a => !isNaN(a));
    const avgAge = ages.length > 0 ? (ages.reduce((a,b) => a+b, 0) / ages.length).toFixed(1) : '—';

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${total}</div>
            <div class="stat-label">Total rendez-vous</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${repeated}</div>
            <div class="stat-label">À refaire ✅</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${notRepeated}</div>
            <div class="stat-label">Pas à refaire ❌</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${withPhysique}</div>
            <div class="stat-label">Intimité physique 💚</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${withEmotionnel}</div>
            <div class="stat-label">Intimité émotionnelle 💗</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${both}</div>
            <div class="stat-label">Les deux ✨</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${avgAge}</div>
            <div class="stat-label">Âge moyen</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${data.length}</div>
            <div class="stat-label">Notes enregistrées</div>
        </div>
    `;
}

// ─── NAVEGAÇÃO ───
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const page = this.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');
        
        if (page === 'home') updateHomeStats();
        if (page === 'stats') updateStatsDetails();
    });
});

// ─── INIT NATIVO DESKTOP ───
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application desktop native démarrée');
    carregarDados();
});