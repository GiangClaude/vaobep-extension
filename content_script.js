
const API_BACKEND_URL = CONFIG.BACKEND_API_URL;
const FRONTEND_URL = CONFIG.FRONTEND_URL;
function getImageUrl(recipeId, coverImage) {
    if (!coverImage || coverImage === 'default.png') return 'https://via.placeholder.com/60?text=Food';
    if (coverImage.startsWith('http') || coverImage.startsWith('blob:')) return coverImage;
    return `${API_BACKEND_URL}/public/recipes/${recipeId}/${coverImage}`;
}

function removeModal() {
    const existingModal = document.getElementById('vaobep-ext-modal');
    if (existingModal) existingModal.remove();
}

function removeModal() {
    const existingModal = document.getElementById('vaobep-ext-modal');
    if (existingModal) existingModal.remove();
}
function renderModal(titleText, contentData) {
    removeModal();
    
    const modal = document.createElement('div');
    modal.id = 'vaobep-ext-modal';
    
    // Tăng width lên 400px, đổi màu nền tổng thể sang kem sữa giống Homepage
    modal.style.cssText = `
        position: fixed; top: 20px; right: 20px; width: 400px;
        background: #fff9f0; box-shadow: 0 10px 25px rgba(255,117,31,0.2);
        border-radius: 12px; z-index: 9999999; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden; border: 2px solid #ffedd5;
    `;

    // Phần Header: Nền trắng, chữ cam, nút tắt màu cam
    modal.innerHTML = `
        <div style="background: white; color: #ff751f; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ffedd5; box-shadow: 0 4px 20px -10px rgba(255,117,31,0.3);">
            <h3 id="vaobep-modal-title" style="margin: 0; font-size: 16px; font-weight: bold;"></h3>
            <button id="vaobep-close-btn" style="background: none; border: none; color: #ff751f; cursor: pointer; font-size: 20px; font-weight: bold; padding: 0 5px;">✖</button>
        </div>
        <div id="vaobep-modal-body" style="padding: 15px; max-height: 450px; overflow-y: auto; color: #333;"></div>
    `;

    document.body.appendChild(modal);

    // Gán Text an toàn (Chống XSS từ title)
    document.getElementById('vaobep-modal-title').textContent = titleText;

    // Gán Content an toàn
    const bodyEl = document.getElementById('vaobep-modal-body');
    if (typeof contentData === 'string') {
        bodyEl.innerHTML = contentData; 
    } else {
        bodyEl.appendChild(contentData); 
    }

    // Sự kiện đóng
    document.getElementById('vaobep-close-btn').addEventListener('click', removeModal);
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "show_search_loading") {
        renderModal(`Tìm kiếm: ${request.text}`, `<div style="text-align: center; padding: 20px;">Đang tìm công thức... 🍳</div>`);
    }

    if (request.action === "show_search_results") {
        const recipes = request.results;
        
        if (!recipes || recipes.length === 0) {
            renderModal(`Tìm kiếm: ${request.query}`, `<div style="padding: 15px; text-align: center;">Không tìm thấy món nào phù hợp.</div>`);
            return;
        }

        const listContainer = document.createElement('div');

        recipes.forEach(r => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "vaobep-recipe-item";
            itemDiv.style.cssText = "display: flex; padding: 12px; background: white; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 2px solid transparent; cursor: pointer; transition: 0.3s;";

            itemDiv.addEventListener('mouseover', () => { 
                itemDiv.style.borderColor = '#ffedd5'; 
                itemDiv.style.transform = 'translateY(-2px)'; 
            });
            itemDiv.addEventListener('mouseout', () => { 
                itemDiv.style.borderColor = 'transparent'; 
                itemDiv.style.transform = 'none'; 
            });
            itemDiv.addEventListener('click', () => {
                window.open(`${FRONTEND_URL}/recipe/${r.recipe_id}`, '_blank');
            });

            const img = document.createElement('img');
            img.src = getImageUrl(r.recipe_id, r.cover_image);
            img.style.cssText = "width: 70px; height: 70px; border-radius: 8px; object-fit: cover; margin-right: 15px;";

            const textDiv = document.createElement('div');

            const titleH4 = document.createElement('h4');
            titleH4.style.cssText = "margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #111;";
            titleH4.textContent = r.title;

            const infoSpan = document.createElement('span');
            infoSpan.style.cssText = "font-size: 12px; color: #666;";
            infoSpan.textContent = `⏱ ${r.cook_time} phút | 🔥 ${r.total_calo || '?'} calo`; 

            textDiv.appendChild(titleH4);
            textDiv.appendChild(infoSpan);
            itemDiv.appendChild(img);
            itemDiv.appendChild(textDiv);
            
            listContainer.appendChild(itemDiv);
        });

         renderModal(`Kết quả: ${request.query}`, listContainer);
    }

    if (request.action === "show_search_error") {
        renderModal("Lỗi", `<div style="color: red; padding: 15px;">${request.error}</div>`);
    }

    if (request.action === "start_crop_mode") {
        initCropMode();
    }

    if (request.action === "extract_main_text") {
        let extractedText = "";
        
        const mainContent = document.querySelector('article') || document.querySelector('main');
        
        if (mainContent) {
            extractedText = mainContent.innerText;
        } else {
            const pTags = document.querySelectorAll('p');
            pTags.forEach(p => {
                if (p.innerText.length > 50) { 
                    extractedText += p.innerText + "\n";
                }
            });
        }

        const finalText = extractedText.substring(0, 15000).trim();
        
        sendResponse({ text: finalText });
    }

    return true;
});




