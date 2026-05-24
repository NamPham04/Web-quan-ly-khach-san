// ╔══════════════════════════════════════════════════════╗
// ║  NGƯỜI 4 — database.js                               ║
// ║  Booking + Database + LocalStorage                   ║
// ║  Chứa: DB (localStorage) · seed data                 ║
// ║         State variables · Helper functions           ║
// ║         Status maps · Lookup helpers                 ║
// ║         openBooking · updateBkPrice · selectPay      ║
// ║         renderBkStep · bkNext · confirmBooking       ║
// ║         renderMyBookings (client history)            ║
// ║         renderAdminBookings · updateBkStatus         ║
// ╚══════════════════════════════════════════════════════╝

// ════════════════════════════════════════════════
//  DATABASE — localStorage wrapper
// ════════════════════════════════════════════════
const DB = {
  get: (k)    => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),

  seed() {
    if (this.get('vh_seeded')) return;

    // ── Tài khoản mẫu ──
    this.set('vh_users', [
      { id:1, name:'Admin Hotel',    email:'admin@hotel.com', password:'admin123', role:'admin',  phone:'0901000000', createdAt:'2024-01-01' },
      { id:2, name:'Nguyễn Văn A',   email:'user@hotel.com',  password:'user123',  role:'client', phone:'0912345678', createdAt:'2024-03-15' },
      { id:3, name:'Trần Thị B',     email:'tran@gmail.com',  password:'123456',   role:'client', phone:'0987654321', createdAt:'2024-04-20' },
    ]);

    // ── Danh mục phòng ──
    this.set('vh_categories', [
      { id:1, name:'Phòng Tiêu Chuẩn', icon:'🛏️', desc:'Phòng tiêu chuẩn đầy đủ tiện nghi cơ bản' },
      { id:2, name:'Phòng Deluxe',      icon:'✨',  desc:'Phòng cao cấp với view đẹp và tiện nghi sang trọng' },
      { id:3, name:'Phòng Suite',        icon:'👑',  desc:'Suite đẳng cấp không gian rộng rãi, dịch vụ VIP' },
      { id:4, name:'Villa Hồ Bơi',      icon:'🏊',  desc:'Biệt thự riêng tư với hồ bơi cá nhân' },
    ]);

    // ── Danh sách phòng ──
    this.set('vh_rooms', [
      { id:1, name:'Phòng Tiêu Chuẩn 101', catId:1, price:850000,  cap:2, size:25,  floor:1, status:'available',
        desc:'Phòng tiêu chuẩn ấm cúng với giường đôi, phòng tắm hiện đại và ban công nhỏ.',
        amenities:['WiFi','AC','TV','Mini Bar'],
        img:'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80' },
      { id:2, name:'Phòng Deluxe 201',       catId:2, price:1500000, cap:2, size:35,  floor:2, status:'available',
        desc:'Phòng deluxe sang trọng với view hồ bơi, giường King và bồn tắm thư giãn.',
        amenities:['WiFi','AC','TV','Mini Bar','Bathtub','Balcony'],
        img:'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80' },
      { id:3, name:'Phòng Suite 301',          catId:3, price:3200000, cap:4, size:65,  floor:3, status:'available',
        desc:'Suite đẳng cấp với phòng khách riêng biệt, bếp nhỏ và sân thượng riêng.',
        amenities:['WiFi','AC','TV','Mini Bar','Bathtub','Balcony','Kitchen','Living Room'],
        img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80' },
      { id:4, name:'Villa Hồ Bơi A',           catId:4, price:6500000, cap:6, size:120, floor:1, status:'available',
        desc:'Biệt thự đẳng cấp với hồ bơi riêng, vườn nhiệt đới và đầu bếp riêng theo yêu cầu.',
        amenities:['WiFi','AC','TV','Full Kitchen','Private Pool','Garden','Butler Service'],
        img:'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
      { id:5, name:'Phòng Tiêu Chuẩn 102',  catId:1, price:850000,  cap:2, size:25,  floor:1, status:'available',
        desc:'Phòng tiêu chuẩn thoáng mát, view vườn xanh mát.',
        amenities:['WiFi','AC','TV'],
        img:'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80' },
      { id:6, name:'Phòng Deluxe 202',         catId:2, price:1800000, cap:3, size:42,  floor:2, status:'available',
        desc:'Phòng deluxe góc với view toàn cảnh biển, giường King và sofa thư giãn.',
        amenities:['WiFi','AC','TV','Mini Bar','Ocean View','Balcony'],
        img:'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80' },
    ]);

    // ── Đặt phòng mẫu ──
    this.set('vh_bookings', [
      { id:1, uid:2, rid:2, ci:'2026-05-10', co:'2026-05-13', guests:2, total:4500000,
        status:'checked_out', pay:'paid', payMethod:'card', createdAt:'2026-05-01', note:'' },
      { id:2, uid:3, rid:1, ci:'2026-05-20', co:'2026-05-22', guests:1, total:1700000,
        status:'confirmed',   pay:'paid', payMethod:'transfer', createdAt:'2026-05-18', note:'Yêu cầu phòng tầng cao' },
    ]);

    this.set('vh_seeded', true);
  },
};

// ════════════════════════════════════════════════
//  STATE — biến dùng chung toàn app
// ════════════════════════════════════════════════
let currentUser   = null;
let editingRoomId = null;
let editingCatId  = null;
let editingUserId = null;
let bookingRoom   = null;
let bkStep        = 1;
let bkPayMethod   = 'card';
let detailRoom    = null;

// ════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════
const fmt     = n => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const today   = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
const nights  = (a, b) => Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));
const uid     = () => Date.now() + Math.floor(Math.random() * 9999);
const esc     = s  => (s || '').toString().replace(/[<>"'&]/g,
  c => ({ '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;', '&':'&amp;' }[c]));

// ── Status maps ──
const SL = {
  available:'Còn trống', occupied:'Đã đặt',       maintenance:'Bảo trì',
  pending:'Chờ xác nhận', confirmed:'Đã xác nhận', checked_in:'Đang ở',
  checked_out:'Đã trả phòng', cancelled:'Đã hủy',
  paid:'Đã thanh toán', unpaid:'Chưa TT',
};
const SC = {
  available:'ok', occupied:'err', maintenance:'warn',
  pending:'warn', confirmed:'info', checked_in:'ok',
  checked_out:'dim', cancelled:'err',
  paid:'ok', unpaid:'err',
};
const badge = (s, extra = '') =>
  `<span class="badge badge-${SC[s] || 'dim'} ${extra}">${SL[s] || s}</span>`;

// ── Lookup helpers ──
const getCat  = id => (DB.get('vh_categories') || []).find(c => c.id === id) || { name:'—', icon:'' };
const getRoom = id => (DB.get('vh_rooms')      || []).find(r => r.id === id) || null;
const getUser = id => (DB.get('vh_users')      || []).find(u => u.id === id) || null;

// ════════════════════════════════════════════════
//  BOOKING — đặt phòng phía Client
// ════════════════════════════════════════════════
function openBooking(rid) {
  const r = getRoom(rid); if (!r) return;
  bookingRoom = r; bkStep = 1; bkPayMethod = 'card';
  document.getElementById('bk-room-name').textContent  = r.name;
  document.getElementById('bk-room-price').textContent = fmt(r.price) + '/đêm';
  document.getElementById('bk-room-img').src           = r.img || '';
  document.getElementById('bk-guests').max             = r.cap;
  document.getElementById('bk-guests').value           = 1;
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

// Lắng nghe thay đổi ngày
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
    if (!ci || !co) { toast('Vui lòng chọn ngày nhận và trả phòng', 'err'); return; }
    if (co <= ci)   { toast('Ngày trả phòng phải sau ngày nhận phòng', 'err'); return; }
  }
  if (s === 3) {
    const ci    = document.getElementById('bk-ci').value;
    const co    = document.getElementById('bk-co').value;
    const n     = nights(ci, co);
    const total = bookingRoom.price * n;
    const payLbl = { card:'💳 Thẻ tín dụng', transfer:'🏦 Chuyển khoản', cash:'💵 Tiền mặt tại quầy' };
    document.getElementById('bk-confirm-detail').innerHTML = `
      ${[
        ['🛏️ Phòng', bookingRoom.name],
        ['📅 Nhận phòng', ci],
        ['📅 Trả phòng', co],
        ['🌙 Số đêm', n + ' đêm'],
        ['👥 Số khách', document.getElementById('bk-guests').value + ' người'],
        ['💳 Thanh toán', payLbl[bkPayMethod]],
      ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:14px">
          <span style="color:var(--text2)">${k}</span>
          <span style="font-weight:500">${esc(String(v))}</span>
        </div>`).join('')}
      <div style="border-top:1px solid rgba(184,149,42,.3);padding-top:12px;
           display:flex;justify-content:space-between;font-size:20px;font-weight:700">
        <span>Tổng thanh toán</span>
        <span style="color:var(--gold-l)">${fmt(total)}</span>
      </div>`;
  }
  renderBkStep(s);
}

function confirmBooking() {
  const ci = document.getElementById('bk-ci').value;
  const co = document.getElementById('bk-co').value;
  const bookings = DB.get('vh_bookings') || [];

  // Kiểm tra trùng lịch
  const conflict = bookings.find(b =>
    b.rid === bookingRoom.id &&
    !['cancelled', 'checked_out'].includes(b.status) &&
    !(co <= b.ci || ci >= b.co)
  );
  if (conflict) { toast('Phòng đã được đặt trong khoảng thời gian này!', 'err'); return; }

  const n  = nights(ci, co);
  const bk = {
    id: uid(), uid: currentUser.id, rid: bookingRoom.id,
    ci, co,
    guests:    Number(document.getElementById('bk-guests').value),
    total:     bookingRoom.price * n,
    status:    'confirmed',
    pay:       'paid',
    payMethod: bkPayMethod,
    createdAt: today(),
    note:      document.getElementById('bk-note').value,
  };
  DB.set('vh_bookings', [...bookings, bk]);
  closeModal('modal-booking');
  toast('🎉 Đặt phòng thành công! Chúc bạn kỳ nghỉ tuyệt vời', 'ok');
  if (document.getElementById('page-my-bookings').classList.contains('active'))
    renderMyBookings();
}

// ── Lịch sử đặt phòng (Client) ────────────────────────
function renderMyBookings() {
  const bookings = (DB.get('vh_bookings') || [])
    .filter(b => b.uid === currentUser.id)
    .sort((a, b) => b.id - a.id);
  const wrap = document.getElementById('my-bookings-list');

  if (!bookings.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:80px 0;color:var(--text3)">
      <div style="font-size:48px;margin-bottom:14px">📭</div>
      <p style="font-size:16px;margin-bottom:18px">Bạn chưa có đặt phòng nào</p>
      <button class="btn btn-gold" onclick="showPage('rooms')">Khám phá phòng ngay</button>
    </div>`;
    return;
  }

  wrap.innerHTML = bookings.map(b => {
    const r = getRoom(b.rid);
    return `<div class="card card-pad mb16">
      <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
        <img src="${r?.img || ''}"
          onerror="this.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200'"
          alt="" style="width:110px;height:80px;object-fit:cover;border-radius:9px;flex-shrink:0">
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

// ════════════════════════════════════════════════
//  ADMIN — Quản lý đặt phòng
//  Luồng: pending → confirmed → checked_in → checked_out
//                            └─────────────────→ cancelled
// ════════════════════════════════════════════════
function renderAdminBookings() {
  const bookings = (DB.get('vh_bookings') || []).sort((a, b) => b.id - a.id);
  const q  = (document.getElementById('ab-search').value || '').toLowerCase();
  const st = document.getElementById('ab-filter').value;

  const filtered = bookings.filter(b => {
    const r  = getRoom(b.rid);
    const u  = getUser(b.uid);
    const mq = !q
      || (r?.name  || '').toLowerCase().includes(q)
      || (u?.name  || '').toLowerCase().includes(q)
      || (u?.email || '').toLowerCase().includes(q);
    const ms = !st || b.status === st;
    return mq && ms;
  });

  document.getElementById('admin-bk-count').textContent = bookings.length + ' đặt phòng';
  document.getElementById('admin-bk-tbody').innerHTML = filtered.map(b => {
    const r = getRoom(b.rid);
    const u = getUser(b.uid);
    const actions = [];
    if (b.status === 'pending')
      actions.push(`<button class="btn btn-info btn-xs"    onclick="updateBkStatus(${b.id},'confirmed')">✅ Xác nhận</button>`);
    if (b.status === 'confirmed')
      actions.push(`<button class="btn btn-success btn-xs" onclick="updateBkStatus(${b.id},'checked_in')">🔑 Check-in</button>`);
    if (b.status === 'checked_in')
      actions.push(`<button class="btn btn-outline btn-xs" onclick="updateBkStatus(${b.id},'checked_out')">🚪 Check-out</button>`);
    if (!['checked_out', 'cancelled'].includes(b.status))
      actions.push(`<button class="btn btn-danger btn-xs"  onclick="updateBkStatus(${b.id},'cancelled')">✕ Hủy</button>`);

    return `<tr>
      <td>
        <div class="fw600 text-sm">${esc(u?.name || '—')}</div>
        <div class="text-dim" style="font-size:11px">${esc(u?.email || '')}</div>
      </td>
      <td class="text-sm">${esc(r?.name || '—')}</td>
      <td style="font-size:12px;color:var(--text2)">
        ${b.ci} → ${b.co}<br>
        <span class="text-xs">${nights(b.ci, b.co)} đêm · ${b.guests} khách</span>
      </td>
      <td style="color:var(--gold-l);font-weight:600;font-size:13px">${fmt(b.total)}</td>
      <td>${badge(b.pay)}</td>
      <td>${badge(b.status)}</td>
      <td><div style="display:flex;gap:5px;flex-wrap:wrap">${actions.join('')}</div></td>
    </tr>`;
  }).join('') ||
    '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text3)">Không có đặt phòng</td></tr>';
}

function updateBkStatus(bid, status) {
  const bookings = DB.get('vh_bookings') || [];
  DB.set('vh_bookings', bookings.map(b => b.id === bid ? { ...b, status } : b));
  toast(`Cập nhật: ${SL[status]}`, 'ok');
  renderAdminBookings();
}
