// ════════════════════════════════════════════════════════
//  admin.js  —  TV2: Dashboard · Rooms · Categories · Users
//              TV4: Admin Bookings (quản lý đặt phòng)
//  Phụ thuộc: db.js (load trước)
// ════════════════════════════════════════════════════════

// ─── TV2: DASHBOARD ──────────────────────────────────
function renderDashboard() {
  const rooms    = DB.get('vh_rooms')    || [];
  const bookings = DB.get('vh_bookings') || [];
  const users    = DB.get('vh_users')    || [];
  const revenue  = bookings.filter(b => b.pay === 'paid').reduce((s, b) => s + b.total, 0);
  const activeB  = bookings.filter(b => ['confirmed', 'checked_in'].includes(b.status)).length;

  document.getElementById('dash-stats').innerHTML = [
    { icon: '🛏️', val: rooms.length,                              lbl: 'Tổng số phòng',          sub: `${rooms.filter(r => r.status === 'available').length} còn trống`, col: '#3b82f6' },
    { icon: '📅', val: activeB,                                   lbl: 'Đặt phòng hoạt động',    sub: `Tổng ${bookings.length} đặt phòng`,                               col: '#2ecc71' },
    { icon: '💰', val: fmt(revenue),                              lbl: 'Doanh thu',               sub: 'Từ các đặt phòng đã thanh toán',                                  col: 'var(--gold-l)' },
    { icon: '👥', val: users.filter(u => u.role === 'client').length, lbl: 'Khách hàng',          sub: 'Tài khoản đã đăng ký',                                            col: '#9b59b6' },
  ].map(s => `<div class="stat">
    <div class="stat-icon">${s.icon}</div>
    <div class="stat-val" style="color:${s.col}">${esc(String(s.val))}</div>
    <div class="stat-lbl">${s.lbl}</div>
    <div class="stat-sub">${s.sub}</div>
  </div>`).join('');

  // Đặt phòng gần đây
  const recent = bookings.slice(-5).reverse();
  document.getElementById('dash-recent').innerHTML = `
    <table><thead><tr><th>Phòng</th><th>Check-in</th><th>Trạng thái</th></tr></thead><tbody>
    ${recent.map(b => {
      const r = getRoom(b.rid);
      return `<tr><td>${esc(r?.name || '—')}</td><td>${b.ci}</td><td>${badge(b.status)}</td></tr>`;
    }).join('')}
    </tbody></table>`;

  // Tình trạng phòng
  const statuses = ['available', 'occupied', 'maintenance'];
  document.getElementById('dash-room-status').innerHTML = statuses.map(s => {
    const cnt  = rooms.filter(r => r.status === s).length;
    const pct  = rooms.length ? Math.round(cnt / rooms.length * 100) : 0;
    const cols = { available: 'var(--ok)', occupied: 'var(--err)', maintenance: 'var(--warn)' };
    return `<div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:7px">
        <span>${SL[s]}</span><span style="color:var(--text2)">${cnt} phòng (${pct}%)</span>
      </div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${cols[s]}"></div></div>
    </div>`;
  }).join('');
}

