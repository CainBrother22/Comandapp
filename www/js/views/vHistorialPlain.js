export default class vHistorialPlain {
  constructor() {
    this.contenedor = document.getElementById("contenedor-historial");
    this.botonesFiltro = document.querySelectorAll(".btn-filtro");
    this.btBorrarHistorial = document.getElementById("btn-borrar-historial");

    this._onCambiarFiltro = null;
    this._onDividirPago = null;
    this._onPagarCredito = null;
    this._onEliminarVenta = null;

    this.botonesFiltro.forEach((btn) => {
      btn.onclick = () => {
        this.botonesFiltro.forEach((b) => b.classList.remove("activo"));
        btn.classList.add("activo");
        const filtro = btn.dataset.filtro || "todos";
        if (this._onCambiarFiltro) {
          this._onCambiarFiltro(filtro);
        }
      };
    });
  }

  onCambiarFiltro(callback) {
    this._onCambiarFiltro = callback;
  }

  onDividirPago(callback) {
    this._onDividirPago = callback;
  }

  onPagarCredito(callback) {
    this._onPagarCredito = callback;
  }

  onEliminarVenta(callback) {
    this._onEliminarVenta = callback;
  }

  onBorrarTodo(callback) {
    if (this.btBorrarHistorial) {
      this.btBorrarHistorial.onclick = callback;
    }
  }

  // Mejora 1: Sin totales globales históricos; conserva totales semanales y diarios
  renderizarSemanas(semanas = []) {
    if (!this.contenedor) return;
    this.contenedor.innerHTML = "";

    if (semanas.length === 0) {
      this.contenedor.innerHTML =
        `<p style="text-align:center; color:var(--text-muted); margin-top:20px;">No se encontraron ventas para este filtro.</p>`;
      return;
    }

    for (const sem of semanas) {
      const bloqueSemana = document.createElement("div");
      bloqueSemana.className = "bloque-semanal";

      const cabSemana = document.createElement("div");
      cabSemana.className = "cabecera-semanal";
      cabSemana.innerHTML = `
        <span>📊 Semana ${sem.semana}</span>
        <span>Total Semanal: $${sem.totalSemanaUSD.toFixed(2)} (Bs. ${sem.totalSemanaBs.toFixed(2)})</span>
      `;
      bloqueSemana.appendChild(cabSemana);

      for (const datosDia of sem.dias) {
        const seccionDia = document.createElement("div");
        seccionDia.className = "bloque-diario";

        const cabDia = document.createElement("div");
        cabDia.className = "cabecera-diaria";
        cabDia.innerHTML = `
          <span>📅 ${datosDia.dia}</span>
          <span>Total Día: $${datosDia.totalUSD.toFixed(2)} (Bs. ${datosDia.totalBs.toFixed(2)})</span>
          <span>
            Efectivo: $${datosDia.sumEfectivoUSD.toFixed(2)} (Bs. ${datosDia.sumEfectivoBs.toFixed(2)}) | 
            Pago Móvil: $${datosDia.sumPagoMovilUSD.toFixed(2)} (Bs. ${datosDia.sumPagoMovilBs.toFixed(2)})
          </span>
        `;
        seccionDia.appendChild(cabDia);

        const ventasInvertidas = [...datosDia.ventas].reverse();
        for (const venta of ventasInvertidas) {
          seccionDia.appendChild(this._crearTarjetaVenta(venta));
        }

        bloqueSemana.appendChild(seccionDia);
      }

      this.contenedor.appendChild(bloqueSemana);
    }
  }

  _crearTarjetaVenta(venta) {
    const esPagado = venta.estado === "Pagado";
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-venta";
    tarjeta.style.borderLeftColor = esPagado ? "#2ecc71" : "#e67e22";

    const fila = document.createElement("div");
    fila.className = "venta-row";

    const info = document.createElement("div");
    info.className = "venta-info";

    const estadoText = esPagado ? "✅ Pagado" : "⏳ Crédito";
    const saldoText = !esPagado ? ` (Saldo: $${venta.saldoPendienteUSD.toFixed(2)})` : "";
    const metodoText = venta.metodoPago
      ? venta.metodoPago === "efectivo"
        ? "Efectivo"
        : venta.metodoPago === "pagoMovil"
          ? "Pago Móvil"
          : "Mixto"
      : "—";

    let detalleText = "";
    if (esPagado && venta.detallePago) {
      const efBs = venta.detallePago.efectivoUSD * venta.tasaFijada;
      const pmBs = venta.detallePago.pagoMovilUSD * venta.tasaFijada;
      detalleText = `<br><span style="font-size:13px; color:#94a3b8;">
        Efectivo: $${venta.detallePago.efectivoUSD.toFixed(2)} (Bs. ${efBs.toFixed(2)}) | 
        Pago Móvil: $${venta.detallePago.pagoMovilUSD.toFixed(2)} (Bs. ${pmBs.toFixed(2)})
      </span>`;
    } else if (esPagado) {
      detalleText = `<br><span style="font-size:13px; color:#64748b;">(Sin detallar)</span>`;
    }

    const textoDescuento =
      venta.descuentoUSD > 0
        ? `<br><span style="color:#f43f5e; font-size:12px; font-weight:bold;">Descuento aplicado: -$${venta.descuentoUSD.toFixed(2)}</span>`
        : "";

    const textoNotas =
      venta.notas && venta.notas.trim() !== ""
        ? `<br><span style="color:var(--accent); font-size:12px; font-style:italic;">📝 ${venta.notas}</span>`
        : "";

    const horaSolo = venta.fecha.split(",")[1] || venta.fecha;
    info.innerHTML = `
      <strong>${venta.cliente}</strong> <small>(${horaSolo.trim()})</small><br>
      <small>${venta.productos.join(", ")}</small><br>
      <strong>Total: $${venta.totalUSD.toFixed(2)} (Bs. ${venta.totalBs.toFixed(2)})</strong>
      <span style="color:#94a3b8;">(Tasa: ${venta.tasaFijada})</span>
      ${textoDescuento}
      <br><span style="font-size:13px;">Método: ${metodoText}</span>
      ${detalleText}
      ${textoNotas}
      <br><span style="font-weight:bold; color:${esPagado ? "#10b981" : "#f59e0b"};">${estadoText}${saldoText}</span>
    `;

    const acciones = document.createElement("div");
    acciones.className = "venta-actions";

    if (esPagado) {
      const btnDividir = document.createElement("button");
      btnDividir.type = "button";
      btnDividir.className = "btn-accion btn-editar-pago";
      btnDividir.textContent = venta.detallePago ? "Editar pago" : "Dividir pago";
      btnDividir.onclick = () => {
        if (this._onDividirPago) this._onDividirPago(venta.id);
      };
      acciones.appendChild(btnDividir);
    } else {
      const btnPagar = document.createElement("button");
      btnPagar.type = "button";
      btnPagar.className = "btn-accion btn-pagar-credito";
      btnPagar.textContent = "Pagar";
      btnPagar.onclick = () => {
        if (this._onPagarCredito) this._onPagarCredito(venta.id);
      };
      acciones.appendChild(btnPagar);
    }

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn-eliminar";
    btnEliminar.textContent = "X";
    btnEliminar.onclick = () => {
      if (this._onEliminarVenta) this._onEliminarVenta(venta.id);
    };
    acciones.appendChild(btnEliminar);

    fila.appendChild(info);
    fila.appendChild(acciones);
    tarjeta.appendChild(fila);
    return tarjeta;
  }
}