let cropOverlay = null;
let cropBox = null;
let startX = 0, startY = 0;
let isDragging = false;

function initCropMode() {
    if (cropOverlay) cropOverlay.remove();
    
    cropOverlay = document.createElement('div');
    cropOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.5); z-index: 2147483647; cursor: crosshair;
    `;
    
    cropBox = document.createElement('div');
    cropBox.style.cssText = `
        position: absolute; border: 2px dashed #fff; background: rgba(255,255,255,0.1);
        display: none; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
    `;
    
    cropOverlay.appendChild(cropBox);
    document.body.appendChild(cropOverlay);

    cropOverlay.addEventListener('mousedown', onMouseDown);
    cropOverlay.addEventListener('mousemove', onMouseMove);
    cropOverlay.addEventListener('mouseup', onMouseUp);
}

function onMouseDown(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    cropBox.style.left = startX + 'px';
    cropBox.style.top = startY + 'px';
    cropBox.style.width = '0px';
    cropBox.style.height = '0px';
    cropBox.style.display = 'block';
}

function onMouseMove(e) {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);
    
    cropBox.style.width = width + 'px';
    cropBox.style.height = height + 'px';
    cropBox.style.left = left + 'px';
    cropBox.style.top = top + 'px';
}

function onMouseUp(e) {
    isDragging = false;
    
    const rect = cropBox.getBoundingClientRect();
    
    if (rect.width < 10 || rect.height < 10) {
        cancelCropMode();
        return;
    }

    const dpr = window.devicePixelRatio;

    const coords = {
        x: rect.left * dpr,
        y: rect.top * dpr,
        width: rect.width * dpr,
        height: rect.height * dpr
    };

    cropOverlay.style.background = 'transparent';
    cropBox.style.boxShadow = 'none';
    cropBox.style.border = 'none';

    setTimeout(() => {
        chrome.runtime.sendMessage({ action: "capture_and_crop", coords: coords });
        cancelCropMode(); 
        renderModal("AI Đang phân tích ảnh", `<div style="text-align: center; padding: 20px;">Vui lòng đợi vài giây... 🤖🍳</div>`);
    }, 100);
}

function cancelCropMode() {
    if (cropOverlay) {
        cropOverlay.remove();
        cropOverlay = null;
        cropBox = null;
    }
}

