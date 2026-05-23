// ════════════════════════════════════════════════════════
//  db.js  —  TV3: Database · Seed Data · Helpers · State
//  Tất cả các file khác phụ thuộc vào file này.
//  Load TRƯỚC client.js và admin.js.
// ════════════════════════════════════════════════════════

// ─── DATABASE (localStorage wrapper) ─────────────────
const DB = {
  get: (k) => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),

  seed() {
    if (this.get('vh_seeded')) return;

    // Tài khoản mẫu
    this.set('vh_users', [
      { id: 1, name: 'Admin Hotel',   email: 'admin@hotel.com', password: 'admin123', role: 'admin',  phone: '0901000000', createdAt: '2024-01-01' },
      { id: 2, name: 'Nguyễn Văn A', email: 'user@hotel.com',  password: 'user123',  role: 'client', phone: '0912345678', createdAt: '2024-03-15' },
      { id: 3, name: 'Trần Thị B',   email: 'tran@gmail.com',  password: '123456',   role: 'client', phone: '0987654321', createdAt: '2024-04-20' },
    ]);

    // Danh mục phòng
    this.set('vh_categories', [
      { id: 1, name: 'Phòng Tiêu Chuẩn', icon: '🛏️', desc: 'Phòng tiêu chuẩn đầy đủ tiện nghi cơ bản' },
      { id: 2, name: 'Phòng Deluxe',      icon: '✨',  desc: 'Phòng cao cấp với view đẹp và tiện nghi sang trọng' },
      { id: 3, name: 'Phòng Suite',        icon: '👑',  desc: 'Suite đẳng cấp không gian rộng rãi, dịch vụ VIP' },
      { id: 4, name: 'Villa Hồ Bơi',      icon: '🏊',  desc: 'Biệt thự riêng tư với hồ bơi cá nhân' },
    ]);

    // Danh sách phòng
    this.set('vh_rooms', [
      { id: 1, name: 'Phòng Tiêu Chuẩn 101', catId: 1, price: 850000,  cap: 2, size: 25,  floor: 1, status: 'available',
        desc: 'Phòng tiêu chuẩn ấm cúng với giường đôi, phòng tắm hiện đại và ban công nhỏ.',
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
        img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80' },
      { id: 2, name: 'Phòng Deluxe 201',       catId: 2, price: 1500000, cap: 2, size: 35,  floor: 2, status: 'available',
        desc: 'Phòng deluxe sang trọng với view hồ bơi, giường King và bồn tắm thư giãn.',
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Bathtub', 'Balcony'],
        img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80' },
      { id: 3, name: 'Phòng Suite 301',          catId: 3, price: 3200000, cap: 4, size: 65,  floor: 3, status: 'available',
        desc: 'Suite đẳng cấp với phòng khách riêng biệt, bếp nhỏ và sân thượng riêng.',
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Bathtub', 'Balcony', 'Kitchen', 'Living Room'],
        img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80' },
      { id: 4, name: 'Villa Hồ Bơi A',           catId: 4, price: 6500000, cap: 6, size: 120, floor: 1, status: 'available',
        desc: 'Biệt thự đẳng cấp với hồ bơi riêng, vườn nhiệt đới và đầu bếp riêng theo yêu cầu.',
        amenities: ['WiFi', 'AC', 'TV', 'Full Kitchen', 'Private Pool', 'Garden', 'Butler Service'],
        img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80' },
      { id: 5, name: 'Phòng Tiêu Chuẩn 102',  catId: 1, price: 850000,  cap: 2, size: 25,  floor: 1, status: 'available',
        desc: 'Phòng tiêu chuẩn thoáng mát, view vườn xanh mát.',
        amenities: ['WiFi', 'AC', 'TV'],
        img: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80' },
      { id: 6, name: 'Phòng Deluxe 202',         catId: 2, price: 1800000, cap: 3, size: 42,  floor: 2, status: 'available',
        desc: 'Phòng deluxe góc với view toàn cảnh biển, giường King và sofa thư giãn.',
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Ocean View', 'Balcony'],
        img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80' },
    ]);

    // Đặt phòng mẫu
    this.set('vh_bookings', [
      { id: 1, uid: 2, rid: 2, ci: '2026-05-10', co: '2026-05-13', guests: 2, total: 4500000,
        status: 'checked_out', pay: 'paid', payMethod: 'card', createdAt: '2026-05-01', note: '' },
      { id: 2, uid: 3, rid: 1, ci: '2026-05-20', co: '2026-05-22', guests: 1, total: 1700000,
        status: 'confirmed',   pay: 'paid', payMethod: 'transfer', createdAt: '2026-05-18', note: 'Yêu cầu phòng tầng cao' },
    ]);

    this.set('vh_seeded', true);
  }
};

// ─── STATE (biến dùng chung toàn app) ────────────────
let currentUser    = null;
let editingRoomId  = null;
let editingCatId   = null;
let editingUserId  = null;
let bookingRoom    = null;
let bkStep         = 1;
let bkPayMethod    = 'card';
let detailRoom     = null;

// ─── HELPERS ─────────────────────────────────────────
const fmt     = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const today   = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
const nights  = (a, b) => Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));
const uid     = () => Date.now() + Math.floor(Math.random() * 9999);
const esc     = (s) => (s || '').toString().replace(/[<>"'&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c]));

// ─── STATUS MAPS ─────────────────────────────────────
const SL = {
  available: 'Còn trống',  occupied: 'Đã đặt',       maintenance: 'Bảo trì',
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', checked_in: 'Đang ở',
  checked_out: 'Đã trả phòng', cancelled: 'Đã hủy',
  paid: 'Đã thanh toán',   unpaid: 'Chưa TT'
};
const SC = {
  available: 'ok',  occupied: 'err',    maintenance: 'warn',
  pending: 'warn',  confirmed: 'info',  checked_in: 'ok',
  checked_out: 'dim', cancelled: 'err',
  paid: 'ok',       unpaid: 'err'
};

const badge = (s, extra = '') =>
  `<span class="badge badge-${SC[s] || 'dim'} ${extra}">${SL[s] || s}</span>`;

// ─── TOAST ───────────────────────────────────────────
function toast(msg, type = 'ok') {
  const w  = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span style="flex:1">${msg}</span><span onclick="this.parentElement.remove()" style="cursor:pointer;opacity:.7;font-size:18px;line-height:1">×</span>`;
  w.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ─── MODAL ───────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('show');    }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ─── LOOKUP HELPERS ──────────────────────────────────
function getCat(id)  { return (DB.get('vh_categories') || []).find(c => c.id === id) || { name: '—', icon: '' }; }
function getRoom(id) { return (DB.get('vh_rooms')      || []).find(r => r.id === id) || null; }
function getUser(id) { return (DB.get('vh_users')      || []).find(u => u.id === id) || null; }
