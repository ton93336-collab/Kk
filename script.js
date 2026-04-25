// ================= 1. เปลี่ยนหน้าเว็บ (Navigation) แบบคลีนๆ =================
function openPage(targetId) {
    // 1. ซ่อนทุกหน้าที่มีคลาส .view-section
    const allPages = document.querySelectorAll('.view-section');
    allPages.forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active');
    });

    // 2. แสดงเฉพาะหน้าที่เรากดเลือก
    const targetPage = document.getElementById(targetId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        // Force Reflow เพื่อให้ Animation ทำงาน
        void targetPage.offsetWidth; 
        targetPage.classList.add('active');
    }

    // 3. เลื่อนจอกลับไปบนสุด
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= 2. แจ้งเตือน Toast =================
let toastTmr;
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('hidden');
    void toast.offsetWidth; 
    toast.classList.add('show');
    clearTimeout(toastTmr);
    toastTmr = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ================= 3. ฐานข้อมูล LocalStorage =================
let db = {};
const defaultDB = {
    web: [ { title: 'เว็บโอนเงิน 69.-', link: 'https://example.com', img: 'https://placehold.co/400x250/fafafa/d67a8d?text=Web+Preview' } ],
    id: [ { title: 'ป้ายลายมินิมอล', img: 'https://placehold.co/400x400/fafafa/d67a8d?text=ID+Banner' } ],
    decor: [], rov: [], idv: [], forms: [], course: []
};

function initApp() {
    const saved = localStorage.getItem('eoy_final_db');
    if (saved) { db = JSON.parse(saved); } 
    else { db = defaultDB; saveDB(); }
    
    // โหลดผลงานทั้งหมด
    Object.keys(db).forEach(cat => renderGal(cat));
    // โหลดรูปคงที่
    loadStaticImages();
}

function saveDB() { localStorage.setItem('eoy_final_db', JSON.stringify(db)); }

// ================= 4. สร้างแกลลอรี่ (Render) =================
function renderGal(cat) {
    const cont = document.getElementById(`gal-${cat}`);
    if (!cont) return;
    cont.innerHTML = ''; 

    if (db[cat].length === 0) {
        cont.innerHTML = `<p style="text-align:center; color:#ccc; font-size:12px; grid-column:1/-1;">ยังไม่มีข้อมูลผลงานค่ะ</p>`;
        return;
    }

    // เรียงของใหม่ไว้บนสุด
    [...db[cat]].reverse().forEach((item, rawIdx) => {
        const idx = db[cat].length - 1 - rawIdx; // หา Index จริง
        
        const card = document.createElement('div');
        card.className = 'work-item';

        const isZoom = cat === 'id';
        // คลิกดูรูปซูม หรือ คลิกลิงก์
        const imgAct = isZoom ? `onclick="openZoom('${item.img}')"` : `onclick="window.open('${item.link || '#'}', '_blank')"`;
        const zClass = isZoom ? 'zoomable' : '';
        
        const btnDel = `<button class="admin-ui btn-del-gal" onclick="delItem('${cat}', ${idx})"><i class="fa-solid fa-xmark"></i></button>`;
        const btnEditImg = `<button class="admin-ui btn-edit-gal" onclick="event.stopPropagation(); triggerGlobalUpload('${cat}', ${idx})"><i class="fa-solid fa-camera"></i></button>`;

        let html = `
            ${btnDel}
            <div class="img-wrap ${zClass}" ${imgAct} style="cursor: pointer;">
                <img src="${item.img}" alt="work">
                ${btnEditImg}
            </div>
            <h4 class="edit-text" id="txt-${cat}-${idx}">${item.title}</h4>
        `;

        if (!isZoom) {
            html += `<button class="btn-sm" onclick="window.open('${item.link || '#'}', '_blank')">เข้าดูเว็บไซต์</button>`;
        }

        card.innerHTML = html;
        cont.appendChild(card);
    });

    if (document.body.classList.contains('admin-mode')) bindEditText();
}

// ================= 5. เพิ่ม/ลบ ข้อมูล =================
let activeCat = '';
let tempImgBase64 = '';

