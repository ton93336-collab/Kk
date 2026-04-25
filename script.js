// ================= 1. TOAST NOTIFICATION =================
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast-notify');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('hidden');
    void toast.offsetWidth; 
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ================= 2. IMAGE COMPRESSION SYSTEM (ใหม่! บีบอัดรูปก่อนเซฟ) =================
// ฟังก์ชันนี้จะทำหน้าที่ย่อรูปใหญ่ๆ ให้ขนาดไม่เกิน 800px เพื่อไม่ให้ LocalStorage เต็ม
function compressImage(file, callback) {
    showToast('กำลังบีบอัดรูปภาพ... ⏳'); // แจ้งเตือนผู้ใช้ว่ากำลังประมวลผล
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800; // ขนาดความกว้าง/ยาวสูงสุด
            let width = img.width;
            let height = img.height;

            // คำนวณอัตราส่วนการย่อ
            if (width > height) {
                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // แปลงกลับเป็น Base64 แบบ JPEG คุณภาพ 70% (ไฟล์เล็กแต่ยังชัด)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedBase64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ================= 3. NAVIGATION =================
function switchPage(targetId) {
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        void target.offsetWidth; 
        target.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= 4. DATABASE =================
let db = {};
const defaultDB = {
    web: [ { title: 'เว็บลิงก์ร้าน 69.-', link: 'https://example.com', img: 'https://placehold.co/400x250/ffeef2/f092a5?text=Web+Design' } ],
    id: [ { title: 'ป้ายลายอนิเมะ', img: 'https://placehold.co/400x400/ffeef2/f092a5?text=ID+Banner' } ],
    decor: [], rov: [], idv: [], forms: [], course: []
};

function initApplication() {
    const savedData = localStorage.getItem('eoy_bento_v7');
    if (savedData) { db = JSON.parse(savedData); } 
    else { db = defaultDB; saveDB(); }
    
    Object.keys(db).forEach(cat => renderGallery(cat));
    renderHomeRecentWorks(); // โหลดหน้าหลัก
    loadStaticData();
}

function saveDB() { localStorage.setItem('eoy_bento_v7', JSON.stringify(db)); }

// ================= 5. RENDER GALLERY =================
function renderGallery(cat) {
    const container = document.getElementById(`gal-${cat}`);
    if (!container) return;
    container.innerHTML = ''; 

    if (db[cat].length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#9e8e92; font-size:13px;">ยังไม่มีผลงานในหมวดนี้ 🌸</p>`;
        return;
    }

    [...db[cat]].reverse().forEach((item, rawIdx) => {
        const idx = db[cat].length - 1 - rawIdx;
        const card = document.createElement('div');
        card.className = 'work-item';

        const isZoom = cat === 'id';
        const actionClick = isZoom ? `onclick="openZoomView('${item.img}')"` : `onclick="window.open('${item.link || '#'}', '_blank')"`;
        const zClass = isZoom ? 'zoomable' : '';
        
        const btnDel = `<button class="admin-ui btn-del-gal" onclick="deleteRecord('${cat}', ${idx})"><i class="fa-solid fa-xmark"></i></button>`;
        const btnEditImg = `<button class="admin-ui btn-edit-gal" onclick="event.stopPropagation(); initGalleryUpload('${cat}', ${idx})"><i class="fa-solid fa-camera"></i></button>`;

        let html = `
            ${btnDel}
            <div class="img-frame ${zClass}" ${actionClick}>
                <img src="${item.img}" alt="Work Image">
                ${btnEditImg}
            </div>
            <h4 class="edit-text work-title" id="txt-${cat}-${idx}">${item.title}</h4>
        `;

        if (!isZoom) {
            html += `<button class="btn-action-sm" onclick="window.open('${item.link || '#'}', '_blank')">เข้าดูเว็บไซต์</button>`;
        }

        card.innerHTML = html;
        container.appendChild(card);
    });

    if (document.body.classList.contains('admin-mode')) bindContentEditable();
}

// เรนเดอร์กล่องผลงานล่าสุดหน้าแรก
function renderHomeRecentWorks() {
    const slider = document.getElementById('home-recent-works');
    slider.innerHTML = '';
    let allWorks = [];
    Object.keys(db).forEach(cat => {
        db[cat].forEach(item => { allWorks.push(item); });
    });
    
    // ดึง 5 ผลงานล่าสุด
    const recent = allWorks.reverse().slice(0, 5);
    
    if (recent.length === 0) {
        slider.innerHTML = '<p style="font-size:12px; color:#aaa; padding:10px;">ยังไม่มีผลงานอัปเดตค่ะ</p>';
        return;
    }

    recent.forEach(item => {
        const card = document.createElement('div');
        card.className = 'recent-card';
        card.innerHTML = `
            <img src="${item.img}" alt="${item.title}">
            <h4>${item.title}</h4>
        `;
        slider.appendChild(card);
    });
}

// ================= 6. ADD & DELETE (ใช้ระบบบีบอัด) =================
let activeCategory = '';
let tempImgBase64 = '';

function openAddDataModal(cat) {
    activeCategory = cat;
    tempImgBase64 = '';
    document.getElementById('inp-work-title').value = '';
    document.getElementById('inp-work-link').value = '';
    document.getElementById('preview-new-img').src = 'https://placehold.co/400x300/fff0f5/ffb6c1?text=Click+to+Upload';
    document.getElementById('inp-work-link').style.display = (cat === 'id') ? 'none' : 'block';
    document.getElementById('modal-add').classList.remove('hidden');
}

// อัปโหลดตอนเพิ่มผลงาน (ผ่าน Canvas Compression)
function previewAndCompressImage(e) {
    const file = e.target.files[0];
    if(file){
        compressImage(file, function(compressedBase64) {
            tempImgBase64 = compressedBase64;
            document.getElementById('preview-new-img').src = tempImgBase64;
            showToast('บีบอัดรูปเสร็จสิ้น เตรียมพร้อมเซฟ! ✅');
        });
    }
}

function saveNewRecord() {
    const title = document.getElementById('inp-work-title').value;
    const link = document.getElementById('inp-work-link').value;

    if (!title || !tempImgBase64) {
        showToast('กรุณาใส่ชื่อและรูปภาพให้ครบค่ะ'); return;
    }

    try {
        db[activeCategory].push({ title: title, link: link, img: tempImgBase64 });
        saveDB();
        renderGallery(activeCategory);
        renderHomeRecentWorks(); // อัปเดตหน้าแรก
        closeModal('modal-add');
        showToast('เพิ่มผลงานสำเร็จ! 🎀');
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการเซฟพื้นที่จัดเก็บ');
    }
}

function deleteRecord(cat, idx) {
    if (confirm('ยืนยันลบผลงานชิ้นนี้ใช่ไหมคะ? 🗑️')) {
        db[cat].splice(idx, 1);
        saveDB();
        renderGallery(cat);
        renderHomeRecentWorks();
        showToast('ลบผลงานเรียบร้อย');
    }
}

// ================= 7. GLOBAL IMAGE UPLOADER (ผ่าน Canvas Compression) =================
let uploadTargetInfo = {};

function openUploader(targetId) {
    uploadTargetInfo = { type: 'static', id: targetId };
    document.getElementById('global-file-uploader').click();
}

function initGalleryUpload(cat, idx) {
    uploadTargetInfo = { type: 'gallery', cat: cat, idx: idx };
    document.getElementById('global-file-uploader').click();
}

function processGlobalFileAndCompress(e) {
    const file = e.target.files[0];
    if(file) {
        compressImage(file, function(compressedBase64) {
            if (uploadTargetInfo.type === 'static') {
                document.getElementById(uploadTargetInfo.id).src = compressedBase64;
                localStorage.setItem(uploadTargetInfo.id, compressedBase64);
            } else if (uploadTargetInfo.type === 'gallery') {
                db[uploadTargetInfo.cat][uploadTargetInfo.idx].img = compressedBase64;
                saveDB();
                renderGallery(uploadTargetInfo.cat);
                renderHomeRecentWorks();
            }
            showToast('อัปเดตรูปภาพเรียบร้อย 📸');
        });
    }
}

// ================= 8. ADMIN SYSTEM =================
function toggleAdminSystem() {
    if (document.body.classList.contains('admin-mode')) {
        if(confirm('ปิดโหมดแอดมินแก้ไขเว็บ?')) {
            document.body.classList.remove('admin-mode');
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
            showToast('ออกจากระบบแล้วค่ะ');
        }
    } else {
        document.getElementById('inp-admin-pass').value = '';
        document.getElementById('err-login').classList.add('hidden');
        document.getElementById('modal-login').classList.remove('hidden');
    }
}

function verifyLogin() {
    const pass = document.getElementById('inp-admin-pass').value.trim().toLowerCase();
    if (pass === "ss11") {
        closeModal('modal-login');
        document.body.classList.add('admin-mode');
        bindContentEditable();
        showToast('เข้าสู่ระบบสำเร็จ! ✨');
    } else {
        document.getElementById('err-login').classList.remove('hidden');
    }
}

function bindContentEditable() {
    document.querySelectorAll('.edit-text').forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.onblur = function() {
            if(!this.id) this.id = 'txt-' + Math.random().toString(36).substr(2, 9);
            if(this.id.startsWith('txt-') && this.id.split('-').length === 3) {
                const parts = this.id.split('-');
                if(db[parts[1]] && db[parts[1]][parts[2]]) {
                    db[parts[1]][parts[2]].title = this.innerText;
                    saveDB();
                }
            } else {
                localStorage.setItem(this.id, this.innerText);
            }
            showToast('บันทึกข้อความแล้ว');
        };
    });
}

function loadStaticData() {
    ['img-profile', 'img-mascot'].forEach(id => {
        const savedImg = localStorage.getItem(id);
        if(savedImg) document.getElementById(id).src = savedImg;
    });

    document.querySelectorAll('.edit-text').forEach(el => {
        if (el.id && el.id.split('-').length !== 3) {
            const savedTxt = localStorage.getItem(el.id);
            if(savedTxt) el.innerText = savedTxt;
        }
    });
}

// ================= 9. UTILITIES =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openZoomView(src) { document.getElementById('zoom-img-display').src = src; document.getElementById('modal-zoom').classList.remove('hidden'); }

// Start App
window.onload = initApplication;
