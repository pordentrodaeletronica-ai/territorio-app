// ====================================
// SISTEMA DE DESIGNAÇÕES - VERSÃO FINAL
// Congregação Ribeirão Claro
// ====================================

// ====================================
// UTILIDADES
// ====================================

function generateWeeks() {
    const weeks = [];
    
    // Pega a data de hoje
    const today = new Date();
    
    // Volta para a segunda-feira da semana atual
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se domingo, volta 6 dias, senão volta pro início da semana
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + diff);
    
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    // Gera 52 semanas a partir da semana atual
    for (let i = 0; i < 52; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const dia = weekStart.getDate();
        const mes = meses[weekStart.getMonth()];
        const ano = weekStart.getFullYear();
        
        weeks.push({
            id: `week_${i + 1}`,
            label: `Semana: ${dia} de ${mes} de ${ano}`,
            startDate: weekStart,
            endDate: weekEnd
        });
    }
    
    return weeks;
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
}

function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// ====================================
// LOGIN E AUTENTICAÇÃO
// ====================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const spinner = document.getElementById('loginSpinner');

    if (!email || !password) {
        alert('Preencha email e senha');
        return;
    }

    // Ativa spinner
    loginBtn.classList.add('btn-loading');
    loginBtn.disabled = true;
    spinner.classList.add('active');

    try {
        const response = await fetch(
            `${CONFIG.APPS_SCRIPT_URL}?action=authenticate&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        );
        
        const result = await response.json();
        
        if (result.success) {
            APP_DATA.currentUser = result.data.user.email;
            APP_DATA.currentUserData = result.data.user;
            await loadAllData();
            showMainContent();
        } else {
            alert(result.message || 'Email ou senha incorretos');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao conectar com servidor');
    } finally {
        // Desativa spinner
        loginBtn.classList.remove('btn-loading');
        loginBtn.disabled = false;
        spinner.classList.remove('active');
    }
}

async function loadAllData() {
    try {
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=getData`);
        const data = await response.json();
        
        if (data.success) {
            APP_DATA.brothers = data.data.brothers || [];
            APP_DATA.designations = data.data.designations || {};
            APP_DATA.announcements = data.data.announcements || [];
            APP_DATA.grupos = data.data.grupos || [];
            
            const weeks = generateWeeks();
            weeks.forEach(week => {
                if (!APP_DATA.designations[week.id]) {
                    APP_DATA.designations[week.id] = {
                        quinta: {},
                        sabado: {},
                        mecanicas_quinta: {},
                        mecanicas_sabado: {},
                        dirigentes: {},
                        limpeza: {}
                    };
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function showMainContent() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainContent').classList.add('active');
    
    const user = APP_DATA.currentUserData;
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = `(${CONFIG.ROLE_DISPLAY[user.role] || user.role})`;
    
    renderTabs(user.tabs);
    renderTab(user.tabs[0]);
}

function logout() {
    location.reload();
}

// ====================================
// TABS
// ====================================

function renderTabs(tabs) {
    const tabsContainer = document.getElementById('tabsContainer');
    tabsContainer.innerHTML = tabs.map(tab => 
        `<div class="tab" data-tab="${tab}" onclick="renderTab('${tab}')">${CONFIG.TAB_NAMES[tab]}</div>`
    ).join('');
}

function renderTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    const container = document.getElementById('contentContainer');
    
    switch(tabName) {
        case 'quinta': renderQuinta(container); break;
        case 'sabado': renderSabado(container); break;
        case 'mecanicas': renderMecanicas(container); break;
        case 'dirigentes': renderDirigentes(container); break;
        case 'limpeza': renderLimpeza(container); break;
        case 'grupos': renderGrupos(container); break;
        case 'anuncios': renderAnuncios(container); break;
        case 'cadastro': renderCadastro(container); break;
    }
}

// ====================================
// QUINTA-FEIRA (MEIO DE SEMANA) - VERSÃO FINAL
// ====================================

function renderQuinta(container) {
    const weeks = generateWeeks();
    const canEdit = canUserEdit('quinta');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Reunião de Meio de Semana</h3>
            </div>
            
            <div class="week-selector">
                <label>Data da Reunião:</label>
                <select id="quintaWeekSelect" onchange="updateQuintaView()">
                    ${weeks.map(w => `<option value="${w.id}">${w.label}</option>`).join('')}
                </select>
            </div>
            
            <div id="quintaDesignations"></div>
            
            ${canEdit ? `
                <div class="action-bar">
                    <button class="btn btn-success" onclick="saveDesignations('quinta')">Salvar Designações</button>
                    <button class="btn btn-secondary" onclick="gerarPDFQuinta()" style="margin-left: 0.5rem;">📄 Gerar PDF</button>
                </div>
            ` : '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>'}
        </div>
    `;
    
    updateQuintaView();
}

function updateQuintaView() {
    const weekId = document.getElementById('quintaWeekSelect').value;
    const data = APP_DATA.designations[weekId]?.quinta || {};
    const canEdit = canUserEdit('quinta');
    
    // Contar quantas partes de Nossa Vida Cristã existem
    let partesVida = data.partes_vida || [{ numero: '', tema: '', irmao: null }];
    
    document.getElementById('quintaDesignations').innerHTML = `
        <!-- CABEÇALHO -->
        <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <div style="display: grid; gap: 1rem;">
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Leitura Semanal da Bíblia:</label>
                    <input type="text" class="form-control" value="${data.leitura_semanal || ''}" 
                        onchange="updateTextField('quinta', '${weekId}', 'leitura_semanal', this.value)"
                        placeholder="Ex: Isaías 1-7"
                        ${!canEdit ? 'disabled' : ''}>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Presidente:</label>
                        ${renderBrotherSelectInlineQuinta('presidente', weekId, data.presidente, canEdit)}
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Conselheiro Sala B:</label>
                        ${renderBrotherSelectInlineQuinta('dirigente_sala_b', weekId, data.dirigente_sala_b, canEdit)}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Cântico Inicial:</label>
                        <input type="text" class="form-control" value="${data.cantico_inicial || ''}" 
                            onchange="updateTextField('quinta', '${weekId}', 'cantico_inicial', this.value)"
                            placeholder="Ex: 44"
                            ${!canEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Oração Inicial:</label>
                        ${renderBrotherSelectInlineQuinta('oracao_inicial', weekId, data.oracao_inicial, canEdit)}
                    </div>
                </div>
            </div>
        </div>

        <!-- TESOUROS DA PALAVRA DE DEUS -->
        <div class="section-header" style="background: var(--azure-tesouros);">
            TESOUROS DA PALAVRA DE DEUS
        </div>
        <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: grid; gap: 1.5rem;">
                <!-- PARTE 1: DISCURSO -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">1. Discurso (10 min):</label>
                    <div style="display: grid; gap: 0.5rem;">
                        ${renderBrotherSelectInlineQuinta('parte1_discurso', weekId, data.parte1_discurso, canEdit)}
                        <input type="text" class="form-control" value="${data.parte1_tema || ''}" 
                            onchange="updateTextField('quinta', '${weekId}', 'parte1_tema', this.value)"
                            placeholder="Tema"
                            ${!canEdit ? 'disabled' : ''}>
                    </div>
                </div>
                
                <!-- PARTE 2: JOIAS -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">2. Joias Espirituais (10 min):</label>
                    ${renderBrotherSelectInlineQuinta('parte2_joias', weekId, data.parte2_joias, canEdit)}
                </div>
                
                <!-- PARTE 3: LEITURA DA BÍBLIA -->
                <div style="border-top: 2px solid var(--border); padding-top: 1rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.75rem;">3. Leitura da Bíblia:</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="font-size: 0.9rem; color: var(--text-medium); margin-bottom: 0.5rem; display: block;">Salão Principal (4 min):</label>
                            <input type="text" class="form-control" value="${data.parte3_estudante || ''}" 
                                onchange="updateTextField('quinta', '${weekId}', 'parte3_estudante', this.value)"
                                placeholder="Estudante"
                                style="margin-bottom: 0.5rem;"
                                ${!canEdit ? 'disabled' : ''}>
                            <input type="text" class="form-control" value="${data.parte3_trecho || ''}" 
                                onchange="updateTextField('quinta', '${weekId}', 'parte3_trecho', this.value)"
                                placeholder="Trecho (ex: Isa. 2:1-11)"
                                ${!canEdit ? 'disabled' : ''}>
                        </div>
                        <div>
                            <label style="font-size: 0.9rem; color: var(--text-medium); margin-bottom: 0.5rem; display: block;">Sala B (4 min):</label>
                            <input type="text" class="form-control" value="${data.parte3_estudante_b || ''}" 
                                onchange="updateTextField('quinta', '${weekId}', 'parte3_estudante_b', this.value)"
                                placeholder="Estudante"
                                style="margin-bottom: 0.5rem;"
                                ${!canEdit ? 'disabled' : ''}>
                            <input type="text" class="form-control" value="${data.parte3_trecho_b || ''}" 
                                onchange="updateTextField('quinta', '${weekId}', 'parte3_trecho_b', this.value)"
                                placeholder="Trecho (ex: Isa. 2:1-11)"
                                ${!canEdit ? 'disabled' : ''}>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- FAÇA SEU MELHOR NO MINISTÉRIO -->
        <div class="section-header" style="background: var(--amarelo-ministerio); color: black;">
            FAÇA SEU MELHOR NO MINISTÉRIO
        </div>
        
        ${renderParteMinisterio(4, 'quinta', weekId, data, canEdit)}
        ${renderParteMinisterio(5, 'quinta', weekId, data, canEdit)}
        ${renderParteMinisterio(6, 'quinta', weekId, data, canEdit)}

        <!-- NOSSA VIDA CRISTÃ -->
        <div style="margin-top: 1.5rem;">
            <div style="margin-bottom: 1rem;">
                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Cântico:</label>
                <input type="text" class="form-control" value="${data.cantico_meio || ''}" 
                    onchange="updateTextField('quinta', '${weekId}', 'cantico_meio', this.value)"
                    placeholder="Ex: 38"
                    ${!canEdit ? 'disabled' : ''}>
            </div>
        </div>
        
        <div class="section-header" style="background: var(--vermelho-vida);">
            NOSSA VIDA CRISTÃ
        </div>
        
        <div id="partesVidaContainer">
            ${partesVida.map((parte, index) => renderParteVidaCrista(index, parte, weekId, canEdit)).join('')}
        </div>
        
        ${canEdit ? `
            <div style="margin-bottom: 1.5rem;">
                <button class="btn btn-secondary" onclick="adicionarParteVida('${weekId}')">+ Adicionar Parte</button>
            </div>
        ` : ''}
        
        <!-- ESTUDO BÍBLICO -->
        <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem; font-weight: 600;">Estudo Bíblico de Congregação (30 min)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Dirigente:</label>
                    ${renderBrotherSelectInlineQuinta('estudo_biblico', weekId, data.estudo_biblico, canEdit)}
                </div>
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Leitor:</label>
                    ${renderBrotherSelectInlineQuinta('leitor', weekId, data.leitor, canEdit)}
                </div>
            </div>
        </div>
        
        <!-- FINAL -->
        <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Cântico Final:</label>
                    <input type="text" class="form-control" value="${data.cantico_final || ''}" 
                        onchange="updateTextField('quinta', '${weekId}', 'cantico_final', this.value)"
                        placeholder="Ex: 89"
                        ${!canEdit ? 'disabled' : ''}>
                </div>
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Oração Final:</label>
                    ${renderBrotherSelectInlineQuinta('oracao_final', weekId, data.oracao_final, canEdit)}
                </div>
            </div>
        </div>
    `;
}

function renderParteMinisterio(numero, meeting, weekId, data, canEdit) {
    const temaP = data[`parte${numero}_tema`] || '';
    const estudanteP = data[`parte${numero}_estudante`] || '';
    const ajudanteP = data[`parte${numero}_ajudante`] || '';
    
    const temaB = data[`parte${numero}_tema_b`] || '';
    const estudanteB = data[`parte${numero}_estudante_b`] || '';
    const ajudanteB = data[`parte${numero}_ajudante_b`] || '';
    
    return `
        <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
            <h4 style="margin-bottom: 1rem; font-weight: 600;">Parte ${numero}</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <!-- SALÃO PRINCIPAL -->
                <div>
                    <strong style="display: block; margin-bottom: 0.75rem; color: var(--roxo-jw);">Salão Principal:</strong>
                    <div style="display: grid; gap: 0.5rem;">
                        <input type="text" class="form-control" placeholder="Tema" value="${temaP}"
                            onchange="updateTextField('${meeting}', '${weekId}', 'parte${numero}_tema', this.value)"
                            ${!canEdit ? 'disabled' : ''}>
                        <input type="text" class="form-control" placeholder="Estudante" value="${estudanteP}"
                            onchange="updateTextField('${meeting}', '${weekId}', 'parte${numero}_estudante', this.value)"
                            ${!canEdit ? 'disabled' : ''}>
                        <input type="text" class="form-control" placeholder="Ajudante" value="${ajudanteP}"
                            onchange="updateTextField('${meeting}', '${weekId}', 'parte${numero}_ajudante', this.value)"
                            ${!canEdit ? 'disabled' : ''}>
                    </div>
                </div>
                
                <!-- SALA B -->
                <div>
                    <strong style="display: block; margin-bottom: 0.75rem; color: var(--roxo-jw);">Sala B:</strong>
                    <div style="display: grid; gap: 0.5rem;">
                        <input type="text" class="form-control" placeholder="Tema" value="${temaB}"
                            onchange="updateTextField('${meeting}', '${weekId}', 'parte${numero}_tema_b', this.value)"
                            ${!canEdit ? 'disabled' : ''}>
                        <input type="text" class="form-control" placeholder="Estudante" value="${estudanteB}"
                            onchange="updateTextField('${meeting}', '${weekId}', 'parte${numero}_estudante_b', this.value)"
                            ${!canEdit ? 'disabled' : ''}>
                        <input type="text" class="form-control" placeholder="Ajudante" value="${ajudanteB}"
                            onchange="updateTextField('${meeting}', '${weekId}', 'parte${numero}_ajudante_b', this.value)"
                            ${!canEdit ? 'disabled' : ''}>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderParteVidaCrista(index, parte, weekId, canEdit) {
    return `
        <div style="background: var(--bg-light); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: grid; grid-template-columns: 100px 1fr 200px ${canEdit ? '50px' : ''}; gap: 1rem; align-items: end;">
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Número:</label>
                    <input type="text" class="form-control" value="${parte.numero || ''}" 
                        onchange="updateParteVida(${index}, '${weekId}', 'numero', this.value)"
                        placeholder="7"
                        ${!canEdit ? 'disabled' : ''}>
                </div>
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Tema:</label>
                    <input type="text" class="form-control" value="${parte.tema || ''}" 
                        onchange="updateParteVida(${index}, '${weekId}', 'tema', this.value)"
                        placeholder="Tema da parte"
                        ${!canEdit ? 'disabled' : ''}>
                </div>
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Irmão:</label>
                    <select class="form-control" onchange="updateParteVida(${index}, '${weekId}', 'irmao', this.value)" ${!canEdit ? 'disabled' : ''}>
                        <option value="">Selecionar...</option>
                        ${APP_DATA.brothers.map(b => `
                            <option value="${b.id}" ${parte.irmao == b.id ? 'selected' : ''}>${b.name}</option>
                        `).join('')}
                    </select>
                </div>
                ${canEdit && index > 0 ? `
                    <div>
                        <button class="btn btn-danger btn-sm" onclick="removerParteVida(${index}, '${weekId}')" style="padding: 0.5rem;">✕</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function adicionarParteVida(weekId) {
    if (!APP_DATA.designations[weekId].quinta.partes_vida) {
        APP_DATA.designations[weekId].quinta.partes_vida = [{ numero: '', tema: '', irmao: null }];
    }
    
    APP_DATA.designations[weekId].quinta.partes_vida.push({ numero: '', tema: '', irmao: null });
    updateQuintaView();
}

function removerParteVida(index, weekId) {
    if (APP_DATA.designations[weekId].quinta.partes_vida && APP_DATA.designations[weekId].quinta.partes_vida.length > 1) {
        APP_DATA.designations[weekId].quinta.partes_vida.splice(index, 1);
        updateQuintaView();
    }
}

function updateParteVida(index, weekId, field, value) {
    if (!APP_DATA.designations[weekId].quinta.partes_vida) {
        APP_DATA.designations[weekId].quinta.partes_vida = [{ numero: '', tema: '', irmao: null }];
    }
    
    APP_DATA.designations[weekId].quinta.partes_vida[index][field] = value;
}

function renderBrotherSelectInlineQuinta(field, weekId, value, canEdit) {
    return `
        <select class="form-control" onchange="updateTextField('quinta', '${weekId}', '${field}', this.value)" ${!canEdit ? 'disabled' : ''}>
            <option value="">Selecionar...</option>
            ${APP_DATA.brothers.map(b => `
                <option value="${b.id}" ${value == b.id ? 'selected' : ''}>${b.name}</option>
            `).join('')}
        </select>
    `;
}

console.log("Quinta completa carregada!");
// ====================================
// SÁBADO (FINAL DE SEMANA)
// ====================================

function renderSabado(container) {
    const weeks = generateWeeks();
    const canEdit = canUserEdit('sabado');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Reunião de Final de Semana</h3>
            </div>
            
            <div class="week-selector">
                <label>Semana:</label>
                <select id="sabadoWeekSelect" onchange="updateSabadoView()">
                    ${weeks.map(w => `<option value="${w.id}">${w.label}</option>`).join('')}
                </select>
            </div>
            
            <div id="sabadoDesignations"></div>
            
            ${canEdit ? `
                <div class="action-bar">
                    <button class="btn btn-success" onclick="saveDesignations('sabado')">Salvar Designações</button>
                    <button class="btn btn-secondary" onclick="gerarPDFSabado()" style="margin-left: 0.5rem;">📄 Gerar PDF</button>
                </div>
            ` : '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>'}
        </div>
    `;
    
    updateSabadoView();
}

function updateSabadoView() {
    const weekId = document.getElementById('sabadoWeekSelect').value;
    const data = APP_DATA.designations[weekId]?.sabado || {};
    const canEdit = canUserEdit('sabado');
    
    document.getElementById('sabadoDesignations').innerHTML = `
        <div class="designation-grid">
            ${renderBrotherSelect('Presidente', 'sabado', weekId, 'presidente', canEdit)}
            ${renderBrotherSelect('Oração Inicial', 'sabado', weekId, 'oracao_inicial', canEdit)}
        </div>
        
        <div style="margin: 1.5rem 0; padding: 1rem; background: var(--bg-light); border-radius: 8px;">
            <label style="font-weight: 600; margin-bottom: 0.5rem; display: block;">Orador (digite o nome):</label>
            <input type="text" class="form-control" value="${data.orador || ''}" 
                onchange="updateTextField('sabado', '${weekId}', 'orador', this.value)"
                placeholder="Ex: Irmão Visitante da Congregação de..."
                ${!canEdit ? 'disabled' : ''}>
        </div>
        
        <div class="designation-grid">
            ${renderBrotherSelect('Leitor Sentinela', 'sabado', weekId, 'leitor_sentinela', canEdit)}
            ${renderBrotherSelect('Oração Final', 'sabado', weekId, 'oracao_final', canEdit)}
        </div>
    `;
}

// ====================================
// MECÂNICAS
// ====================================

function renderMecanicas(container) {
    const weeks = generateWeeks();
    const canEdit = canUserEdit('mecanicas');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Partes Mecânicas - Som/Vídeo/Indicador</h3>
            </div>
            
            <div class="week-selector">
                <label>Semana:</label>
                <select id="mecanicasWeekSelect" onchange="updateMecanicasView()">
                    ${weeks.map(w => `<option value="${w.id}">${w.label}</option>`).join('')}
                </select>
            </div>
            
            <div id="mecanicasDesignations"></div>
            
            ${canEdit ? `
                <div class="action-bar">
                    <button class="btn btn-success" onclick="saveDesignations('mecanicas_quinta')" style="margin-right: 0.5rem;">Salvar Quinta</button>
                    <button class="btn btn-success" onclick="saveDesignations('mecanicas_sabado')">Salvar Sábado</button>
                    <button class="btn btn-secondary" onclick="gerarPDFMecanicas()" style="margin-left: 0.5rem;">📄 Gerar PDF</button>
                </div>
            ` : '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>'}
        </div>
    `;
    
    updateMecanicasView();
}

function updateMecanicasView() {
    const weekId = document.getElementById('mecanicasWeekSelect').value;
    const canEdit = canUserEdit('mecanicas');
    
    document.getElementById('mecanicasDesignations').innerHTML = `
        <div class="section-header">Quinta-feira (Meio de Semana)</div>
        <div class="designation-grid">
            ${renderBrotherSelect('Indicador Entrada', 'mecanicas_quinta', weekId, 'indicador_entrada', canEdit)}
            ${renderBrotherSelect('Indicador Auditório', 'mecanicas_quinta', weekId, 'indicador_auditorio', canEdit)}
            ${renderBrotherSelect('Volante 1', 'mecanicas_quinta', weekId, 'volante_1', canEdit)}
            ${renderBrotherSelect('Volante 2', 'mecanicas_quinta', weekId, 'volante_2', canEdit)}
            ${renderBrotherSelect('Palco', 'mecanicas_quinta', weekId, 'palco', canEdit)}
            ${renderBrotherSelect('Som/Mídias', 'mecanicas_quinta', weekId, 'som_midias', canEdit)}
        </div>
        
        <div class="section-header" style="margin-top: 2rem;">Sábado (Final de Semana)</div>
        <div class="designation-grid">
            ${renderBrotherSelect('Indicador Entrada', 'mecanicas_sabado', weekId, 'indicador_entrada', canEdit)}
            ${renderBrotherSelect('Indicador Auditório', 'mecanicas_sabado', weekId, 'indicador_auditorio', canEdit)}
            ${renderBrotherSelect('Volante 1', 'mecanicas_sabado', weekId, 'volante_1', canEdit)}
            ${renderBrotherSelect('Volante 2', 'mecanicas_sabado', weekId, 'volante_2', canEdit)}
            ${renderBrotherSelect('Palco', 'mecanicas_sabado', weekId, 'palco', canEdit)}
            ${renderBrotherSelect('Som/Mídias', 'mecanicas_sabado', weekId, 'som_midias', canEdit)}
        </div>
    `;
}

// ====================================
// DIRIGENTES
// ====================================

function renderDirigentes(container) {
    const weeks = generateWeeks();
    const canEdit = canUserEdit('dirigentes');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Dirigentes de Campo</h3>
            </div>
            
            <div class="week-selector">
                <label>Semana:</label>
                <select id="dirigentesWeekSelect" onchange="updateDirigentesView()">
                    ${weeks.map(w => `<option value="${w.id}">${w.label}</option>`).join('')}
                </select>
            </div>
            
            <div id="dirigentesDesignations"></div>
            
            ${canEdit ? `
                <div class="action-bar">
                    <button class="btn btn-success" onclick="saveDesignations('dirigentes')">Salvar Designações</button>
                    <button class="btn btn-secondary" onclick="gerarPDFDirigentes()" style="margin-left: 0.5rem;">📄 Gerar PDF</button>
                </div>
            ` : '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>'}
        </div>
    `;
    
    updateDirigentesView();
}

function updateDirigentesView() {
    const weekId = document.getElementById('dirigentesWeekSelect').value;
    const data = APP_DATA.designations[weekId]?.dirigentes || {};
    const canEdit = canUserEdit('dirigentes');
    
    const dias = [
        { key: 'segunda', label: 'Segunda-feira' },
        { key: 'terca', label: 'Terça-feira' },
        { key: 'quarta', label: 'Quarta-feira' },
        { key: 'quinta', label: 'Quinta-feira' },
        { key: 'sexta', label: 'Sexta-feira' },
        { key: 'sabado', label: 'Sábado' },
        { key: 'domingo1', label: 'Domingo - 1ª Saída' },
        { key: 'domingo2', label: 'Domingo - 2ª Saída' }
    ];
    
    let html = '';
    
    dias.forEach(dia => {
        const diaData = data[dia.key] || { horario: '', local: '', dirigente: null };
        html += `
            <div class="section-header">${dia.label}</div>
            <div style="background: var(--bg-light); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: grid; grid-template-columns: 120px 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Horário:</label>
                        <input type="text" class="form-control" value="${diaData.horario || ''}"
                            onchange="updateDirigenteField('${weekId}', '${dia.key}', 'horario', this.value)"
                            placeholder="09:00"
                            ${!canEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Local:</label>
                        <input type="text" class="form-control" value="${diaData.local || ''}"
                            onchange="updateDirigenteField('${weekId}', '${dia.key}', 'local', this.value)"
                            placeholder="Salão do Reino"
                            ${!canEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Dirigente:</label>
                        ${renderBrotherSelectInlineDirigente(weekId, dia.key, diaData.dirigente, canEdit)}
                    </div>
                </div>
            </div>
        `;
    });
    
    const ruralData = data.rural || { ativo: false, horario: '', local: '', dirigente: null };
    html += `
        <div style="margin-top: 2rem;">
            <div class="checkbox-group">
                <input type="checkbox" id="ruralCheck_${weekId}" ${ruralData.ativo ? 'checked' : ''}
                    onchange="toggleRural('${weekId}', this.checked)" ${!canEdit ? 'disabled' : ''}>
                <label for="ruralCheck_${weekId}">Incluir saída para o RURAL</label>
            </div>
            
            <div id="ruralSection_${weekId}" style="${ruralData.ativo ? '' : 'display: none;'} margin-top: 1rem;">
                <div class="section-header">Rural</div>
                <div style="background: var(--bg-light); padding: 1rem; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: 120px 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Horário:</label>
                            <input type="text" class="form-control" value="${ruralData.horario || ''}"
                                onchange="updateDirigenteField('${weekId}', 'rural', 'horario', this.value)"
                                ${!canEdit ? 'disabled' : ''}>
                        </div>
                        <div>
                            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Local:</label>
                            <input type="text" class="form-control" value="${ruralData.local || ''}"
                                onchange="updateDirigenteField('${weekId}', 'rural', 'local', this.value)"
                                ${!canEdit ? 'disabled' : ''}>
                        </div>
                        <div>
                            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Dirigente:</label>
                            ${renderBrotherSelectInlineDirigente(weekId, 'rural', ruralData.dirigente, canEdit)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('dirigentesDesignations').innerHTML = html;
}

function renderBrotherSelectInlineDirigente(weekId, dia, value, canEdit) {
    return `
        <select class="form-control" onchange="updateDirigenteField('${weekId}', '${dia}', 'dirigente', this.value)" ${!canEdit ? 'disabled' : ''}>
            <option value="">Selecionar...</option>
            ${APP_DATA.brothers.map(b => `
                <option value="${b.id}" ${value == b.id ? 'selected' : ''}>${b.name}</option>
            `).join('')}
        </select>
    `;
}

function toggleRural(weekId, ativo) {
    if (!APP_DATA.designations[weekId].dirigentes) {
        APP_DATA.designations[weekId].dirigentes = {};
    }
    if (!APP_DATA.designations[weekId].dirigentes.rural) {
        APP_DATA.designations[weekId].dirigentes.rural = { ativo: false, horario: '', local: '', dirigente: null };
    }
    
    APP_DATA.designations[weekId].dirigentes.rural.ativo = ativo;
    document.getElementById(`ruralSection_${weekId}`).style.display = ativo ? '' : 'none';
}

function updateDirigenteField(weekId, dia, field, value) {
    if (!APP_DATA.designations[weekId].dirigentes) {
        APP_DATA.designations[weekId].dirigentes = {};
    }
    if (!APP_DATA.designations[weekId].dirigentes[dia]) {
        APP_DATA.designations[weekId].dirigentes[dia] = { horario: '', local: '', dirigente: null };
    }
    
    APP_DATA.designations[weekId].dirigentes[dia][field] = value;
}

// ====================================
// LIMPEZA
// ====================================

function renderLimpeza(container) {
    const weeks = generateWeeks();
    const canEdit = canUserEdit('limpeza');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Limpeza do Salão</h3>
            </div>
            
            <div class="week-selector">
                <label>Semana:</label>
                <select id="limpezaWeekSelect" onchange="updateLimpezaView()">
                    ${weeks.map(w => `<option value="${w.id}">${w.label}</option>`).join('')}
                </select>
            </div>
            
            <div id="limpezaDesignations"></div>
            
            ${canEdit ? `
                <div class="action-bar">
                    <button class="btn btn-success" onclick="saveDesignations('limpeza')">Salvar</button>
                    <button class="btn btn-secondary" onclick="gerarPDFLimpeza()" style="margin-left: 0.5rem;">📄 Gerar PDF</button>
                </div>
            ` : '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>'}
        </div>
    `;
    
    updateLimpezaView();
}

function updateLimpezaView() {
    const weekId = document.getElementById('limpezaWeekSelect').value;
    const data = APP_DATA.designations[weekId]?.limpeza || {};
    const canEdit = canUserEdit('limpeza');
    
    document.getElementById('limpezaDesignations').innerHTML = `
        <div style="padding: 1.5rem; background: var(--bg-light); border-radius: 8px;">
            <label style="font-weight: 600; margin-bottom: 0.5rem; display: block;">Grupo Responsável pela Limpeza:</label>
            <input type="text" class="form-control" value="${data.grupo_responsavel || ''}"
                onchange="updateTextField('limpeza', '${weekId}', 'grupo_responsavel', this.value)"
                placeholder="Ex: Grupo Salão do Reino"
                ${!canEdit ? 'disabled' : ''}>
        </div>
    `;
}

console.log("Sábado, Mecânicas, Dirigentes e Limpeza carregados!");
// ====================================
// GRUPOS
// ====================================

function renderGrupos(container) {
    const canEdit = APP_DATA.currentUserData.role === 'coordenador' || APP_DATA.currentUserData.role === 'secretario';
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Grupos do Salão do Reino</h3>
            </div>
            
            ${canEdit ? `
                <div style="margin-bottom: 2rem;">
                    <button class="btn btn-success" onclick="openModalGrupo()">Adicionar Novo Grupo</button>
                </div>
            ` : ''}
            
            <div id="gruposList">
                ${APP_DATA.grupos.length === 0 ? 
                    '<p class="text-center" style="color: var(--text-medium); padding: 2rem;">Nenhum grupo cadastrado</p>' :
                    APP_DATA.grupos.map(grupo => `
                        <div class="grupo-item">
                            <div class="grupo-header">
                                <div class="grupo-title">${grupo.nome}</div>
                                ${canEdit ? `
                                    <div class="grupo-actions">
                                        <button class="btn btn-secondary btn-sm" onclick="editGrupo(${grupo.id})">Editar</button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteGrupo(${grupo.id})">Excluir</button>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="grupo-info">
                                <div class="grupo-field">
                                    <div class="grupo-field-label">Ancião:</div>
                                    <div class="grupo-field-value">${grupo.anciao || '-'}</div>
                                </div>
                                <div class="grupo-field">
                                    <div class="grupo-field-label">Assistente:</div>
                                    <div class="grupo-field-value">${grupo.assistente || '-'}</div>
                                </div>
                                <div class="grupo-field">
                                    <div class="grupo-field-label">Membros:</div>
                                    <div class="grupo-field-value">${grupo.membros || '-'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
            
            ${!canEdit ? '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>' : ''}
        </div>
    `;
}

function openModalGrupo(grupoId = null) {
    const modal = document.getElementById('modalGrupo');
    const selectAnciao = document.getElementById('grupoAnciao');
    const selectAssistente = document.getElementById('grupoAssistente');
    
    const optionsHTML = APP_DATA.brothers.map(b => 
        `<option value="${b.name}">${b.name}</option>`
    ).join('');
    
    selectAnciao.innerHTML = '<option value="">Selecionar...</option>' + optionsHTML;
    selectAssistente.innerHTML = '<option value="">Selecionar...</option>' + optionsHTML;
    
    if (grupoId) {
        const grupo = APP_DATA.grupos.find(g => g.id === grupoId);
        if (grupo) {
            document.getElementById('modalGrupoTitle').textContent = 'Editar Grupo';
            document.getElementById('grupoId').value = grupo.id;
            document.getElementById('grupoNome').value = grupo.nome;
            document.getElementById('grupoAnciao').value = grupo.anciao || '';
            document.getElementById('grupoAssistente').value = grupo.assistente || '';
            document.getElementById('grupoMembros').value = grupo.membros || '';
        }
    } else {
        document.getElementById('modalGrupoTitle').textContent = 'Adicionar Novo Grupo';
        document.getElementById('formGrupo').reset();
        document.getElementById('grupoId').value = '';
    }
    
    modal.classList.add('active');
}

function closeModalGrupo() {
    document.getElementById('modalGrupo').classList.remove('active');
}

async function saveGrupo(event) {
    event.preventDefault();
    
    const grupoId = document.getElementById('grupoId').value;
    const grupoData = {
        id: grupoId || Date.now(),
        nome: document.getElementById('grupoNome').value,
        anciao: document.getElementById('grupoAnciao').value,
        assistente: document.getElementById('grupoAssistente').value,
        membros: document.getElementById('grupoMembros').value
    };
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveGrupo', grupo: grupoData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (grupoId) {
                const index = APP_DATA.grupos.findIndex(g => g.id == grupoId);
                if (index !== -1) APP_DATA.grupos[index] = grupoData;
            } else {
                APP_DATA.grupos.push(grupoData);
            }
            
            closeModalGrupo();
            renderTab('grupos');
            alert('Grupo salvo!');
        } else {
            alert('Erro ao salvar');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar');
    }
}

function editGrupo(grupoId) {
    openModalGrupo(grupoId);
}

async function deleteGrupo(grupoId) {
    if (!confirm('Excluir este grupo?')) return;
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteGrupo', grupoId: grupoId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            APP_DATA.grupos = APP_DATA.grupos.filter(g => g.id !== grupoId);
            renderTab('grupos');
            alert('Grupo excluído!');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ====================================
// ANÚNCIOS
// ====================================

function renderAnuncios(container) {
    const canEdit = APP_DATA.currentUserData.role === 'coordenador' || APP_DATA.currentUserData.role === 'secretario';
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Anúncios</h3>
            </div>
            
            ${canEdit ? `
                <div style="margin-bottom: 2rem;">
                    <button class="btn btn-success" onclick="openModalAnuncio()">Adicionar Anúncio</button>
                </div>
            ` : ''}
            
            <div>
                ${APP_DATA.announcements.length === 0 ?
                    '<p class="text-center" style="color: var(--text-medium); padding: 2rem;">Nenhum anúncio</p>' :
                    APP_DATA.announcements.sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => `
                        <div class="announcement-item">
                            <div class="announcement-header">
                                <div class="announcement-date">${formatFullDate(a.date)} - ${a.tipo}</div>
                                ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="deleteAnuncio(${a.id})">Excluir</button>` : ''}
                            </div>
                            <div class="announcement-text">${a.text}</div>
                        </div>
                    `).join('')
                }
            </div>
            
            ${!canEdit ? '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>' : ''}
        </div>
    `;
}

function openModalAnuncio() {
    document.getElementById('modalAnuncio').classList.add('active');
}

function closeModalAnuncio() {
    document.getElementById('modalAnuncio').classList.remove('active');
    document.getElementById('formAnuncio').reset();
}

async function saveAnuncio(event) {
    event.preventDefault();
    
    const anuncioData = {
        id: Date.now(),
        date: document.getElementById('anuncioData').value,
        tipo: document.getElementById('anuncioTipo').value,
        text: document.getElementById('anuncioTexto').value
    };
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveAnuncio', anuncio: anuncioData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            APP_DATA.announcements.push(anuncioData);
            closeModalAnuncio();
            renderTab('anuncios');
            alert('Anúncio adicionado!');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function deleteAnuncio(anuncioId) {
    if (!confirm('Excluir este anúncio?')) return;
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteAnuncio', anuncioId: anuncioId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            APP_DATA.announcements = APP_DATA.announcements.filter(a => a.id !== anuncioId);
            renderTab('anuncios');
            alert('Anúncio excluído!');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ====================================
// CADASTRO DE IRMÃOS
// ====================================

function renderCadastro(container) {
    const canEdit = APP_DATA.currentUserData.role === 'coordenador' || APP_DATA.currentUserData.role === 'secretario';
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Cadastro de Irmãos</h3>
            </div>
            
            ${canEdit ? `
                <div style="margin-bottom: 2rem;">
                    <button class="btn btn-success" onclick="openModalIrmao()">Adicionar Irmão</button>
                </div>
            ` : ''}
            
            <div class="brother-list">
                ${APP_DATA.brothers.length === 0 ?
                    '<p class="text-center" style="color: var(--text-medium); padding: 2rem;">Nenhum irmão cadastrado</p>' :
                    APP_DATA.brothers.sort((a, b) => a.name.localeCompare(b.name)).map(b => `
                        <div class="brother-item">
                            <span>${b.name}</span>
                            ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="deleteIrmao(${b.id})">Excluir</button>` : ''}
                        </div>
                    `).join('')
                }
            </div>
            
            ${!canEdit ? '<p style="color: var(--text-medium); margin-top: 2rem;">Acesso apenas leitura</p>' : ''}
        </div>
    `;
}

function openModalIrmao() {
    document.getElementById('modalIrmao').classList.add('active');
}

function closeModalIrmao() {
    document.getElementById('modalIrmao').classList.remove('active');
    document.getElementById('formIrmao').reset();
    // Desmarcar todos checkboxes
    ['dirigente', 'mecanicas', 'presidente', 'leitor', 'estudo', 'discurso', 'joias', 'vida_crista', 'oracoes'].forEach(q => {
        document.getElementById(`irmao_${q}`).checked = false;
    });
}

async function saveIrmao(event) {
    event.preventDefault();
    
    const irmaoData = {
        id: Date.now(),
        name: document.getElementById('irmaoNome').value,
        dirigente: document.getElementById('irmao_dirigente').checked,
        mecanicas: document.getElementById('irmao_mecanicas').checked,
        presidente: document.getElementById('irmao_presidente').checked,
        leitor: document.getElementById('irmao_leitor').checked,
        estudo: document.getElementById('irmao_estudo').checked,
        discurso: document.getElementById('irmao_discurso').checked,
        joias: document.getElementById('irmao_joias').checked,
        vida_crista: document.getElementById('irmao_vida_crista').checked,
        oracoes: document.getElementById('irmao_oracoes').checked
    };
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveIrmao', irmao: irmaoData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            APP_DATA.brothers.push(irmaoData);
            closeModalIrmao();
            renderTab('cadastro');
            alert('Irmão adicionado!');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function deleteIrmao(irmaoId) {
    if (!confirm('Excluir este irmão?')) return;
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteIrmao', irmaoId: irmaoId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            APP_DATA.brothers = APP_DATA.brothers.filter(b => b.id !== irmaoId);
            renderTab('cadastro');
            alert('Irmão excluído!');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function renderBrotherSelect(label, meeting, weekId, field, canEdit) {
    const data = APP_DATA.designations[weekId]?.[meeting]?.[field] || null;
    
    return `
        <div class="designation-item">
            <div class="designation-label">${label}</div>
            <select class="brother-select" data-meeting="${meeting}" data-week="${weekId}" data-field="${field}" 
                onchange="updateBrotherSelect(this)" ${!canEdit ? 'disabled' : ''}>
                <option value="">Selecionar...</option>
                ${APP_DATA.brothers.map(b => `
                    <option value="${b.id}" ${data == b.id ? 'selected' : ''}>${b.name}</option>
                `).join('')}
            </select>
            ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="clearBrotherSelect('${meeting}', '${weekId}', '${field}')">Limpar</button>` : '<div></div>'}
        </div>
    `;
}

function updateBrotherSelect(select) {
    const meeting = select.dataset.meeting;
    const weekId = select.dataset.week;
    const field = select.dataset.field;
    const value = select.value;
    
    if (!APP_DATA.designations[weekId]) APP_DATA.designations[weekId] = {};
    if (!APP_DATA.designations[weekId][meeting]) APP_DATA.designations[weekId][meeting] = {};
    
    APP_DATA.designations[weekId][meeting][field] = value;
}

function clearBrotherSelect(meeting, weekId, field) {
    if (APP_DATA.designations[weekId]?.[meeting]) {
        APP_DATA.designations[weekId][meeting][field] = null;
    }
    
    switch(meeting) {
        case 'sabado': updateSabadoView(); break;
        case 'mecanicas_quinta':
        case 'mecanicas_sabado': updateMecanicasView(); break;
    }
}

function updateTextField(meeting, weekId, field, value) {
    if (!APP_DATA.designations[weekId]) APP_DATA.designations[weekId] = {};
    if (!APP_DATA.designations[weekId][meeting]) APP_DATA.designations[weekId][meeting] = {};
    
    APP_DATA.designations[weekId][meeting][field] = value;
}

async function saveDesignations(meeting) {
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveDesignations',
                meeting: meeting,
                data: APP_DATA.designations
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Salvo com sucesso!');
        } else {
            alert('Erro ao salvar');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar');
    }
}

function canUserEdit(tabName) {
    const user = APP_DATA.currentUserData;
    
    if (user.role === 'coordenador' || user.role === 'secretario') {
        return true;
    }
    
    return user.tabs.includes(tabName);
}

console.log('Sistema FINAL completo carregado! 🎉');

// ====================================
// TROCAR SENHA
// ====================================

function openModalTrocarSenha() {
    document.getElementById('modalTrocarSenha').classList.add('active');
}

function closeModalTrocarSenha() {
    document.getElementById('modalTrocarSenha').classList.remove('active');
    document.getElementById('formTrocarSenha').reset();
}

async function trocarSenha(event) {
    event.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    // Validações
    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (novaSenha.length < 4) {
        alert('A senha deve ter no mínimo 4 caracteres!');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'changePassword',
                email: APP_DATA.currentUser,
                oldPassword: senhaAtual,
                newPassword: novaSenha
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Senha alterada com sucesso!');
            closeModalTrocarSenha();
        } else {
            alert(result.message || 'Erro ao alterar senha');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao alterar senha');
    }
}

// Carregar o gerador de PDF FINAL
const script = document.createElement('script');
script.src = 'pdf-generator-final.js';
document.head.appendChild(script);
