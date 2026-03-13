const autocannon = require('autocannon');
const { v4: uuidv4 } = require('uuid'); // We might need to install this or just use Math.random

async function runMassiveRegistrationTest() {
    const url = 'https://api.equaly.co/api/auth/register';
    const totalRequests = 5000;
    const concurrentUsers = 500; // Testing with high concurrency

    console.log(`🔥 INICIANDO PRUEBA DE REGISTRO MASIVO 🔥`);
    console.log(`Target: ${url}`);
    console.log(`Usuarios Concurrentes: ${concurrentUsers}`);
    console.log(`Objetivo: ${totalRequests} registros simulados\n`);

    const inst = autocannon({
        url: url,
        connections: concurrentUsers,
        amount: totalRequests,
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        setupClient: (client) => {
            // This function runs for every request to generate unique data
            const randomId = Math.floor(Math.random() * 1000000);
            client.setBody(JSON.stringify({
                name: `Test User ${randomId}`,
                email: `test_${Date.now()}_${randomId}@equaly.test`,
                password: 'Password123!',
                country: 'EC',
                terms_accepted: true
            }));
        }
    }, (err, res) => {
        if (err) {
            console.error('❌ Error fatal en la prueba:', err);
        } else {
            console.log(`\n📊 RESULTADOS DEL REGISTRO MASIVO:`);
            console.log(`   🔸 Total Peticiones: ${res.requests.total}`);
            console.log(`   🔸 Éxitos (2xx): ${res.requests.sent - res.non2xx}`);
            console.log(`   🔸 Fallos o Bloqueos: ${res.non2xx}`);
            console.log(`   🔸 Peticiones por Segundo: ${res.requests.average.toFixed(2)}`);
            console.log(`   🔸 Latencia Media: ${res.latency.average} ms`);
            
            if (res.non2xx > 0) {
                console.log(`\n⚠️ NOTA: Los fallos detectados suelen ser por el Firewall de Vercel`);
                console.log(`          o límites de conexión de la base de datos protegiendo el sistema.`);
            }
            console.log(`\n✅ Prueba de estrés finalizada.`);
        }
    });

    autocannon.track(inst, { renderProgressBar: true });
}

runMassiveRegistrationTest();
