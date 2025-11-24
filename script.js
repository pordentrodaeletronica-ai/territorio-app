// ============================================
// CONFIGURAÇÃO
// ============================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbynjSXxB53BUK11HiXMz8jV3lifLozxHqbBDqSGEO4f0wW_hZhIl9E2eOWAv2V7mOZf7w/exec';
const USER_DATA_KEY = 'territorio_user_data';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let usuarioAtual = null;
let territorioAtual = null;
let quadrasData = [];
let territorioIndex = 0;

// ============================================
// INICIALIZAÇÃO
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
            verificarSessao();
        }, 500);
    }, 1500);
    
    inicializarEventos();
});

function inicializarEventos() {
    document.getElementById('btn-login').addEventListener('click', fazerLogin);
    document.getElementById('codigo-acesso').addEventListener('keypress', (e) => { if (e.key === 'Enter') fazerLogin(); });
    document.getElementById('btnSair').addEventListener('click', fazerLogout);
    document.getElementById('btn-prev-territorio').addEventListener('click', () => alternarTerritorio(-1));
    document.getElementById('btn-next-territorio').addEventListener('click', () => alternarTerritorio(1));
    document.getElementById('btn-ver-mapa').addEventListener('click', mostrarMapa);
    document.getElementById('btn-salvar-quadra').addEventListener('click', salvarQuadra);
    document.getElementById('btn-cancelar-modal').addEventListener('click', () => { document.getElementById('modal-quadra').style.display = 'none'; });
    document.getElementById('quadra-status').addEventListener('change', atualizarCamposModal);
    document.getElementById('btn-finalizar-tudo').addEventListener('click', () => selecionarOpcaoFechada('finalizar'));
    document.getElementById('btn-ainda-faltam').addEventListener('click', () => selecionarOpcaoFechada('faltam'));
    document.getElementById('btnSincronizar').addEventListener('click', sincronizarAgora);
    document.getElementById('btnTrocarDirigente').addEventListener('click', abrirModalTroca);
    document.getElementById('btn-confirmar-troca').addEventListener('click', confirmarTrocaDirigente);
    document.getElementById('btn-cancelar-troca').addEventListener('click', () => { document.getElementById('modal-troca').style.display = 'none'; });
}

function verificarSessao() {
    const dadosSalvos = localStorage.getItem(USER_DATA_KEY);
    if (dadosSalvos) {
        try {
            usuarioAtual = JSON.parse(dadosSalvos);
            if (usuarioAtual.territorioAtual) { mostrarTelaInicial(); carregarDadosTerritorio(); }
            else if (usuarioAtual.territorios && usuarioAtual.territorios.length > 1) mostrarSelecaoTerritorio();
            else if (usuarioAtual.territorios && usuarioAtual.territorios.length === 1) { usuarioAtual.territorioAtual = usuarioAtual.territorios[0].territorioId; localStorage.setItem(USER_DATA_KEY, JSON.stringify(usuarioAtual)); mostrarTelaInicial(); carregarDadosTerritorio(); }
            else mostrarTelaLogin();
        } catch (e) { mostrarTelaLogin(); }
    } else { mostrarTelaLogin(); }
}

async function fazerLogin() {
    const codigo = document.getElementById('codigo-acesso').value.trim().toUpperCase();
    const btnLogin = document.getElementById('btn-login');
    if (!codigo) { mostrarToast('Por favor, digite seu código', 'erro'); return; }
    btnLogin.disabled = true; btnLogin.textContent = 'Verificando...';
    try {
        const dados = await fazerLoginAPI(codigo);
        usuarioAtual = dados; localStorage.setItem(USER_DATA_KEY, JSON.stringify(dados));
        mostrarToast('Bem-vindo, ' + dados.nome + '!', 'sucesso');
        if (dados.territorios && dados.territorios.length > 1) setTimeout(() => mostrarSelecaoTerritorio(), 500);
        else if (dados.territorios && dados.territorios.length === 1) { usuarioAtual.territorioAtual = dados.territorios[0].territorioId; localStorage.setItem(USER_DATA_KEY, JSON.stringify(usuarioAtual)); setTimeout(() => { mostrarTelaInicial(); carregarDadosTerritorio(); }, 500); }
        else setTimeout(() => { mostrarTelaInicial(); carregarDadosTerritorio(); }, 500);
    } catch (erro) { mostrarToast(erro.message || 'Código não encontrado', 'erro'); btnLogin.disabled = false; btnLogin.textContent = 'Entrar'; }
}

function mostrarSelecaoTerritorio() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('selecao-territorio-screen').classList.remove('hidden');
    document.getElementById('user-name-selecao').textContent = usuarioAtual.nome;
    const container = document.getElementById('lista-territorios');
    container.innerHTML = '';
    usuarioAtual.territorios.forEach(t => {
        const card = document.createElement('div');
        card.className = 'territorio-card';
        card.innerHTML = `<h3>Território ${t.territorioId}</h3><p>Designado em: ${formatarData(t.dataDesignacao)}</p>`;
        card.onclick = () => selecionarTerritorio(t.territorioId);
        container.appendChild(card);
    });
}

