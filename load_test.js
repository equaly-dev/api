const autocannon = require('autocannon');
const axios = require('axios');

async function runTest() {
    console.log("🚀 Iniciando Pruebas de Rendimiento (Load Testing) para 5000+ simulaciones...\n");

    let token = '';
    try {
        const res = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'demo@correo.com',
            password: 'password123'
        });
        token = res.data.token;
        console.log("✅ Autenticación de prueba exitosa.");
    } catch (err) {
        console.log("No se pudo iniciar sesión con demo@correo.com, intentemos con un token temporal o crearemos uno de prueba.");
    }

    const runAC = (opts) => new Promise((resolve) => {
        const inst = autocannon(opts, (err, res) => resolve(res));
    });

    console.log("\n📊 1. Probando Rendimiento de Login (bcrypt CPU-bound)");
    const loginRes = await runAC({
        url: 'http://localhost:3000/api/auth/login',
        connections: 100, // Bcrypt is heavy, so we use 100 concurrent
        duration: 10,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'demo@correo.com', password: 'wrongpassword' }) // test rejection speed
    });
    console.log(`   🔸 Peticiones por segundo: ${loginRes.requests.average}`);
    console.log(`   🔸 Latencia promedio: ${loginRes.latency.average} ms`);
    console.log(`   🔸 Errores (de 4xx/5xx): ${loginRes.non2xx}`);

    console.log("\n📊 2. Probando Dashboard /user/profile (Altamente Concurrente)");
    const profileRes = await runAC({
        url: 'http://localhost:3000/api/user/profile',
        connections: 1000,
        duration: 10,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   🔸 Peticiones por segundo: ${profileRes.requests.average}`);
    console.log(`   🔸 Latencia promedio: ${profileRes.latency.average} ms`);

    console.log("\n📊 3. Probando Resumen de Portafolio /user/portfolio-summary (Base de Datos intensiva)");
    const portRes = await runAC({
        url: 'http://localhost:3000/api/user/portfolio-summary',
        connections: 1000,
        duration: 10,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   🔸 Peticiones por segundo: ${portRes.requests.average}`);
    console.log(`   🔸 Latencia promedio: ${portRes.latency.average} ms`);

    console.log("\n📊 4. Probando Sistema de Referidos /user/referrals");
    const refRes = await runAC({
        url: 'http://localhost:3000/api/user/referrals',
        connections: 1000,
        duration: 10,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   🔸 Peticiones por segundo: ${refRes.requests.average}`);
    console.log(`   🔸 Latencia promedio: ${refRes.latency.average} ms`);

    console.log("\n✅ Pruebas finalizadas.");
}

runTest();
