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
                    'p2p_capital', 'p2p_precioVentaBybit', 'p2p_precioBrutoBinance',
                    'p2p_capital2', 'p2p_precioVentaBinance', 'p2p_precioBrutoBybit'
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
// 4. PESTAÑA P2P BYBIT - BINANCE (NUEVO)
// ================================================================

// Cambiar entre sub-pestañas
function cambiarSubPestana(num) {
    const sub1 = document.getElementById('sub1');
    const sub2 = document.getElementById('sub2');
    const btn1 = document.getElementById('btnSub1');
    const btn2 = document.getElementById('btnSub2');

    if (num === 1) {
        sub1.style.display = 'block';
        sub2.style.display = 'none';
        btn1.className = 'btn';
        btn2.className = 'btn-secondary';
        setTimeout(window.calcularP2PBB, 100);
    } else {
        sub1.style.display = 'none';
        sub2.style.display = 'block';
        btn1.className = 'btn-secondary';
        btn2.className = 'btn';
        setTimeout(window.calcularP2PBB, 100);
    }
}

// Función Principal de Cálculo
window.calcularP2PBB = function() {
    const sub1 = document.getElementById('sub1');
    const sub2 = document.getElementById('sub2');

    // ============================================
    // CÁLCULO OPCIÓN 1: Bybit Venta -> Binance Compra
    // ============================================
    if (sub1.style.display !== 'none') {
        // Leer los datos
        const capital = parseFloat(document.getElementById('p2p_capital').value) || 0;
        const precioVentaBybit = parseFloat(document.getElementById('p2p_precioVentaBybit').value) || 0;
        const precioBrutoBinance = parseFloat(document.getElementById('p2p_precioBrutoBinance').value) || 0;

        const comisionBinance = 0.002; // 0.2%
        
        // 1. Precio Real Binance (lo que realmente te cuesta cada USDT)
        const precioRealBinance = precioBrutoBinance * (1 + comisionBinance);

        // 2. USDT Vendidos (Capital / precio de venta en Bybit)
        const usdtVendidos = precioVentaBybit > 0 ? capital / precioVentaBybit : 0;

        // 3. USDT Comprados en Binance (Capital / Precio Real con comisión)
        const usdtComprados = precioBrutoBinance > 0 ? capital / (precioBrutoBinance * (1 + comisionBinance)) : 0;

        // 4. Ganancia Neta
        const gananciaUSDT = usdtComprados - usdtVendidos;
        const gananciaARS = gananciaUSDT * precioVentaBybit; // Valorizado al precio de venta
        
        // 👇 NUEVO: SPREAD REAL DESPUÉS DE COMISIÓN 👇
        const spreadReal = usdtVendidos > 0 ? (gananciaUSDT / usdtVendidos) * 100 : 0;
        const signoSpread = spreadReal >= 0 ? '+' : '';
        const colorSpread = spreadReal >= 0 ? 'positive' : 'negative';
        
        // Spread mínimo requerido (solo informativo)
        const spreadMinimo = (1 / (1 - comisionBinance)) - 1;

        // ---------- PRECIO SUGERIDO ----------
        const spreadObjetivo = 0.002;
        const precioSugerido = precioVentaBybit / (1 + spreadObjetivo) / (1 + comisionBinance);

        // Mostrar resultados Opción 1
        document.getElementById('resultadosSub1').style.display = 'block';
        document.getElementById('p2p_usdtVendidos').textContent = usdtVendidos.toFixed(2);
        document.getElementById('p2p_precioRealBinance').textContent = '$' + precioRealBinance.toFixed(2);
        document.getElementById('p2p_usdtComprados').textContent = usdtComprados.toFixed(2);
        // 👇 MOSTRAR EL SPREAD REAL 👇
        document.getElementById('p2p_spreadReal1').textContent = signoSpread + spreadReal.toFixed(2) + '%';
        document.getElementById('p2p_spreadReal1').className = `value ${colorSpread}`;
        
        const colorUSDT1 = gananciaUSDT >= 0 ? 'positive' : 'negative';
        
        document.getElementById('p2p_gananciaUSDT1').textContent = (gananciaUSDT >= 0 ? '+' : '') + gananciaUSDT.toFixed(2) + ' USDT';
        document.getElementById('p2p_gananciaUSDT1').className = `value ${colorUSDT1}`;
        document.getElementById('p2p_gananciaARS1').textContent = (gananciaARS >= 0 ? '+' : '') + '$' + gananciaARS.toFixed(2) + ' ARS';
        
        document.getElementById('p2p_spreadMinimo1').textContent = (spreadMinimo * 100).toFixed(2) + '%';
        document.getElementById('p2p_detVentaUSDT').textContent = usdtVendidos.toFixed(2);
        document.getElementById('p2p_detCompraUSDT').textContent = usdtComprados.toFixed(2);

        // Precio final real
        document.getElementById('p2p_precioFinalReal').textContent = '$' + precioRealBinance.toFixed(2);

        // ---------- MOSTRAR LA SUGERENCIA ----------
        const sugerenciaSpan = document.getElementById('p2p_sugerenciaTexto1');
        if (sugerenciaSpan) {
            sugerenciaSpan.textContent = '💰 Sugerido: $' + precioSugerido.toFixed(2);

            const ayudaMensaje = document.getElementById('p2p_mensajeAyuda1');
            if (ayudaMensaje) {
                const numerosSpan = ayudaMensaje.querySelector('#p2p_numerosAyuda');
                const formulaSpan = ayudaMensaje.querySelector('#p2p_formulaNumeros');
                if (numerosSpan) {
                    numerosSpan.innerHTML = `
                        <strong>Tu precio de venta Bybit:</strong> $${precioVentaBybit.toFixed(2)}<br>
                        <strong>Precio objetivo:</strong> $${precioSugerido.toFixed(2)}<br>
                        <strong>Spread objetivo:</strong> 0.20%<br>
                        <strong>Comisión Binance:</strong> 0.20%
                    `;
                }
                if (formulaSpan) {
                    const precioConComision = precioVentaBybit / 1.002;
                    const precioFinal = precioConComision / 1.002;
                    formulaSpan.textContent = `$${precioVentaBybit.toFixed(2)} ÷ 1.002 ÷ 1.002 = $${precioFinal.toFixed(2)}`;
                }
            }
        }
    }

    // ============================================
    // CÁLCULO OPCIÓN 2: Binance Venta -> Bybit Compra
    // ============================================
    if (sub2.style.display !== 'none') {
        const capital = parseFloat(document.getElementById('p2p_capital2').value) || 0;
        const precioVentaBinance = parseFloat(document.getElementById('p2p_precioVentaBinance').value) || 0;
        const precioBrutoBybit = parseFloat(document.getElementById('p2p_precioBrutoBybit').value) || 0;

        // Comisión Binance del 0.2% sobre el precio de venta (el precio real baja)
        const comisionBinance = 0.002; // 0.2%
        const precioRealBinance = precioVentaBinance * (1 - comisionBinance);

        // Cálculos
        const usdtVendidos = precioVentaBinance > 0 ? capital / precioVentaBinance : 0;
        const arsObtenidos = usdtVendidos * precioRealBinance;
        const usdtComprados = precioBrutoBybit > 0 ? arsObtenidos / precioBrutoBybit : 0;
        
        // Ganancia en USDT
        const gananciaUSDT = usdtComprados - usdtVendidos;
        const gananciaARS = gananciaUSDT * precioVentaBinance;
        const gananciaPct = capital > 0 ? (gananciaARS / capital) * 100 : 0;

        // Spread mínimo requerido para cubrir la comisión
        // Fórmula: 1 / (1 - comisión) - 1
        const spreadMinimo = (1 / (1 - comisionBinance)) - 1;

        // Mostrar resultados Opción 2
        document.getElementById('resultadosSub2').style.display = 'block';
        document.getElementById('p2p_usdtVendidos2').textContent = usdtVendidos.toFixed(2);
        document.getElementById('p2p_precioRealBinance2').textContent = '$' + precioRealBinance.toFixed(2);
        document.getElementById('p2p_usdtComprados2').textContent = usdtComprados.toFixed(2);
        
        const colorUSDT2 = gananciaUSDT >= 0 ? 'positive' : 'negative';
        document.getElementById('p2p_gananciaUSDT2').textContent = (gananciaUSDT >= 0 ? '+' : '') + gananciaUSDT.toFixed(2) + ' USDT';
        document.getElementById('p2p_gananciaUSDT2').className = `value ${colorUSDT2}`;
        document.getElementById('p2p_gananciaARS2').textContent = (gananciaARS >= 0 ? '+' : '') + '$' + gananciaARS.toFixed(2) + ' ARS';
        
        document.getElementById('p2p_spreadMinimo2').textContent = (spreadMinimo * 100).toFixed(2) + '%';
        document.getElementById('p2p_detVentaUSDT2').textContent = usdtVendidos.toFixed(2);
        document.getElementById('p2p_detCompraUSDT2').textContent = usdtComprados.toFixed(2);
    }
}

// Agregar eventos automáticos para la pestaña Binance-Bybit
function agregarEventosP2P() {
    const inputsP2P = [
        'p2p_capital', 'p2p_precioVentaBybit', 'p2p_precioBrutoBinance',
        'p2p_capital2', 'p2p_precioVentaBinance', 'p2p_precioBrutoBybit'
    ];
    agregarEventosAInputs(inputsP2P, window.calcularP2PBB);
}

// Y activar eventos al cargar la pestaña
window.agregarEventosP2P = agregarEventosP2P;

// Lógica para mostrar/ocultar la ayuda al hacer clic en el ícono ⓘ
document.addEventListener('click', function(e) {
    if (e.target.id === 'p2p_iconoAyuda1') {
        const ayuda = document.getElementById('p2p_mensajeAyuda1');
        ayuda.style.display = ayuda.style.display === 'none' ? 'block' : 'none';
    }
});

// ================================================================
// 3. CONTROL DE VISIBILIDAD DE PESTAÑAS (KRAKEN)
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