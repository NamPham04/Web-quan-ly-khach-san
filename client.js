// ════════════════════════════════════════════════════════
//  client.js  —  TV1: Auth · Navigation · Client Pages · Booking
//  Phụ thuộc: db.js (load trước)
// ════════════════════════════════════════════════════════

// ─── AUTH ────────────────────────────────────────────
function switchTab(t) {
  document.getElementById('form-login').classList.toggle('hidden', t !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', t !== 'register');
  document.getElementById('tab-login-btn').classList.toggle('active', t === 'login');
  document.getElementById('tab-reg-btn').classList.toggle('active', t === 'register');
  document.getElementById('li-err').classList.add('hidden');
  document.getElementById('rg-err').classList.add('hidden');
}

function doLogin() {
  const email  = document.getElementById('li-email').value.trim();
  const pwd    = document.getElementById('li-pwd').value;
  const users  = DB.get('vh_users') || [];
  const u      = users.find(x => x.email === email && x.password === pwd);
  const errEl  = document.getElementById('li-err');
  if (!u) {
    errEl.textContent = 'Email hoặc mật khẩu không đúng';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  currentUser = u;
  DB.set('vh_currentUser', u);
  enterApp();
}

function doRegister() {
  const name  = document.getElementById('rg-name').value.trim();
  const email = document.getElementById('rg-email').value.trim();
  const phone = document.getElementById('rg-phone').value.trim();
  const pwd   = document.getElementById('rg-pwd').value;
  const errEl = document.getElementById('rg-err');
  if (!name || !email || !pwd) { errEl.textContent = 'Vui lòng điền đầy đủ thông tin'; errEl.classList.remove('hidden'); return; }
  if (pwd.length < 6)          { errEl.textContent = 'Mật khẩu ít nhất 6 ký tự';       errEl.classList.remove('hidden'); return; }
  const users = DB.get('vh_users') || [];
  if (users.find(u => u.email === email)) { errEl.textContent = 'Email đã tồn tại'; errEl.classList.remove('hidden'); return; }
  const newU = { id: uid(), name, email, phone, password: pwd, role: 'client', createdAt: today() };
  DB.set('vh_users', [...users, newU]);
  currentUser = newU;
  DB.set('vh_currentUser', newU);
  errEl.classList.add('hidden');
  enterApp();
}

function doLogout() {
  currentUser = null;
  DB.set('vh_currentUser', null);
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-page').style.display = 'flex';
  document.getElementById('li-email').value = '';
  document.getElementById('li-pwd').value   = '';
}

function enterApp() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('app').style.display = 'flex';
  document.getElementById('ui-name').textContent = currentUser.name;
  document.getElementById('ui-role').textContent = currentUser.role === 'admin' ? '👑 Quản trị viên' : '👤 Khách hàng';
  document.getElementById('nav-client').classList.toggle('hidden', currentUser.role === 'admin');
  document.getElementById('nav-admin').classList.toggle('hidden',  currentUser.role !== 'admin');
  populateCatSelects();
  if (currentUser.role === 'admin') showPage('dashboard');
  else showPage('rooms');
}

// ─── NAVIGATION ──────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') === `showPage('${name}')` ||
        n.onclick?.toString().includes(`'${name}'`)) {
      n.classList.add('active');
    }
  });
  const fns = {
    'rooms':           renderRooms,
    'my-bookings':     renderMyBookings,
    'profile':         renderProfile,
    'dashboard':       renderDashboard,
    'admin-rooms':     renderAdminRooms,
    'admin-cats':      renderAdminCats,
    'admin-bookings':  renderAdminBookings,
    'admin-users':     renderAdminUsers,
  };
  if (fns[name]) fns[name]();
}

// ─── CATEGORY SELECT (dùng chung cho TV1 & TV2) ──────
function populateCatSelects() {
  const cats = DB.get('vh_categories') || [];
  const cf = document.getElementById('room-cat-filter');
  if (cf) {
    const v = cf.value;
    cf.innerHTML = '<option value="">Tất cả danh mục</option>' +
      cats.map(c => `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`).join('');
    cf.value = v;
  }
  const rc = document.getElementById('rm-cat');
  if (rc) rc.innerHTML = cats.map(c => `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`).join('');
}

