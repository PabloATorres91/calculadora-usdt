// ================================================================
// 1. SISTEMA DE PESTAÑAS Y CARGA DE ARCHIVOS (CON EVENTOS)
// ================================================================
async function cargarPagina(rutaHtml) {
    const contenedor = document.getElementById('contenedor-dinamico');
    const contenedorDolar = document.getElementById('contenedor-dolar');
    if (contenedorDolar) contenedorDolar.style.display = 'none';
    if (contenedor) contenedor.style.display = 'block';
    
    // 1. Poner el texto de "Cargando..." mientras se descarga
    contenedor.innerHTML = '<div style="text-align:center; padding:20px; color:#6a7e99;">Cargando calculadora...</div>';

    // 2. Usar fetch para traer el contenido del archivo HTML
    fetch(rutaHtml)
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo cargar la página");
            }
            return response.text();
        })
        .then(html => {
            // 3. Inyectar el HTML en el contenedor
            contenedor.innerHTML = html;
            
            // 4. Ejecutar los scripts que estén dentro de la página cargada (si hubiera alguno)
            const scripts = contenedor.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                eval(scripts[i].innerHTML); 
            }

            // ... (código anterior) ...

            if (rutaHtml.includes('spread.html') && typeof window.calcularSpread === 'function') {
                const inputsSpread = ['precioVenta', 'arsRecibidos', 'precioCompra', 'arsRecompra'];
                // Restaurar valores guardados
                restaurarPestana(inputsSpread);
                agregarEventosAInputs(inputsSpread, window.calcularSpread);
                // Guardar automáticamente cada vez que se escribe (ya lo hace el evento input, pero reforzamos)
                inputsSpread.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                agregarSyncBybit('precioVenta');
                agregarSyncCompra('precioCompra');
                agregarSyncCampoPar('arsRecibidos', SYNC_ARS_SPREAD_IDS);
                agregarSyncCampoPar('arsRecompra', SYNC_ARS_SPREAD_IDS);
                const gananciaObjEl = document.getElementById('gananciaObjetivo');
                if (gananciaObjEl) {
                    const guardado = localStorage.getItem('gananciaObjetivo');
                    if (guardado !== null) gananciaObjEl.value = guardado;
                    gananciaObjEl.addEventListener('input', function() {
                        guardarInput('gananciaObjetivo');
                        window.recalcularPrecioCompraObjetivo();
                    });
                    gananciaObjEl.addEventListener('change', window.recalcularPrecioCompraObjetivo);
                }
                const ventaSpreadEl = document.getElementById('precioVenta');
                if (ventaSpreadEl) ventaSpreadEl.addEventListener('input', function() {
                    const pctActual = document.getElementById('gananciaObjetivo');
                    if (pctActual && gananciaObjetivoManual && pctActual.value.trim() !== '') {
                        window.recalcularPrecioCompraObjetivo();
                    } else {
                        window.sincronizarGananciaReal();
                    }
                });
                const compraSpreadEl = document.getElementById('precioCompra');
                if (compraSpreadEl) compraSpreadEl.addEventListener('input', function() {
                    gananciaObjetivoManual = false;
                    window.sincronizarGananciaReal();
                });
                const pctOnLoad = document.getElementById('gananciaObjetivo');
                if (pctOnLoad && pctOnLoad.value.trim() === '' &&
                    document.getElementById('precioVenta').value !== '' &&
                    document.getElementById('precioCompra').value !== '') {
                    window.sincronizarGananciaReal();
                }
                setTimeout(window.calcularSpread, 100);
            } else if (rutaHtml.includes('binance_p2p.html') && typeof window.calcularBinanceP2P === 'function') {
                const inputsBP = ['bp_precioVenta', 'bp_arsRecibidos', 'bp_precioCompra', 'bp_arsRecompra'];
                restaurarPestana(inputsBP);
                agregarEventosAInputs(inputsBP, window.calcularBinanceP2P);
                inputsBP.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                agregarSyncBinanceVenta('bp_precioVenta');
                agregarSyncBinanceCompra('bp_precioCompra');
                agregarSyncCampoPar('bp_arsRecibidos', SYNC_ARS_BINANCE_IDS);
                agregarSyncCampoPar('bp_arsRecompra', SYNC_ARS_BINANCE_IDS);
                setTimeout(window.calcularBinanceP2P, 100);
            } else if (rutaHtml.includes('fiwind.html') && typeof window.calcularFiwind === 'function') {
                const inputsFiwind = ['usdPrice', 'usdtRate', 'myPrice', 'myPriceBinance', 'capitalArs'];
                restaurarPestana(inputsFiwind);
                agregarEventosAInputs(inputsFiwind, window.calcularFiwind);
                inputsFiwind.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                agregarSyncBybit('myPrice');
                agregarSyncBinanceVenta('myPriceBinance');
                (async () => {
                    await window.actualizarPreciosFiwind();
                    setTimeout(window.calcularFiwind, 100);
                })();
            } else if (rutaHtml.includes('p2p_bybit_binance.html') && typeof window.calcularP2PBB === 'function') {
                const inputsP2P = [
                    'p2p_capital',
                    'p2p_precioVentaBybit', 'p2p_precioBrutoBinance',
                    'p2p_precioVentaBinance', 'p2p_precioBrutoBybit',
                    'p2p_arsRecompra1', 'p2p_arsRecompra2'
                ];
                restaurarPestana(inputsP2P);
                agregarEventosAInputs(inputsP2P, window.calcularP2PBB);
                inputsP2P.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                agregarSyncBybit('p2p_precioVentaBybit');
                agregarSyncCompra('p2p_precioBrutoBybit');
                agregarSyncBinanceVenta('p2p_precioVentaBinance');
                agregarSyncBinanceCompra('p2p_precioBrutoBinance');
                setTimeout(window.calcularP2PBB, 100);
            } else if (rutaHtml.includes('kraken.html') && typeof window.calcularCiclo === 'function') {
                const inputsKraken = ['c3_usdtVendido', 'c3_arsRecibidos', 'c3_tasaCompraUsd', 'c3_tasaFiwind', 'c3_tasaUsdtUsdc', 'c3_tasaKraken'];
                restaurarPestana(inputsKraken);
                agregarEventosAInputs(inputsKraken, window.calcularCiclo);
                inputsKraken.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                setTimeout(window.calcularCiclo, 100);
            } else if (rutaHtml.includes('binance_spot.html') && typeof window.calcularBinanceSpot === 'function') {
                const inputsBS = ['bs_precioSpot', 'bs_precioVentaBybit', 'bs_precioVentaBinance'];
                restaurarPestana(inputsBS);
                agregarEventosAInputs(inputsBS, window.calcularBinanceSpot);
                inputsBS.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                agregarSyncBybit('bs_precioVentaBybit');
                agregarSyncBinanceVenta('bs_precioVentaBinance');
                window.actualizarPrecioSpotBinance().then(() => {
                    setTimeout(window.calcularBinanceSpot, 100);
                }).catch(() => {
                    setTimeout(window.calcularBinanceSpot, 100);
                });
            } else if (rutaHtml.includes('spot_retiro.html') && typeof window.calcularSpotRetiro === 'function') {
                const inputsSV = ['sv_precioCompraBybit', 'sv_precioCompraBinance', 'sv_usdtVender'];
                restaurarPestana(inputsSV);
                agregarEventosAInputs(inputsSV, window.calcularSpotRetiro);
                inputsSV.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                agregarSyncCompra('sv_precioCompraBybit');
                agregarSyncBinanceCompra('sv_precioCompraBinance');
                window.actualizarPrecioSpotRetiro().then(() => {
                    setTimeout(window.calcularSpotRetiro, 100);
                }).catch(() => {
                    setTimeout(window.calcularSpotRetiro, 100);
                });
            }

            // Mapear función de cálculo de la pestaña actual (para recomputar al cambiar comisión)
            if (rutaHtml.includes('spread.html')) window.computeActual = window.calcularSpread;
            else if (rutaHtml.includes('binance_p2p.html')) window.computeActual = window.calcularBinanceP2P;
            else if (rutaHtml.includes('fiwind.html')) window.computeActual = window.calcularFiwind;
            else if (rutaHtml.includes('p2p_bybit_binance.html')) window.computeActual = window.calcularP2PBB;
            else if (rutaHtml.includes('kraken.html')) window.computeActual = window.calcularCiclo;
            else if (rutaHtml.includes('binance_spot.html')) window.computeActual = window.calcularBinanceSpot;
            else if (rutaHtml.includes('spot_retiro.html')) window.computeActual = window.calcularSpotRetiro;

            // Actualizar textos de comisión (etiquetas que muestran el % según el check)
            actualizarTextosComision();

            // ... (código siguiente) ...
        })
        .catch(error => {
            contenedor.innerHTML = `<p style="color: #f05a5a; text-align:center;">Error al cargar la página: ${error.message}</p>`;
        });
}

// Función genérica para agregar escuchadores a una lista de inputs
function agregarEventosAInputs(listaIds, funcionCallback) {
    listaIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            // Solo agregamos eventos si no los tiene ya
            if (!el.dataset.listenerAdded) {
                el.dataset.listenerAdded = 'true'; 
                
                el.addEventListener('keydown', function(e) { 
                    if (e.key === 'Enter') { 
                        e.preventDefault(); 
                        if (!isNaN(evaluarExpresion(this.value))) {
                            this.value = evaluarExpresion(this.value);
                        }
                        funcionCallback(); 
                    } 
                });
                el.addEventListener('blur', funcionCallback);
                el.addEventListener('input', function() { 
                    clearTimeout(this._timer); 
                    this._timer = setTimeout(funcionCallback, 300); 
                });
            }
        }
    });
}

// Sincronizar "Precio Venta Bybit/USDT" entre los 4 tabs que lo usan
const SYNC_BYBIT_IDS = ['precioVenta', 'p2p_precioVentaBybit', 'bs_precioVentaBybit', 'myPrice'];
function syncBybitPrecio(sourceId) {
    const sourceEl = document.getElementById(sourceId);
    if (!sourceEl) return;
    const val = sourceEl.value;
    SYNC_BYBIT_IDS.forEach(function(id) {
        localStorage.setItem(id, val);
        const el = document.getElementById(id);
        if (el && el.value !== val) {
            el.value = val;
        }
    });
}

// Sincronizar "Precio Compra USDT/Bybit" entre tabs
const SYNC_COMPRA_IDS = ['precioCompra', 'p2p_precioBrutoBybit', 'sv_precioCompraBybit'];
function syncCompraPrecio(sourceId) {
    const sourceEl = document.getElementById(sourceId);
    if (!sourceEl) return;
    const val = sourceEl.value;
    SYNC_COMPRA_IDS.forEach(function(id) {
        localStorage.setItem(id, val);
        const el = document.getElementById(id);
        if (el && el.value !== val) {
            el.value = val;
        }
    });
}

function agregarSyncBybit(inputId) {
    const el = document.getElementById(inputId);
    if (!el || el.dataset.syncBybitAdded) return;
    el.dataset.syncBybitAdded = 'true';
    el.addEventListener('input', function() { syncBybitPrecio(inputId); });
    el.addEventListener('blur', function() { syncBybitPrecio(inputId); });
    el.addEventListener('change', function() { syncBybitPrecio(inputId); });
}

function agregarSyncCompra(inputId) {
    const el = document.getElementById(inputId);
    if (!el || el.dataset.syncCompraAdded) return;
    el.dataset.syncCompraAdded = 'true';
    el.addEventListener('input', function() { syncCompraPrecio(inputId); });
    el.addEventListener('blur', function() { syncCompraPrecio(inputId); });
    el.addEventListener('change', function() { syncCompraPrecio(inputId); });
}