function selecionarTerritorio(territorioId) {
    usuarioAtual.territorioAtual = territorioId; localStorage.setItem(USER_DATA_KEY, JSON.stringify(usuarioAtual));
    document.getElementById('selecao-territorio-screen').classList.add('hidden'); mostrarTelaInicial(); carregarDadosTerritorio();
}

function configurarAlternadorTerritorios() {
    const switcher = document.getElementById('territorio-switcher');
    if (!usuarioAtual || !usuarioAtual.territorios || usuarioAtual.territorios.length <= 1) { switcher.classList.add('hidden'); return; }
    switcher.classList.remove('hidden');
    territorioIndex = usuarioAtual.territorios.findIndex(t => t.territorioId == usuarioAtual.territorioAtual);
    if (territorioIndex === -1) territorioIndex = 0;
    atualizarNomeTerritorioAtual();
}

function atualizarNomeTerritorioAtual() {
    const t = usuarioAtual.territorios[territorioIndex];
    document.getElementById('territorio-atual-nome').textContent = `${t.territorioId} - ${territorioAtual ? territorioAtual.nome : 'Carregando...'}`;
}

function alternarTerritorio(direcao) {
    territorioIndex += direcao;
    if (territorioIndex < 0) territorioIndex = usuarioAtual.territorios.length - 1;
    else if (territorioIndex >= usuarioAtual.territorios.length) territorioIndex = 0;
    const novoTerritorioId = usuarioAtual.territorios[territorioIndex].territorioId;
    usuarioAtual.territorioAtual = novoTerritorioId; localStorage.setItem(USER_DATA_KEY, JSON.stringify(usuarioAtual));
    mostrarToast('Carregando território...', 'aviso'); carregarDadosTerritorio();
}

function mostrarTelaLogin() { document.getElementById('login-screen').classList.remove('hidden'); document.getElementById('codigo-acesso').value = ''; }

function mostrarTelaInicial() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('selecao-territorio-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('rodape-sync').classList.remove('hidden');
    document.getElementById('user-name').textContent = usuarioAtual.nome;
    configurarAlternadorTerritorios();
}

function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem(USER_DATA_KEY); usuarioAtual = null; territorioAtual = null; quadrasData = [];
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('main-header').classList.add('hidden');
        document.getElementById('rodape-sync').classList.add('hidden');
        mostrarTelaLogin();
    }
}

async function carregarDadosTerritorio() {
    if (!usuarioAtual || !usuarioAtual.territorioAtual) {
        document.getElementById('territorio-titulo').textContent = 'Você não possui território designado';
        document.getElementById('quadras-container').innerHTML = '<p style="text-align:center; color:#999; padding:40px;">Aguardando designação.</p>';
        atualizarResumo(0, 0, 0, 0); syncManager.atualizarStatus('synced', 'Sem território'); return;
    }
    try {
        syncManager.atualizarStatus('syncing', 'Carregando...');
        const dados = await carregarTerritorioAPI(usuarioAtual.territorioAtual);
        territorioAtual = { id: dados.territorioId, nome: dados.territorioNome };
        quadrasData = dados.quadras;
        document.getElementById('territorio-titulo').textContent = `Território ${dados.territorioId} - ${dados.territorioNome}`;
        atualizarResumo(dados.stats.total, dados.stats.fechadas, dados.stats.emAberto, dados.stats.naoIniciadas);
        renderizarQuadras();
        if (usuarioAtual.territorios && usuarioAtual.territorios.length > 1) atualizarNomeTerritorioAtual();
        syncManager.atualizarStatus('synced', 'Atualizado');
        localStorage.setItem('territorio_cache', JSON.stringify({ territorio: territorioAtual, quadras: quadrasData, timestamp: new Date().toISOString() }));
    } catch (erro) { console.error('Erro:', erro); mostrarToast('Erro ao carregar território', 'erro'); syncManager.atualizarStatus('error', 'Erro'); }
}

function mostrarMapa() {
    if (!territorioAtual || !territorioAtual.id) { mostrarToast('Nenhum território carregado', 'erro'); return; }
    window.open('https://drive.google.com/drive/folders/1wQiIvWGud5GMtdwxV6RtmQDUSLK_ZqzI', '_blank');
    mostrarToast(`Procure: ${String(territorioAtual.id).padStart(2, '0')}-${territorioAtual.nome}`, 'aviso');
}

