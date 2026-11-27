import mProducto from "./mProducto.js";
import mOrden from "./mOrden.js";
import mVentaContado from "./mVentaContado.js";
import mVentaCredito from "./mVentaCredito.js";
import mStorage from "./mStorage.js";

export default class mPosCaja {
  static CLAVE_SECRETA = "X7K9M2P5Q8";
  static CATEGORIAS_BASE = [
    "Hamburguesas",
    "Perros Calientes",
    "Pepitos",
    "Combos",
    "Otros",
  ];

  constructor() {
    this.ordenActual = new mOrden();
    this._categorias = [];
    this._menu = [];
    this._ventas = [];
    this._ordenesEnEspera = [];
    this._tasaBCV = 0;
  }

  inicializar() {
    const tasaGuardada = parseFloat(mStorage.leerTexto(mStorage.CLAVES.TASA_BCV, "0"));
    this._tasaBCV = Number.isFinite(tasaGuardada) && tasaGuardada > 0 ? tasaGuardada : 0;

    const catsGuardadas = mStorage.leerJSON(mStorage.CLAVES.CATEGORIAS, null);
    if (Array.isArray(catsGuardadas) && catsGuardadas.length > 0) {
      this._categorias = catsGuardadas.map((c) => String(c).trim()).filter(Boolean);
    } else {
      this._categorias = [...mPosCaja.CATEGORIAS_BASE];
      mStorage.guardarJSON(mStorage.CLAVES.CATEGORIAS, this._categorias);
    }

    const menuGuardado = mStorage.leerJSON(mStorage.CLAVES.MENU, null);
    if (Array.isArray(menuGuardado) && menuGuardado.length > 0) {
      this._menu = menuGuardado.map((p) => new mProducto(p)).filter((p) => p.id > 0 && p.nombre);
    } else {
      this._menu = [
        new mProducto({ id: 1, nombre: "Hamburguesa Clásica", precioUSD: 5.0, categoria: "Hamburguesas" }),
        new mProducto({ id: 2, nombre: "Perro Caliente Sencillo", precioUSD: 2.0, categoria: "Perros Calientes" }),
        new mProducto({ id: 3, nombre: "Pepito de Carne", precioUSD: 6.0, categoria: "Pepitos" }),
        new mProducto({ id: 4, nombre: "Ración de Papas Fritas", precioUSD: 2.5, categoria: "Otros" }),
      ];
      this.guardarCatalogo();
    }

    const esperaGuardada = mStorage.leerJSON(mStorage.CLAVES.ESPERA, []);
    this._ordenesEnEspera = Array.isArray(esperaGuardada) ? esperaGuardada : [];

    const histGuardado = mStorage.leerJSON(mStorage.CLAVES.HISTORIAL, []);
    this._ventas = Array.isArray(histGuardado)
      ? histGuardado.map((v) => mPosCaja.hidratarVenta(v))
      : [];
  }

  static hidratarVenta(raw) {
    if (raw && raw.estado === "Credito") {
      return new mVentaCredito(raw);
    }
    return new mVentaContado(raw || {});
  }

  estaActivado() {
    return mStorage.leerTexto(mStorage.CLAVES.ACTIVACION, "") === "true";
  }

  activarSistema(clave) {
    if (String(clave ?? "").trim() === mPosCaja.CLAVE_SECRETA) {
      mStorage.guardarTexto(mStorage.CLAVES.ACTIVACION, "true");
      return true;
    }
    return false;
  }

  get tasaBCV() {
    return this._tasaBCV;
  }

  set tasaBCV(valor) {
    const num = parseFloat(valor);
    this._tasaBCV = Number.isFinite(num) && num >= 0 ? num : 0;
    mStorage.guardarTexto(mStorage.CLAVES.TASA_BCV, String(this._tasaBCV));
  }

  get categorias() {
    return [...this._categorias];
  }

  get menu() {
    return [...this._menu];
  }

  get ordenesEnEspera() {
    return [...this._ordenesEnEspera];
  }

