// js/models/mTasaBCV.js
// Servicio para consultar las tasas del Banco Central de Venezuela (BCV)

export default class mTasaBCV {
  /**
   * Obtiene la tasa BCV actualmente vigente (la que aplica hoy).
   * @returns {Promise<{valor: number, fuente: string, fechaValor: string}>}
   */
  static async obtenerTasaActual() {
    // 1. Intento principal: DolarAPI (específica para BCV, sin API key)
    try {
      const respuesta = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      if (respuesta.ok) {
        const datos = await respuesta.json();
        const tasa = parseFloat(datos.promedio);
        if (tasa > 0) {
          return {
            valor: tasa,
            fuente: "DolarAPI (BCV)",
            fechaValor: datos.fechaActualizacion, // La API ya devuelve la fecha de vigencia
          };
        }
      }
    } catch (error) {
      console.log("DolarAPI no disponible, intentando respaldo...");
    }

    // 2. Respaldo: ExchangeRate-API (tasa oficial internacional)
    try {
      const respuesta = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      if (respuesta.ok) {
        const datos = await respuesta.json();
        const tasa = parseFloat(datos.rates?.VES);
        if (tasa > 0) {
          return {
            valor: tasa,
            fuente: "ExchangeRate (Oficial)",
            fechaValor: new Date().toISOString().split("T")[0], // Solo fecha, sin hora
          };
        }
      }
    } catch (error) {
      console.log("ExchangeRate también falló");
    }

    throw new Error("No se pudo conectar con el BCV. Verifica tu internet o ingresa la tasa manualmente.");
  }

  /**
   * Obtiene la PRÓXIMA tasa BCV publicada (la que regirá el siguiente día hábil).
   * Usa el parámetro `is_operation_rate=true` de Sydocs.
   * @returns {Promise<{valor: number, fuente: string, fechaValor: string, esFutura: boolean}>}
   */
  static async obtenerProximaTasa() {
    try {
      const url = "https://api.sypago.net/api/v1/bank/bcv/rate?is_operation_rate=true";
      const respuesta = await fetch(url);

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }

      const datos = await respuesta.json();
      // La API devuelve un array; buscamos la entrada para USD
      const entradaUSD = Array.isArray(datos)
        ? datos.find((item) => item.code === "USD")
        : null;

      if (!entradaUSD || !(entradaUSD.rate > 0)) {
        throw new Error("La API de Sydocs no devolvió una tasa USD válida.");
      }

      const fechaValor = entradaUSD.load_date;
      // Comparamos la fecha de vigencia con la fecha actual para saber si es futura
      const esFutura = new Date(fechaValor) > new Date();

      return {
        valor: entradaUSD.rate,
        fuente: "Sydocs (BCV)",
        fechaValor: fechaValor,
        esFutura: esFutura,
      };
    } catch (error) {
      console.error("Error al obtener la próxima tasa:", error);
      // Si falla, lanzamos un error para que la vista pueda manejarlo
      throw new Error("No se pudo obtener la próxima tasa del BCV. Inténtalo de nuevo más tarde.");
    }
  }
}