function renderizarQuadras() {
    const container = document.getElementById('quadras-container');
    container.innerHTML = '';
    if (!quadrasData || quadrasData.length === 0) { container.innerHTML = '<p style="text-align:center; color:#999;">Nenhuma quadra</p>'; return; }
    quadrasData.forEach(quadra => {
        const card = document.createElement('div');
        card.className = 'quadra-card'; card.classList.add(`status-${quadra.status}`);
        const statusTexto = {'nao_iniciada': 'Não iniciada', 'em_aberto': 'Em aberto', 'fechada': 'Fechada'}[quadra.status] || quadra.status;
        card.innerHTML = `<h4>📍 Quadra ${quadra.quadra}</h4><p><strong>Status:</strong> ${statusTexto}</p>${quadra.ondeParou ? `<p><strong>Onde parou:</strong> ${quadra.ondeParou}</p>` : ''}${quadra.dataAtualizacao ? `<p><strong>Atualizado:</strong> ${formatarData(quadra.dataAtualizacao)}</p>` : ''}`;
        card.onclick = () => abrirModalQuadra(quadra); container.appendChild(card);
    });
}

function atualizarResumo(total, fechadas, emAberto, naoIniciadas) {
    document.getElementById('resumo-total').textContent = total;
    document.getElementById('resumo-fechadas').textContent = fechadas;
    document.getElementById('resumo-aberto').textContent = emAberto;
    document.getElementById('resumo-nao-iniciadas').textContent = naoIniciadas;
}

let quadraAtual = null; let opcaoFechadaSelecionada = null;

function abrirModalQuadra(quadra) {
    quadraAtual = quadra;
    document.getElementById('modal-titulo').textContent = `Quadra ${quadra.quadra}`;
    document.getElementById('quadra-status').value = quadra.status;
    document.getElementById('quadra-onde-parou').value = quadra.ondeParou || '';
    document.getElementById('quadra-observacoes').value = quadra.observacoes || '';
    atualizarCamposModal(); document.getElementById('modal-quadra').style.display = 'flex';
}

function atualizarCamposModal() {
    const status = document.getElementById('quadra-status').value;
    const opcoesFechada = document.getElementById('opcoes-fechada');
    const campoOndeParou = document.getElementById('campo-onde-parou');
    opcoesFechada.classList.add('hidden'); campoOndeParou.classList.add('hidden');
    if (status === 'fechada') opcoesFechada.classList.remove('hidden');
    else if (status === 'em_aberto') campoOndeParou.classList.remove('hidden');
}

function selecionarOpcaoFechada(opcao) {
    opcaoFechadaSelecionada = opcao;
    const btnFinalizar = document.getElementById('btn-finalizar-tudo');
    const btnFaltam = document.getElementById('btn-ainda-faltam');
    const campoOndeParou = document.getElementById('campo-onde-parou');
    if (opcao === 'finalizar') { btnFinalizar.classList.add('selecionado'); btnFaltam.classList.remove('selecionado'); campoOndeParou.classList.add('hidden'); }
    else { btnFaltam.classList.add('selecionado'); btnFinalizar.classList.remove('selecionado'); campoOndeParou.classList.remove('hidden'); }
}

function salvarQuadra() {
    const status = document.getElementById('quadra-status').value;
    const ondeParou = document.getElementById('quadra-onde-parou').value.trim();
    const observacoes = document.getElementById('quadra-observacoes').value.trim();
    if (status === 'fechada' && !opcaoFechadaSelecionada) { mostrarToast('Escolha uma opção', 'erro'); return; }
    if (status === 'fechada' && opcaoFechadaSelecionada === 'faltam' && !ondeParou) { mostrarToast('Informe onde parou', 'erro'); return; }
    if (status === 'em_aberto' && !ondeParou) { mostrarToast('Informe onde parou', 'erro'); return; }
    quadraAtual.status = status; quadraAtual.ondeParou = (status === 'fechada' && opcaoFechadaSelecionada === 'finalizar') ? '' : ondeParou;
    quadraAtual.observacoes = observacoes; quadraAtual.dataAtualizacao = new Date().toISOString();
    syncManager.adicionar('atualizar_quadra', { territorioId: territorioAtual.id, quadra: quadraAtual.quadra, status: quadraAtual.status, ondeParou: quadraAtual.ondeParou, observacoes: quadraAtual.observacoes, dataAtualizacao: quadraAtual.dataAtualizacao });
    renderizarQuadras(); const stats = calcularStats(quadrasData); atualizarResumo(stats.total, stats.fechadas, stats.emAberto, stats.naoIniciadas);
    localStorage.setItem('territorio_cache', JSON.stringify({ territorio: territorioAtual, quadras: quadrasData, timestamp: new Date().toISOString() }));
    document.getElementById('modal-quadra').style.display = 'none'; mostrarToast('Quadra atualizada!', 'sucesso'); opcaoFechadaSelecionada = null;
}

