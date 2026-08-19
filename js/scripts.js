// ================================================================
// 1. SISTEMA DE PESTAÑAS Y CARGA DE ARCHIVOS (CON EVENTOS)
// ================================================================
async function cargarPagina(rutaHtml) {
    const contenedor = document.getElementById('contenedor-dinamico');
    
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
                setTimeout(window.calcularSpread, 100);
            } else if (rutaHtml.includes('fiwind.html') && typeof window.calcularFiwind === 'function') {
                const inputsFiwind = ['usdPrice', 'usdtRate', 'myPrice', 'capitalArs'];
                restaurarPestana(inputsFiwind);
                agregarEventosAInputs(inputsFiwind, window.calcularFiwind);
                inputsFiwind.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
                (async () => {
                    await window.actualizarPreciosFiwind();
                    setTimeout(window.calcularFiwind, 100);
                })();
            } else if (rutaHtml.includes('p2p_bybit_binance.html') && typeof window.calcularP2PBB === 'function') {
                const inputsP2P = [
                    'p2p_capital',
                    'p2p_precioVentaBybit', 'p2p_precioBrutoBinance',
                    'p2p_precioVentaBinance', 'p2p_precioBrutoBybit'
                ];
                restaurarPestana(inputsP2P);
                agregarEventosAInputs(inputsP2P, window.calcularP2PBB);
                inputsP2P.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => guardarInput(id));
                });
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
                window.actualizarPrecioSpotBinance().then(() => {
                    setTimeout(window.calcularBinanceSpot, 100);
                }).catch(() => {
                    setTimeout(window.calcularBinanceSpot, 100);
                });
            }

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

// Activar la clase 'active' en las pestañas al hacer clic
document.addEventListener('click', function(e) {
    if(e.target.classList.contains('tab')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
    }
});

// Cargar la primera pestaña por defecto al abrir la página (Spread)
window.onload = function() {
    cargarPagina('pages/spread.html');
};

// ================================================================
// 2. FUNCIONES DE CÁLCULO DE CADA PESTAÑA
// ================================================================

