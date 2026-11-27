export default class mProducto {
  constructor({ id, nombre, precioUSD, categoria }) {
    this._id = 0;
    this._nombre = "";
    this._precioUSD = 0;
    this._categoria = "";

    this.id = id;
    this.nombre = nombre;
    this.precioUSD = precioUSD;
    this.categoria = categoria;
  }

  set id(valor) {
    const num = Number(valor);
    this._id = Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
  }

  get id() {
    return this._id;
  }

  set nombre(valor) {
    this._nombre = String(valor ?? "").trim();
  }

  get nombre() {
    return this._nombre;
  }

  set precioUSD(valor) {
    const num = Number(valor);
    this._precioUSD = Number.isFinite(num) && num > 0 ? num : 0;
  }

  get precioUSD() {
    return this._precioUSD;
  }

  set categoria(valor) {
    this._categoria = String(valor ?? "").trim() || "Otros";
  }

  get categoria() {
    return this._categoria;
  }

  toJSON() {
    return {
      id: this._id,
      nombre: this._nombre,
      precioUSD: this._precioUSD,
      categoria: this._categoria,
    };
  }
}