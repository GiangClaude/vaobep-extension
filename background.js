
const API_URL = "https://vaobep-backend-140613815644.asia-southeast1.run.app/api/extension";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "searchRecipeMenu",
    title: "Tìm công thức '%s' trên Vào Bếp",
    contexts: ["selection"] 
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "searchRecipeMenu") {
    const selectedText = info.selectionText;

    chrome.tabs.sendMessage(tab.id, { 
        action: "show_search_loading", 
        text: selectedText 
    });

    fetch(`${API_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: selectedText })
    })
    .then(response => response.json())
    .then(data => {
      chrome.tabs.sendMessage(tab.id, { 
          action: "show_search_results", 
          query: selectedText,
          results: data.data 
      });
    })
    .catch(error => {
      console.error("Lỗi tìm kiếm:", error);
      chrome.tabs.sendMessage(tab.id, { 
          action: "show_search_error", 
          error: "Không thể kết nối đến máy chủ." 
      });
    });
  }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture_and_crop") {
        const coords = request.coords;
        const tabId = sender.tab.id;

        chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 100 }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                chrome.tabs.sendMessage(tabId, { action: "show_search_error", error: "Không thể chụp màn hình." });
                return;
            }

            cropImageWithCanvas(dataUrl, coords)
                .then(croppedBase64 => {
                    return fetch(`${API_URL}/identify-image`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: croppedBase64 })
                    });
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const dishName = data.data.dishName || data.dishName || "Món ăn";
                        const recipeList = data.data.recipes

                        chrome.tabs.sendMessage(tabId, { 
                            action: "show_search_results", 
                            query: `AI nhận diện ${dishName}`,
                            results: recipeList 
                        });
                    } else {
                        chrome.tabs.sendMessage(tabId, { action: "show_search_error", error: data.message });
                    }
                })
                .catch(err => {
                    console.error("Lỗi cắt/gửi ảnh:", err);
                    chrome.tabs.sendMessage(tabId, { action: "show_search_error", error: "AI bận, vui lòng thử lại." });
                });
        });
    }
});


async function cropImageWithCanvas(dataUrl, coords) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    
    const MAX_SIZE = 800;
    let targetWidth = coords.width;
    let targetHeight = coords.height;

    if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / targetWidth, MAX_SIZE / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
    }
    
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
        imageBitmap, 
        coords.x, coords.y, coords.width, coords.height, 
        0, 0, targetWidth, targetHeight                  
    );
    
    const croppedBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(croppedBlob);
    });
}