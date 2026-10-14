import http from 'http';

export async function handleRatesRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  if (req.method === 'GET' && pathname === '/api/rates') {
    try {
      // Peticiones en paralelo a Binance y DolarApi
      const [binanceRes, dolarRes] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
        fetch('https://dolarapi.com/v1/dolares')
      ]);

      // Casteamos el JSON a 'any' para evitar el error TS18046 ('unknown')
      const btcData = (await binanceRes.json()) as any;
      const dolarData = (await dolarRes.json()) as any[];

      // Mapear los dólares
      const oficial = dolarData.find((d: any) => d.casa === 'oficial')?.venta || 0;
      const blue = dolarData.find((d: any) => d.casa === 'blue')?.venta || 0;
      const mep = dolarData.find((d: any) => d.casa === 'bolsa')?.venta || 0;

      // Cotización de UVA (Actualización según serie del BCRA)
      const uvaVal = 2150.53; 

      const responsePayload = {
        dolar: {
          oficial,
          blue,
          mep
        },
        btc: {
          binance: parseFloat(btcData.price) || 0
        },
        uva: {
          bcra: uvaVal
        },
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responsePayload));
      return true;

    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error al consultar cotizaciones externas: ' + err.message }));
      return true;
    }
  }

  return false;
}