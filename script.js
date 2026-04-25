// ================= 1. TOAST NOTIFICATION (Cute Alert) =================
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast-notify');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('hidden');
    void toast.offsetWidth; // Reflow
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ================= 2. NAVIGATION (เปลี่ยนหน้าแบบ Smooth) =================
function switchPage(targetId) {
    // ซ่อนทุกหน้า
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });

    // โชว์หน้าที่เลือก
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        void target.offsetWidth; 
        target.classList.add('active');
    }

    // เลื่อนกลับไปบนสุดของกล่อง Carrd
    document.querySelector('.carrd-main-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ================= 3. DATABASE (LocalStorage 100%) =================
let db = {};
// ข้อมูลเริ่มต้นสำหรับหมวดต่างๆ
const defaultDB = {
    web: [ { title: 'เว็บลิงก์ร้าน 69.-', link: 'https://example.com', img: 'https://placehold.co/400x250/ffeef2/f092a5?text=Web+Design' } ],
    id: [ { title: 'ป้ายลายอนิเมะ', img: 'https://placehold.co/400x400/ffeef2/f092a5?text=ID+Banner' } ],
    decor: [], rov: [], idv: [], forms: [], course: []
};

function initApplication() {
    const savedData = localStorage.getItem('eoy_carrd_v6');
    if (savedData) { db = JSON.parse(savedData); } 
    else { db = defaultDB; saveDB(); }
    
    // เรนเดอร์แกลลอรี่ทุกหน้า
    Object.keys(db).forEach(cat => renderGallery(cat));
    // โหลดข้อความและรูปภาพ Static
    loadStaticData();
}

function saveDB() { localStorage.setItem('eoy_carrd_v6', JSON.stringify(db)); }

// ================= 4. RENDER GALLERY =================
function renderGallery(cat) {
    const container = document.getElementById(`gal-${cat}`);
    if (!container) return;
    container.innerHTML = ''; 

    if (db[cat].length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#9e8e92; font-size:13px; grid-column:1/-1; padding:20px;">ยังไม่มีผลงานในหมวดนี้ 🌸</p>`;
        return;
    }

    // เรียงของใหม่ไว้บนสุด
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

// ================= 5. ADD & DELETE (CRUD) =================
let activeCategory = '';
let tempImgBase64 = '';

function openAddDataModal(cat) {
    activeCategory = cat;
    tempImgBase64 = '';
    document.getElementById('inp-work-title').value = '';
    document.getElementById('inp-work-link').value = '';
    document.getElementById('preview-new-img').src = 'https://placehold.co/400x300/fff0f5/ffb6c1?text=Click+to+Upload';
    
    // ซ่อนช่องลิงก์ถ้าเป็นป้ายไอดี
    document.getElementById('inp-work-link').style.display = (cat === 'id') ? 'none' : 'block';
    document.getElementById('modal-add').classList.remove('hidden');
}

function previewNewImage(e) {
    if(e.target.files[0]){
        const reader = new FileReader();
        reader.onload = ev => {
            tempImgBase64 = ev.target.result;
            document.getElementById('preview-new-img').src = tempImgBase64;
        };
        reader.readAsDataURL(e.target.files[0]);
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
        closeModal('modal-add');
        showToast('เพิ่มผลงานสำเร็จ! 🎀');
    } catch (err) {
        alert('รูปภาพใหญ่เกินไป กรุณาลดขนาดภาพก่อนอัปโหลดค่ะ');
    }
}

function deleteRecord(cat, idx) {
    if (confirm('ยืนยันลบผลงานชิ้นนี้ใช่ไหมคะ? 🗑️')) {
        db[cat].splice(idx, 1);
        saveDB();
        renderGallery(cat);
        showToast('ลบผลงานเรียบร้อย');
    }
}

// ================= 6. GLOBAL IMAGE UPLOADER =================
let uploadTargetInfo = {};

function openUploader(targetId) {
    uploadTargetInfo = { type: 'static', id: targetId };
    document.getElementById('global-file-uploader').click();
}

function initGalleryUpload(cat, idx) {
    uploadTargetInfo = { type: 'gallery', cat: cat, idx: idx };
    document.getElementById('global-file-uploader').click();
}

function processGlobalFile(e) {
    if(e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => {
            const dataUrl = ev.target.result;
            if (uploadTargetInfo.type === 'static') {
                document.getElementById(uploadTargetInfo.id).src = dataUrl;
                localStorage.setItem(uploadTargetInfo.id, dataUrl);
            } else if (uploadTargetInfo.type === 'gallery') {
                db[uploadTargetInfo.cat][uploadTargetInfo.idx].img = dataUrl;
                saveDB();
                renderGallery(uploadTargetInfo.cat);
            }
            showToast('อัปเดตรูปภาพเรียบร้อย 📸');
        };
        reader.readAsDataURL(e.target.files[0]);
    }
}

// ================= 7. ADMIN SYSTEM =================
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

// ระบบ Edit Text กดแก้ได้เลย
function bindContentEditable() {
    document.querySelectorAll('.edit-text').forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.onblur = function() {
            if(!this.id) this.id = 'txt-' + Math.random().toString(36).substr(2, 9);
            
            // ถ้าเป็นการแก้ชื่อผลงานใน Gallery
            if(this.id.startsWith('txt-') && this.id.split('-').length === 3) {
                const parts = this.id.split('-');
                if(db[parts[1]] && db[parts[1]][parts[2]]) {
                    db[parts[1]][parts[2]].title = this.innerText;
                    saveDB();
                }
            } else {
                // ถ้าแก้ข้อความทั่วไป (เช่น Bio, ชื่อร้าน)
                localStorage.setItem(this.id, this.innerText);
            }
            showToast('บันทึกข้อความแล้ว');
        };
    });
}

function loadStaticData() {
    // โหลดรูปคงที่
    ['img-profile', 'img-mascot'].forEach(id => {
        const savedImg = localStorage.getItem(id);
        if(savedImg) document.getElementById(id).src = savedImg;
    });

    // โหลดข้อความคงที่
    document.querySelectorAll('.edit-text').forEach(el => {
        if (el.id && el.id.split('-').length !== 3) {
            const savedTxt = localStorage.getItem(el.id);
            if(savedTxt) el.innerText = savedTxt;
        }
    });
}

// ================= 8. UTILITIES =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openZoomView(src) { document.getElementById('zoom-img-display').src = src; document.getElementById('modal-zoom').classList.remove('hidden'); }

// รันแอปพลิเคชันตอนเปิดหน้าเว็บ
window.onload = initApplication;
