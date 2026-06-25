const API_BASE = 'http://localhost:7002/rest';

const qs = (s) => document.querySelector(s);

// Auth elements
const regName = qs('#reg-name');
const regEmail = qs('#reg-email');
const regPassword = qs('#reg-password');
const btnRegister = qs('#btn-register');
const regMsg = qs('#reg-msg');

const loginEmail = qs('#login-email');
const loginPassword = qs('#login-password');
const btnLogin = qs('#btn-login');
const loginMsg = qs('#login-msg');

const authArea = qs('#auth-area');
const appArea = qs('#app-area');
const userInfo = qs('#user-info');
const userRole = qs('#user-role');
const btnLogout = qs('#btn-logout');

// Reimbursement elements
const rbTitle = qs('#rb-title');
const rbDesc = qs('#rb-desc');
const rbAmount = qs('#rb-amount');
const btnCreateRb = qs('#btn-create-rb');
const rbMsg = qs('#rb-msg');
const rbList = qs('#rb-list');

let currentUser = null;

// Helpers
const showMsg = (el, text, isError = true) => {
    el.textContent = text || '';
    el.style.color = isError ? '#ef4444' : '#10b981';
};

const setLoggedIn = (user) => {
    currentUser = user;
    if (user) {
        authArea.classList.add('hidden');
        appArea.classList.remove('hidden');
        userInfo.textContent = `${user.name} (${user.email})`;
        if (userRole) userRole.textContent = user.role;
        loadReimbursements();
    } else {
        authArea.classList.remove('hidden');
        appArea.classList.add('hidden');
        userInfo.textContent = '';
        if (userRole) userRole.textContent = '';
    }
};

// Register
btnRegister.addEventListener('click', async () => {
    btnRegister.disabled = true;
    showMsg(regMsg, '');
    try {
        const res = await fetch(`${API_BASE}/onboardings/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: regName.value, email: regEmail.value, password: regPassword.value }),
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Register failed');
        showMsg(regMsg, 'Registered successfully — please login', false);
        regName.value = regEmail.value = regPassword.value = '';
    } catch (err) {
        showMsg(regMsg, err.message || String(err));
    } finally {
        btnRegister.disabled = false;
    }
});

// Login
btnLogin.addEventListener('click', async () => {
    btnLogin.disabled = true;
    showMsg(loginMsg, '');
    try {
        const res = await fetch(`${API_BASE}/onboardings/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value }),
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        const user = data.data.user;
        setLoggedIn(user);
        loginEmail.value = loginPassword.value = '';
    } catch (err) {
        showMsg(loginMsg, err.message || String(err));
    } finally {
        btnLogin.disabled = false;
    }
});

btnLogout.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE}/onboardings/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
        // ignore
    }
    setLoggedIn(null);
});

// Create reimbursement
btnCreateRb.addEventListener('click', async () => {
    btnCreateRb.disabled = true;
    showMsg(rbMsg, '');
    try {
        const payload = { title: rbTitle.value, description: rbDesc.value, amount: Number(rbAmount.value) };
        const res = await fetch(`${API_BASE}/reimbursements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Create failed');
        showMsg(rbMsg, 'Created successfully', false);
        rbTitle.value = rbDesc.value = rbAmount.value = '';
        loadReimbursements();
    } catch (err) {
        showMsg(rbMsg, err.message || String(err));
    } finally {
        btnCreateRb.disabled = false;
    }
});

// Load reimbursements
const loadReimbursements = async () => {
    rbList.innerHTML = 'Loading...';
    try {
        const res = await fetch(`${API_BASE}/reimbursements`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load');
        const rows = data;
        // backend returns { status, data } usually — handle both
        const items = Array.isArray(rows) ? rows : data.data || data;
        renderReimbursements(items);
    } catch (err) {
        rbList.innerHTML = `<div class="msg">${err.message || String(err)}</div>`;
    }
};

const renderReimbursements = (items) => {
    if (!items || items.length === 0) {
        rbList.innerHTML = '<div class="small">No reimbursements found.</div>';
        return;
    }

    rbList.innerHTML = items
        .map((r) => {
            return `
      <div class="rb-item">
        <div><strong>${escapeHtml(r.title || '')}</strong></div>
        <div class="rb-meta">Amount: ${r.amount} | Status: ${r.status || ''} | EMP: ${r.employeeId || r.employee_id || ''}</div>
        <div class="small">${escapeHtml(r.description || '')}</div>
      </div>
    `;
        })
        .join('\n');
};

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// On load: show auth area
setLoggedIn(null);

// Try to detect logged-in user by calling a lightweight endpoint: / (root) or re-fetch reimbursements and check error
(async () => {
    try {
        const res = await fetch(`${API_BASE}/onboardings/login`, { method: 'GET', credentials: 'include' });
        // this backend doesn't expose GET /login; skip
    } catch (e) {
        // ignore
    }
})();