// Sincronizar precios de VENTA Binance P2P entre pestañas
const SYNC_BINANCE_VENTA_IDS = ['bp_precioVenta', 'p2p_precioVentaBinance', 'bs_precioVentaBinance', 'myPriceBinance'];
function syncBinanceVentaPrecio(sourceId) {
    const sourceEl = document.getElementById(sourceId);
    if (!sourceEl) return;
    const val = sourceEl.value;
    SYNC_BINANCE_VENTA_IDS.forEach(function(id) {
        localStorage.setItem(id, val);
        const el = document.getElementById(id);
        if (el && el.value !== val) {
            el.value = val;
        }
    });
}

// Sincronizar precios de COMPRA Binance P2P entre pestañas
const SYNC_BINANCE_COMPRA_IDS = ['bp_precioCompra', 'p2p_precioBrutoBinance', 'sv_precioCompraBinance'];
function syncBinanceCompraPrecio(sourceId) {
    const sourceEl = document.getElementById(sourceId);
    if (!sourceEl) return;
    const val = sourceEl.value;
    SYNC_BINANCE_COMPRA_IDS.forEach(function(id) {
        localStorage.setItem(id, val);
        const el = document.getElementById(id);
        if (el && el.value !== val) {
            el.value = val;
        }
    });
}

function agregarSyncBinanceVenta(inputId) {
    const el = document.getElementById(inputId);
    if (!el || el.dataset.syncBinanceVentaAdded) return;
    el.dataset.syncBinanceVentaAdded = 'true';
    el.addEventListener('input', function() { syncBinanceVentaPrecio(inputId); });
    el.addEventListener('blur', function() { syncBinanceVentaPrecio(inputId); });
    el.addEventListener('change', function() { syncBinanceVentaPrecio(inputId); });
}

function agregarSyncBinanceCompra(inputId) {
    const el = document.getElementById(inputId);
    if (!el || el.dataset.syncBinanceCompraAdded) return;
    el.dataset.syncBinanceCompraAdded = 'true';
    el.addEventListener('input', function() { syncBinanceCompraPrecio(inputId); });
    el.addEventListener('blur', function() { syncBinanceCompraPrecio(inputId); });
    el.addEventListener('change', function() { syncBinanceCompraPrecio(inputId); });
}

// Replicar campos ARS entre sí (pares de ids), ambas direcciones
function syncCampoPar(sourceId, idsPar) {
    const sourceEl = document.getElementById(sourceId);
    if (!sourceEl) return;
    const val = sourceEl.value;
    idsPar.forEach(function(id) {
        localStorage.setItem(id, val);
        const el = document.getElementById(id);
        if (el && el.value !== val) {
            el.value = val;
        }
    });
}

function agregarSyncCampoPar(inputId, idsPar) {
    const el = document.getElementById(inputId);
    const flag = 'syncPar_' + idsPar.join('_');
    if (!el || el.dataset[flag]) return;
    el.dataset[flag] = 'true';
    el.addEventListener('input', function() { syncCampoPar(inputId, idsPar); });
    el.addEventListener('blur', function() { syncCampoPar(inputId, idsPar); });
    el.addEventListener('change', function() { syncCampoPar(inputId, idsPar); });
    // Replicar también el total evaluado al presionar Enter (keyup después del keydown de evaluarExpresion)
    el.addEventListener('keyup', function() { syncCampoPar(inputId, idsPar); });
}

// Pares de campos ARS a espejar
const SYNC_ARS_BINANCE_IDS = ['bp_arsRecibidos', 'bp_arsRecompra'];
const SYNC_ARS_SPREAD_IDS = ['arsRecibidos', 'arsRecompra'];

// Activar la clase 'active' en las pestañas al hacer clic
document.addEventListener('click', function(e) {
    if(e.target.classList.contains('tab')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
    }
});

// ================================================================
// 1.5 COMISIÓN P2P BINANCE GLOBAL ("¿Verificado?")
// Verificado = 0.16% · No verificado = 0.20% (valor previo)
// ================================================================
let comisionP2PVerificada = true;

function getComisionP2PBinance() {
    return comisionP2PVerificada ? 0.0016 : 0.002;
}

function formatoPctComision(comision) {
    return (comision * 100).toFixed(2).replace('.', ',') + '%';
}

function actualizarTextosComision() {
    const comision = getComisionP2PBinance();
    const pct = formatoPctComision(comision);
    const multBaja = (1 - comision).toFixed(4);
    const multAlta = (1 + comision).toFixed(4);
    const textoToggles = [
        ['p2p_info1_fee', pct],
        ['p2p_info2_fee', pct],
        ['fiwind_binance_fee', pct],
        ['bp_feeVenta', pct],
        ['bp_feeCompra', pct],
        ['p2p_info1_mult', multAlta],
        ['p2p_info2_mult', multBaja],
        ['bp_multVenta', multBaja],
        ['bp_multCompra', multAlta]
    ];
    textoToggles.forEach(function(par) {
        const el = document.getElementById(par[0]);
        if (el) el.textContent = par[1];
    });
}

function toggleComisionP2P() {
    const cb = document.getElementById('checkComisionP2P');
    if (!cb) return;
    comisionP2PVerificada = cb.checked;
    localStorage.setItem('comisionP2PVerificada', comisionP2PVerificada);
    actualizarTextosComision();
    if (window.computeActual) window.computeActual();
}

// Cargar la primera pestaña por defecto al abrir la página (Spread)
window.onload = function() {
    cargarPagina('pages/spread.html');
    iniciarPollerDolar();
};

// ================================================================
// 2. FUNCIONES DE CÁLCULO DE CADA PESTAÑA
// ================================================================

// --- PESTAÑA SPREAD (spread.html) ---
let gananciaObjetivoManual = false;

// Si el usuario toca el campo %, ese valor pasa a ser el "motor": completa el precio de compra según el precio de venta
window.recalcularPrecioCompraObjetivo = function() {
    const pctEl = document.getElementById('gananciaObjetivo');
    const ventaEl = document.getElementById('precioVenta');
    const compraEl = document.getElementById('precioCompra');
    if (!pctEl || !ventaEl || !compraEl) return;
    gananciaObjetivoManual = pctEl.value.trim() !== '';
    const pct = parseFloat(pctEl.value);
    const precioVenta = parseFloat(ventaEl.value);
    if (!gananciaObjetivoManual || isNaN(pct) || isNaN(precioVenta) || precioVenta <= 0 || pct <= -100) return;
    const precioCompra = precioVenta / (1 + pct / 100);
    compraEl.value = precioCompra.toFixed(2);
    localStorage.setItem('precioCompra', compraEl.value);
    if (window.computeActual) window.computeActual();
};

// Si el usuario toca venta o compra (sin % manual), el campo % se completa con la ganancia real calculada
window.sincronizarGananciaReal = function() {
    const pctEl = document.getElementById('gananciaObjetivo');
    const ventaEl = document.getElementById('precioVenta');
    const compraEl = document.getElementById('precioCompra');
    if (!pctEl || !ventaEl || !compraEl) return;
    const precioVenta = parseFloat(ventaEl.value);
    const precioCompra = parseFloat(compraEl.value);
    if (isNaN(precioVenta) || isNaN(precioCompra) || precioVenta <= 0 || precioCompra <= 0) return;
    const pct = (precioVenta / precioCompra - 1) * 100;
    pctEl.value = pct.toFixed(2);
    guardarInput('gananciaObjetivo');
};

window.calcularSpread = function() {
    const precioVentaInput = document.getElementById('precioVenta');
    if(!precioVentaInput) return;

    // Leer valores (ARS con sumas: ej 100000+200000+300000)
    const precioVenta = parseFloat(precioVentaInput.value) || 0;
    const arsRecibidos = evaluarExpresion(document.getElementById('arsRecibidos').value) || 0;
    const precioCompra = parseFloat(document.getElementById('precioCompra').value) || 0;
    
    // ARS para recompra: se espeja con ARS recibidos, acepta sumas
    const arsRecompra = evaluarExpresion(document.getElementById('arsRecompra').value) || 0;

    let cantidadCompra = 0;
    if (precioCompra > 0) cantidadCompra = arsRecompra / precioCompra;

    const arsObtenidos = cantidadCompra * precioVenta;
    const gananciaARS = arsObtenidos - arsRecompra;
    let gananciaUSDT = 0;
    if (precioVenta > 0) gananciaUSDT = gananciaARS / precioVenta;

    let gananciaPorcentaje = 0;
    if (arsRecompra > 0) gananciaPorcentaje = (gananciaARS / arsRecompra) * 100;

    const cantidadVenta = arsRecibidos / precioVenta;
    document.getElementById('cantidadVenta').value = cantidadVenta.toFixed(6);
    document.getElementById('cantidadCompra').value = cantidadCompra.toFixed(6);

    const signo = (gananciaUSDT >= 0) ? '+' : '';
    const colorClass = (gananciaUSDT > 0.000001) ? 'positive' : (gananciaUSDT < -0.000001 ? 'negative' : 'neutral');

    document.getElementById('gananciaPorcentaje').textContent = `${signo}${gananciaPorcentaje.toFixed(3)}%`;
    document.getElementById('gananciaPorcentaje').className = `value ${colorClass}`;
    document.getElementById('gananciaUSDT').textContent = `${signo}${gananciaUSDT.toFixed(2)} USDT`;
    document.getElementById('gananciaUSDT').className = `value ${colorClass}`;
    const signoARS = (gananciaARS >= 0) ? '+' : '';
    document.getElementById('gananciaARS').textContent = `${signoARS}$${gananciaARS.toFixed(2)}`;
    document.getElementById('gananciaARS').className = `value ${colorClass}`;

    document.getElementById('usdtOperados').textContent = cantidadCompra.toFixed(2);
    
    // Actualizar los items del resumen
    document.getElementById('detComprados').textContent = cantidadCompra.toFixed(2);
    document.getElementById('detPrecioCompra').textContent = `$${precioCompra.toFixed(2)}`;
    document.getElementById('detPrecioVenta').textContent = `$${precioVenta.toFixed(2)}`;

    let detalleHTML = '';
    if (gananciaUSDT > 0.000001) {
        detalleHTML = `✅ <span class="highlight-green">Ganaste +${gananciaUSDT.toFixed(2)} USDT</span> (${signo}${gananciaPorcentaje.toFixed(3)}% de spread). 🎯`;
    } else if (gananciaUSDT < -0.000001) {
        detalleHTML = `⚠️ <span class="highlight-red">Perdiste ${gananciaUSDT.toFixed(2)} USDT</span> (${gananciaPorcentaje.toFixed(3)}% de spread).`;
    } else {
        detalleHTML = `⚖️ Operación en equilibrio. Sin ganancia ni pérdida.`;
    }
    document.getElementById('detGananciaTexto').innerHTML = detalleHTML;
}

