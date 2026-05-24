// ╔══════════════════════════════════════════════════════╗
// ║  NGƯỜI 3 — rooms.js                                  ║
// ║  Quản lý phòng + Danh mục (Rooms & Categories)       ║
// ║  Chứa: renderRooms · showRoomDetail · bookFromDetail  ║
// ║         populateCatSelects                            ║
// ║         renderAdminRooms · openRoomModal              ║
// ║         saveRoom · deleteRoom                         ║
// ║         renderAdminCats · openCatModal                ║
// ║         saveCat · deleteCat                           ║
// ║  Phụ thuộc: database.js (load trước)                 ║
// ╚══════════════════════════════════════════════════════╝

// ─── Cập nhật dropdown danh mục (dùng chung) ─────────
function populateCatSelects() {
  const cats = DB.get('vh_categories') || [];
  const cf   = document.getElementById('room-cat-filter');
  if (cf) {
    const v = cf.value;
    cf.innerHTML = '<option value="">Tất cả danh mục</option>' +
      cats.map(c => `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`).join('');
    cf.value = v;
  }
  const rc = document.getElementById('rm-cat');
  if (rc) rc.innerHTML = cats.map(c =>
    `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`
  ).join('');
}

// ════════════════════════════════════════════════
//  CLIENT — Danh sách phòng
// ════════════════════════════════════════════════
function renderRooms() {
  const rooms       = DB.get('vh_rooms')      || [];
  const cats        = DB.get('vh_categories') || [];
  const search      = (document.getElementById('room-search').value || '').toLowerCase();
  const catFilter   = document.getElementById('room-cat-filter').value;
  const priceFilter = document.getElementById('room-price-filter').value;

  const filtered = rooms.filter(r => {
    const ms = !search || r.name.toLowerCase().includes(search) || r.desc.toLowerCase().includes(search);
    const mc = !catFilter   || r.catId == catFilter;
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
            <img src="${esc(r.img)}" alt="${esc(r.name)}"
              onerror="this.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'">
            <div style="position:absolute;top:10px;left:10px">
              <span class="badge badge-gold">${cat.icon} ${esc(cat.name)}</span>
            </div>
            <div style="position:absolute;top:10px;right:10px">${badge(r.status)}</div>
          </div>
          <div class="room-info">
            <h3 style="font-size:16px;margin-bottom:7px">${esc(r.name)}</h3>
            <p style="color:var(--text2);font-size:12.5px;margin-bottom:12px;line-height:1.6">
              ${esc(r.desc.substring(0,100))}${r.desc.length > 100 ? '…' : ''}
            </p>
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
                ${r.status === 'available'
                  ? `<button class="btn btn-gold btn-sm" onclick="openBooking(${r.id})">Đặt ngay</button>`
                  : ''}
              </div>
            </div>
          </div>
        </div>`;
      }).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--text3)">
         <div style="font-size:48px;margin-bottom:14px">🔍</div>
         <p style="font-size:16px">Không tìm thấy phòng phù hợp</p>
       </div>`;
}

// ─── Chi tiết phòng (modal) ───────────────────────────
function showRoomDetail(rid) {
  const r = getRoom(rid);
  if (!r) return;
  detailRoom = r;
  const cat = getCat(r.catId);
  document.getElementById('rd-name').textContent     = r.name;
  document.getElementById('rd-img').src              = r.img || '';
  document.getElementById('rd-cat').innerHTML        = `${cat.icon} ${esc(cat.name)}`;
  document.getElementById('rd-price').textContent    = fmt(r.price);
  document.getElementById('rd-cap').textContent      = r.cap  + ' người';
  document.getElementById('rd-size').textContent     = r.size + ' m²';
  document.getElementById('rd-floor').textContent    = 'Tầng ' + r.floor;
  document.getElementById('rd-status').innerHTML     = badge(r.status);
  document.getElementById('rd-desc').textContent     = r.desc;
  document.getElementById('rd-amenities').innerHTML  =
    (r.amenities || []).map(a => `<span class="chip">✓ ${esc(a)}</span>`).join('');
  document.getElementById('rd-book-btn').style.display = r.status === 'available' ? '' : 'none';
  openModal('modal-room-detail');
}

function bookFromDetail() {
  closeModal('modal-room-detail');
  if (detailRoom) openBooking(detailRoom.id);
}

// ════════════════════════════════════════════════
//  ADMIN — Quản lý phòng
// ════════════════════════════════════════════════
function renderAdminRooms() {
  const rooms    = DB.get('vh_rooms') || [];
  const q        = (document.getElementById('ar-search').value || '').toLowerCase();
  const filtered = q ? rooms.filter(r => r.name.toLowerCase().includes(q)) : rooms;

  document.getElementById('admin-rooms-count').textContent = rooms.length + ' phòng';
  document.getElementById('admin-rooms-tbody').innerHTML = filtered.map(r => {
    const cat = getCat(r.catId);
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${esc(r.img)}"
            onerror="this.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=80'"
            alt="" style="width:50px;height:38px;object-fit:cover;border-radius:6px;flex-shrink:0">
          <span class="fw600">${esc(r.name)}</span>
        </div>
      </td>
      <td class="text-dim">${cat.icon} ${esc(cat.name)}</td>
      <td style="color:var(--gold-l);font-weight:600">${fmt(r.price)}</td>
      <td>${r.cap} người</td>
      <td>${badge(r.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-xs" onclick="showRoomDetail(${r.id})">👁</button>
          <button class="btn btn-outline btn-xs" onclick="openRoomModal(${r.id})">✏️ Sửa</button>
          <button class="btn btn-danger btn-xs"  onclick="deleteRoom(${r.id})">🗑️ Xóa</button>
        </div>
      </td>
    </tr>`;
  }).join('') ||
    '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3)">Không có phòng</td></tr>';
}

function openRoomModal(rid) {
  editingRoomId = rid || null;
  document.getElementById('room-modal-title').textContent =
    rid ? '✏️ Chỉnh sửa phòng' : '➕ Thêm phòng mới';
  populateCatSelects();

  if (rid) {
    const r = getRoom(rid);
    if (!r) return;
    document.getElementById('rm-name').value      = r.name;
    document.getElementById('rm-cat').value       = r.catId;
    document.getElementById('rm-price').value     = r.price;
    document.getElementById('rm-cap').value       = r.cap;
    document.getElementById('rm-size').value      = r.size;
    document.getElementById('rm-floor').value     = r.floor;
    document.getElementById('rm-status').value    = r.status;
    document.getElementById('rm-amenities').value = (r.amenities || []).join(', ');
    document.getElementById('rm-img').value       = r.img  || '';
    document.getElementById('rm-desc').value      = r.desc || '';
  } else {
    ['rm-name', 'rm-price', 'rm-amenities', 'rm-img', 'rm-desc']
      .forEach(id => document.getElementById(id).value = '');
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
    amenities: document.getElementById('rm-amenities').value
               .split(',').map(s => s.trim()).filter(Boolean),
    img:  document.getElementById('rm-img').value.trim(),
    desc: document.getElementById('rm-desc').value.trim(),
  };

  const rooms = DB.get('vh_rooms') || [];
  if (editingRoomId) {
    DB.set('vh_rooms', rooms.map(r => r.id === editingRoomId ? { ...r, ...data } : r));
  } else {
    DB.set('vh_rooms', [...rooms, { id: uid(), ...data }]);
  }
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

// ════════════════════════════════════════════════
//  ADMIN — Quản lý danh mục
// ════════════════════════════════════════════════
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
  }).join('') ||
    '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3)">Chưa có danh mục nào</div>';
}

function openCatModal(cid) {
  editingCatId = cid || null;
  document.getElementById('cat-modal-title').textContent =
    cid ? '✏️ Chỉnh sửa danh mục' : '➕ Thêm danh mục';

  if (cid) {
    const c = (DB.get('vh_categories') || []).find(x => x.id === cid);
    if (!c) return;
    document.getElementById('ct-icon').value = c.icon || '';
    document.getElementById('ct-name').value = c.name || '';
    document.getElementById('ct-desc').value = c.desc || '';
  } else {
    ['ct-icon', 'ct-name', 'ct-desc']
      .forEach(id => document.getElementById(id).value = '');
  }
  openModal('modal-cat');
}

function saveCat() {
  const name = document.getElementById('ct-name').value.trim();
  if (!name) { toast('Vui lòng nhập tên danh mục', 'err'); return; }

  const data = {
    name,
    icon: document.getElementById('ct-icon').value.trim(),
    desc: document.getElementById('ct-desc').value.trim(),
  };
  const cats = DB.get('vh_categories') || [];
  if (editingCatId) {
    DB.set('vh_categories', cats.map(c => c.id === editingCatId ? { ...c, ...data } : c));
  } else {
    DB.set('vh_categories', [...cats, { id: uid(), ...data }]);
  }
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
