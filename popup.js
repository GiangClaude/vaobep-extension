
const API_BACKEND_URL = "https://vaobep-backend-140613815644.asia-southeast1.run.app";
const FRONTEND_URL = "https://vaobep-frontend.vercel.app/"; 

function getRecipeImageUrl(recipeId, cover_image) {
    if (!cover_image || cover_image === 'default.png') return 'https://via.placeholder.com/60?text=Food';
    if (cover_image.startsWith('http') || cover_image.startsWith('blob:')) return cover_image;
    return `${API_BACKEND_URL}/public/recipes/${recipeId}/${cover_image}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const suggestList = document.getElementById('suggestList');
    const loadingSuggest = document.getElementById('loadingSuggest');

    fetch(`${API_BACKEND_URL}/api/extension/suggest`)
        .then(res => res.json())
        .then(data => {
            loadingSuggest.style.display = 'none';
            if (data.success && data.data.length > 0) {
                data.data.forEach(recipe => {
                    const card = document.createElement('div');
                    card.className = 'recipe-card';
                    card.innerHTML = `
                        <img class="recipe-img" src="${getRecipeImageUrl(recipe.recipe_id, recipe.cover_image)}" alt="${recipe.title}">
                        <div class="recipe-info">
                            <h4>${recipe.title}</h4>
                            <p>⏱ ${recipe.cook_time} phút | 🔥 ${recipe.total_calo || '0'} calo</p>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => {
                        chrome.tabs.create({ url: `${FRONTEND_URL}/recipe/${recipe.recipe_id}` });
                    });

                    suggestList.appendChild(card);
                });
            } else {
                suggestList.innerHTML = '<p class="loading">Không có dữ liệu.</p>';
            }
        })
        .catch(err => {
            loadingSuggest.innerHTML = 'Lỗi kết nối máy chủ.';
            console.error(err);
        });
});


    const btnCropImage = document.getElementById('btnCropImage');
    if (btnCropImage) {
        btnCropImage.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0) return;
                const activeTab = tabs[0];
                
                chrome.tabs.sendMessage(activeTab.id, { action: "start_crop_mode" });
                
                window.close(); 
            });
        });
    }

let currentWebText = ""; 

document.addEventListener('DOMContentLoaded', () => {

    const btnAskAi = document.getElementById('btnAskAi');
    const aiQuestionInput = document.getElementById('aiQuestionInput');
    const aiResponseBox = document.getElementById('aiResponseBox');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "extract_main_text" }, (response) => {
            if (response && response.text) {
                currentWebText = response.text;
                console.log("Đã bóc tách được", currentWebText.length, "ký tự.");
            }
        });
    });

    const handleAskAi = () => {
        const question = aiQuestionInput.value.trim();
        if (!question) return;

        aiResponseBox.style.display = 'block';
        aiResponseBox.innerHTML = '<em>Đang suy nghĩ... 🤔</em>';
        aiQuestionInput.value = '';

        fetch(`${API_BACKEND_URL}/api/extension/ask-context`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                context: currentWebText,
                question: question
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                aiResponseBox.innerHTML = `<strong>AI:</strong> ${data.text.replace(/\n/g, '<br>')}`;
            } else {
                aiResponseBox.innerHTML = `<span style="color:red">Lỗi: ${data.message}</span>`;
            }
        })
        .catch(err => {
            aiResponseBox.innerHTML = `<span style="color:red">Lỗi kết nối máy chủ.</span>`;
            console.error("Lỗi Q&A:", err);
        });
    };

    if (btnAskAi) btnAskAi.addEventListener('click', handleAskAi);
    
    if (aiQuestionInput) {
        aiQuestionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAskAi();
        });
    }
});