// ─── CLIENT: DANH SÁCH PHÒNG ─────────────────────────
function renderRooms() {
  const rooms      = DB.get('vh_rooms')      || [];
  const cats       = DB.get('vh_categories') || [];
  const search     = (document.getElementById('room-search').value      || '').toLowerCase();
  const catFilter  = document.getElementById('room-cat-filter').value;
  const priceFilter = document.getElementById('room-price-filter').value;

  const filtered = rooms.filter(r => {
    const ms = !search || r.name.toLowerCase().includes(search) || r.desc.toLowerCase().includes(search);
    const mc = !catFilter || r.catId == catFilter;
    const mp = !priceFilter
      || (priceFilter === 'low'  && r.price < 1500000)
      || (priceFilter === 'mid'  && r.price >= 1500000 && r.price < 4000000)
      || (priceFilter === 'high' && r.price >= 4000000);
    return ms && mc && mp;
  });

  document.getElementById('rooms-count').textContent = `${filtered.length} phòng tìm thấy`;
  document.getElementById('rooms-grid').innerHTML = filtered.length
    ? filtered.map(r => {
        const cat = cats.find(c => c.id === r.catId) || { name: '—', icon: '' };
        return `
        <div class="room-card">
          <div class="room-img">
            <img src="${esc(r.img)}" alt="${esc(r.name)}" onerror="this.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'">
            <div style="position:absolute;top:10px;left:10px"><span class="badge badge-gold">${cat.icon} ${esc(cat.name)}</span></div>
            <div style="position:absolute;top:10px;right:10px">${badge(r.status)}</div>
          </div>
          <div class="room-info">
            <h3 style="font-size:16px;margin-bottom:7px">${esc(r.name)}</h3>
            <p style="color:var(--text2);font-size:12.5px;margin-bottom:12px;line-height:1.6">${esc(r.desc.substring(0, 100))}${r.desc.length > 100 ? '…' : ''}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
              <span class="chip">👥 ${r.cap}</span>
              <span class="chip">📐 ${r.size}m²</span>
              <span class="chip">🏢 Tầng ${r.floor}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <div>
                <span style="color:var(--gold-l);font-size:19px;font-weight:700">${fmt(r.price)}</span>
                <span style="color:var(--text3);font-size:12px">/đêm</span>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-outline btn-sm" onclick="showRoomDetail(${r.id})">👁 Chi tiết</button>
                ${r.status === 'available' ? `<button class="btn btn-gold btn-sm" onclick="openBooking(${r.id})">Đặt ngay</button>` : ''}
              </div>
            </div>
          </div>
        </div>`;
      }).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--text3)"><div style="font-size:48px;margin-bottom:14px">🔍</div><p style="font-size:16px">Không tìm thấy phòng phù hợp</p></div>`;
}

// ─── CLIENT: CHI TIẾT PHÒNG ──────────────────────────
function showRoomDetail(rid) {
  const r = getRoom(rid);
  if (!r) return;
  detailRoom = r;
  const cat = getCat(r.catId);
  document.getElementById('rd-name').textContent      = r.name;
  document.getElementById('rd-img').src               = r.img || '';
  document.getElementById('rd-cat').innerHTML         = `${cat.icon} ${esc(cat.name)}`;
  document.getElementById('rd-price').textContent     = fmt(r.price);
  document.getElementById('rd-cap').textContent       = r.cap + ' người';
  document.getElementById('rd-size').textContent      = r.size + ' m²';
  document.getElementById('rd-floor').textContent     = 'Tầng ' + r.floor;
  document.getElementById('rd-status').innerHTML      = badge(r.status);
  document.getElementById('rd-desc').textContent      = r.desc;
  document.getElementById('rd-amenities').innerHTML   = (r.amenities || []).map(a => `<span class="chip">✓ ${esc(a)}</span>`).join('');
  document.getElementById('rd-book-btn').style.display = r.status === 'available' ? '' : 'none';
  openModal('modal-room-detail');
}

function bookFromDetail() {
  closeModal('modal-room-detail');
  if (detailRoom) openBooking(detailRoom.id);
}

