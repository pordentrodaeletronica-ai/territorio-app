// Configurações do Sistema de Designações
const CONFIG = {
    // URL do Google Apps Script
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzbw_Kerko_d5NqVh13vFLQZo0Q-ZWKxY0dLc3TLkX3Q86E5AlzvtcQkCtlBB3gXrxU/exec',
    
    // ID da Planilha Google Sheets
    SPREADSHEET_ID: '13rDNI-MVsqIanLeC13mPVdYsxbFEmrizOXwwF3vni3A',
    
    // Data inicial para geração de semanas
    START_DATE: '2025-01-06',
    
    // Número de semanas a exibir
    WEEKS_COUNT: 8,
    
    // Cores do sistema
    COLORS: {
        roxoJw: '#5b3c88',
        azureTesouros: '#4bacc6',
        amareloMinisterio: '#ffc000',
        vermelhoVida: '#bf2f13'
    },
    
    // Nomes das abas
    TAB_NAMES: {
        'quinta': 'Meio de Semana',
        'sabado': 'Final de Semana',
        'mecanicas': 'Partes Mecânicas',
        'dirigentes': 'Dirigentes de Campo',
        'limpeza': 'Limpeza',
        'grupos': 'Grupos',
        'anuncios': 'Anúncios',
        'cadastro': 'Cadastro de Irmãos'
    },
    
    // Nomes de exibição dos roles
    ROLE_DISPLAY: {
        'coordenador': 'Coordenador',
        'secretario': 'Secretário',
        'designacao_quinta': 'Designação Meio de Semana',
        'designacao_sabado': 'Designação Final de Semana',
        'designacao_limpeza': 'Designação da Limpeza',
        'superintendente': 'Superintendente de Serviço',
        'anciao': 'Ancião'
    }
};

// Dados da aplicação
const APP_DATA = {
    currentUser: null,
    currentUserData: null,
    brothers: [],
    designations: {},
    announcements: [],
    grupos: []
};