  guardarCatalogo() {
    mStorage.guardarJSON(mStorage.CLAVES.CATEGORIAS, this._categorias);
    mStorage.guardarJSON(mStorage.CLAVES.MENU, this._menu.map((p) => p.toJSON()));
  }

  guardarHistorial() {
    mStorage.guardarJSON(mStorage.CLAVES.HISTORIAL, this._ventas.map((v) => v.toJSON()));
  }

  guardarEspera() {
    mStorage.guardarJSON(mStorage.CLAVES.ESPERA, this._ordenesEnEspera);
  }

  // --- Mejora 2: Filtrado para evitar scroll interminable en la caja ---
  obtenerProductosFiltrados({ categoria = "TODAS", busqueda = "" } = {}) {
    const q = String(busqueda ?? "").trim().toLowerCase();
    return this._menu.filter((prod) => {
      const coincideCat =
        !categoria || categoria === "TODAS" || prod.categoria === categoria;
      const coincideTexto =
        !q ||
        prod.nombre.toLowerCase().includes(q) ||
        prod.categoria.toLowerCase().includes(q);
      return coincideCat && coincideTexto;
    });
  }

  // --- Mejora 3: Gestión cómoda de categorías y productos en configuración ---
  agregarCategoria(nombre) {
    const limpio = String(nombre ?? "").trim();
    if (!limpio) return { ok: false, error: "Escribe un nombre válido." };
    if (this._categorias.some((c) => c.toLowerCase() === limpio.toLowerCase())) {
      return { ok: false, error: "La categoría ya existe." };
    }
    this._categorias.push(limpio);
    this.guardarCatalogo();
    return { ok: true, categoria: limpio };
  }

  eliminarCategoria(indice) {
    if (indice < 0 || indice >= this._categorias.length) return false;
    this._categorias.splice(indice, 1);
    this.guardarCatalogo();
    return true;
  }

  agregarProducto({ nombre, precioUSD, categoria }) {
    const limpioNombre = String(nombre ?? "").trim();
    const numPrecio = parseFloat(precioUSD);
    if (!limpioNombre || !Number.isFinite(numPrecio) || numPrecio <= 0) {
      return { ok: false, error: "Datos del producto inválidos." };
    }
    if (this._menu.some((p) => p.nombre.toLowerCase() === limpioNombre.toLowerCase())) {
      return { ok: false, error: "Ya existe un producto con ese nombre." };
    }
    const maxId = this._menu.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const nuevo = new mProducto({
      id: maxId + 1,
      nombre: limpioNombre,
      precioUSD: numPrecio,
      categoria,
    });
    this._menu.push(nuevo);
    this.guardarCatalogo();
    return { ok: true, producto: nuevo };
  }

  editarProducto(idProducto, { nombre, precioUSD, categoria }) {
    const idx = this._menu.findIndex((p) => p.id === Number(idProducto));
    if (idx === -1) return { ok: false, error: "Producto no encontrado." };

    const limpioNombre = String(nombre ?? "").trim();
    const numPrecio = parseFloat(precioUSD);
    if (!limpioNombre || !Number.isFinite(numPrecio) || numPrecio <= 0) {
      return { ok: false, error: "Nombre o precio inválido." };
    }

    const duplicado = this._menu.some(
      (p, i) => i !== idx && p.nombre.toLowerCase() === limpioNombre.toLowerCase()
    );
    if (duplicado) {
      return { ok: false, error: "Otro producto ya usa ese nombre." };
    }

    this._menu[idx].nombre = limpioNombre;
    this._menu[idx].precioUSD = numPrecio;
    this._menu[idx].categoria = categoria || this._menu[idx].categoria;
    this.guardarCatalogo();
    return { ok: true, producto: this._menu[idx] };
  }

  eliminarProducto(idProducto) {
    const antes = this._menu.length;
    this._menu = this._menu.filter((p) => p.id !== Number(idProducto));
    if (this._menu.length !== antes) {
      this.guardarCatalogo();
      return true;
    }
    return false;
  }