// ─── CLIENT: ĐẶT PHÒNG ───────────────────────────────
function openBooking(rid) {
  const r = getRoom(rid);
  if (!r) return;
  bookingRoom = r; bkStep = 1; bkPayMethod = 'card';
  document.getElementById('bk-room-name').textContent = r.name;
  document.getElementById('bk-room-price').textContent = fmt(r.price) + '/đêm';
  document.getElementById('bk-room-img').src  = r.img || '';
  document.getElementById('bk-guests').max    = r.cap;
  document.getElementById('bk-guests').value  = 1;
  const ci = today(), co = addDays(ci, 1);
  document.getElementById('bk-ci').value = ci;
  document.getElementById('bk-ci').min   = ci;
  document.getElementById('bk-co').value = co;
  document.getElementById('bk-co').min   = co;
  document.getElementById('bk-note').value = '';
  updateBkPrice();
  document.getElementById('bk-modal-title').textContent = '📅 Đặt phòng – ' + r.name;
  selectPay('card');
  renderBkStep(1);
  openModal('modal-booking');
}

function updateBkPrice() {
  if (!bookingRoom) return;
  const ci = document.getElementById('bk-ci').value;
  const co = document.getElementById('bk-co').value;
  if (!ci || !co) return;
  const n     = nights(ci, co);
  const total = bookingRoom.price * n;
  document.getElementById('bk-price-formula').textContent = `${fmt(bookingRoom.price)} × ${n} đêm`;
  document.getElementById('bk-subtotal').textContent      = fmt(total);
  document.getElementById('bk-total').textContent         = fmt(total);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bk-ci').addEventListener('change', function () {
    const co = document.getElementById('bk-co');
    if (this.value >= co.value) co.value = addDays(this.value, 1);
    co.min = addDays(this.value, 1);
    updateBkPrice();
  });
  document.getElementById('bk-co').addEventListener('change', updateBkPrice);
});

function selectPay(m) {
  bkPayMethod = m;
  ['card', 'transfer', 'cash'].forEach(k => {
    document.getElementById('pay-' + k).classList.toggle('sel', k === m);
  });
}

function renderBkStep(s) {
  bkStep = s;
  [1, 2, 3].forEach(i => {
    document.getElementById('bk-step' + i).classList.toggle('hidden', i !== s);
    const st = document.getElementById('st' + i);
    st.className = 'step' + (i < s ? ' done' : i === s ? ' active' : '');
  });
  [1, 2].forEach(i => document.getElementById('sl' + i).classList.toggle('done', s > i));
}