window.resetSpread = function() {
    ['precioVenta', 'arsRecibidos', 'precioCompra', 'arsRecompra'].forEach(function(id) {
        localStorage.removeItem(id);
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    window.calcularSpread();
};

// --- PESTAÑA BINANCE P2P (binance_p2p.html) ---
// Igual que la de Bybit P2P pero con la comisión de Binance aplicada a venta y compra.
window.calcularBinanceP2P = function() {
    const precioVentaInput = document.getElementById('bp_precioVenta');
    if (!precioVentaInput) return;

    const comision = getComisionP2PBinance();
    const precioVenta = parseFloat(precioVentaInput.value) || 0;
    // ARS recibidos: acepta sumas de ventas (ej: 100000+200000+300000)
    const arsRecibidos = evaluarExpresion(document.getElementById('bp_arsRecibidos').value) || 0;
    const precioCompra = parseFloat(document.getElementById('bp_precioCompra').value) || 0;

    // ARS para recompra: acepta sumas de billeteras (ej: 100000+200000+300000)
    const arsRecompraInput = document.getElementById('bp_arsRecompra');
    const arsRecompra = evaluarExpresion(arsRecompraInput.value) || 0;

    // Efectivos con comisión Binance (venta neta ×(1-c) · compra real ×(1+c))
    const precioVentaNeto = precioVenta * (1 - comision);
    const precioCompraReal = precioCompra * (1 + comision);

    document.getElementById('bp_precioVentaNeto').textContent = precioVentaNeto.toFixed(2);
    document.getElementById('bp_precioCompraReal').textContent = precioCompraReal.toFixed(2);

    const cantidadVenta = precioVentaNeto > 0 ? arsRecibidos / precioVentaNeto : 0;
    const cantidadCompra = precioCompraReal > 0 ? arsRecompra / precioCompraReal : 0;

    const arsObtenidos = cantidadCompra * precioVentaNeto;
    const gananciaARS = arsObtenidos - arsRecompra;
    let gananciaUSDT = 0;
    if (precioVentaNeto > 0) gananciaUSDT = gananciaARS / precioVentaNeto;

    let gananciaPorcentaje = 0;
    if (arsRecompra > 0) gananciaPorcentaje = (gananciaARS / arsRecompra) * 100;

    document.getElementById('bp_cantidadVenta').value = cantidadVenta.toFixed(6);
    document.getElementById('bp_cantidadCompra').value = cantidadCompra.toFixed(6);

    const signo = (gananciaUSDT >= 0) ? '+' : '';
    const colorClass = (gananciaUSDT > 0.000001) ? 'positive' : (gananciaUSDT < -0.000001 ? 'negative' : 'neutral');

    document.getElementById('bp_gananciaPorcentaje').textContent = `${signo}${gananciaPorcentaje.toFixed(3)}%`;
    document.getElementById('bp_gananciaPorcentaje').className = `value ${colorClass}`;
    document.getElementById('bp_gananciaUSDT').textContent = `${signo}${gananciaUSDT.toFixed(2)} USDT`;
    document.getElementById('bp_gananciaUSDT').className = `value ${colorClass}`;
    const signoARS = (gananciaARS >= 0) ? '+' : '';
    document.getElementById('bp_gananciaARS').textContent = `${signoARS}$${gananciaARS.toFixed(2)}`;
    document.getElementById('bp_gananciaARS').className = `value ${colorClass}`;

    document.getElementById('bp_usdtOperados').textContent = cantidadCompra.toFixed(2);

    document.getElementById('bp_detComprados').textContent = cantidadCompra.toFixed(2);
    document.getElementById('bp_detPrecioCompra').textContent = `${precioCompraReal.toFixed(2)}`;
    document.getElementById('bp_detPrecioVenta').textContent = `${precioVentaNeto.toFixed(2)}`;

    let detalleHTML = '';
    if (gananciaUSDT > 0.000001) {
        detalleHTML = `✅ <span class="highlight-green">Ganaste +${gananciaUSDT.toFixed(2)} USDT</span> (${signo}${gananciaPorcentaje.toFixed(3)}% de spread). 🎯`;
    } else if (gananciaUSDT < -0.000001) {
        detalleHTML = `⚠️ <span class="highlight-red">Perdiste ${gananciaUSDT.toFixed(2)} USDT</span> (${gananciaPorcentaje.toFixed(3)}% de spread).`;
    } else {
        detalleHTML = `⚖️ Operación en equilibrio. Sin ganancia ni pérdida.`;
    }
    document.getElementById('bp_detGananciaTexto').innerHTML = detalleHTML;
};

window.resetBinanceP2P = function() {
    ['bp_precioVenta', 'bp_arsRecibidos', 'bp_precioCompra', 'bp_arsRecompra'].forEach(function(id) {
        localStorage.removeItem(id);
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    window.calcularBinanceP2P();
};

// --- PESTAÑA FIWIND (fiwind.html) ---
window.calcularFiwind = function() {
    const usdPrice = document.getElementById('usdPrice');
    if(!usdPrice) return;
    if(!document.getElementById('costUsdt')) return; 
    
    const usd = parseFloat(usdPrice.value);
    const rate = parseFloat(document.getElementById('usdtRate').value);
    if (isNaN(usd) || isNaN(rate)) return;

    const cost = usd * rate;
    const costoRow = document.getElementById('fiwind_costoRow');
    if (costoRow) costoRow.style.display = 'flex';
    document.getElementById('costUsdt').textContent = '$ ' + cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const myPriceVal = parseFloat(document.getElementById('myPrice').value);
    const myPriceBinanceVal = parseFloat(document.getElementById('myPriceBinance').value);
    const capital = parseFloat(document.getElementById('capitalArs').value);
    const hintEl = document.getElementById('myHint');

    // --- Bybit (0% fee) ---
    const bybitResult = document.getElementById('fiwind_bybitResult');
    const bybitCapitalBlock = document.getElementById('fiwind_capitalBybit');
    if (!isNaN(myPriceVal) && myPriceVal > 0) {
        if (bybitResult) bybitResult.style.display = 'block';
        if (hintEl) hintEl.style.display = 'none';

        document.getElementById('fiwind_bybit_buyPrice').textContent = cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('fiwind_bybit_sellPrice').textContent = myPriceVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const bybitGain = myPriceVal - cost;
        const bybitPct = (bybitGain / cost) * 100;
        const bybitWin = bybitGain >= 0;
        const pctEl = document.getElementById('fiwind_bybit_pct');
        pctEl.textContent = (bybitWin ? '+' : '') + bybitPct.toFixed(3) + '%';
        pctEl.style.color = bybitWin ? '#00c897' : '#f05a5a';

        // Detalle con capital
        if (!isNaN(capital) && capital > 0 && bybitCapitalBlock) {
            bybitCapitalBlock.style.display = 'block';
            const usdtSold = capital / myPriceVal;
            const usdBought = capital / usd;
            const usdtBought = capital / cost;
            const totalReturn = usdtBought * myPriceVal;
            const usdtGain = usdtBought - usdtSold;
            const arsGain = totalReturn - capital;
            const isWin = usdtGain >= 0;

            document.getElementById('fiwind_bybit_usdtSold').textContent = usdtSold.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('fiwind_bybit_usdTotal').textContent = 'U$D ' + usdBought.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('fiwind_bybit_usdtTotal').textContent = usdtBought.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('fiwind_bybit_arsReturn').textContent = '$ ' + totalReturn.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const gainColor = isWin ? '#00c897' : '#f05a5a';
            document.getElementById('fiwind_bybit_usdtGain').textContent = (isWin ? '+' : '') + usdtGain.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('fiwind_bybit_usdtGain').style.color = gainColor;
            document.getElementById('fiwind_bybit_arsGain').textContent = (isWin ? '+' : '') + '$ ' + arsGain.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ARS';
            document.getElementById('fiwind_bybit_arsGain').style.color = gainColor;
        } else if (bybitCapitalBlock) {
            bybitCapitalBlock.style.display = 'none';
        }
    } else {
        if (bybitResult) bybitResult.style.display = 'none';
        if (bybitCapitalBlock) bybitCapitalBlock.style.display = 'none';
    }

    // --- Binance (fee P2P en venta) ---
    const binanceResult = document.getElementById('fiwind_binanceResult');
    const binanceCapitalBlock = document.getElementById('fiwind_capitalBinance');
    const COMISION_BINANCE = getComisionP2PBinance();
    if (!isNaN(myPriceBinanceVal) && myPriceBinanceVal > 0) {
        if (binanceResult) binanceResult.style.display = 'block';
        if (hintEl) hintEl.style.display = 'none';

        const sellNet = myPriceBinanceVal * (1 - COMISION_BINANCE);
        document.getElementById('fiwind_binance_buyPrice').textContent = cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('fiwind_binance_sellPrice').textContent = sellNet.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const binanceGain = sellNet - cost;
        const binancePct = (binanceGain / cost) * 100;
        const binanceWin = binanceGain >= 0;
        const pctEl = document.getElementById('fiwind_binance_pct');
        pctEl.textContent = (binanceWin ? '+' : '') + binancePct.toFixed(3) + '%';
        pctEl.style.color = binanceWin ? '#00c897' : '#f05a5a';

        // Detalle con capital
        if (!isNaN(capital) && capital > 0 && binanceCapitalBlock) {
            binanceCapitalBlock.style.display = 'block';
            const usdtSold = capital / myPriceBinanceVal;
            const usdBought = capital / usd;
            const usdtBought = capital / cost;
            const totalReturn = usdtBought * sellNet;
            const usdtGain = usdtBought - usdtSold;
            const arsGain = totalReturn - capital;
            const isWin = usdtGain >= 0;

            document.getElementById('fiwind_binance_usdtSold').textContent = usdtSold.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('fiwind_binance_usdTotal').textContent = 'U$D ' + usdBought.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('fiwind_binance_usdtTotal').textContent = usdtBought.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('fiwind_binance_arsReturn').textContent = '$ ' + totalReturn.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const gainColor = isWin ? '#00c897' : '#f05a5a';
            document.getElementById('fiwind_binance_usdtGain').textContent = (isWin ? '+' : '') + usdtGain.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('fiwind_binance_usdtGain').style.color = gainColor;
            document.getElementById('fiwind_binance_arsGain').textContent = (isWin ? '+' : '') + '$ ' + arsGain.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ARS';
            document.getElementById('fiwind_binance_arsGain').style.color = gainColor;
        } else if (binanceCapitalBlock) {
            binanceCapitalBlock.style.display = 'none';
        }
    } else {
        if (binanceResult) binanceResult.style.display = 'none';
        if (binanceCapitalBlock) binanceCapitalBlock.style.display = 'none';
    }

    // Hint
    if (hintEl) {
        const bybitOk = !isNaN(myPriceVal) && myPriceVal > 0;
        const binanceOk = !isNaN(myPriceBinanceVal) && myPriceBinanceVal > 0;
        hintEl.style.display = (bybitOk || binanceOk) ? 'none' : 'block';
    }
}

// -------------------------------------------------------------
// NUEVA FUNCIÓN: CONSULTA DE PRECIOS EN VIVO (CRIPTOYA)
// -------------------------------------------------------------
window.actualizarPreciosFiwind = async function() {
    const usdPriceInput = document.getElementById('usdPrice');
    const usdtRateInput = document.getElementById('usdtRate');

    if (!usdPriceInput || !usdtRateInput) return;

    const oldRate = usdtRateInput.value;
    usdtRateInput.placeholder = "Cargando...";

    try {
        // AHORA VAMOS DIRECTAMENTE A CRIPTOYA SIN PROXY (Gracias a la extensión CORS Unblock)
        const response = await fetch('https://criptoya.com/api/fiwind/usdt/usd/1');
        
        if (!response.ok) throw new Error("Error al conectar con Criptoya");

        const data = await response.json();
        
        const precioUSDT = data.ask; 

        if (precioUSDT && !isNaN(precioUSDT) && precioUSDT > 0) {
            usdtRateInput.value = precioUSDT.toFixed(3);
        } else {
            usdtRateInput.value = oldRate || "1.046"; 
        }

        if (!usdPriceInput.value || usdPriceInput.value === "" || usdPriceInput.value === "Cargando...") {
            usdPriceInput.value = "";
        }

        window.calcularFiwind();

    } catch (error) {
        console.error("Error al obtener precio de Fiwind desde Criptoya:", error);
        usdtRateInput.value = oldRate || "1.046";
        window.calcularFiwind();
    } finally {
        usdtRateInput.placeholder = "Ej: 1.048";
    }
}

// --- PESTAÑA KRAKEN (kraken.html) ---
window.calcularCiclo = function() {
    const usdtVendidoInput = document.getElementById('c3_usdtVendido');
    if(!usdtVendidoInput) return;

    const usdtVendido = parseFloat(usdtVendidoInput.value) || 0;
    const arsRecibidos = parseFloat(document.getElementById('c3_arsRecibidos').value) || 0;
    const tasaCompraUsd = parseFloat(document.getElementById('c3_tasaCompraUsd').value) || 0;
    const tasaFiwind = parseFloat(document.getElementById('c3_tasaFiwind').value) || 0;
    const tasaUsdtUsdc = parseFloat(document.getElementById('c3_tasaUsdtUsdc').value) || 0;
    const tasaKraken = parseFloat(document.getElementById('c3_tasaKraken').value) || 0;

    const tasaVenta = usdtVendido > 0 ? arsRecibidos / usdtVendido : 0;
    document.getElementById('c3_tasaVenta').value = tasaVenta.toFixed(2);

    const usdObtenido = tasaCompraUsd > 0 ? arsRecibidos / tasaCompraUsd : 0;
    document.getElementById('c3_usdObtenido').value = usdObtenido.toFixed(4);
    const usdtFiwind = usdObtenido * tasaFiwind;
    document.getElementById('c3_usdtFiwind').value = usdtFiwind.toFixed(4);
    const usdcObtenido = usdtFiwind * tasaUsdtUsdc;
    document.getElementById('c3_usdcObtenido').value = usdcObtenido.toFixed(4);
    const arsFinal = usdcObtenido * tasaKraken;
    document.getElementById('c3_arsFinal').value = arsFinal.toFixed(2);

    const gananciaArs = arsFinal - arsRecibidos;
    const gananciaPct = arsRecibidos > 0 ? (gananciaArs / arsRecibidos) * 100 : 0;
    const usdtEquivFinal = tasaVenta > 0 ? arsFinal / tasaVenta : 0;
    const isWin = gananciaArs >= 0;
    const signo = isWin ? '+' : '';

    document.getElementById('c3_resultBlock').className = 'result-big ' + (isWin ? 'green' : 'red');
    document.getElementById('c3_resultLabel').textContent = isWin ? 'Ganancia del ciclo' : 'Pérdida del ciclo';
    document.getElementById('c3_gananciaPct').textContent = `${signo}${gananciaPct.toFixed(3)}%`;
    document.getElementById('c3_gananciaArs').textContent = `${signo}$ ${gananciaArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    document.getElementById('c3_arsInicial').textContent = '$ ' + arsRecibidos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('c3_arsFinalMini').textContent = '$ ' + arsFinal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('c3_usdtVendidoMini').textContent = usdtVendido.toFixed(2);
    document.getElementById('c3_usdtEquivFinal').textContent = usdtEquivFinal.toFixed(4);

    document.getElementById('c3_detUsdtVendido').textContent = usdtVendido.toFixed(2);
    document.getElementById('c3_detArsInicial').textContent = '$ ' + arsRecibidos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('c3_detArsFinal').textContent = '$ ' + arsFinal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let detalleHTML = '';
    if (gananciaArs > 0.01) {
        detalleHTML = `Ganaste <strong class="highlight-green">+$ ${gananciaArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> (<span class="highlight-green">+${gananciaPct.toFixed(3)}%</span>) en el ciclo completo. 🎯`;
    } else if (gananciaArs < -0.01) {
        detalleHTML = `Perdiste <strong class="highlight-red">$ ${gananciaArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> (${gananciaPct.toFixed(3)}%) en el ciclo completo. ⚠️`;
    } else {
        detalleHTML = `Ciclo en equilibrio. Sin ganancia ni pérdida. ⚖️`;
    }
    document.getElementById('c3_detGananciaTexto').innerHTML = detalleHTML;
}

// ================================================================
// 4. PESTAÑA P2P BYBIT - BINANCE (COMPARACIÓN LADO A LADO)
// ================================================================

function evaluarExpresion(str) {
    if (!str || typeof str !== 'string') return NaN;
    str = str.replace(/\s/g, '');
    if (!/^[0-9+\-*/().]+$/.test(str)) return NaN;
    try {
        const result = Function('"use strict"; return (' + str + ')')();
        return (typeof result === 'number' && isFinite(result)) ? result : NaN;
    } catch(e) { return NaN; }
}

window.calcularP2PBB = function() {
    const precioVentaBybitInput = document.getElementById('p2p_precioVentaBybit');
    if (!precioVentaBybitInput) return;

    const precioVentaBybit = parseFloat(precioVentaBybitInput.value) || 0;
    const precioBrutoBinance = parseFloat(document.getElementById('p2p_precioBrutoBinance').value) || 0;
    const precioVentaBinance = parseFloat(document.getElementById('p2p_precioVentaBinance').value) || 0;
    const precioBrutoBybit = parseFloat(document.getElementById('p2p_precioBrutoBybit').value) || 0;
    const comisionBinance = getComisionP2PBinance();

    const precioRealBinance1 = precioBrutoBinance * (1 + comisionBinance);
    const precioRealBinance2 = precioVentaBinance * (1 - comisionBinance);

    const capitales = [
        { amount: 500000,  key: '500k' },
        { amount: 1000000, key: '1m' },
        { amount: 1500000, key: '1m5' },
        { amount: 2000000, key: '2m' }
    ];

    // Info bajo los inputs
    const elInfo1 = document.getElementById('p2p_info1');
    const elInfo2 = document.getElementById('p2p_info2');

    if (elInfo1) elInfo1.style.display = (precioVentaBybit > 0 && precioBrutoBinance > 0) ? 'block' : 'none';
    if (elInfo2) elInfo2.style.display = (precioVentaBinance > 0 && precioBrutoBybit > 0) ? 'block' : 'none';

    if (precioVentaBybit > 0 && precioBrutoBinance > 0) {
        const gananciaPct1 = ((1 / precioRealBinance1) - (1 / precioVentaBybit)) / (1 / precioVentaBybit) * 100;
        document.getElementById('p2p_info1_venta').textContent = precioVentaBybit.toFixed(2);
        document.getElementById('p2p_info1_compra').textContent = precioRealBinance1.toFixed(2);
        const elPct = document.getElementById('p2p_info1_pct');
        elPct.textContent = (gananciaPct1 >= 0 ? '+' : '') + gananciaPct1.toFixed(3) + '%';
        elPct.style.color = gananciaPct1 >= 0 ? '#00c897' : '#f05a5a';
    }

    if (precioVentaBinance > 0 && precioBrutoBybit > 0) {
        const gananciaPct2 = ((1 * (1 - comisionBinance) / precioBrutoBybit) - (1 / precioVentaBinance)) / (1 / precioVentaBinance) * 100;
        document.getElementById('p2p_info2_venta').textContent = precioRealBinance2.toFixed(2);
        document.getElementById('p2p_info2_compra').textContent = precioBrutoBybit.toFixed(2);
        const elPct = document.getElementById('p2p_info2_pct');
        elPct.textContent = (gananciaPct2 >= 0 ? '+' : '') + gananciaPct2.toFixed(3) + '%';
        elPct.style.color = gananciaPct2 >= 0 ? '#00c897' : '#f05a5a';
    }

    // USDT comprable con ARS para recompra
    const arsRecompraRaw1 = document.getElementById('p2p_arsRecompra1').value;
    const arsRecompraRaw2 = document.getElementById('p2p_arsRecompra2').value;
    const arsRecompra1 = evaluarExpresion(arsRecompraRaw1) || 0;
    const arsRecompra2 = evaluarExpresion(arsRecompraRaw2) || 0;

    if (arsRecompra1 > 0 && precioBrutoBinance > 0) {
        const usdtComprable = arsRecompra1 / precioBrutoBinance;
        document.getElementById('p2p_usdtComprable1').textContent = usdtComprable.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        document.getElementById('p2p_usdtComprable1').textContent = '—';
    }

    if (arsRecompra2 > 0 && precioBrutoBybit > 0) {
        const usdtComprable = arsRecompra2 / precioBrutoBybit;
        document.getElementById('p2p_usdtComprable2').textContent = usdtComprable.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        document.getElementById('p2p_usdtComprable2').textContent = '—';
    }

    let ganPctS1_2m = 0;
    let ganPctS2_2m = 0;
    let ganS1_2m = 0;
    let ganS2_2m = 0;

    capitales.forEach(function(cap) {
        // Estrategia 1: Bybit Venta → Binance Compra
        const usdtVendidos1 = precioVentaBybit > 0 ? cap.amount / precioVentaBybit : 0;
        const usdtComprados1 = precioRealBinance1 > 0 ? cap.amount / precioRealBinance1 : 0;
        const ganancia1 = usdtComprados1 - usdtVendidos1;
        const gananciaPct1 = usdtVendidos1 > 0 ? (ganancia1 / usdtVendidos1) * 100 : 0;

        const el1 = document.getElementById('p2p_row_' + cap.key + '_s1');
        const el1Pct = document.getElementById('p2p_row_' + cap.key + '_s1_pct');
        if (el1) el1.textContent = usdtVendidos1 > 0 ? ganancia1.toFixed(2) + ' USDT' : '—';
        if (el1Pct) el1Pct.textContent = usdtVendidos1 > 0 ? (gananciaPct1 >= 0 ? '+' : '') + gananciaPct1.toFixed(3) + '%' : '—';
        if (el1) el1.style.color = ganancia1 >= 0 ? '#00c897' : '#f05a5a';
        if (el1Pct) el1Pct.style.color = ganancia1 >= 0 ? '#00c897' : '#f05a5a';

        // Estrategia 2: Binance Venta → Bybit Compra
        const arsNetos2 = cap.amount * (1 - comisionBinance);
        const usdtVendidos2 = precioVentaBinance > 0 ? cap.amount / precioVentaBinance : 0;
        const usdtComprados2 = precioBrutoBybit > 0 ? arsNetos2 / precioBrutoBybit : 0;
        const ganancia2 = usdtComprados2 - usdtVendidos2;
        const gananciaPct2 = usdtVendidos2 > 0 ? (ganancia2 / usdtVendidos2) * 100 : 0;

        const el2 = document.getElementById('p2p_row_' + cap.key + '_s2');
        const el2Pct = document.getElementById('p2p_row_' + cap.key + '_s2_pct');
        if (el2) el2.textContent = usdtVendidos2 > 0 ? ganancia2.toFixed(2) + ' USDT' : '—';
        if (el2Pct) el2Pct.textContent = usdtVendidos2 > 0 ? (gananciaPct2 >= 0 ? '+' : '') + gananciaPct2.toFixed(3) + '%' : '—';
        if (el2) el2.style.color = ganancia2 >= 0 ? '#00c897' : '#f05a5a';
        if (el2Pct) el2Pct.style.color = ganancia2 >= 0 ? '#00c897' : '#f05a5a';

        if (cap.key === '2m') {
            ganPctS1_2m = gananciaPct1;
            ganPctS2_2m = gananciaPct2;
            ganS1_2m = ganancia1;
            ganS2_2m = ganancia2;
        }
    });

    // ============================================
    // RESULTADOS DETALLADOS (con capital del usuario)
    // ============================================
    const capital = parseFloat(document.getElementById('p2p_capital').value) || 0;

    // Estrategia 1: Bybit Venta → Binance Compra
    const usdtVendidos1 = precioVentaBybit > 0 ? capital / precioVentaBybit : 0;
    const usdtComprados1 = precioRealBinance1 > 0 ? capital / precioRealBinance1 : 0;
    const gananciaUSDT1 = usdtComprados1 - usdtVendidos1;
    const gananciaARS1 = gananciaUSDT1 * precioVentaBybit;
    const gananciaPctARS1 = capital > 0 ? (gananciaARS1 / capital) * 100 : 0;
    const gananciaPctUSDT1 = usdtVendidos1 > 0 ? (gananciaUSDT1 / usdtVendidos1) * 100 : 0;
    const spreadReal1 = gananciaPctUSDT1;
    const precioSugerido1 = precioVentaBybit / (1 + comisionBinance);

    document.getElementById('resultadosSub1').style.display = 'block';
    document.getElementById('p2p_usdtVendidos').textContent = usdtVendidos1.toFixed(2);
    document.getElementById('p2p_usdtComprados').textContent = usdtComprados1.toFixed(2);
    const signoSpread1 = spreadReal1 >= 0 ? '+' : '';
    document.getElementById('p2p_spreadReal1').textContent = signoSpread1 + spreadReal1.toFixed(2) + '%';
    document.getElementById('p2p_spreadReal1').className = 'value ' + (spreadReal1 >= 0 ? 'positive' : 'negative');
    const color1 = gananciaUSDT1 >= 0 ? 'positive' : 'negative';
    document.getElementById('p2p_gananciaUSDT1').textContent = (gananciaUSDT1 >= 0 ? '+' : '') + gananciaUSDT1.toFixed(2) + ' USDT';
    document.getElementById('p2p_gananciaUSDT1').className = 'value ' + color1;
    document.getElementById('p2p_gananciaARS1').textContent = (gananciaARS1 >= 0 ? '+' : '') + '$' + gananciaARS1.toFixed(2) + ' ARS';
    document.getElementById('p2p_gananciaARS1').className = 'value ' + color1;
    document.getElementById('p2p_gananciaPctARS1').textContent = (gananciaPctARS1 >= 0 ? '+' : '') + gananciaPctARS1.toFixed(3) + '%';
    document.getElementById('p2p_gananciaPctARS1').className = 'value ' + color1;
    document.getElementById('p2p_gananciaPctUSDT1').textContent = (gananciaPctUSDT1 >= 0 ? '+' : '') + gananciaPctUSDT1.toFixed(3) + '%';
    document.getElementById('p2p_gananciaPctUSDT1').className = 'value ' + color1;
    document.getElementById('p2p_sugerenciaTexto1').textContent = '$' + precioSugerido1.toFixed(2);
    document.getElementById('p2p_formulaTexto1').textContent =
        '$' + precioVentaBybit.toFixed(2) + ' ÷ ' + (1 + comisionBinance).toFixed(4) + ' = $' + precioSugerido1.toFixed(2);

    // Estrategia 2: Binance Venta → Bybit Compra
    const arsNetos2 = capital * (1 - comisionBinance);
    const usdtVendidos2 = precioVentaBinance > 0 ? capital / precioVentaBinance : 0;
    const usdtComprados2 = precioBrutoBybit > 0 ? arsNetos2 / precioBrutoBybit : 0;
    const gananciaUSDT2 = usdtComprados2 - usdtVendidos2;
    const gananciaARS2 = (usdtComprados2 * precioVentaBinance) - capital;
    const gananciaPctARS2 = capital > 0 ? (gananciaARS2 / capital) * 100 : 0;
    const gananciaPctUSDT2 = usdtVendidos2 > 0 ? (gananciaUSDT2 / usdtVendidos2) * 100 : 0;
    const spreadReal2 = gananciaPctUSDT2;
    const precioSugerido2 = precioVentaBinance * (1 - comisionBinance);

    document.getElementById('resultadosSub2').style.display = 'block';
    document.getElementById('p2p_usdtVendidos2').textContent = usdtVendidos2.toFixed(2);
    document.getElementById('p2p_usdtComprados2').textContent = usdtComprados2.toFixed(2);
    const signoSpread2 = spreadReal2 >= 0 ? '+' : '';
    document.getElementById('p2p_spreadReal2').textContent = signoSpread2 + spreadReal2.toFixed(2) + '%';
    document.getElementById('p2p_spreadReal2').className = 'value ' + (spreadReal2 >= 0 ? 'positive' : 'negative');
    const color2 = gananciaUSDT2 >= 0 ? 'positive' : 'negative';
    document.getElementById('p2p_gananciaUSDT2').textContent = (gananciaUSDT2 >= 0 ? '+' : '') + gananciaUSDT2.toFixed(2) + ' USDT';
    document.getElementById('p2p_gananciaUSDT2').className = 'value ' + color2;
    document.getElementById('p2p_gananciaARS2').textContent = (gananciaARS2 >= 0 ? '+' : '') + '$' + gananciaARS2.toFixed(2) + ' ARS';
    document.getElementById('p2p_gananciaARS2').className = 'value ' + color2;
    document.getElementById('p2p_gananciaPctARS2').textContent = (gananciaPctARS2 >= 0 ? '+' : '') + gananciaPctARS2.toFixed(3) + '%';
    document.getElementById('p2p_gananciaPctARS2').className = 'value ' + color2;
    document.getElementById('p2p_gananciaPctUSDT2').textContent = (gananciaPctUSDT2 >= 0 ? '+' : '') + gananciaPctUSDT2.toFixed(3) + '%';
    document.getElementById('p2p_gananciaPctUSDT2').className = 'value ' + color2;
    document.getElementById('p2p_sugerenciaTexto2').textContent = '$' + precioSugerido2.toFixed(2);
    document.getElementById('p2p_formulaTexto2').textContent =
        '$' + precioVentaBinance.toFixed(2) + ' × ' + (1 - comisionBinance).toFixed(4) + ' = $' + precioSugerido2.toFixed(2);

    // BANNER GANADOR
    const banner = document.getElementById('winnerBanner');
    const nameEl = document.getElementById('winnerName');
    const detailEl = document.getElementById('winnerDetail');

    if (precioVentaBybit > 0 || precioVentaBinance > 0) {
        banner.style.display = 'block';

        if (ganPctS1_2m > ganPctS2_2m + 0.001) {
            banner.className = 'winner-banner winner-bybit';
            nameEl.textContent = 'Bybit Venta → Binance Compra';
            detailEl.textContent = '+' + ganS1_2m.toFixed(2) + ' USDT en $2M  ·  ' + (ganPctS1_2m >= 0 ? '+' : '') + ganPctS1_2m.toFixed(3) + '%  ·  +' + (ganPctS1_2m - ganPctS2_2m).toFixed(3) + '% sobre Estrategia 2';
        } else if (ganPctS2_2m > ganPctS1_2m + 0.001) {
            banner.className = 'winner-banner winner-binance';
            nameEl.textContent = 'Binance Venta → Bybit Compra';
            detailEl.textContent = '+' + ganS2_2m.toFixed(2) + ' USDT en $2M  ·  ' + (ganPctS2_2m >= 0 ? '+' : '') + ganPctS2_2m.toFixed(3) + '%  ·  +' + (ganPctS2_2m - ganPctS1_2m).toFixed(3) + '% sobre Estrategia 1';
        } else {
            banner.className = 'winner-banner winner-empate';
            nameEl.textContent = 'Empate — Ambas estrategias dan igual';
            detailEl.textContent = 'Diferencia despreciable en todos los montos';
        }
    } else {
        banner.style.display = 'none';
    }
}

// ================================================================
// 5. PESTAÑA P2P → BINANCE SPOT
// ================================================================

window.calcularBinanceSpot = function() {
    const precioSpotInput = document.getElementById('bs_precioSpot');
    if (!precioSpotInput) return;

    const precioSpot = parseFloat(precioSpotInput.value) || 0;
    const precioVentaBybit = parseFloat(document.getElementById('bs_precioVentaBybit').value) || 0;
    const precioVentaBinance = parseFloat(document.getElementById('bs_precioVentaBinance').value) || 0;
    const comisionBinanceP2P = getComisionP2PBinance();
    const comisionSpot = 0.001;
    const precioSpotEfectivo = precioSpot * (1 + comisionSpot);

    const capitales = [
        { amount: 500000,  key: '500k' },
        { amount: 1000000, key: '1m' },
        { amount: 1500000, key: '1m5' },
        { amount: 2000000, key: '2m' }
    ];

    // Info bajo los inputs de precio
    const elBybitInfo = document.getElementById('bs_bybitInfo');
    const elBinanceInfo = document.getElementById('bs_binanceInfo');

    if (elBybitInfo) elBybitInfo.style.display = precioVentaBybit > 0 ? 'block' : 'none';
    if (elBinanceInfo) elBinanceInfo.style.display = precioVentaBinance > 0 ? 'block' : 'none';

    if (precioVentaBybit > 0 && precioSpot > 0) {
        const gananciaPctBybit = ((1 / precioSpotEfectivo) - (1 / precioVentaBybit)) / (1 / precioVentaBybit) * 100;
        document.getElementById('bs_bybitPrecio').textContent = precioVentaBybit.toFixed(2);
        document.getElementById('bs_bybitSpotEfectivo').textContent = precioSpotEfectivo.toFixed(2);
        const elPct = document.getElementById('bs_bybitGananciaPct');
        elPct.textContent = (gananciaPctBybit >= 0 ? '+' : '') + gananciaPctBybit.toFixed(3) + '%';
        elPct.style.color = gananciaPctBybit >= 0 ? '#00c897' : '#f05a5a';
    }

    if (precioVentaBinance > 0 && precioSpot > 0) {
        const gananciaPctBinance = ((1 * (1 - comisionBinanceP2P) / precioSpotEfectivo) - (1 / precioVentaBinance)) / (1 / precioVentaBinance) * 100;
        document.getElementById('bs_binancePrecio').textContent = precioVentaBinance.toFixed(2);
        document.getElementById('bs_binanceSpotEfectivo').textContent = precioSpotEfectivo.toFixed(2);
        const elPct = document.getElementById('bs_binanceGananciaPct');
        elPct.textContent = (gananciaPctBinance >= 0 ? '+' : '') + gananciaPctBinance.toFixed(3) + '%';
        elPct.style.color = gananciaPctBinance >= 0 ? '#00c897' : '#f05a5a';
    }

    // Calcular por cada monto
    capitales.forEach(function(cap) {
        // Bybit → Spot
        const usdtVendidosBybit = precioVentaBybit > 0 ? cap.amount / precioVentaBybit : 0;
        const usdtCompradosBybit = precioSpotEfectivo > 0 ? cap.amount / precioSpotEfectivo : 0;
        const gananciaBybit = usdtCompradosBybit - usdtVendidosBybit;
        const gananciaPctBybit = usdtVendidosBybit > 0 ? (gananciaBybit / usdtVendidosBybit) * 100 : 0;

        const elBybit = document.getElementById('bs_row_' + cap.key + '_bybit');
        const elBybitPct = document.getElementById('bs_row_' + cap.key + '_bybit_pct');
        if (elBybit) elBybit.textContent = usdtVendidosBybit > 0 ? gananciaBybit.toFixed(2) + ' USDT' : '—';
        if (elBybitPct) elBybitPct.textContent = usdtVendidosBybit > 0 ? (gananciaPctBybit >= 0 ? '+' : '') + gananciaPctBybit.toFixed(3) + '%' : '—';
        if (elBybit) elBybit.style.color = gananciaBybit >= 0 ? '#00c897' : '#f05a5a';
        if (elBybitPct) elBybitPct.style.color = gananciaBybit >= 0 ? '#00c897' : '#f05a5a';

        // Binance → Spot
        const arsNetoBinance = cap.amount * (1 - comisionBinanceP2P);
        const usdtVendidosBinance = precioVentaBinance > 0 ? cap.amount / precioVentaBinance : 0;
        const usdtCompradosBinance = precioSpotEfectivo > 0 ? arsNetoBinance / precioSpotEfectivo : 0;
        const gananciaBinance = usdtCompradosBinance - usdtVendidosBinance;
        const gananciaPctBinance = usdtVendidosBinance > 0 ? (gananciaBinance / usdtVendidosBinance) * 100 : 0;

        const elBinance = document.getElementById('bs_row_' + cap.key + '_binance');
        const elBinancePct = document.getElementById('bs_row_' + cap.key + '_binance_pct');
        if (elBinance) elBinance.textContent = usdtVendidosBinance > 0 ? gananciaBinance.toFixed(2) + ' USDT' : '—';
        if (elBinancePct) elBinancePct.textContent = usdtVendidosBinance > 0 ? (gananciaPctBinance >= 0 ? '+' : '') + gananciaPctBinance.toFixed(3) + '%' : '—';
        if (elBinance) elBinance.style.color = gananciaBinance >= 0 ? '#00c897' : '#f05a5a';
        if (elBinancePct) elBinancePct.style.color = gananciaBinance >= 0 ? '#00c897' : '#f05a5a';
    });

    // BANNER GANADOR
    const banner = document.getElementById('bs_winnerBanner');
    const nameEl = document.getElementById('bs_winnerName');
    const detailEl = document.getElementById('bs_winnerDetail');

    if (precioVentaBybit > 0 || precioVentaBinance > 0) {
        banner.style.display = 'block';

        // Calcular ganancia en 2M para el banner
        const usdtBybit2m = precioVentaBybit > 0 ? 2000000 / precioVentaBybit : 0;
        const ganBybit2m = precioSpotEfectivo > 0 ? (2000000 / precioSpotEfectivo) - usdtBybit2m : 0;
        const ganPctBybit2m = usdtBybit2m > 0 ? (ganBybit2m / usdtBybit2m) * 100 : 0;

        const arsNetoBinance2m = 2000000 * (1 - comisionBinanceP2P);
        const usdtBinance2m = precioVentaBinance > 0 ? 2000000 / precioVentaBinance : 0;
        const ganBinance2m = precioSpotEfectivo > 0 ? (arsNetoBinance2m / precioSpotEfectivo) - usdtBinance2m : 0;
        const ganPctBinance2m = usdtBinance2m > 0 ? (ganBinance2m / usdtBinance2m) * 100 : 0;

        if (ganPctBybit2m > ganPctBinance2m + 0.001) {
            banner.className = 'winner-banner winner-bybit';
            nameEl.textContent = 'Bybit P2P → Binance Spot';
            detailEl.textContent = '+' + ganBybit2m.toFixed(2) + ' USDT en $2M  ·  ' + (ganPctBybit2m >= 0 ? '+' : '') + ganPctBybit2m.toFixed(3) + '%  ·  +' + (ganPctBybit2m - ganPctBinance2m).toFixed(3) + '% sobre Binance';
        } else if (ganPctBinance2m > ganPctBybit2m + 0.001) {
            banner.className = 'winner-banner winner-binance';
            nameEl.textContent = 'Binance P2P → Binance Spot';
            detailEl.textContent = '+' + ganBinance2m.toFixed(2) + ' USDT en $2M  ·  ' + (ganPctBinance2m >= 0 ? '+' : '') + ganPctBinance2m.toFixed(3) + '%  ·  +' + (ganPctBinance2m - ganPctBybit2m).toFixed(3) + '% sobre Bybit';
        } else {
            banner.className = 'winner-banner winner-empate';
            nameEl.textContent = 'Empate — Ambas estrategias dan igual';
            detailEl.textContent = 'Diferencia despreciable en todos los montos';
        }
    } else {
        banner.style.display = 'none';
    }
}

// -------------------------------------------------------------
// CONSULTA DE PRECIO SPOT BINANCE (EN VIVO)
// -------------------------------------------------------------
window.actualizarPrecioSpotBinance = async function() {
    const precioSpotInput = document.getElementById('bs_precioSpot');
    if (!precioSpotInput) return;

    const oldPrice = precioSpotInput.value;
    precioSpotInput.placeholder = "Cargando...";

    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTARS');

        if (!response.ok) throw new Error("Error al conectar con Binance");

        const data = await response.json();
        const precio = parseFloat(data.price);

        if (precio && !isNaN(precio) && precio > 0) {
            precioSpotInput.value = precio.toFixed(2);
        } else {
            precioSpotInput.value = oldPrice || "";
        }

    } catch (error) {
        console.error("Error al obtener precio spot de Binance:", error);
        if (!precioSpotInput.value || precioSpotInput.value === "") {
            precioSpotInput.value = oldPrice || "";
        }
    } finally {
        precioSpotInput.placeholder = "Ej: 1584.70";
    }
}

// ================================================================
// 6. CONTROL DE VISIBILIDAD DE PESTAÑAS (KRAKEN)
// ================================================================

function toggleKraken() {
    const checkbox = document.getElementById('checkMostrarKraken');
    const btnKraken = document.getElementById('btnKraken');
    
    // 1. Ocultar o mostrar el botón según el estado del checkbox
    if (checkbox.checked) {
        btnKraken.style.display = 'block'; // Mostrar
    } else {
        btnKraken.style.display = 'none';  // Ocultar
    }

    // 2. Guardar la preferencia en el navegador (LocalStorage) para que no se olvide
    localStorage.setItem('mostrarKraken', checkbox.checked);
}

// 3. Al cargar la página, recordar la última preferencia del usuario
document.addEventListener('DOMContentLoaded', function() {
    const checkbox = document.getElementById('checkMostrarKraken');
    const btnKraken = document.getElementById('btnKraken');

    // Comisión P2P Binance verificada (por defecto: verificado = 0.16%)
    const comisionGuardada = localStorage.getItem('comisionP2PVerificada');
    if (comisionGuardada === 'false') comisionP2PVerificada = false;
    const cbComision = document.getElementById('checkComisionP2P');
    if (cbComision) cbComision.checked = comisionP2PVerificada;

    // Leer lo que guardamos antes (si existe). Si no existe, por defecto es true (mostrar).
    const recordar = localStorage.getItem('mostrarKraken');
    
    if (recordar === 'false') {
        checkbox.checked = false;
        btnKraken.style.display = 'none';
    } else {
        checkbox.checked = true;
        btnKraken.style.display = 'block';
    }
});

// ================================================================
// 5. PESTAÑA VUELTA SPOT → P2P
// ================================================================

window.actualizarPrecioSpotRetiro = function() {
    return fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTARS')
        .then(res => {
            if (!res.ok) throw new Error('Error Binance API');
            return res.json();
        })
        .then(data => {
            const el = document.getElementById('sv_precioSpot');
            if (el) el.value = parseFloat(data.price).toFixed(2);
        })
        .catch(err => {
            console.error('Error precio Spot Retiro:', err);
        });
};

window.calcularSpotRetiro = function() {
    const precioSpotInput = document.getElementById('sv_precioSpot');
    if (!precioSpotInput) return;

    const precioSpot = parseFloat(precioSpotInput.value) || 0;
    const precioCompraBybit = parseFloat(document.getElementById('sv_precioCompraBybit').value) || 0;
    const precioCompraBinance = parseFloat(document.getElementById('sv_precioCompraBinance').value) || 0;
    const usdtVender = parseFloat(document.getElementById('sv_usdtVender').value) || 0;

    const COMISION_SPOT = 0.001;
    const COMISION_RETIRO = 0.01;
    const COMISION_P2P_BINANCE = getComisionP2PBinance();

    // ARS después de vender en Spot
    const arsBrutos = usdtVender * precioSpot;
    const arsPostSpot = arsBrutos * (1 - COMISION_SPOT);
    const arsPostRetiro = arsPostSpot * (1 - COMISION_RETIRO);

    // Nota de break-even (precio máximo de recompra P2P para que la vuelta sea rentable)
    const breakBybit = precioSpot * (1 - COMISION_SPOT) * (1 - COMISION_RETIRO);
    const breakBinance = breakBybit / (1 + COMISION_P2P_BINANCE);
    const diffBybit = precioSpot - breakBybit;
    const diffBinance = precioSpot - breakBinance;
    const notaEl = document.getElementById('sv_notaSpot');
    if (notaEl && precioSpot > 0) {
        notaEl.style.display = 'block';
        document.getElementById('sv_breakBybit').textContent = breakBybit.toFixed(2);
        document.getElementById('sv_diffBybit').textContent = diffBybit.toFixed(2);
        document.getElementById('sv_breakBinance').textContent = breakBinance.toFixed(2);
        document.getElementById('sv_diffBinance').textContent = diffBinance.toFixed(2);
    }

    // === Bybit P2P ===
    const usdtBybit = precioCompraBybit > 0 ? arsPostRetiro / precioCompraBybit : 0;
    const gananciaBybit = usdtBybit - usdtVender;
    const pctBybit = usdtVender > 0 ? (gananciaBybit / usdtVender) * 100 : 0;

    document.getElementById('sv_bybit_arsSpot').textContent = '$' + arsPostSpot.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    document.getElementById('sv_bybit_arsRetiro').textContent = '$' + arsPostRetiro.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    document.getElementById('sv_bybit_usdtFinal').textContent = usdtBybit.toFixed(2) + ' USDT';

    const colorBybit = gananciaBybit >= 0 ? 'positive' : 'negative';
    document.getElementById('sv_bybit_ganancia').textContent = (gananciaBybit >= 0 ? '+' : '') + gananciaBybit.toFixed(2) + ' USDT';
    document.getElementById('sv_bybit_ganancia').className = 'value ' + colorBybit;

    const bigBybit = document.getElementById('sv_bybit_resultBig');
    bigBybit.style.display = 'block';
    bigBybit.className = 'result-big result-' + colorBybit;
    document.getElementById('sv_bybit_pct').textContent = (pctBybit >= 0 ? '+' : '') + pctBybit.toFixed(3) + '%';

    // === Binance P2P ===
    const precioBinanceFinal = precioCompraBinance > 0 ? precioCompraBinance * (1 + COMISION_P2P_BINANCE) : 0;
    const usdtBinance = precioBinanceFinal > 0 ? arsPostRetiro / precioBinanceFinal : 0;
    const gananciaBinance = usdtBinance - usdtVender;
    const pctBinance = usdtVender > 0 ? (gananciaBinance / usdtVender) * 100 : 0;

    document.getElementById('sv_binance_arsSpot').textContent = '$' + arsPostSpot.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    document.getElementById('sv_binance_arsRetiro').textContent = '$' + arsPostRetiro.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    document.getElementById('sv_binance_usdtFinal').textContent = usdtBinance.toFixed(2) + ' USDT';

    const colorBinance = gananciaBinance >= 0 ? 'positive' : 'negative';
    document.getElementById('sv_binance_ganancia').textContent = (gananciaBinance >= 0 ? '+' : '') + gananciaBinance.toFixed(2) + ' USDT';
    document.getElementById('sv_binance_ganancia').className = 'value ' + colorBinance;

    const bigBinance = document.getElementById('sv_binance_resultBig');
    bigBinance.style.display = 'block';
    bigBinance.className = 'result-big result-' + colorBinance;
    document.getElementById('sv_binance_pct').textContent = (pctBinance >= 0 ? '+' : '') + pctBinance.toFixed(3) + '%';

    // === TABLA ===
    const montos = [
        { usdt: 100,   key: '100' },
        { usdt: 500,   key: '500' },
        { usdt: 1000,  key: '1k' },
        { usdt: 5000,  key: '5k' }
    ];

    montos.forEach(function(m) {
        const arsM = m.usdt * precioSpot * (1 - COMISION_SPOT) * (1 - COMISION_RETIRO);

        // Bybit
        const uB = precioCompraBybit > 0 ? arsM / precioCompraBybit : 0;
        const gB = uB - m.usdt;
        const pB = m.usdt > 0 ? (gB / m.usdt) * 100 : 0;
        const elB = document.getElementById('sv_row_' + m.key + '_bybit');
        const elBP = document.getElementById('sv_row_' + m.key + '_bybit_pct');
        if (elB) { elB.textContent = (gB >= 0 ? '+' : '') + gB.toFixed(2); elB.style.color = gB >= 0 ? '#00c897' : '#f05a5a'; }
        if (elBP) { elBP.textContent = (pB >= 0 ? '+' : '') + pB.toFixed(3) + '%'; elBP.style.color = gB >= 0 ? '#00c897' : '#f05a5a'; }

        // Binance
        const uN = precioBinanceFinal > 0 ? arsM / precioBinanceFinal : 0;
        const gN = uN - m.usdt;
        const pN = m.usdt > 0 ? (gN / m.usdt) * 100 : 0;
        const elN = document.getElementById('sv_row_' + m.key + '_binance');
        const elNP = document.getElementById('sv_row_' + m.key + '_binance_pct');
        if (elN) { elN.textContent = (gN >= 0 ? '+' : '') + gN.toFixed(2); elN.style.color = gN >= 0 ? '#00c897' : '#f05a5a'; }
        if (elNP) { elNP.textContent = (pN >= 0 ? '+' : '') + pN.toFixed(3) + '%'; elNP.style.color = gN >= 0 ? '#00c897' : '#f05a5a'; }
    });

    // === BANNER GANADOR ===
    const banner = document.getElementById('sv_winnerBanner');
    const nameEl = document.getElementById('sv_winnerName');
    const detailEl = document.getElementById('sv_winnerDetail');

    if (usdtVender > 0 && (precioCompraBybit > 0 || precioCompraBinance > 0)) {
        banner.style.display = 'block';

        if (pctBybit > pctBinance + 0.001) {
            banner.className = 'winner-banner winner-bybit';
            nameEl.textContent = 'Bybit P2P — te da ' + gananciaBybit.toFixed(2) + ' USDT más';
            detailEl.textContent = 'Bybit: ' + (pctBybit >= 0 ? '+' : '') + pctBybit.toFixed(3) + '%  ·  Binance: ' + (pctBinance >= 0 ? '+' : '') + pctBinance.toFixed(3) + '%  ·  Diferencia: +' + (pctBybit - pctBinance).toFixed(3) + '%';
        } else if (pctBinance > pctBybit + 0.001) {
            banner.className = 'winner-banner winner-binance';
            nameEl.textContent = 'Binance P2P — te da ' + gananciaBinance.toFixed(2) + ' USDT más';
            detailEl.textContent = 'Binance: ' + (pctBinance >= 0 ? '+' : '') + pctBinance.toFixed(3) + '%  ·  Bybit: ' + (pctBybit >= 0 ? '+' : '') + pctBybit.toFixed(3) + '%  ·  Diferencia: +' + (pctBinance - pctBybit).toFixed(3) + '%';
        } else {
            banner.className = 'winner-banner winner-empate';
            nameEl.textContent = 'Empate — ambas opciones dan lo mismo';
            detailEl.textContent = 'Diferencia despreciable entre ambas';
        }
    } else {
        banner.style.display = 'none';
    }
}

// ================================================================
// 6. SISTEMA DE GUARDADO DE DATOS ENTRE PESTAÑAS (localStorage)
// ================================================================

// Función para guardar el valor de un input en localStorage
function guardarInput(idInput) {
    const input = document.getElementById(idInput);
    if (input) {
        localStorage.setItem(idInput, input.value);
    }
}

// Función para restaurar el valor de un input desde localStorage
function restaurarInput(idInput) {
    const input = document.getElementById(idInput);
    if (input) {
        const valorGuardado = localStorage.getItem(idInput);
        if (valorGuardado !== null) {
            input.value = valorGuardado;
        }
    }
}

// Función para restaurar TODOS los inputs de una pestaña específica
function restaurarPestana(listaIds) {
    listaIds.forEach(id => restaurarInput(id));
}

// Función para guardar TODOS los inputs de una pestaña específica (se llama con cada tecla)
function guardarPestana(listaIds) {
    listaIds.forEach(id => guardarInput(id));
}

// ================================================================
// DÓLAR OFICIAL + BLUE + UALÁ (DolarApi.com / ComparaDolar) — consulta cada 10 min + gráfico SVG
// ================================================================
let historialDolar = [];
let historialDolarBlue = [];
let historialDolarUala = [];
const DOLAR_MAX_PUNTOS = 288; // 48 hs a una muestra cada 10 min
const DOLAR_MIN_INTERVALO = 10 * 60 * 1000; // ventana mínima entre muestras y entre consultas manuales

function cargarHistorialDolar() {
    try {
        const raw = localStorage.getItem('dolarOficialHistorial');
        historialDolar = raw ? JSON.parse(raw) : [];
    } catch (e) {
        historialDolar = [];
    }
    if (!Array.isArray(historialDolar)) historialDolar = [];
}

function cargarHistorialDolarBlue() {
    try {
        const raw = localStorage.getItem('dolarBlueHistorial');
        historialDolarBlue = raw ? JSON.parse(raw) : [];
    } catch (e) {
        historialDolarBlue = [];
    }
    if (!Array.isArray(historialDolarBlue)) historialDolarBlue = [];
}

function cargarHistorialDolarUala() {
    try {
        const raw = localStorage.getItem('dolarUalaHistorial');
        historialDolarUala = raw ? JSON.parse(raw) : [];
    } catch (e) {
        historialDolarUala = [];
    }
    if (!Array.isArray(historialDolarUala)) historialDolarUala = [];
}

function guardarHistorialDolar() {
    try {
        localStorage.setItem('dolarOficialHistorial', JSON.stringify(historialDolar.slice(-DOLAR_MAX_PUNTOS)));
    } catch (e) {}
}

function guardarHistorialDolarBlue() {
    try {
        localStorage.setItem('dolarBlueHistorial', JSON.stringify(historialDolarBlue.slice(-DOLAR_MAX_PUNTOS)));
    } catch (e) {}
}

function guardarHistorialDolarUala() {
    try {
        localStorage.setItem('dolarUalaHistorial', JSON.stringify(historialDolarUala.slice(-DOLAR_MAX_PUNTOS)));
    } catch (e) {}
}

// Fusionar históricos (localStorage + archivo del recopilador) sin repetir muestras
// de la misma franja de 10 min.
function fusionarHistoriales(base, extra) {
    const bucket = {};
    [base, extra].forEach(function(arr) {
        (arr || []).forEach(function(p) {
            const clave = Math.floor(p.t / DOLAR_MIN_INTERVALO);
            if (!(clave in bucket)) bucket[clave] = p;
        });
    });
    let salida = Object.keys(bucket).sort(function(a, b) { return a - b; }).map(function(k) { return bucket[k]; });
    if (salida.length > DOLAR_MAX_PUNTOS) salida = salida.slice(-DOLAR_MAX_PUNTOS);
    return salida;
}

function mergeHistorialDolar(extra) {
    historialDolar = fusionarHistoriales(historialDolar, extra);
    guardarHistorialDolar();
}

function mergeHistorialDolarBlue(extra) {
    historialDolarBlue = fusionarHistoriales(historialDolarBlue, extra);
    guardarHistorialDolarBlue();
}

function mergeHistorialDolarUala(extra) {
    historialDolarUala = fusionarHistoriales(historialDolarUala, extra);
    guardarHistorialDolarUala();
}

// Leer los históricos que acumuló el recopilador (data/dolar_historial.json,
// data/dolar_blue_historial.json y data/dolar_uala_historial.json). Si no existen
// (o es file:// y el fetch no alcanza), se mantiene el histórico local.
async function leerHistorialDesdeArchivo() {
    const fuentes = [
        ['data/dolar_historial.json', mergeHistorialDolar],
        ['data/dolar_blue_historial.json', mergeHistorialDolarBlue],
        ['data/dolar_uala_historial.json', mergeHistorialDolarUala]
    ];
    for (let i = 0; i < fuentes.length; i++) {
        try {
            const res = await fetch(fuentes[i][0], { cache: 'no-store' });
            if (res.ok) {
                const datos = await res.json();
                if (Array.isArray(datos) && datos.length > 0) fuentes[i][1](datos);
            }
        } catch (e) {}
    }
}

function formatearNumero(v) {
    return v.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function pasoBonitoGrafico(rango, objetivoTicks) {
    const bruto = rango / objetivoTicks;
    if (bruto <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const norm = bruto / mag;
    let paso;
    if (norm <= 1) paso = 1;
    else if (norm <= 2) paso = 2;
    else if (norm <= 2.5) paso = 2.5;
    else if (norm <= 5) paso = 5;
    else paso = 10;
    return paso * mag;
}

function dibujarGraficoDolar(svgId, series, color) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    // compatibilidad: un solo array de puntos pasado directamente
    if (Array.isArray(series) && series.length > 0 && series[0] && typeof series[0].compra !== 'undefined') {
        series = [{ puntos: series, color: color || '#3b82f6', etiqueta: '' }];
    }
    const W = 900, H = 320, padL = 78, padR = 20, padT = 20, padB = 42;
    const ancho = W - padL - padR;
    const alto = H - padT - padB;

    const noVacio = (series || []).filter(function(sr) { return sr.puntos.length > 0; });
    if (noVacio.length === 0) {
        svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="14" fill="#6a7e99">Sin datos todavía. Consultá una vez para empezar el gráfico.</text>`;
        return;
    }

    let min = Infinity, max = -Infinity;
    let tMin = Infinity, tMax = -Infinity;
    noVacio.forEach(function(sr) {
        sr.puntos.forEach(function(p) {
            if (p.compra < min) min = p.compra;
            if (p.compra > max) max = p.compra;
            if (p.t < tMin) tMin = p.t;
            if (p.t > tMax) tMax = p.t;
        });
    });
    if (min === max) { min -= 1; max += 1; }
    const rango = max - min;
    min -= rango * 0.08;
    max += rango * 0.08;

    // Eje X por hora real (no por índice): cada muestra va donde corresponde en el tiempo
    const rangoT = tMax - tMin;

    const yPos = function(v) {
        return padT + alto - ((v - min) / (max - min)) * alto;
    };
    const xPos = function(t) {
        if (rangoT <= 0) return padL + ancho / 2;
        return padL + ((t - tMin) / rangoT) * ancho;
    };

    let s = '';
    const paso = pasoBonitoGrafico(max - min, 5);
    for (let v = Math.ceil(min / paso) * paso; v <= max; v += paso) {
        const y = yPos(v);
        s += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#2a3442" stroke-width="1"/>`;
        s += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="12" fill="#8899b0">${formatearNumero(v)}</text>`;
    }

    // Etiquetas horarias: cada 2 hs si hay más de 3 hs de datos; si no, una por muestra
    const DOS_HORAS = 2 * 60 * 60 * 1000;
    if (rangoT > 3 * 60 * 60 * 1000) {
        const inicio = Math.ceil(tMin / DOS_HORAS) * DOS_HORAS;
        for (let tick = inicio; tick <= tMax; tick += DOS_HORAS) {
            const x = xPos(tick);
            const t = new Date(tick);
            s += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + alto}" stroke="#2a3442" stroke-width="1"/>`;
            s += `<text x="${x}" y="${H - 14}" text-anchor="middle" font-size="12" fill="#8899b0">${t.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</text>`;
        }
    } else {
        const todas = noVacio[0].puntos;
        const pasoEtiquetas = Math.max(1, Math.ceil(todas.length / 6));
        todas.forEach(function(p, i) {
            if (i % pasoEtiquetas !== 0 && i !== todas.length - 1) return;
            const x = xPos(p.t);
            const t = new Date(p.t);
            s += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + alto}" stroke="#2a3442" stroke-width="1" stroke-dasharray="3,4"/>`;
            s += `<text x="${x}" y="${H - 14}" text-anchor="middle" font-size="12" fill="#8899b0">${t.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</text>`;
        });
    }

    noVacio.forEach(function(sr) {
        const pts = sr.puntos.map(function(p) {
            return xPos(p.t).toFixed(1) + ',' + yPos(p.compra).toFixed(1);
        }).join(' ');
        s += `<polyline points="${pts}" fill="none" stroke="${sr.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

        const last = sr.puntos[sr.puntos.length - 1];
        const lx = xPos(last.t);
        const ly = yPos(last.compra);
        s += `<circle cx="${lx}" cy="${ly}" r="4.5" fill="${sr.color}"/>`;
        s += `<text x="${lx}" y="${ly - (noVacio.indexOf(sr) === 0 ? 10 : 18)}" text-anchor="middle" font-size="12" font-weight="bold" fill="${sr.color}">${formatearNumero(last.compra)}</text>`;
    });

    s += `<rect x="${padL}" y="${padT}" width="${ancho}" height="${alto}" fill="none" stroke="#2a3442"/>`;
    svg.innerHTML = s;
}

window.consultarDolar = async function() {
    const btn = document.getElementById('btnActualizarDolar');
    if (btn) { btn.disabled = true; btn.textContent = '⟳ Consultando…'; }
    const errEl = document.getElementById('dolarError');
    if (errEl) errEl.textContent = '';
    const ahora = Date.now();
    const ultimoT = Math.max(
        historialDolar.length ? historialDolar[historialDolar.length - 1].t : 0,
        historialDolarBlue.length ? historialDolarBlue[historialDolarBlue.length - 1].t : 0,
        historialDolarUala.length ? historialDolarUala[historialDolarUala.length - 1].t : 0
    );
    try {
        const resultados = await Promise.allSettled([
            fetch('https://dolarapi.com/v1/dolares/oficial').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(d) { return { compra: d.compra }; }),
            fetch('https://dolarapi.com/v1/dolares/blue').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(d) { return { compra: d.compra }; }),
            fetch('https://api.comparadolar.ar/usd').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(d) {
                const uala = (d || []).filter(function(x) { return x.slug === 'uala'; })[0];
                if (!uala || typeof uala.ask !== 'number') throw new Error('sin cotización de Ualá');
                return { compra: uala.ask };
            })
        ]);
        const unNuevo = !ultimoT || ahora - ultimoT >= 60 * 1000;
        for (let i = 0; i < 3; i++) {
            if (resultados[i].status !== 'fulfilled') continue;
            const serie = (i === 1) ? 'blue' : (i === 2) ? 'uala' : 'oficial';
            const dst = { oficial: 'historialDolar', blue: 'historialDolarBlue', uala: 'historialDolarUala' }[serie];
            if (!unNuevo) break;
            window[dst].push({ t: ahora, compra: resultados[i].value.compra });
        }
        guardarHistorialDolar();
        guardarHistorialDolarBlue();
        guardarHistorialDolarUala();
        const hora = new Date(ahora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ultActEl = document.getElementById('dolarUltAct');
        if (ultActEl) ultActEl.textContent = hora;
        const ultActBlueEl = document.getElementById('blueUltAct');
        if (ultActBlueEl) ultActBlueEl.textContent = hora;
        actualizarVistaDolar();
    } catch (err) {
        if (errEl) errEl.textContent = 'No se pudo consultar DolarApi/ComparaDolar. Se reintentará en 10 min. (' + err.message + ')';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⟳ Actualizar ahora'; }
    }
};

// Series a dibujar en cada panel: el oficial lleva también la línea de Ualá.
function construirSeriesGrafico(prefijo) {
    if (prefijo === 'dolar') {
        return [
            { puntos: historialDolar, color: '#3b82f6', etiqueta: 'Oficial BCRA' },
            { puntos: historialDolarUala, color: '#f59e0b', etiqueta: 'Ualá' }
        ];
    }
    return [{ puntos: historialDolarBlue, color: '#38bdf8', etiqueta: 'Blue' }];
}

// Renderizar un panel (oficial o blue). prefijo: 'dolar' o 'blue'; ids: prefijoCompra,
// prefijoUltimoPrecio, prefijoVariacion, prefijoUltAct, prefijoGrafico.
function aplicarPanelVista(prefijo, historial, color) {
    const compraEl = document.getElementById(prefijo + 'Compra');
    if (!compraEl) return;
    const ultActEl = document.getElementById(prefijo + 'UltAct');
    const ultimoPrecioEl = document.getElementById(prefijo + 'UltimoPrecio');
    const varEl = document.getElementById(prefijo + 'Variacion');
    if (historial.length === 0) {
        compraEl.textContent = '—';
        if (ultimoPrecioEl) { ultimoPrecioEl.textContent = '—'; ultimoPrecioEl.style.color = ''; }
        if (varEl) varEl.textContent = '—';
        if (ultActEl) ultActEl.textContent = '—';
        dibujarGraficoDolar(prefijo + 'Grafico', construirSeriesGrafico(prefijo));
        return;
    }
    const last = historial[historial.length - 1];
    compraEl.textContent = '$' + formatearNumero(last.compra);
    if (ultActEl) ultActEl.textContent = new Date(last.t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    // Último precio distinto al actual: verde si era más (el dólar bajó), rojo si era menos (el dólar subió)
    let prevDistinto = null;
    for (let i = historial.length - 2; i >= 0; i--) {
        if (historial[i].compra !== last.compra) { prevDistinto = historial[i]; break; }
    }
    if (ultimoPrecioEl) {
        if (prevDistinto) {
            const eraMas = prevDistinto.compra > last.compra;
            ultimoPrecioEl.textContent = '$' + formatearNumero(prevDistinto.compra);
            ultimoPrecioEl.style.color = eraMas ? '#22c55e' : '#ef4444';
        } else {
            ultimoPrecioEl.textContent = '—';
            ultimoPrecioEl.style.color = '';
        }
    }
    const prev = historial[historial.length - 2];
    if (varEl) {
        if (prev) {
            const diff = last.compra - prev.compra;
            varEl.textContent = (diff >= 0 ? '+' : '') + formatearNumero(diff);
            varEl.style.color = diff >= 0 ? '#22c55e' : '#ef4444';
        } else {
            varEl.textContent = '—';
        }
    }
    dibujarGraficoDolar(prefijo + 'Grafico', construirSeriesGrafico(prefijo));
}

// Strip "Dólar Ualá" dentro del panel DOLAR OFICIAL
function actualizarVistaUala() {
    const ualaEl = document.getElementById('dolarUala');
    const varEl = document.getElementById('dolarUalaVar');
    if (!ualaEl) return;
    const hist = historialDolarUala;
    if (hist.length === 0) {
        ualaEl.textContent = '—';
        ualaEl.style.color = '';
        if (varEl) { varEl.textContent = '—'; varEl.style.color = ''; }
        return;
    }
    const last = hist[hist.length - 1];
    ualaEl.textContent = '$' + formatearNumero(last.compra);
    let prevDistinto = null;
    for (let i = hist.length - 2; i >= 0; i--) {
        if (hist[i].compra !== last.compra) { prevDistinto = hist[i]; break; }
    }
    if (prevDistinto) {
        const eraMas = prevDistinto.compra > last.compra;
        ualaEl.style.color = eraMas ? '#22c55e' : '#ef4444';
        if (varEl) {
            const diff = last.compra - prevDistinto.compra;
            const pct = (diff / prevDistinto.compra) * 100;
            varEl.textContent = (diff >= 0 ? '+' : '') + formatearNumero(diff) + ' (' + (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%)';
            varEl.style.color = eraMas ? '#22c55e' : '#ef4444';
        }
    } else {
        ualaEl.style.color = '';
        if (varEl) { varEl.textContent = '—'; varEl.style.color = ''; }
    }
}

function actualizarVistaDolar() {
    aplicarPanelVista('dolar', historialDolar, '#3b82f6');
    aplicarPanelVista('blue', historialDolarBlue, '#38bdf8');
    actualizarVistaUala();
}

function mostrarAvisoDolar(mensaje) {
    let overlay = document.getElementById('dolarModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'dolarModal';
        overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.55); display: none; align-items: center; justify-content: center;';
        const caja = document.createElement('div');
        caja.style.cssText = 'background: #10171f; border: 1px solid #3b82f6; border-radius: 12px; padding: 22px 26px; max-width: 420px; font-size: 14px; line-height: 1.6; color: #e8edf5; box-shadow: 0 10px 40px rgba(0,0,0,.6); text-align: left;';
        const msgDiv = document.createElement('div');
        msgDiv.id = 'dolarModalMsg';
        msgDiv.style.cssText = 'white-space: pre-line;';
        const btn = document.createElement('button');
        btn.textContent = 'Aceptar';
        btn.style.cssText = 'margin-top: 18px; background: #3b82f6; color: #fff; border: none; padding: 9px 28px; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600;';
        btn.addEventListener('click', function() { overlay.style.display = 'none'; });
        caja.appendChild(msgDiv);
        caja.appendChild(btn);
        overlay.appendChild(caja);
        document.body.appendChild(overlay);
    }
    document.getElementById('dolarModalMsg').textContent = mensaje;
    overlay.style.display = 'flex';
}

// Botón "Actualizar ahora": si hace poco que se consultó, avisa en vez de sumar muestra
window.consultarDolarManual = function() {
    const ahora = Date.now();
    const ultimo = historialDolar[historialDolar.length - 1];
    const ultimoBlue = historialDolarBlue[historialDolarBlue.length - 1];
    const ultimoUala = historialDolarUala[historialDolarUala.length - 1];
    const ultimoT = Math.max(ultimo ? ultimo.t : 0, ultimoBlue ? ultimoBlue.t : 0, ultimoUala ? ultimoUala.t : 0);
    if (ultimoT && ahora - ultimoT < DOLAR_MIN_INTERVALO) {
        const tUlt = new Date(ultimoT);
        const prox = new Date(ultimoT + DOLAR_MIN_INTERVALO);
        const faltan = Math.ceil((ultimoT + DOLAR_MIN_INTERVALO - ahora) / 60000);
        let mensaje = 'La última consulta se ejecutó a las ' + tUlt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (ultimo) mensaje += '\nPrecio oficial: $' + formatearNumero(ultimo.compra);
        if (ultimoUala) mensaje += '\nPrecio Ualá: $' + formatearNumero(ultimoUala.compra);
        if (ultimoBlue) mensaje += '\nPrecio blue: $' + formatearNumero(ultimoBlue.compra);
        mensaje += '\nLa próxima consulta automática será en ~' + faltan + ' min (a las ' + prox.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ').';
        mostrarAvisoDolar(mensaje);
        return;
    }
    window.consultarDolar();
};

// Mostrar la vista del dólar (vive en index.html, no se fetchea) y consultar al toque
window.cargarDolar = async function() {
    const contenedorDolar = document.getElementById('contenedor-dolar');
    const contenedor = document.getElementById('contenedor-dinamico');
    if (contenedorDolar) contenedorDolar.style.display = 'block';
    if (contenedor) contenedor.style.display = 'none';
    cargarHistorialDolar();
    cargarHistorialDolarBlue();
    cargarHistorialDolarUala();
    await leerHistorialDesdeArchivo();
    actualizarVistaDolar();
    window.consultarDolar();
};

function iniciarPollerDolar() {
    cargarHistorialDolar();
    cargarHistorialDolarBlue();
    cargarHistorialDolarUala();
    setInterval(function() { window.consultarDolar(); }, 10 * 60 * 1000);
}