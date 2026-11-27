export default class vModalesPlain {
  constructor() {
    // Modal Cobro / Pago Crédito
    this.modalPago = document.getElementById("modal-pago");
    this.tituloModalPago = this.modalPago?.querySelector("h2");
    this.detalleOrden = document.getElementById("modal-detalle-orden");
    this.secDescuento = document.getElementById("modal-descuento");
    this.inDescuento = document.getElementById("input-descuento");
    this.selTipoDescuento = document.getElementById("tipo-descuento");
    this.lblTotalFinalUSD = document.getElementById("modal-total-final-usd");
    this.lblTotalFinalBs = document.getElementById("modal-total-final-bs");
    this.secCredito = document.getElementById("modal-credito");
    this.chkCredito = document.getElementById("chk-credito");
    this.btPagarEfectivo = document.getElementById("btn-pagar-efectivo");
    this.btPagarMovil = document.getElementById("btn-pagar-movil");

    // Modal Dividir Pago
    this.modalDividir = document.getElementById("modal-dividir-pago");
    this.detalleDividir = document.getElementById("modal-detalle-dividir");
    this.inDividirDescuento = document.getElementById("dividir-input-descuento");
    this.selDividirTipoDescuento = document.getElementById("dividir-tipo-descuento");
    this.lblDividirTotalUSD = document.getElementById("dividir-total-final-usd");
    this.lblDividirTotalBs = document.getElementById("dividir-total-final-bs");
    this.selDividirMonedaEfectivo = document.getElementById("dividir-moneda-efectivo");
    this.lblDividirEfectivo = document.querySelector("label[for='dividir-efectivo']");
    this.inDividirEfectivo = document.getElementById("dividir-efectivo");
    this.inDividirMovil = document.getElementById("dividir-movil");
    this.btGuardarDividir = document.getElementById("btn-guardar-dividir");

    // Modal Conflictos de Importación
    this.modalConflictos = document.getElementById("modal-conflictos-menu");
    this.listaConflictos = document.getElementById("lista-conflictos-menu");
    this.btOmitirConflictos = document.getElementById("btn-omitir-conflictos");
    this.btReemplazarConflictos = document.getElementById("btn-reemplazar-conflictos");

    // Modal Órdenes en Espera
    this.modalEspera = document.getElementById("modal-espera");
    this.listaEspera = document.getElementById("lista-espera");

    this._onRestaurarEspera = null;
    this._onEliminarEspera = null;

    document.querySelectorAll(".btn-close-modal").forEach((btn) => {
      btn.onclick = () => this.cerrarTodos();
    });

    window.addEventListener("click", (e) => {
      if (
        e.target === this.modalPago ||
        e.target === this.modalDividir ||
        e.target === this.modalConflictos ||
        e.target === this.modalEspera
      ) {
        this.cerrarTodos();
      }
    });
  }

  cerrarTodos() {
    if (this.modalPago) this.modalPago.style.display = "none";
    if (this.modalDividir) this.modalDividir.style.display = "none";
    if (this.modalConflictos) this.modalConflictos.style.display = "none";
    if (this.modalEspera) this.modalEspera.style.display = "none";
    if (this.secDescuento) this.secDescuento.style.display = "block";
    if (this.secCredito) this.secCredito.style.display = "block";
  }

  abrirModalCobroOrden({ agrupados, subtotalUSD, tasaBCV, calcularDescuento, onConfirmarPago }) {
    if (!this.modalPago) return;
    if (this.tituloModalPago) this.tituloModalPago.textContent = "Procesar Pago";

    let html = "<ul>";
    for (const item of agrupados) {
      const prefijo = item.cantidad > 1 ? `${item.cantidad}x ` : "";
      html += `<li>${prefijo}${item.producto.nombre}</li>`;
    }
    html += "</ul>";
    html += `<p style="color:#94a3b8; margin-top:8px;">Subtotal: $${subtotalUSD.toFixed(2)} (Bs. ${(subtotalUSD * tasaBCV).toFixed(2)})</p>`;
    if (this.detalleOrden) this.detalleOrden.innerHTML = html;

    if (this.secDescuento) this.secDescuento.style.display = "block";
    if (this.secCredito) this.secCredito.style.display = "block";
    if (this.inDescuento) this.inDescuento.value = "";
    if (this.selTipoDescuento) this.selTipoDescuento.value = "PORCENTAJE";
    if (this.chkCredito) this.chkCredito.checked = false;

    const recalcular = () => {
      const descUSD = calcularDescuento(
        this.inDescuento?.value,
        this.selTipoDescuento?.value,
        subtotalUSD,
        tasaBCV
      );
      const finalUSD = Math.max(subtotalUSD - descUSD, 0);
      if (this.lblTotalFinalUSD) this.lblTotalFinalUSD.textContent = finalUSD.toFixed(2);
      if (this.lblTotalFinalBs) this.lblTotalFinalBs.textContent = (finalUSD * tasaBCV).toFixed(2);
    };

    if (this.inDescuento) this.inDescuento.oninput = recalcular;
    if (this.selTipoDescuento) this.selTipoDescuento.onchange = recalcular;
    recalcular();

    const enviar = (metodo) => {
      onConfirmarPago({
        metodoPago: metodo,
        esCredito: Boolean(this.chkCredito?.checked),
        descuentoMonto: this.inDescuento?.value,
        descuentoTipo: this.selTipoDescuento?.value || "PORCENTAJE",
      });
    };

    if (this.btPagarEfectivo) this.btPagarEfectivo.onclick = () => enviar("efectivo");
    if (this.btPagarMovil) this.btPagarMovil.onclick = () => enviar("pagoMovil");

    this.modalPago.style.display = "block";
  }

  abrirModalPagoCredito({ venta, onConfirmarLiquidacion }) {
    if (!this.modalPago) return;
    if (this.tituloModalPago) this.tituloModalPago.textContent = "Pagar Crédito";

    if (this.detalleOrden) {
      this.detalleOrden.innerHTML = `
        <p><strong>Cliente:</strong> ${venta.cliente}</p>
        <p><strong>Productos:</strong> ${venta.productos.join(", ")}</p>
        <p><strong>Total:</strong> $${venta.totalUSD.toFixed(2)} (Bs. ${venta.totalBs.toFixed(2)})</p>
        <p><strong>Saldo pendiente:</strong> $${venta.saldoPendienteUSD.toFixed(2)}</p>
      `;
    }

    if (this.secDescuento) this.secDescuento.style.display = "none";
    if (this.secCredito) this.secCredito.style.display = "none";

    if (this.btPagarEfectivo) {
      this.btPagarEfectivo.onclick = () => onConfirmarLiquidacion("efectivo");
    }
    if (this.btPagarMovil) {
      this.btPagarMovil.onclick = () => onConfirmarLiquidacion("pagoMovil");
    }

    this.modalPago.style.display = "block";
  }

  abrirModalDividirPago({ venta, calcularDescuento, onGuardarDivision }) {
    if (!this.modalDividir) return;
    const subtotalOriginalUSD = venta.totalUSD + (venta.descuentoUSD || 0);

    if (this.detalleDividir) {
      this.detalleDividir.innerHTML = `
        <p><strong>Cliente:</strong> ${venta.cliente}</p>
        <p style="color:#94a3b8;"><strong>Subtotal original:</strong> $${subtotalOriginalUSD.toFixed(2)} (Tasa: ${venta.tasaFijada})</p>
      `;
    }

    if (venta.descuentoUSD > 0) {
      if (this.inDividirDescuento) this.inDividirDescuento.value = venta.descuentoUSD.toFixed(2);
      if (this.selDividirTipoDescuento) this.selDividirTipoDescuento.value = "USD";
    } else {
      if (this.inDividirDescuento) this.inDividirDescuento.value = "";
      if (this.selDividirTipoDescuento) this.selDividirTipoDescuento.value = "PORCENTAJE";
    }

    const recalcular = () => {
      const descUSD = calcularDescuento(
        this.inDividirDescuento?.value,
        this.selDividirTipoDescuento?.value,
        subtotalOriginalUSD,
        venta.tasaFijada
      );
      const nuevoTotalUSD = Math.max(subtotalOriginalUSD - descUSD, 0);
      if (this.lblDividirTotalUSD) this.lblDividirTotalUSD.textContent = nuevoTotalUSD.toFixed(2);
      if (this.lblDividirTotalBs) {
        this.lblDividirTotalBs.textContent = (nuevoTotalUSD * venta.tasaFijada).toFixed(2);
      }
    };

    if (this.inDividirDescuento) this.inDividirDescuento.oninput = recalcular;
    if (this.selDividirTipoDescuento) this.selDividirTipoDescuento.onchange = recalcular;
    recalcular();

    const efActualUSD = venta.detallePago ? venta.detallePago.efectivoUSD : 0;
    const pmActualUSD = venta.detallePago ? venta.detallePago.pagoMovilUSD : 0;

    if (this.selDividirMonedaEfectivo) {
      this.selDividirMonedaEfectivo.value = "USD";
      this.selDividirMonedaEfectivo.onchange = () => {
        const moneda = this.selDividirMonedaEfectivo.value;
        if (this.lblDividirEfectivo) {
          this.lblDividirEfectivo.textContent =
            moneda === "USD" ? "Monto en Efectivo ($)" : "Monto en Efectivo (Bs)";
        }
        if (this.inDividirEfectivo) this.inDividirEfectivo.value = "";
      };
    }

    if (this.lblDividirEfectivo) this.lblDividirEfectivo.textContent = "Monto en Efectivo ($)";
    if (this.inDividirEfectivo) {
      this.inDividirEfectivo.value = efActualUSD > 0 ? efActualUSD.toFixed(2) : "";
    }
    if (this.inDividirMovil) {
      this.inDividirMovil.value =
        pmActualUSD > 0 && venta.tasaFijada > 0 ? (pmActualUSD * venta.tasaFijada).toFixed(2) : "";
    }

    if (this.btGuardarDividir) {
      this.btGuardarDividir.onclick = () => {
        const moneda = this.selDividirMonedaEfectivo?.value || "USD";
        const efRaw = parseFloat(this.inDividirEfectivo?.value) || 0;
        const efectivoUSD =
          moneda === "USD" ? efRaw : venta.tasaFijada > 0 ? efRaw / venta.tasaFijada : 0;
        const movilBs = parseFloat(this.inDividirMovil?.value) || 0;
        const pagoMovilUSD = venta.tasaFijada > 0 ? movilBs / venta.tasaFijada : 0;

        onGuardarDivision({
          descuentoMonto: this.inDividirDescuento?.value,
          descuentoTipo: this.selDividirTipoDescuento?.value || "PORCENTAJE",
          efectivoUSD,
          pagoMovilUSD,
        });
      };
    }

    this.modalDividir.style.display = "block";
  }

  abrirModalConflictos(conflictos = [], onResolver) {
    if (!this.modalConflictos) return;
    if (this.listaConflictos) {
      this.listaConflictos.innerHTML = conflictos
        .map(
          (p) =>
            `<div style="padding:8px 0; border-bottom:1px solid var(--border);">• <strong>${p.nombre}</strong> ($${Number(p.precioUSD).toFixed(2)}) — ${p.categoria}</div>`
        )
        .join("");
    }
    if (this.btOmitirConflictos) {
      this.btOmitirConflictos.onclick = () => {
        this.cerrarTodos();
        onResolver("omitir");
      };
    }
    if (this.btReemplazarConflictos) {
      this.btReemplazarConflictos.onclick = () => {
        this.cerrarTodos();
        onResolver("reemplazar");
      };
    }
    this.modalConflictos.style.display = "block";
  }

  onRestaurarEspera(callback) {
    this._onRestaurarEspera = callback;
  }

  onEliminarEspera(callback) {
    this._onEliminarEspera = callback;
  }

  abrirModalEspera(comandas = []) {
    if (!this.modalEspera || !this.listaEspera) return;
    this.listaEspera.innerHTML = "";

    if (comandas.length === 0) {
      this.listaEspera.innerHTML =
        `<p style="text-align:center; color:var(--text-muted);">No hay comandas en espera.</p>`;
    } else {
      comandas.forEach((orden, index) => {
        const conteo = {};
        (orden.productos || []).forEach((p) => {
          conteo[p.nombre] = (conteo[p.nombre] || 0) + 1;
        });
        const resumen = Object.keys(conteo)
          .map((k) => `${conteo[k]}x ${k}`)
          .join(", ");

        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-espera";

        const info = document.createElement("div");
        info.style.flex = "1";
        info.innerHTML = `
          <strong>${orden.cliente}</strong> <span style="color:var(--text-muted); font-size:0.85rem;">(${orden.hora || ""})</span>
          <small>${resumen}</small>
          ${orden.notas ? `<div style="color:var(--accent); font-size:0.85rem; margin-top:4px; font-style:italic;">📝 ${orden.notas}</div>` : ""}
        `;

        const btns = document.createElement("div");
        btns.className = "botones-espera";

        const btnCargar = document.createElement("button");
        btnCargar.type = "button";
        btnCargar.className = "btn-secundario";
        btnCargar.style.padding = "6px 12px";
        btnCargar.textContent = "Cargar";
        btnCargar.onclick = () => {
          if (this._onRestaurarEspera) this._onRestaurarEspera(index);
        };

        const btnBorrar = document.createElement("button");
        btnBorrar.type = "button";
        btnBorrar.className = "btn-eliminar";
        btnBorrar.textContent = "X";
        btnBorrar.onclick = () => {
          if (this._onEliminarEspera) this._onEliminarEspera(index);
        };

        btns.appendChild(btnCargar);
        btns.appendChild(btnBorrar);
        tarjeta.appendChild(info);
        tarjeta.appendChild(btns);
        this.listaEspera.appendChild(tarjeta);
      });
    }

    this.modalEspera.style.display = "block";
  }
}