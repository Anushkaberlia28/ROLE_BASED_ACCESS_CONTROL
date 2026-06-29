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

const showMsg = (el, text, isError = true) => {
    el.textContent = text || '';
    el.style.color = isError ? '#ef4444' : '#10b981';
};

const requestJson = async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        credentials: 'include',
        ...options,
    });

    let payload = null;
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        payload = await res.json().catch(() => null);
    } else {
        payload = await res.text().catch(() => null);
    }

    if (!res.ok) {
        const message = payload?.message || payload || `Request failed with ${res.status}`;
        throw new Error(message);
    }

    return payload;
};

const extractItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.reimbursements)) return payload.data.reimbursements;
    if (Array.isArray(payload?.reimbursements)) return payload.reimbursements;
    return [];
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

btnRegister.addEventListener('click', async () => {
    btnRegister.disabled = true;
    showMsg(regMsg, '');
    try {
        await requestJson('/onboardings/register', {
            method: 'POST',
            body: JSON.stringify({
                name: regName.value,
                email: regEmail.value,
                password: regPassword.value,
            }),
        });
        showMsg(regMsg, 'Registered successfully — please login', false);
        regName.value = regEmail.value = regPassword.value = '';
    } catch (err) {
        showMsg(regMsg, err.message || String(err));
    } finally {
        btnRegister.disabled = false;
    }
});

btnLogin.addEventListener('click', async () => {
    btnLogin.disabled = true;
    showMsg(loginMsg, '');
    try {
        const data = await requestJson('/onboardings/login', {
            method: 'POST',
            body: JSON.stringify({
                email: loginEmail.value,
                password: loginPassword.value,
            }),
        });
        const user = data?.data?.user;
        if (!user) throw new Error('Login response was invalid');
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
        await requestJson('/onboardings/logout', { method: 'POST' });
    } catch (e) {
        // ignore
    }
    setLoggedIn(null);
});

btnCreateRb.addEventListener('click', async () => {
    btnCreateRb.disabled = true;
    showMsg(rbMsg, '');
    try {
        const payload = {
            title: rbTitle.value,
            description: rbDesc.value,
            amount: Number(rbAmount.value),
        };

        await requestJson('/reimbursements', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        showMsg(rbMsg, 'Created successfully', false);
        rbTitle.value = rbDesc.value = rbAmount.value = '';
        loadReimbursements();
    } catch (err) {
        showMsg(rbMsg, err.message || String(err));
    } finally {
        btnCreateRb.disabled = false;
    }
});

const loadReimbursements = async () => {
    rbList.innerHTML = 'Loading...';
    try {
        const data = await requestJson('/reimbursements', { method: 'GET' });
        const items = extractItems(data);
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

setLoggedIn(null);