// --- PESTAÑA SPREAD (spread.html) ---
window.calcularSpread = function() {
    const precioVentaInput = document.getElementById('precioVenta');
    if(!precioVentaInput) return;

    // Leer valores
    const precioVenta = parseFloat(precioVentaInput.value) || 0;
    const arsRecibidos = parseFloat(document.getElementById('arsRecibidos').value) || 0;
    const precioCompra = parseFloat(document.getElementById('precioCompra').value) || 0;
    
    // Obtener el input de recompra
    const arsRecompraInput = document.getElementById('arsRecompra');
    let arsRecompra = parseFloat(arsRecompraInput.value) || 0;

    // Lógica clave: Si ARS Recibidos tiene un valor válido, forzamos a que Recompra tome el mismo valor
    // (Esto evita que se quede con el 575000 de ejemplo si el usuario no lo borró)
    if (arsRecibidos > 0) {
        arsRecompra = arsRecibidos;
        arsRecompraInput.value = arsRecibidos; // Actualizamos el valor visual del input
    }

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

// --- PESTAÑA FIWIND (fiwind.html) ---
window.calcularFiwind = function() {
    const usdPrice = document.getElementById('usdPrice');
    if(!usdPrice) return;

    // 👇 ESTA LÍNEA EVITA QUE SE ROMPA SI TARDAN EN LLEGAR LOS DATOS
    if(!document.getElementById('costUsdt')) return; 
    
    const usd = parseFloat(usdPrice.value);
    const rate = parseFloat(document.getElementById('usdtRate').value);
    if (isNaN(usd) || isNaN(rate)) return;

    const cost = usd * rate;
    document.getElementById('costUsdt').textContent = '$ ' + cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('breakeven').textContent = '$ ' + cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const myPriceVal = parseFloat(document.getElementById('myPrice').value);
    const capital = parseFloat(document.getElementById('capitalArs').value);

    if (!isNaN(myPriceVal) && myPriceVal > 0) {
        document.getElementById('myResultBlock').style.display = 'flex';
        document.getElementById('myHint').style.display = 'none';

        document.getElementById('buyPrice').textContent = '$ ' + cost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('sellPrice').textContent = '$ ' + myPriceVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const myGainArsVal = myPriceVal - cost;
        const myGainPctVal = (myGainArsVal / cost) * 100;
        const isWin = myGainArsVal >= 0;

        document.getElementById('myResultColor').className = 'result-big ' + (isWin ? 'green' : 'red');
        document.getElementById('myResultLabel').textContent = isWin ? 'Ganancia por USDT' : 'Pérdida por USDT';
        document.getElementById('myGainPct').textContent = (isWin ? '+' : '') + myGainPctVal.toFixed(3) + '%';
        document.getElementById('myGainArs').textContent = (isWin ? '+' : '') + '$ ' + myGainArsVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ARS por USDT';

        if (!isNaN(capital) && capital > 0) {
            document.getElementById('capitalResultBlock').style.display = 'flex';
            const usdtSoldVal = capital / myPriceVal;
            const usdBoughtVal = capital / usd;
            const usdtBoughtVal = capital / cost;
            const totalReturnVal = usdtBoughtVal * myPriceVal;
            const usdtGainVal = usdtBoughtVal - usdtSoldVal;
            const usdtGainPctVal = (usdtGainVal / usdtSoldVal) * 100;
            const isUsdtWin = usdtGainVal >= 0;

            document.getElementById('usdtSold').textContent = usdtSoldVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('totalUsd').textContent = 'U$D ' + usdBoughtVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('totalUsdt').textContent = usdtBoughtVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('totalReturn').textContent = '$ ' + totalReturnVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            document.getElementById('usdtGain').textContent = (isUsdtWin ? '+' : '') + usdtGainVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
            document.getElementById('usdtGainSub').textContent = (isUsdtWin ? '+' : '') + usdtGainPctVal.toFixed(3) + '% · ' + usdtSoldVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' vendidos → ' + usdtBoughtVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' comprados';
            document.getElementById('usdtGainBlock').className = 'result-big ' + (isUsdtWin ? 'green' : 'red');
            // =========================================================
            // 👇 NUEVO CÁLCULO DE GANANCIA EN ARS 👇
            // =========================================================
            const arsGainVal = totalReturnVal - capital;
            const arsGainPctVal = (arsGainVal / capital) * 100;
            const isArsWin = arsGainVal >= 0;

            // Mostramos el bloque
            document.getElementById('arsGainBlock').style.display = 'block';
            
            document.getElementById('arsGain').textContent = (isArsWin ? '+' : '') + '$ ' + arsGainVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            // 👇 CAMBIO AQUÍ: Agregamos el precio de venta al subtítulo
            document.getElementById('arsGainSub').textContent = (isArsWin ? '+' : '') + arsGainPctVal.toFixed(3) + '% · Valorizado a tu venta: $' + myPriceVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ARS/USDT';
            
            // Le ponemos el color verde si ganó, rojo si perdió
            document.getElementById('arsGainBlock').className = 'result-big ' + (isArsWin ? 'green' : 'red');

        } else {
            document.getElementById('capitalResultBlock').style.display = 'none';
        }
    } else {
        document.getElementById('myResultBlock').style.display = 'none';
        document.getElementById('myHint').style.display = 'block';
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

window.calcularP2PBB = function() {
    const precioVentaBybitInput = document.getElementById('p2p_precioVentaBybit');
    if (!precioVentaBybitInput) return;

    const precioVentaBybit = parseFloat(precioVentaBybitInput.value) || 0;
    const precioBrutoBinance = parseFloat(document.getElementById('p2p_precioBrutoBinance').value) || 0;
    const precioVentaBinance = parseFloat(document.getElementById('p2p_precioVentaBinance').value) || 0;
    const precioBrutoBybit = parseFloat(document.getElementById('p2p_precioBrutoBybit').value) || 0;
    const comisionBinance = 0.002;

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
    const precioSugerido1 = precioVentaBybit / (1 + 0.002) / (1 + comisionBinance);

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
        '$' + precioVentaBybit.toFixed(2) + ' ÷ 1.0020 ÷ ' + (1 + comisionBinance).toFixed(4) + ' = $' + precioSugerido1.toFixed(2);

    // Estrategia 2: Binance Venta → Bybit Compra
    const arsNetos2 = capital * (1 - comisionBinance);
    const usdtVendidos2 = precioVentaBinance > 0 ? capital / precioVentaBinance : 0;
    const usdtComprados2 = precioBrutoBybit > 0 ? arsNetos2 / precioBrutoBybit : 0;
    const gananciaUSDT2 = usdtComprados2 - usdtVendidos2;
    const gananciaARS2 = (usdtComprados2 * precioVentaBinance) - capital;
    const gananciaPctARS2 = capital > 0 ? (gananciaARS2 / capital) * 100 : 0;
    const gananciaPctUSDT2 = usdtVendidos2 > 0 ? (gananciaUSDT2 / usdtVendidos2) * 100 : 0;
    const spreadReal2 = gananciaPctUSDT2;
    const precioSugerido2 = precioVentaBinance * (1 - comisionBinance) / (1 + 0.002);

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
        '$' + precioVentaBinance.toFixed(2) + ' × ' + (1 - comisionBinance).toFixed(4) + ' ÷ 1.0020 = $' + precioSugerido2.toFixed(2);

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
    const comisionBinanceP2P = 0.002;
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
// 5. SISTEMA DE GUARDADO DE DATOS ENTRE PESTAÑAS (localStorage)
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