function showAddModal(cat) {
    activeCat = cat;
    tempImgBase64 = '';
    document.getElementById('inp-title').value = '';
    document.getElementById('inp-link').value = '';
    document.getElementById('inp-preview').src = 'https://placehold.co/400x250/fafafa/d67a8d?text=Tap+to+Upload';
    
    // ซ่อนช่องลิงก์ถ้าเป็นหมวดป้ายไอดี
    document.getElementById('inp-link').style.display = (cat === 'id') ? 'none' : 'block';
    
    document.getElementById('modal-add').classList.remove('hidden');
}

function previewUpload(e) {
    if(e.target.files[0]){
        const r = new FileReader();
        r.onload = ev => {
            tempImgBase64 = ev.target.result;
            document.getElementById('inp-preview').src = tempImgBase64;
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

function saveData() {
    const title = document.getElementById('inp-title').value;
    const link = document.getElementById('inp-link').value;

    if (!title || !tempImgBase64) {
        showToast('กรุณากรอกชื่อและใส่รูปภาพค่ะ'); return;
    }

    try {
        db[activeCat].push({ title: title, link: link, img: tempImgBase64 });
        saveDB();
        renderGal(activeCat);
        closeModal('modal-add');
        showToast('บันทึกผลงานสำเร็จ!');
    } catch (err) {
        alert('รูปภาพขนาดใหญ่เกินไป ลองแคปรูปหรือบีบอัดก่อนนะคะ');
    }
}

function delItem(cat, idx) {
    if (confirm('ลบชิ้นนี้ทิ้งเลยนะคะ?')) {
        db[cat].splice(idx, 1);
        saveDB();
        renderGal(cat);
        showToast('ลบผลงานแล้ว');
    }
}

// ================= 6. อัปโหลดรูปภาพ (รวมทุกจุด) =================
let upTarget = {};

function openUploader(targetId) {
    upTarget = { type: 'static', id: targetId };
    document.getElementById('global-file').click();
}

function triggerGlobalUpload(cat, idx) {
    upTarget = { type: 'gal', cat: cat, idx: idx };
    document.getElementById('global-file').click();
}

function processGlobalUpload(e) {
    if(e.target.files[0]) {
        const r = new FileReader();
        r.onload = ev => {
            if (upTarget.type === 'static') {
                document.getElementById(upTarget.id).src = ev.target.result;
                localStorage.setItem(upTarget.id, ev.target.result);
            } else if (upTarget.type === 'gal') {
                db[upTarget.cat][upTarget.idx].img = ev.target.result;
                saveDB();
                renderGal(upTarget.cat);
            }
            showToast('อัปเดตรูปภาพเรียบร้อย');
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

// ================= 7. ระบบ Admin =================
function toggleAdmin() {
    if (document.body.classList.contains('admin-mode')) {
        if(confirm('ออกจากโหมดแก้ไข?')) {
            document.body.classList.remove('admin-mode');
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
            showToast('ออกจากระบบแอดมิน');
        }
    } else {
        document.getElementById('inp-pass').value = '';
        document.getElementById('err-pass').classList.add('hidden');
        document.getElementById('modal-login').classList.remove('hidden');
    }
}

function checkLogin() {
    const p = document.getElementById('inp-pass').value.trim().toLowerCase();
    if (p === "ss11") {
        closeModal('modal-login');
        document.body.classList.add('admin-mode');
        bindEditText();
        showToast('เข้าสู่ระบบจัดการสำเร็จ!');
    } else {
        document.getElementById('err-pass').classList.remove('hidden');
    }
}

function bindEditText() {
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
            showToast('บันทึกข้อความสำเร็จ');
        };
    });
}

function loadStaticImages() {
    ['img-profile', 'img-mascot'].forEach(id => {
        const saved = localStorage.getItem(id);
        if(saved) document.getElementById(id).src = saved;
    });

    document.querySelectorAll('.edit-text').forEach(el => {
        if (el.id && el.id.split('-').length !== 3) {
            const txt = localStorage.getItem(el.id);
            if(txt) el.innerText = txt;
        }
    });
}

// ================= 8. Utils =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openZoom(src) { document.getElementById('zoom-img-src').src = src; document.getElementById('modal-zoom').classList.remove('hidden'); }

// Init Application
window.onload = initApp;
