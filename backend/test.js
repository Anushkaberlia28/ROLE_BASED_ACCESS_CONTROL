const baseUrl = 'http://localhost:7002/rest';

async function runTests() {
    console.log("Starting API integration smoke tests...");

    // 1. Test Login as CFO
    const loginRes = await fetch(`${baseUrl}/onboardings/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cfo@org.com', password: 'CFO#ORG@April2026' }) // Seeded credentials [cite: 76, 77]
    });

    const loginData = await loginRes.json();
    console.log("CFO Login Response Status:", loginRes.status);
    console.log("CFO Login Payload:", JSON.stringify(loginData, null, 2));

    // Extract cookie from headers to simulate the automated test behavior
    const cookie = loginRes.headers.get('set-cookie');

    // 2. Test fetching employee directory using the auth cookie
    const dirRes = await fetch(`${baseUrl}/employees`, {
        method: 'GET',
        headers: { 'Cookie': cookie }
    });

    const dirData = await dirRes.json();
    console.log("\nEmployees Directory Status:", dirRes.status);
    console.log("Directory Payload:", JSON.stringify(dirData, null, 2));
}

runTests().catch(console.error);