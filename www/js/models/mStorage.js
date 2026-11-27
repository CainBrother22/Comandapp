export default class mStorage {
  static CLAVES = {
    ACTIVACION: "comandapp_activado",
    TASA_BCV: "tasa_bcv_fija",
    CATEGORIAS: "categorias_pos",
    MENU: "menu_personalizado",
    HISTORIAL: "historial_ventas",
    ESPERA: "ordenes_espera",
  };

  static leerJSON(clave, valorPorDefecto) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : valorPorDefecto;
    } catch {
      return valorPorDefecto;
    }
  }

  static guardarJSON(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  static leerTexto(clave, valorPorDefecto = "") {
    return localStorage.getItem(clave) ?? valorPorDefecto;
  }

  static guardarTexto(clave, valor) {
    localStorage.setItem(clave, String(valor));
  }

  static eliminar(clave) {
    localStorage.removeItem(clave);
  }

  static async exportarArchivoJSON(nombreArchivo, contenidoJSON) {
    const texto =
      typeof contenidoJSON === "string"
        ? contenidoJSON
        : JSON.stringify(contenidoJSON, null, 2);

    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      try {
        const Filesystem = window.Capacitor.Plugins?.Filesystem;
        const Share = window.Capacitor.Plugins?.Share;
        if (!Filesystem || !Share) {
          throw new Error("Faltan plugins Filesystem o Share de Capacitor.");
        }

        const guardado = await Filesystem.writeFile({
          path: nombreArchivo,
          data: texto,
          directory: "CACHE",
          encoding: "utf8",
        });

        await Share.share({
          title: "Respaldo ComandAPP",
          text: "Archivo de respaldo exportado desde ComandAPP.",
          url: guardado.uri,
          dialogTitle: "Compartir o guardar respaldo",
        });

        return { ok: true, mensaje: "Menú de compartir abierto correctamente." };
      } catch (err) {
        return { ok: false, error: err?.message || "Error al exportar en Android." };
      }
    }

    const blob = new Blob([texto], { type: "application/json" });
    try {
      const archivo = new File([blob], nombreArchivo, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({
          title: "Respaldo ComandAPP",
          files: [archivo],
        });
        return { ok: true, mensaje: "Archivo compartido vía navegador." };
      }
    } catch {
      // Continúa hacia descarga directa
    }

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    return { ok: true, mensaje: "Descarga iniciada." };
  }
}