  // --- Órdenes en espera ---
  pausarOrdenActual(cliente, notas) {
    if (this.ordenActual.cantidadItems() === 0) {
      return { ok: false, error: "Agrega productos antes de pausar la comanda." };
    }
    const nombreCliente =
      String(cliente ?? "").trim() || `Comanda #${this._ordenesEnEspera.length + 1}`;
    const comanda = {
      id: Date.now(),
      cliente: nombreCliente,
      hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      productos: this.ordenActual.productos.map((p) => p.toJSON()),
      notas: String(notas ?? "").trim(),
    };
    this._ordenesEnEspera.push(comanda);
    this.guardarEspera();
    this.ordenActual.vaciar();
    return { ok: true, comanda };
  }

  restaurarOrdenEspera(indice) {
    if (indice < 0 || indice >= this._ordenesEnEspera.length) return null;
    const [comanda] = this._ordenesEnEspera.splice(indice, 1);
    this.ordenActual.reemplazarProductos(comanda.productos || []);
    this.ordenActual.cliente = comanda.cliente || "";
    this.ordenActual.notas = comanda.notas || "";
    this.guardarEspera();
    return comanda;
  }

  eliminarOrdenEspera(indice) {
    if (indice < 0 || indice >= this._ordenesEnEspera.length) return false;
    this._ordenesEnEspera.splice(indice, 1);
    this.guardarEspera();
    return true;
  }

  // --- Cálculo de descuentos y registro de ventas ---
  static calcularDescuentoUSD(monto, tipo, subtotalUSD, tasa) {
    const valor = parseFloat(monto);
    if (!Number.isFinite(valor) || valor <= 0 || subtotalUSD <= 0) return 0;
    let desc = 0;
    if (tipo === "PORCENTAJE") desc = subtotalUSD * (valor / 100);
    else if (tipo === "USD") desc = valor;
    else if (tipo === "BS" && tasa > 0) desc = valor / tasa;
    return Math.min(Math.max(desc, 0), subtotalUSD);
  }

  registrarVenta({
    cliente,
    notas,
    descuentoMonto,
    descuentoTipo,
    esCredito = false,
    metodoPago = "efectivo",
  }) {
    const subtotalUSD = this.ordenActual.calcularSubtotalUSD();
    const tasa = this._tasaBCV;
    const descuentoUSD = mPosCaja.calcularDescuentoUSD(
      descuentoMonto,
      descuentoTipo,
      subtotalUSD,
      tasa
    );
    const totalUSD = Math.max(subtotalUSD - descuentoUSD, 0);
    const totalBs = totalUSD * tasa;
    const productosComprimidos = this.ordenActual.obtenerNombresComprimidos();

    const baseParams = {
      id: Date.now(),
      cliente,
      fecha: new Date().toLocaleString(),
      productos: productosComprimidos,
      totalUSD,
      totalBs,
      tasaFijada: tasa,
      descuentoUSD,
      notas,
    };

    const venta = esCredito
      ? new mVentaCredito({ ...baseParams, saldoPendienteUSD: totalUSD })
      : new mVentaContado({
          ...baseParams,
          metodoPago,
          detallePago: {
            efectivoUSD: metodoPago === "efectivo" ? totalUSD : 0,
            pagoMovilUSD: metodoPago === "pagoMovil" ? totalUSD : 0,
          },
        });

    this._ventas.push(venta);
    this.guardarHistorial();
    this.ordenActual.vaciar();
    return venta;
  }

  buscarVentaPorId(idVenta) {
    return this._ventas.find((v) => v.id === Number(idVenta)) || null;
  }

  liquidarCredito(idVenta, metodoPago) {
    const idx = this._ventas.findIndex((v) => v.id === Number(idVenta));
    if (idx === -1) return null;
    const actual = this._ventas[idx];
    if (!actual.esCredito()) return actual;

    const ventaPagada = actual.convertirAContado({
      metodoPago,
      detallePago: {
        efectivoUSD: metodoPago === "efectivo" ? actual.totalUSD : 0,
        pagoMovilUSD: metodoPago === "pagoMovil" ? actual.totalUSD : 0,
      },
    });
    this._ventas[idx] = ventaPagada;
    this.guardarHistorial();
    return ventaPagada;
  }