// ─── TV2: QUẢN LÝ PHÒNG ──────────────────────────────
function renderAdminRooms() {
  const rooms    = DB.get('vh_rooms') || [];
  const q        = (document.getElementById('ar-search').value || '').toLowerCase();
  const filtered = q ? rooms.filter(r => r.name.toLowerCase().includes(q)) : rooms;
  document.getElementById('admin-rooms-count').textContent = rooms.length + ' phòng';
  document.getElementById('admin-rooms-tbody').innerHTML = filtered.map(r => {
    const cat = getCat(r.catId);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <img src="${esc(r.img)}" onerror="this.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=80'" alt="" style="width:50px;height:38px;object-fit:cover;border-radius:6px;flex-shrink:0">
        <span class="fw600">${esc(r.name)}</span>
      </div></td>
      <td class="text-dim">${cat.icon} ${esc(cat.name)}</td>
      <td style="color:var(--gold-l);font-weight:600">${fmt(r.price)}</td>
      <td>${r.cap} người</td>
      <td>${badge(r.status)}</td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-xs" onclick="showRoomDetail(${r.id})">👁</button>
        <button class="btn btn-outline btn-xs" onclick="openRoomModal(${r.id})">✏️ Sửa</button>
        <button class="btn btn-danger btn-xs"  onclick="deleteRoom(${r.id})">🗑️ Xóa</button>
      </div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3)">Không có phòng</td></tr>';
}

function openRoomModal(rid) {
  editingRoomId = rid || null;
  document.getElementById('room-modal-title').textContent = rid ? '✏️ Chỉnh sửa phòng' : '➕ Thêm phòng mới';
  populateCatSelects();
  if (rid) {
    const r = getRoom(rid); if (!r) return;
    document.getElementById('rm-name').value       = r.name;
    document.getElementById('rm-cat').value        = r.catId;
    document.getElementById('rm-price').value      = r.price;
    document.getElementById('rm-cap').value        = r.cap;
    document.getElementById('rm-size').value       = r.size;
    document.getElementById('rm-floor').value      = r.floor;
    document.getElementById('rm-status').value     = r.status;
    document.getElementById('rm-amenities').value  = (r.amenities || []).join(', ');
    document.getElementById('rm-img').value        = r.img  || '';
    document.getElementById('rm-desc').value       = r.desc || '';
  } else {
    ['rm-name', 'rm-price', 'rm-amenities', 'rm-img', 'rm-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('rm-cap').value    = 2;
    document.getElementById('rm-size').value   = 30;
    document.getElementById('rm-floor').value  = 1;
    document.getElementById('rm-status').value = 'available';
  }
  openModal('modal-room');
}

function saveRoom() {
  const name  = document.getElementById('rm-name').value.trim();
  const price = Number(document.getElementById('rm-price').value);
  if (!name || !price) { toast('Vui lòng điền tên và giá phòng', 'err'); return; }
  const data = {
    name,
    catId:     Number(document.getElementById('rm-cat').value),
    price,
    cap:       Number(document.getElementById('rm-cap').value),
    size:      Number(document.getElementById('rm-size').value),
    floor:     Number(document.getElementById('rm-floor').value),
    status:    document.getElementById('rm-status').value,
    amenities: document.getElementById('rm-amenities').value.split(',').map(s => s.trim()).filter(Boolean),
    img:       document.getElementById('rm-img').value.trim(),
    desc:      document.getElementById('rm-desc').value.trim()
  };
  const rooms = DB.get('vh_rooms') || [];
  if (editingRoomId) DB.set('vh_rooms', rooms.map(r => r.id === editingRoomId ? { ...r, ...data } : r));
  else               DB.set('vh_rooms', [...rooms, { id: uid(), ...data }]);
  closeModal('modal-room');
  toast(editingRoomId ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!', 'ok');
  renderAdminRooms();
  populateCatSelects();
}

function deleteRoom(rid) {
  if (!confirm('Xóa phòng này? Hành động không thể hoàn tác!')) return;
  DB.set('vh_rooms', (DB.get('vh_rooms') || []).filter(r => r.id !== rid));
  toast('Đã xóa phòng', 'ok');
  renderAdminRooms();
}

// ─── TV2: QUẢN LÝ DANH MỤC ───────────────────────────
function renderAdminCats() {
  const cats  = DB.get('vh_categories') || [];
  const rooms = DB.get('vh_rooms')      || [];
  document.getElementById('admin-cats-count').textContent = cats.length + ' danh mục';
  document.getElementById('cats-grid').innerHTML = cats.map(c => {
    const cnt = rooms.filter(r => r.catId === c.id).length;
    return `<div class="card card-pad">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:36px;margin-bottom:10px">${c.icon || '📦'}</div>
          <h3 style="font-size:15px;margin-bottom:6px">${esc(c.name)}</h3>
          <p class="text-dim text-sm mb12" style="line-height:1.5">${esc(c.desc || '')}</p>
          <span class="chip">🛏️ ${cnt} phòng</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-xs" onclick="openCatModal(${c.id})">✏️</button>
          <button class="btn btn-danger btn-xs"  onclick="deleteCat(${c.id})">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3)">Chưa có danh mục nào</div>';
}

function openCatModal(cid) {
  editingCatId = cid || null;
  document.getElementById('cat-modal-title').textContent = cid ? '✏️ Chỉnh sửa danh mục' : '➕ Thêm danh mục';
  if (cid) {
    const c = (DB.get('vh_categories') || []).find(x => x.id === cid);
    if (!c) return;
    document.getElementById('ct-icon').value = c.icon || '';
    document.getElementById('ct-name').value = c.name || '';
    document.getElementById('ct-desc').value = c.desc || '';
  } else {
    ['ct-icon', 'ct-name', 'ct-desc'].forEach(id => document.getElementById(id).value = '');
  }
  openModal('modal-cat');
}

function saveCat() {
  const name = document.getElementById('ct-name').value.trim();
  if (!name) { toast('Vui lòng nhập tên danh mục', 'err'); return; }
  const data = {
    name,
    icon: document.getElementById('ct-icon').value.trim(),
    desc: document.getElementById('ct-desc').value.trim()
  };
  const cats = DB.get('vh_categories') || [];
  if (editingCatId) DB.set('vh_categories', cats.map(c => c.id === editingCatId ? { ...c, ...data } : c));
  else              DB.set('vh_categories', [...cats, { id: uid(), ...data }]);
  closeModal('modal-cat');
  toast(editingCatId ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!', 'ok');
  renderAdminCats();
  populateCatSelects();
}

function deleteCat(cid) {
  if (!confirm('Xóa danh mục này?')) return;
  DB.set('vh_categories', (DB.get('vh_categories') || []).filter(c => c.id !== cid));
  toast('Đã xóa danh mục', 'ok');
  renderAdminCats();
  populateCatSelects();
}

// ─── TV4: QUẢN LÝ ĐẶT PHÒNG ──────────────────────────
// Luồng trạng thái: pending → confirmed → checked_in → checked_out
//                                      └→ cancelled (bất kỳ lúc nào chưa checkout)

function renderAdminBookings() {
  const bookings = (DB.get('vh_bookings') || []).sort((a, b) => b.id - a.id);
  const q  = (document.getElementById('ab-search').value || '').toLowerCase();
  const st = document.getElementById('ab-filter').value;

  const filtered = bookings.filter(b => {
    const r = getRoom(b.rid);
    const u = getUser(b.uid);
    const mq = !q || (r?.name || '').toLowerCase().includes(q) ||
                     (u?.name  || '').toLowerCase().includes(q) ||
                     (u?.email || '').toLowerCase().includes(q);
    const ms = !st || b.status === st;
    return mq && ms;
  });

  document.getElementById('admin-bk-count').textContent = bookings.length + ' đặt phòng';
  document.getElementById('admin-bk-tbody').innerHTML = filtered.map(b => {
    const r = getRoom(b.rid);
    const u = getUser(b.uid);
    const actions = [];
    if (b.status === 'pending')    actions.push(`<button class="btn btn-info btn-xs"    onclick="updateBkStatus(${b.id},'confirmed')">✅ Xác nhận</button>`);
    if (b.status === 'confirmed')  actions.push(`<button class="btn btn-success btn-xs" onclick="updateBkStatus(${b.id},'checked_in')">🔑 Check-in</button>`);
    if (b.status === 'checked_in') actions.push(`<button class="btn btn-outline btn-xs" onclick="updateBkStatus(${b.id},'checked_out')">🚪 Check-out</button>`);
    if (!['checked_out', 'cancelled'].includes(b.status))
      actions.push(`<button class="btn btn-danger btn-xs" onclick="updateBkStatus(${b.id},'cancelled')">✕ Hủy</button>`);
    return `<tr>
      <td><div class="fw600 text-sm">${esc(u?.name || '—')}</div><div class="text-dim" style="font-size:11px">${esc(u?.email || '')}</div></td>
      <td class="text-sm">${esc(r?.name || '—')}</td>
      <td style="font-size:12px;color:var(--text2)">${b.ci} → ${b.co}<br><span class="text-xs">${nights(b.ci, b.co)} đêm · ${b.guests} khách</span></td>
      <td style="color:var(--gold-l);font-weight:600;font-size:13px">${fmt(b.total)}</td>
      <td>${badge(b.pay)}</td>
      <td>${badge(b.status)}</td>
      <td><div style="display:flex;gap:5px;flex-wrap:wrap">${actions.join('')}</div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text3)">Không có đặt phòng</td></tr>';
}

function updateBkStatus(bid, status) {
  const bookings = DB.get('vh_bookings') || [];
  DB.set('vh_bookings', bookings.map(b => b.id === bid ? { ...b, status } : b));
  toast(`Cập nhật: ${SL[status]}`, 'ok');
  renderAdminBookings();
}

// ─── TV2: QUẢN LÝ TÀI KHOẢN ──────────────────────────
function renderAdminUsers() {
  const users = DB.get('vh_users') || [];
  const q     = (document.getElementById('au-search').value || '').toLowerCase();
  const filtered = q ? users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : users;
  document.getElementById('admin-users-count').textContent = users.length + ' tài khoản';
  document.getElementById('admin-users-tbody').innerHTML = filtered.map(u => {
    const roleColor = u.role === 'admin' ? 'var(--gold-l)' : 'var(--info)';
    const roleBg    = u.role === 'admin' ? 'rgba(184,149,42,.15)' : 'rgba(52,152,219,.15)';
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:50%;background:${roleBg};border:1px solid ${roleColor}40;display:flex;align-items:center;justify-content:center;font-weight:700;color:${roleColor};font-size:13px;flex-shrink:0">
          ${(u.name || 'U').charAt(0).toUpperCase()}
        </div>
        <span class="fw600">${esc(u.name)}</span>
      </div></td>
      <td class="text-dim text-sm">${esc(u.email)}</td>
      <td class="text-dim text-sm">${esc(u.phone || '—')}</td>
      <td><span style="background:${roleBg};color:${roleColor};border:1px solid ${roleColor}30;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700">${u.role === 'admin' ? '👑 Admin' : '👤 Khách hàng'}</span></td>
      <td class="text-dim text-sm">${u.createdAt || '—'}</td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-xs" onclick="openUserModal(${u.id})">✏️ Sửa</button>
        <button class="btn btn-danger btn-xs"  onclick="deleteUser(${u.id})">🗑️ Xóa</button>
      </div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3)">Không có tài khoản</td></tr>';
}

function openUserModal(uid2) {
  editingUserId = uid2 || null;
  document.getElementById('user-modal-title').textContent = uid2 ? '✏️ Chỉnh sửa tài khoản' : '➕ Thêm tài khoản';
  if (uid2) {
    const u = getUser(uid2); if (!u) return;
    document.getElementById('um-name').value  = u.name  || '';
    document.getElementById('um-email').value = u.email || '';
    document.getElementById('um-phone').value = u.phone || '';
    document.getElementById('um-pwd').value   = '';
    document.getElementById('um-role').value  = u.role  || 'client';
  } else {
    ['um-name', 'um-email', 'um-phone', 'um-pwd'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('um-role').value = 'client';
  }
  openModal('modal-user');
}

function saveUser() {
  const name  = document.getElementById('um-name').value.trim();
  const email = document.getElementById('um-email').value.trim();
  const pwd   = document.getElementById('um-pwd').value;
  if (!name || !email) { toast('Vui lòng điền tên và email', 'err'); return; }
  const users = DB.get('vh_users') || [];
  if (!editingUserId && users.find(u => u.email === email)) { toast('Email đã tồn tại', 'err'); return; }
  const data = {
    name, email,
    phone: document.getElementById('um-phone').value.trim(),
    role:  document.getElementById('um-role').value
  };
  if (pwd) data.password = pwd;
  if (editingUserId) DB.set('vh_users', users.map(u => u.id === editingUserId ? { ...u, ...data } : u));
  else               DB.set('vh_users', [...users, { id: uid(), createdAt: today(), password: pwd || '123456', ...data }]);
  closeModal('modal-user');
  toast(editingUserId ? 'Cập nhật tài khoản thành công!' : 'Thêm tài khoản thành công!', 'ok');
  renderAdminUsers();
}

function deleteUser(uid2) {
  if (uid2 === currentUser.id) { toast('Không thể xóa tài khoản đang đăng nhập!', 'err'); return; }
  if (!confirm('Xóa tài khoản này?')) return;
  DB.set('vh_users', (DB.get('vh_users') || []).filter(u => u.id !== uid2));
  toast('Đã xóa tài khoản', 'ok');
  renderAdminUsers();
}
