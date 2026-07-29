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

            // 5. Ejecutar la función de cálculo inicial de esa pestaña según el nombre del archivo
            if (rutaHtml.includes('spread.html') && typeof window.calcularSpread === 'function') {
                // ASIGNAR EVENTOS DE SPREAD ANTES DE CALCULAR
                const inputsSpread = ['precioVenta', 'arsRecibidos', 'precioCompra', 'arsRecompra'];
                agregarEventosAInputs(inputsSpread, window.calcularSpread);
                setTimeout(window.calcularSpread, 100);
            } else if (rutaHtml.includes('fiwind.html') && typeof window.calcularFiwind === 'function') {
                // 1. ASIGNAR EVENTOS A LOS INPUTS DE FIWIND
                const inputsFiwind = ['usdPrice', 'usdtRate', 'myPrice', 'capitalArs'];
                agregarEventosAInputs(inputsFiwind, window.calcularFiwind);
                
                // 2. LLAMAMOS A LA API PARA TRAER PRECIOS AL ABRIR LA PESTAÑA
                // El await funciona ahora porque la función es 'async'
                (async () => {
                    await window.actualizarPreciosFiwind();
                    // 3. CALCULAMOS LA PESTAÑA CON LOS NUEVOS VALORES (después de que llegue la API)
                    setTimeout(window.calcularFiwind, 100);
                })();

            } else if (rutaHtml.includes('kraken.html') && typeof window.calcularCiclo === 'function') {
                // ASIGNAR EVENTOS DE KRAKEN ANTES DE CALCULAR
                const inputsKraken = ['c3_usdtVendido', 'c3_arsRecibidos', 'c3_tasaCompraUsd', 'c3_tasaFiwind', 'c3_tasaUsdtUsdc', 'c3_tasaKraken'];
                agregarEventosAInputs(inputsKraken, window.calcularCiclo);
                setTimeout(window.calcularCiclo, 100);
            }
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

    const precioVenta = parseFloat(precioVentaInput.value) || 0;
    const arsRecibidos = parseFloat(document.getElementById('arsRecibidos').value) || 0;
    const precioCompra = parseFloat(document.getElementById('precioCompra').value) || 0;
    const arsRecompra = parseFloat(document.getElementById('arsRecompra').value) || 0;

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
    document.getElementById('gananciaUSDT').textContent = `${signo}${gananciaUSDT.toFixed(6)} USDT`;
    document.getElementById('gananciaUSDT').className = `value ${colorClass}`;
    const signoARS = (gananciaARS >= 0) ? '+' : '';
    document.getElementById('gananciaARS').textContent = `${signoARS}$${gananciaARS.toFixed(2)}`;
    document.getElementById('gananciaARS').className = `value ${colorClass}`;

    document.getElementById('usdtOperados').textContent = cantidadCompra.toFixed(6);
    document.getElementById('detComprados').textContent = cantidadCompra.toFixed(6);
    document.getElementById('detPrecioCompra').textContent = `$${precioCompra.toFixed(2)}`;
    document.getElementById('detPrecioVenta').textContent = `$${precioVenta.toFixed(2)}`;

    let detalleHTML = '';
    if (gananciaUSDT > 0.000001) {
        detalleHTML = `Ganaste <strong class="highlight-green">+${gananciaUSDT.toFixed(6)} USDT</strong> (${signo}${gananciaPorcentaje.toFixed(3)}% de spread). 🎯`;
    } else if (gananciaUSDT < -0.000001) {
        detalleHTML = `Perdiste <strong class="highlight-red">${gananciaUSDT.toFixed(6)} USDT</strong> (${gananciaPorcentaje.toFixed(3)}% de spread). ⚠️`;
    } else {
        detalleHTML = `Operación en equilibrio. Sin ganancia ni pérdida. ⚖️`;
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
            usdPriceInput.value = "1495";
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