  actualizarDivisionPago(idVenta, { descuentoMonto, descuentoTipo, efectivoUSD, pagoMovilUSD }) {
    const idx = this._ventas.findIndex((v) => v.id === Number(idVenta));
    if (idx === -1) return { ok: false, error: "Venta no encontrada." };

    const venta = this._ventas[idx];
    const subtotalOriginalUSD = venta.totalUSD + (venta.descuentoUSD || 0);
    const nuevoDescuentoUSD = mPosCaja.calcularDescuentoUSD(
      descuentoMonto,
      descuentoTipo,
      subtotalOriginalUSD,
      venta.tasaFijada
    );
    const nuevoTotalUSD = Math.max(subtotalOriginalUSD - nuevoDescuentoUSD, 0);
    const ef = Number(efectivoUSD) || 0;
    const pm = Number(pagoMovilUSD) || 0;

    if (Math.abs(ef + pm - nuevoTotalUSD) > 0.01) {
      return {
        ok: false,
        error: `La suma ($${(ef + pm).toFixed(2)}) debe ser igual al total a pagar ($${nuevoTotalUSD.toFixed(2)}).`,
      };
    }

    let ventaActualizada = venta;
    if (venta.esCredito()) {
      ventaActualizada = venta.convertirAContado({
        metodoPago: ef > 0 && pm === 0 ? "efectivo" : pm > 0 && ef === 0 ? "pagoMovil" : "mixto",
        detallePago: { efectivoUSD: ef, pagoMovilUSD: pm },
      });
    } else {
      ventaActualizada.detallePago = { efectivoUSD: ef, pagoMovilUSD: pm };
    }

    ventaActualizada.descuentoUSD = nuevoDescuentoUSD;
    ventaActualizada.totalUSD = nuevoTotalUSD;
    ventaActualizada.totalBs = nuevoTotalUSD * venta.tasaFijada;

    this._ventas[idx] = ventaActualizada;
    this.guardarHistorial();
    return { ok: true, venta: ventaActualizada };
  }

  eliminarVenta(idVenta) {
    const antes = this._ventas.length;
    this._ventas = this._ventas.filter((v) => v.id !== Number(idVenta));
    if (this._ventas.length !== antes) {
      this.guardarHistorial();
      return true;
    }
    return false;
  }

  borrarHistorialCompleto() {
    this._ventas = [];
    mStorage.eliminar(mStorage.CLAVES.HISTORIAL);
  }

