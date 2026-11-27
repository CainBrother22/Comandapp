import mVenta from "./mVenta.js";
import mVentaContado from "./mVentaContado.js";

export default class mVentaCredito extends mVenta {
  constructor(datos = {}) {
    super(datos);
    const saldoInicial =
      datos.saldoPendienteUSD !== undefined
        ? Number(datos.saldoPendienteUSD)
        : this._totalUSD;
    this._saldoPendienteUSD = Number.isFinite(saldoInicial) && saldoInicial >= 0 ? saldoInicial : 0;
  }

  get estado() {
    return "Credito";
  }

  get saldoPendienteUSD() {
    return this._saldoPendienteUSD;
  }

  set saldoPendienteUSD(valor) {
    const num = Number(valor);
    if (Number.isFinite(num) && num >= 0) {
      this._saldoPendienteUSD = num;
    }
  }

  esCredito() {
    return true;
  }

  convertirAContado({ metodoPago = "efectivo", detallePago = null } = {}) {
    return new mVentaContado({
      ...this.toJSON(),
      saldoPendienteUSD: 0,
      metodoPago,
      detallePago,
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      metodoPago: null,
      detallePago: null,
    };
  }
}