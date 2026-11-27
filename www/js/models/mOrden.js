import mProducto from "./mProducto.js";

export default class mOrden {
  constructor() {
    this._productos = [];
    this._notas = "";
    this._cliente = "";
  }

  get productos() {
    return this._productos;
  }

  set notas(valor) {
    this._notas = String(valor ?? "").trim();
  }

  get notas() {
    return this._notas;
  }

  set cliente(valor) {
    this._cliente = String(valor ?? "").trim();
  }

  get cliente() {
    return this._cliente;
  }

  agregarProducto(producto) {
    const item =
      producto instanceof mProducto ? producto : new mProducto(producto);
    if (item.id > 0 && item.nombre) {
      this._productos.push(item);
    }
  }

  eliminarUnoPorId(idProducto) {
    const indice = this._productos.findIndex((p) => p.id === Number(idProducto));
    if (indice !== -1) {
      this._productos.splice(indice, 1);
      return true;
    }
    return false;
  }

  reemplazarProductos(listaProductos = []) {
    this._productos = listaProductos.map((p) =>
      p instanceof mProducto ? p : new mProducto(p)
    );
  }

  vaciar() {
    this._productos = [];
    this._notas = "";
    this._cliente = "";
  }

  cantidadItems() {
    return this._productos.length;
  }

  calcularSubtotalUSD() {
    return this._productos.reduce((acc, p) => acc + p.precioUSD, 0);
  }

  calcularTotalBs(tasaBCV) {
    const tasa = Number(tasaBCV) || 0;
    return this.calcularSubtotalUSD() * tasa;
  }

  obtenerAgrupados() {
    const mapa = new Map();
    for (const prod of this._productos) {
      if (!mapa.has(prod.id)) {
        mapa.set(prod.id, {
          producto: prod,
          cantidad: 0,
          subtotalUSD: 0,
        });
      }
      const entry = mapa.get(prod.id);
      entry.cantidad += 1;
      entry.subtotalUSD += prod.precioUSD;
    }
    return Array.from(mapa.values());
  }

  obtenerNombresComprimidos() {
    return this.obtenerAgrupados().map(({ producto, cantidad }) =>
      cantidad > 1 ? `${cantidad}x ${producto.nombre}` : producto.nombre
    );
  }
}