  // --- Mejora 1: Totales diarios y semanales SIN exponer totales globales históricos ---
  static _parsearFechaVenta(fechaStr) {
    const parteFecha = String(fechaStr ?? "").split(",")[0].trim();
    const partes = parteFecha.split("/");
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const anio = parseInt(partes[2], 10);
      const dt = new Date(anio, mes, dia);
      if (!Number.isNaN(dt.getTime())) {
        return { claveDia: parteFecha, fechaObj: dt };
      }
    }
    const fallback = new Date(fechaStr);
    const dt = Number.isNaN(fallback.getTime()) ? new Date() : fallback;
    return { claveDia: dt.toLocaleDateString(), fechaObj: dt };
  }

  static _claveSemanaISO(dateObj) {
    const copia = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    const diaSemana = copia.getUTCDay() || 7;
    copia.setUTCDate(copia.getUTCDate() + 4 - diaSemana);
    const inicioAnio = new Date(Date.UTC(copia.getUTCFullYear(), 0, 1));
    const numSemana = Math.ceil(((copia - inicioAnio) / 86400000 + 1) / 7);
    return `${copia.getUTCFullYear()}-S${String(numSemana).padStart(2, "0")}`;
  }

  obtenerVentasAgrupadasPorDiaYSemana(filtro = "todos") {
    const filtradas = this._ventas.filter((v) => {
      if (filtro === "credito") return v.estado === "Credito";
      if (filtro === "pagado") return v.estado === "Pagado";
      return true;
    });

    const mapaDias = new Map();

    for (const venta of filtradas) {
      const { claveDia, fechaObj } = mPosCaja._parsearFechaVenta(venta.fecha);
      const semana = mPosCaja._claveSemanaISO(fechaObj);

      if (!mapaDias.has(claveDia)) {
        mapaDias.set(claveDia, {
          dia: claveDia,
          semana,
          fechaObj,
          ventas: [],
          totalUSD: 0,
          totalBs: 0,
          sumEfectivoUSD: 0,
          sumEfectivoBs: 0,
          sumPagoMovilUSD: 0,
          sumPagoMovilBs: 0,
        });
      }

      const grupoDia = mapaDias.get(claveDia);
      grupoDia.ventas.push(venta);
      grupoDia.totalUSD += venta.totalUSD;
      grupoDia.totalBs += venta.totalBs;

      if (venta.estado === "Pagado") {
        let efUSD = 0;
        let pmUSD = 0;
        if (venta.detallePago) {
          efUSD = Number(venta.detallePago.efectivoUSD) || 0;
          pmUSD = Number(venta.detallePago.pagoMovilUSD) || 0;
        } else if (venta.metodoPago === "efectivo") {
          efUSD = venta.totalUSD;
        } else if (venta.metodoPago === "pagoMovil") {
          pmUSD = venta.totalUSD;
        }
        grupoDia.sumEfectivoUSD += efUSD;
        grupoDia.sumEfectivoBs += efUSD * venta.tasaFijada;
        grupoDia.sumPagoMovilUSD += pmUSD;
        grupoDia.sumPagoMovilBs += pmUSD * venta.tasaFijada;
      }
    }

    const diasOrdenados = Array.from(mapaDias.values()).sort(
      (a, b) => b.fechaObj.getTime() - a.fechaObj.getTime()
    );

    const mapaSemanas = new Map();
    for (const diaInfo of diasOrdenados) {
      if (!mapaSemanas.has(diaInfo.semana)) {
        mapaSemanas.set(diaInfo.semana, {
          semana: diaInfo.semana,
          totalSemanaUSD: 0,
          totalSemanaBs: 0,
          dias: [],
        });
      }
      const sem = mapaSemanas.get(diaInfo.semana);
      sem.totalSemanaUSD += diaInfo.totalUSD;
      sem.totalSemanaBs += diaInfo.totalBs;
      sem.dias.push(diaInfo);
    }

    return Array.from(mapaSemanas.values());
  }

  // --- Exportación e importación separada (menú vs historial) ---
  async exportarMenu() {
    const payload = {
      version: "1.0",
      tipo: "comandapp_menu",
      fechaExportacion: new Date().toISOString(),
      categorias: this._categorias,
      productos: this._menu.map((p) => p.toJSON()),
    };
    const fecha = new Date().toISOString().split("T")[0];
    return mStorage.exportarArchivoJSON(`comandapp_menu_${fecha}.json`, payload);
  }

  analizarImportacionMenu(json) {
    let normalizado = json;
    if (!normalizado || normalizado.tipo !== "comandapp_menu") {
      if (Array.isArray(json) && json.length > 0 && typeof json[0] === "object") {
        normalizado = { tipo: "comandapp_menu", categorias: [], productos: json };
      } else if (Array.isArray(json) && json.length > 0 && typeof json[0] === "string") {
        normalizado = { tipo: "comandapp_menu", categorias: json, productos: [] };
      } else {
        return { ok: false, error: "El archivo no parece ser un menú válido de ComandAPP." };
      }
    }

    const categoriasNuevas = Array.isArray(normalizado.categorias)
      ? normalizado.categorias.filter((c) => typeof c === "string" && c.trim() !== "")
      : [];
    const productosNuevos = Array.isArray(normalizado.productos)
      ? normalizado.productos.filter(
          (p) => p && p.nombre && typeof p.precioUSD === "number" && p.categoria
        )
      : [];

    if (categoriasNuevas.length === 0 && productosNuevos.length === 0) {
      return { ok: false, error: "El archivo no contiene categorías ni productos." };
    }

    const existentes = new Set(this._menu.map((p) => p.nombre.toLowerCase().trim()));
    const conflictos = [];
    const sinConflicto = [];

    for (const prod of productosNuevos) {
      if (existentes.has(prod.nombre.toLowerCase().trim())) {
        conflictos.push(prod);
      } else {
        sinConflicto.push(prod);
      }
    }

    let catsAgregadas = 0;
    for (const cat of categoriasNuevas) {
      const limpia = cat.trim();
      if (!this._categorias.some((c) => c.toLowerCase() === limpia.toLowerCase())) {
        this._categorias.push(limpia);
        catsAgregadas += 1;
      }
    }

    if (sinConflicto.length > 0) {
      const maxId = this._menu.reduce((max, p) => Math.max(max, p.id || 0), 0);
      sinConflicto.forEach((p, i) => {
        this._menu.push(
          new mProducto({
            id: maxId + i + 1,
            nombre: p.nombre,
            precioUSD: p.precioUSD,
            categoria: p.categoria,
          })
        );
      });
    }

    this.guardarCatalogo();
    return {
      ok: true,
      catsAgregadas,
      productosAgregados: sinConflicto.length,
      conflictos,
    };
  }

  resolverConflictosMenu(conflictos = [], accion = "omitir") {
    if (accion !== "reemplazar" || !Array.isArray(conflictos) || conflictos.length === 0) {
      return { ok: true, reemplazados: 0 };
    }

    for (const pNuevo of conflictos) {
      const nombreNorm = pNuevo.nombre.toLowerCase().trim();
      const idx = this._menu.findIndex((p) => p.nombre.toLowerCase().trim() === nombreNorm);
      if (idx !== -1) {
        this._menu[idx] = new mProducto({
          id: this._menu[idx].id,
          nombre: pNuevo.nombre,
          precioUSD: pNuevo.precioUSD,
          categoria: pNuevo.categoria,
        });
      } else {
        const maxId = this._menu.reduce((max, p) => Math.max(max, p.id || 0), 0);
        this._menu.push(new mProducto({ ...pNuevo, id: maxId + 1 }));
      }
    }

    this.guardarCatalogo();
    return { ok: true, reemplazados: conflictos.length };
  }

  async exportarHistorial() {
    if (this._ventas.length === 0) {
      return { ok: false, error: "No hay ventas en el historial para exportar." };
    }
    const payload = {
      version: "1.0",
      tipo: "comandapp_historial",
      fechaExportacion: new Date().toISOString(),
      ventas: this._ventas.map((v) => v.toJSON()),
    };
    const fecha = new Date().toISOString().split("T")[0];
    return mStorage.exportarArchivoJSON(`comandapp_historial_${fecha}.json`, payload);
  }

  importarHistorial(json) {
    let normalizado = json;
    if (!normalizado || normalizado.tipo !== "comandapp_historial") {
      if (Array.isArray(json)) {
        normalizado = { tipo: "comandapp_historial", ventas: json };
      } else {
        return { ok: false, error: "El archivo no parece ser un historial válido de ComandAPP." };
      }
    }

    const ventasNuevas = Array.isArray(normalizado.ventas) ? normalizado.ventas : [];
    if (ventasNuevas.length === 0) {
      return { ok: false, error: "El archivo no contiene ventas." };
    }

    const idsExistentes = new Set(this._ventas.map((v) => v.id));
    let importados = 0;
    let omitidos = 0;

    for (const raw of ventasNuevas) {
      if (raw && raw.id && !idsExistentes.has(raw.id)) {
        this._ventas.push(mPosCaja.hidratarVenta(raw));
        idsExistentes.add(raw.id);
        importados += 1;
      } else {
        omitidos += 1;
      }
    }

    this.guardarHistorial();
    return { ok: true, importados, omitidos };
  }
}