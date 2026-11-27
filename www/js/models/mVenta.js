export default class mVenta {
  constructor({
    id,
    cliente = "Cliente General",
    fecha = new Date().toLocaleString(),
    productos = [],
    totalUSD = 0,
    totalBs = 0,
    tasaFijada = 0,
    descuentoUSD = 0,
    notas = "",
  }) {
    if (new.target === mVenta) {
      throw new Error("mVenta es una clase base abstracta y no debe instanciarse directamente.");
    }
    this._id = Number(id) || Date.now();
    this._cliente = String(cliente ?? "").trim() || "Cliente General";
    this._fecha = String(fecha);
    this._productos = Array.isArray(productos) ? [...productos] : [];
    this._totalUSD = Number(totalUSD) || 0;
    this._totalBs = Number(totalBs) || 0;
    this._tasaFijada = Number(tasaFijada) || 0;
    this._descuentoUSD = Number(descuentoUSD) || 0;
    this._notas = String(notas ?? "").trim();
  }

  get id() {
    return this._id;
  }

  get cliente() {
    return this._cliente;
  }

  get fecha() {
    return this._fecha;
  }

  get productos() {
    return this._productos;
  }

  get totalUSD() {
    return this._totalUSD;
  }

  set totalUSD(valor) {
    const num = Number(valor);
    if (Number.isFinite(num) && num >= 0) {
      this._totalUSD = num;
    }
  }

  get totalBs() {
    return this._totalBs;
  }

  set totalBs(valor) {
    const num = Number(valor);
    if (Number.isFinite(num) && num >= 0) {
      this._totalBs = num;
    }
  }

  get tasaFijada() {
    return this._tasaFijada;
  }

  get descuentoUSD() {
    return this._descuentoUSD;
  }

  set descuentoUSD(valor) {
    const num = Number(valor);
    if (Number.isFinite(num) && num >= 0) {
      this._descuentoUSD = num;
    }
  }

  get notas() {
    return this._notas;
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
      id: this._id,
      cliente: this._cliente,
      fecha: this._fecha,
      productos: [...this._productos],
      totalUSD: this._totalUSD,
      totalBs: this._totalBs,
      tasaFijada: this._tasaFijada,
      estado: this.estado,
      saldoPendienteUSD: this.saldoPendienteUSD,
      descuentoUSD: this._descuentoUSD,
      notas: this._notas,
    };
  }
}