import mVenta from "./mVenta.js";

export default class mVentaContado extends mVenta {
  constructor(datos = {}) {
    super(datos);
    this._metodoPago = datos.metodoPago || "efectivo";
    this._detallePago = datos.detallePago
      ? {
          efectivoUSD: Number(datos.detallePago.efectivoUSD) || 0,
          pagoMovilUSD: Number(datos.detallePago.pagoMovilUSD) || 0,
        }
      : {
          efectivoUSD: this._metodoPago === "efectivo" ? this._totalUSD : 0,
          pagoMovilUSD: this._metodoPago === "pagoMovil" ? this._totalUSD : 0,
        };
  }

  get metodoPago() {
    return this._metodoPago;
  }

  set metodoPago(valor) {
    if (["efectivo", "pagoMovil", "mixto"].includes(valor)) {
      this._metodoPago = valor;
    }
  }

  get detallePago() {
    return this._detallePago;
  }

  set detallePago(detalle) {
    if (!detalle) {
      this._detallePago = null;
      return;
    }
    const efUSD = Number(detalle.efectivoUSD) || 0;
    const pmUSD = Number(detalle.pagoMovilUSD) || 0;
    this._detallePago = { efectivoUSD: efUSD, pagoMovilUSD: pmUSD };

    if (efUSD > 0 && pmUSD === 0) this._metodoPago = "efectivo";
    else if (pmUSD > 0 && efUSD === 0) this._metodoPago = "pagoMovil";
    else this._metodoPago = "mixto";
  }

  get estado() {
    return "Pagado";
  }

  get saldoPendienteUSD() {
    return 0;
  }

  esCredito() {
    return false;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      metodoPago: this._metodoPago,
      detallePago: this._detallePago ? { ...this._detallePago } : null,
    };
  }
}