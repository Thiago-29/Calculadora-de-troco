// Aguarda todo o conteúdo da página ser carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // ============================
    // SEÇÃO 1: SELEÇÃO DE ELEMENTOS
    // ============================

    const totalCompraInput = document.getElementById('total-compra');
    const valorPagoInput = document.getElementById('valor-pago');
    const calcularBtn = document.getElementById('calcular');
    const resultadoDiv = document.getElementById('resultado');

    // Elementos adicionais para o Estoque de Troco e o Toggle
    const toggleBtn = document.getElementById('toggle-estoque');
    const estoqueContent = document.getElementById('estoque-content');


    // ============================
    // SEÇÃO 2: MAPA DE VALORES E ESTOQUE
    // ============================

    // Mapeia os valores (em centavos) das cédulas e moedas para o ID do input correspondente
    const mapaValoresParaIDs = {
        20000: 'qnt_200',   // R$ 200,00
        10000: 'qnt_100',   // R$ 100,00
        5000:  'qnt_50',    // R$ 50,00
        2000:  'qnt_20',    // R$ 20,00
        1000:  'qnt_10',    // R$ 10,00
        500:   'qnt_5',     // R$ 5,00
        200:   'qnt_2',     // R$ 2,00
        100:   'qnt_1',     // R$ 1,00
        50:    'qnt_0_50',  // R$ 0,50
        25:    'qnt_0_25',  // R$ 0,25
        10:    'qnt_0_10',  // R$ 0,10
        5:     'qnt_0_05'   // R$ 0,05
    };
    
    // Cria um array com os valores das cédulas e moedas em centavos, ordenados do maior para o menor
    const cedulasEMoedasEmCentavos = Object.keys(mapaValoresParaIDs)
        .map(Number)
        .sort((a, b) => b - a);
    
    // ============================
    // SEÇÃO 3: FUNÇÃO DE CÁLCULO DE TROCO (COM ESTOQUE)
    // ============================

    // Função que calcula o troco respeitando o estoque de notas/moedas
    function calcularTrocoPorCedulas(troco) {
        let resultadoTexto = '<ul>';
        let trocoRestante = Math.round(troco * 100); // Troco em centavos

        // --- 1. LÊ O ESTOQUE ATUAL DEFINIDO PELO USUÁRIO ---
        const estoqueAtual = {};
        for (const [valorEmCentavos, id] of Object.entries(mapaValoresParaIDs)) {
            const inputElement = document.getElementById(id);
            // Lê a quantidade de cada cédula disponível e garante que seja um número inteiro, ou zero
            estoqueAtual[Number(valorEmCentavos)] = parseInt(inputElement.value) || 0;
        }

        let trocoCalculado = {};
        let trocoConseguiuDar = true;

        // --- 2. CALCULA O TROCO USANDO O ESTOQUE DISPONÍVEL ---
        for (const valorEmCentavos of cedulasEMoedasEmCentavos) {
            // Quantidade máxima disponível dessa cédula
            let limiteDeUso = estoqueAtual[valorEmCentavos] || 0;

            // Quantidade ideal de notas/moedas necessária (sem considerar o estoque)
            let quantidadeIdeal = Math.floor(trocoRestante / valorEmCentavos);

            // Usa apenas o que está disponível no estoque
            let quantidadeUsada = Math.min(quantidadeIdeal, limiteDeUso);
            
            // Se for usar alguma quantidade dessa cédula/moeda
            if (quantidadeUsada > 0) {
                // Armazena o valor e a quantidade usada
                trocoCalculado[valorEmCentavos] = quantidadeUsada;
                
                // Subtrai o valor usado do troco restante
                trocoRestante -= quantidadeUsada * valorEmCentavos;
            }
        }
        
        // --- 3. MONTA O RESULTADO VISUAL ---
        for (const valor of cedulasEMoedasEmCentavos) {
            if (trocoCalculado[valor]) {
                const quantidade = trocoCalculado[valor];
                const valorReal = valor / 100; // Converte centavos para reais
                const tipo = valorReal >= 2 ? 'nota' : 'moeda'; // Define o tipo (nota ou moeda)
                const plural = quantidade > 1 ? 's' : ''; // Define plural
                const valorFormatado = valorReal.toFixed(2).replace('.', ',');

                // Adiciona a linha na lista de troco
                resultadoTexto += `<li>${quantidade} ${tipo}${plural} de R$ ${valorFormatado}</li>`;
            }
        }

        // Se ainda sobrou troco e o caixa não tem notas suficientes
        if (trocoRestante > 0) {
            trocoConseguiuDar = false;
            // Mostra mensagem de erro destacada
            resultadoTexto += `<li style="color: red; font-weight: 700;">[ATENÇÃO] Troco indisponível! Faltam R$ ${(trocoRestante / 100).toFixed(2).replace('.', ',')}</li>`;
        }
        
        resultadoTexto += '</ul>'; // Fecha a lista
        // Retorna o HTML e a flag de sucesso
        return {html: resultadoTexto, sucesso: trocoConseguiuDar};
    }
    
    // ============================
    // SEÇÃO 4: LÓGICA DE TOGGLE (ESCONDER/MOSTRAR ESTOQUE)
    // ============================
    
    // Inicia o estoque escondido por padrão (opcional, mas bom para usabilidade)
    // Se você quer que ele comece ABERTO, remova estas linhas:
    estoqueContent.classList.add('hidden');
    toggleBtn.setAttribute('aria-expanded', 'false');


    // Evento de clique para esconder/mostrar a seção de estoque
    toggleBtn.addEventListener('click', () => {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            estoqueContent.classList.add('hidden');
            toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
            estoqueContent.classList.remove('hidden');
            toggleBtn.setAttribute('aria-expanded', 'true');
        }
    });

    // ============================
    // SEÇÃO 5: EVENTO PRINCIPAL DE CÁLCULO
    // ============================

    // Quando o usuário clicar no botão "Calcular"
    calcularBtn.addEventListener('click', () => {
        
        // --- ANIMAÇÃO: Esconde o resultado anterior (reinicia a animação) ---
        resultadoDiv.classList.add('hidden-result');
        
        // Função auxiliar para processar o valor digitado (aceita vírgula ou ponto)
        function processarValor(valor) {
            if (valor.indexOf(',') !== -1) {
                return parseFloat(valor.replace(',', '.'));
            }
            return parseFloat(valor);
        }

        // Converte os valores dos inputs para número decimal
        const totalCompra = processarValor(totalCompraInput.value);
        const valorPago = processarValor(valorPagoInput.value);
        
        // Variáveis de controle de resultado e estilo
        let htmlContent = '';
        let borderColor = '';
        let bgColor = '';
        let shouldAnimate = false;

        // 1. Validação de Entrada
        if (isNaN(totalCompra) || isNaN(valorPago) || totalCompra <= 0) {
            htmlContent = '<p style="color: red;">Por favor, insira valores válidos para a compra.</p>';
            borderColor = '#e57373';
            bgColor = '#ffebee';
        } 
        // 2. Verifica se o valor pago é insuficiente
        else if (valorPago < totalCompra) {
            const faltando = (totalCompra - valorPago).toFixed(2).replace('.', ',');
            htmlContent = `<p style="color: red;">Valor pago insuficiente. Faltam: R$ ${faltando}</p>`;
            borderColor = '#e57373';
            bgColor = '#ffebee';
        } 
        // 3. Cálculo válido
        else {
            const troco = valorPago - totalCompra;
            
            // Chama a função para calcular o troco detalhado (respeitando o estoque)
            const resultadoTroco = calcularTrocoPorCedulas(troco);
            
            // Define o conteúdo e cores baseado no sucesso do troco
            if (resultadoTroco.sucesso) {
                htmlContent = `<p style="color: green;">Troco total: R$ ${troco.toFixed(2).replace('.', ',')}</p>`;
                htmlContent += '<h3>Detalhes do Troco:</h3>';
                htmlContent += resultadoTroco.html;
                
                borderColor = '#81c784'; 
                bgColor = '#e8f5e9'; 
            } else {
                htmlContent = `<p style="color: red;">Troco total: R$ ${troco.toFixed(2).replace('.', ',')}</p>`;
                htmlContent += '<h3>Detalhes do Troco:</h3>';
                htmlContent += resultadoTroco.html;
                
                borderColor = '#e57373';
                bgColor = '#ffebee';
            }
            
            shouldAnimate = true; // Habilita a animação de exibição
        }

        // Aplica o conteúdo HTML e os estilos de cor
        resultadoDiv.innerHTML = htmlContent;
        resultadoDiv.style.borderColor = borderColor;
        resultadoDiv.style.backgroundColor = bgColor;

        // Inicia a animação (remove a classe que esconde/reposiciona)
        if (shouldAnimate) {
            // Pequeno delay para garantir o reinício da transição CSS
            setTimeout(() => {
                resultadoDiv.classList.remove('hidden-result');
            }, 10); 
        }
    });
});