function bkNext(s) {
  if (s === 2) {
    const ci = document.getElementById('bk-ci').value;
    const co = document.getElementById('bk-co').value;
    if (!ci || !co)     { toast('Vui lòng chọn ngày nhận và trả phòng', 'err'); return; }
    if (co <= ci)       { toast('Ngày trả phòng phải sau ngày nhận phòng', 'err'); return; }
  }
  if (s === 3) {
    const ci = document.getElementById('bk-ci').value;
    const co = document.getElementById('bk-co').value;
    const n  = nights(ci, co);
    const total = bookingRoom.price * n;
    const payLbl = { card: '💳 Thẻ tín dụng', transfer: '🏦 Chuyển khoản', cash: '💵 Tiền mặt tại quầy' };
    document.getElementById('bk-confirm-detail').innerHTML = `
      ${[['🛏️ Phòng', bookingRoom.name], ['📅 Nhận phòng', ci], ['📅 Trả phòng', co],
         ['🌙 Số đêm', n + ' đêm'], ['👥 Số khách', document.getElementById('bk-guests').value + ' người'],
         ['💳 Thanh toán', payLbl[bkPayMethod]]
        ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:14px">
          <span style="color:var(--text2)">${k}</span><span style="font-weight:500">${esc(String(v))}</span>
        </div>`).join('')}
      <div style="border-top:1px solid rgba(184,149,42,.3);padding-top:12px;display:flex;justify-content:space-between;font-size:20px;font-weight:700">
        <span>Tổng thanh toán</span><span style="color:var(--gold-l)">${fmt(total)}</span>
      </div>`;
  }
  renderBkStep(s);
}

function confirmBooking() {
  const ci = document.getElementById('bk-ci').value;
  const co = document.getElementById('bk-co').value;
  const bookings = DB.get('vh_bookings') || [];
  const conflict = bookings.find(b =>
    b.rid === bookingRoom.id &&
    !['cancelled', 'checked_out'].includes(b.status) &&
    !(co <= b.ci || ci >= b.co)
  );
  if (conflict) { toast('Phòng đã được đặt trong khoảng thời gian này!', 'err'); return; }
  const n  = nights(ci, co);
  const bk = {
    id: uid(), uid: currentUser.id, rid: bookingRoom.id,
    ci, co, guests: Number(document.getElementById('bk-guests').value),
    total: bookingRoom.price * n, status: 'confirmed', pay: 'paid',
    payMethod: bkPayMethod, createdAt: today(),
    note: document.getElementById('bk-note').value
  };
  DB.set('vh_bookings', [...bookings, bk]);
  closeModal('modal-booking');
  toast('🎉 Đặt phòng thành công! Chúc bạn kỳ nghỉ tuyệt vời', 'ok');
  if (document.getElementById('page-my-bookings').classList.contains('active')) renderMyBookings();
}

// ─── CLIENT: LỊCH SỬ ĐẶT PHÒNG ──────────────────────
function renderMyBookings() {
  const bookings = (DB.get('vh_bookings') || [])
    .filter(b => b.uid === currentUser.id)
    .sort((a, b) => b.id - a.id);
  const wrap = document.getElementById('my-bookings-list');
  if (!bookings.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:80px 0;color:var(--text3)">
      <div style="font-size:48px;margin-bottom:14px">📭</div>
      <p style="font-size:16px;margin-bottom:18px">Bạn chưa có đặt phòng nào</p>
      <button class="btn btn-gold" onclick="showPage('rooms')">Khám phá phòng ngay</button></div>`;
    return;
  }
  wrap.innerHTML = bookings.map(b => {
    const r = getRoom(b.rid);
    return `<div class="card card-pad mb16">
      <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
        <img src="${r?.img || ''}" onerror="this.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200'" alt="" style="width:110px;height:80px;object-fit:cover;border-radius:9px;flex-shrink:0">
        <div style="flex:1;min-width:180px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <div>
              <div class="fw600 mb4">${esc(r?.name || 'Phòng')}</div>
              <div class="text-dim text-sm">Đặt ngày: ${b.createdAt}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${badge(b.status)} ${badge(b.pay)}</div>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--text2)">
            <span>📅 ${b.ci} → ${b.co}</span>
            <span>👥 ${b.guests} khách</span>
            <span style="color:var(--gold-l);font-weight:700">${fmt(b.total)}</span>
          </div>
          ${b.note ? `<div style="margin-top:8px;font-size:12px;color:var(--text3)">💬 ${esc(b.note)}</div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ─── CLIENT: HỒ SƠ CÁ NHÂN ───────────────────────────
function renderProfile() {
  document.getElementById('pf-name').value  = currentUser.name  || '';
  document.getElementById('pf-email').value = currentUser.email || '';
  document.getElementById('pf-phone').value = currentUser.phone || '';
  document.getElementById('pf-pwd').value   = '';
  document.getElementById('profile-avatar').textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
}

function saveProfile() {
  const name  = document.getElementById('pf-name').value.trim();
  const phone = document.getElementById('pf-phone').value.trim();
  const pwd   = document.getElementById('pf-pwd').value;
  if (!name) { toast('Vui lòng nhập họ tên', 'err'); return; }
  const users   = DB.get('vh_users') || [];
  const updated = users.map(u => {
    if (u.id !== currentUser.id) return u;
    return { ...u, name, phone, ...(pwd ? { password: pwd } : {}) };
  });
  DB.set('vh_users', updated);
  currentUser = { ...currentUser, name, phone, ...(pwd ? { password: pwd } : {}) };
  DB.set('vh_currentUser', currentUser);
  document.getElementById('ui-name').textContent = name;
  document.getElementById('profile-avatar').textContent = name.charAt(0).toUpperCase();
  toast('Cập nhật thành công!', 'ok');
}

// ─── INIT ────────────────────────────────────────────
DB.seed();
const _saved = DB.get('vh_currentUser');
if (_saved && _saved.id) {
  currentUser = _saved;
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').style.display        = 'flex';
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('ui-name').textContent = currentUser.name;
  document.getElementById('ui-role').textContent = currentUser.role === 'admin' ? '👑 Quản trị viên' : '👤 Khách hàng';
  document.getElementById('nav-client').classList.toggle('hidden', currentUser.role === 'admin');
  document.getElementById('nav-admin').classList.toggle('hidden',  currentUser.role !== 'admin');
  populateCatSelects();
  if (currentUser.role === 'admin') showPage('dashboard');
  else showPage('rooms');
}