function calcularStats(quadras) {
    const stats = { total: quadras.length, fechadas: 0, emAberto: 0, naoIniciadas: 0 };
    quadras.forEach(q => { if (q.status === 'fechada') stats.fechadas++; else if (q.status === 'em_aberto') stats.emAberto++; else stats.naoIniciadas++; });
    return stats;
}

async function abrirModalTroca() {
    const modal = document.getElementById('modal-troca');
    const selecaoTerritorio = document.getElementById('selecao-territorio-troca');
    const selectTerritorio = document.getElementById('territorio-para-trocar');
    if (usuarioAtual.territorios && usuarioAtual.territorios.length > 1) {
        selecaoTerritorio.classList.remove('hidden'); selectTerritorio.innerHTML = '';
        usuarioAtual.territorios.forEach(t => {
            const option = document.createElement('option'); option.value = t.territorioId; option.textContent = `Território ${t.territorioId}`;
            if (t.territorioId == usuarioAtual.territorioAtual) option.selected = true;
            selectTerritorio.appendChild(option);
        });
    } else { selecaoTerritorio.classList.add('hidden'); }
    try {
        const dirigentes = await listarDirigentesAPI();
        const select = document.getElementById('novo-dirigente');
        select.innerHTML = '<option value="">Selecione</option>';
        dirigentes.forEach(d => { if (d.codigo !== usuarioAtual.codigo) { const option = document.createElement('option'); option.value = d.codigo; option.textContent = d.nome; select.appendChild(option); } });
    } catch (erro) { mostrarToast('Erro ao carregar dirigentes', 'erro'); }
    modal.style.display = 'flex';
}

async function confirmarTrocaDirigente() {
    const novoDirigenteCodigo = document.getElementById('novo-dirigente').value;
    if (!novoDirigenteCodigo) { mostrarToast('Selecione um dirigente', 'erro'); return; }
    let territorioParaTrocar;
    if (usuarioAtual.territorios && usuarioAtual.territorios.length > 1) territorioParaTrocar = document.getElementById('territorio-para-trocar').value;
    else territorioParaTrocar = usuarioAtual.territorioAtual;
    if (!confirm(`Confirma a transferência do Território ${territorioParaTrocar}?`)) return;
    try {
        syncManager.adicionar('trocar_dirigente', { territorioId: territorioParaTrocar, dirigenteAtual: usuarioAtual.codigo, novoDirigente: novoDirigenteCodigo });
        document.getElementById('modal-troca').style.display = 'none'; mostrarToast('Troca enviada!', 'sucesso');
        if (territorioParaTrocar == usuarioAtual.territorioAtual) setTimeout(() => fazerLogout(), 2000);
    } catch (erro) { mostrarToast('Erro ao solicitar troca', 'erro'); }
}

async function sincronizarAgora() {
    const btn = document.getElementById('btnSincronizar');
    const btnText = document.getElementById('sync-btn-text');
    const btnIcon = document.getElementById('sync-btn-icon');
    btn.disabled = true; btnText.textContent = 'Enviando...'; btnIcon.textContent = '⏳';
    await syncManager.sincronizar(); await carregarDadosTerritorio();
    registrarEnvioDados();
    setTimeout(() => { btn.disabled = false; btnText.textContent = 'Enviar dados das quadras'; btnIcon.textContent = '📤'; }, 1000);
}

function registrarEnvioDados() { localStorage.setItem('territorio_ultimo_envio', new Date().toDateString()); }

async function fazerLoginAPI(codigo) {
    const url = `${APPS_SCRIPT_URL}?action=login&codigo=${encodeURIComponent(codigo)}`;
    const response = await fetch(url); const resultado = await response.json();
    if (!resultado.sucesso) throw new Error(resultado.mensagem);
    return resultado.dados;
}

async function carregarTerritorioAPI(territorioId) {
    const url = `${APPS_SCRIPT_URL}?action=carregar&territorio=${territorioId}`;
    const response = await fetch(url); const resultado = await response.json();
    if (!resultado.sucesso) throw new Error(resultado.mensagem);
    return resultado.dados;
}

async function listarDirigentesAPI() {
    const url = `${APPS_SCRIPT_URL}?action=listar_dirigentes`;
    const response = await fetch(url); const resultado = await response.json();
    if (!resultado.sucesso) throw new Error(resultado.mensagem);
    return resultado.dados;
}

function mostrarToast(mensagem, tipo = 'sucesso') {
    const toastExistente = document.querySelector('.toast-message');
    if (toastExistente) toastExistente.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-message'; toast.textContent = mensagem;
    if (tipo === 'erro') toast.style.background = '#f44336';
    else if (tipo === 'aviso') toast.style.background = '#ff9800';
    else toast.style.background = '#4caf50';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;
    return d.toLocaleDateString('pt-BR');
}

console.log('✅ Script.js OK');
