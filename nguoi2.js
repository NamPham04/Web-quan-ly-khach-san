

// ─── Render bảng danh sách tài khoản ─────────────────
function renderAdminUsers() {
  const users = DB.get('vh_users') || [];
  const q     = (document.getElementById('au-search').value || '').toLowerCase();
  const filtered = q
    ? users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    : users;

  document.getElementById('admin-users-count').textContent = users.length + ' tài khoản';

  document.getElementById('admin-users-tbody').innerHTML = filtered.map(u => {
    const isAdmin  = u.role === 'admin';
    const roleColor = isAdmin ? 'var(--gold-l)' : 'var(--info)';
    const roleBg    = isAdmin ? 'rgba(184,149,42,.15)' : 'rgba(52,152,219,.15)';
    const avatar    = (u.name || 'U').charAt(0).toUpperCase();
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:${roleBg};border:1px solid ${roleColor}40;
               display:flex;align-items:center;justify-content:center;font-weight:700;color:${roleColor};
               font-size:13px;flex-shrink:0">${avatar}</div>
          <span class="fw600">${esc(u.name)}</span>
        </div>
      </td>
      <td class="text-dim text-sm">${esc(u.email)}</td>
      <td class="text-dim text-sm">${esc(u.phone || '—')}</td>
      <td>
        <span style="background:${roleBg};color:${roleColor};border:1px solid ${roleColor}30;
             padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700">
          ${isAdmin ? '👑 Admin' : '👤 Khách hàng'}
        </span>
      </td>
      <td class="text-dim text-sm">${u.createdAt || '—'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-xs" onclick="openUserModal(${u.id})">✏️ Sửa</button>
          <button class="btn btn-danger btn-xs"  onclick="deleteUser(${u.id})">🗑️ Xóa</button>
        </div>
      </td>
    </tr>`;
  }).join('') ||
    '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3)">Không có tài khoản</td></tr>';
}

// ─── Mở modal thêm / sửa tài khoản ──────────────────
function openUserModal(uid2) {
  editingUserId = uid2 || null;
  document.getElementById('user-modal-title').textContent =
    uid2 ? '✏️ Chỉnh sửa tài khoản' : '➕ Thêm tài khoản';

  if (uid2) {
    const u = getUser(uid2);
    if (!u) return;
    document.getElementById('um-name').value  = u.name  || '';
    document.getElementById('um-email').value = u.email || '';
    document.getElementById('um-phone').value = u.phone || '';
    document.getElementById('um-pwd').value   = '';
    document.getElementById('um-role').value  = u.role  || 'client';
  } else {
    ['um-name', 'um-email', 'um-phone', 'um-pwd'].forEach(id =>
      document.getElementById(id).value = ''
    );
    document.getElementById('um-role').value = 'client';
  }
  openModal('modal-user');
}

// ─── Lưu tài khoản (thêm mới hoặc cập nhật) ─────────
function saveUser() {
  const name  = document.getElementById('um-name').value.trim();
  const email = document.getElementById('um-email').value.trim();
  const pwd   = document.getElementById('um-pwd').value;

  if (!name || !email) {
    toast('Vui lòng điền tên và email', 'err');
    return;
  }

  const users = DB.get('vh_users') || [];

  // Kiểm tra email trùng khi thêm mới
  if (!editingUserId && users.find(u => u.email === email)) {
    toast('Email đã tồn tại', 'err');
    return;
  }

  const data = {
    name,
    email,
    phone: document.getElementById('um-phone').value.trim(),
    role:  document.getElementById('um-role').value,
  };
  if (pwd) data.password = pwd;

  if (editingUserId) {
    DB.set('vh_users', users.map(u => u.id === editingUserId ? { ...u, ...data } : u));
  } else {
    DB.set('vh_users', [...users, {
      id: uid(),
      createdAt: today(),
      password: pwd || '123456',
      ...data,
    }]);
  }

  closeModal('modal-user');
  toast(editingUserId ? 'Cập nhật tài khoản thành công!' : 'Thêm tài khoản thành công!', 'ok');
  renderAdminUsers();
}

// ─── Xóa tài khoản ───────────────────────────────────
function deleteUser(uid2) {
  if (uid2 === currentUser.id) {
    toast('Không thể xóa tài khoản đang đăng nhập!', 'err');
    return;
  }
  if (!confirm('Xóa tài khoản này?')) return;
  DB.set('vh_users', (DB.get('vh_users') || []).filter(u => u.id !== uid2));
  toast('Đã xóa tài khoản', 'ok');
  renderAdminUsers();
}
