const autocannon = require('autocannon');

async function runBenchmark() {
    console.log("🔍 Iniciando Auditoría de Carga y Capacidad para el ecosistema EQUALY...\n");

    const runTest = (name, url, connections, duration = 10) => new Promise((resolve) => {
        console.log(`📡 Probando: ${name} (${url}) con ${connections} usuarios concurrentes...`);
        autocannon({
            url: url,
            connections: connections,
            duration: duration,
        }, (err, res) => {
            if (err) {
                console.error(`❌ Error en ${name}:`, err);
                resolve(null);
            } else {
                console.log(`   ✅ Completado: ${res.requests.total} peticiones en ${duration}s`);
                console.log(`   🔸 Peticiones/seg (Media): ${res.requests.average.toFixed(2)}`);
                console.log(`   🔸 Latencia (Media): ${res.latency.average} ms`);
                console.log(`   🔸 Errores (No-2xx): ${res.non2xx}\n`);
                resolve(res);
            }
        });
    });

    // 1. Landing Page (Static - High Capacity)
    await runTest("Landing Page", "https://www.equaly.co", 200, 5);

    // 2. Dashboard (Static - High Capacity)
    await runTest("Dashboard", "https://dashboard.equaly.co", 200, 5);

    // 3. API (Serverless - Compute Bound)
    // Usamos el endpoint de inicio que devuelve el HTML premium
    await runTest("API Serverless", "https://api.equaly.co", 50, 5);

    console.log("🏁 Resumen de Capacidad Teórica:");
    console.log("- Static Sites (Landing/Dashboard): Soportan 10,000+ usuarios concurrentes (Vercel Edge Network).");
    console.log("- API Serverless: Soporta hasta 1,000 ejecuciones concurrentes por segundo (Límite de Vercel Pro).");
    console.log("- Base de Datos (Supabase): Soporta hasta 60 conexiones directas o miles vía connection pooler.");
}

runBenchmark();
