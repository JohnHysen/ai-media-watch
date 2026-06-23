document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("sendBtn");
    const linkInput = document.getElementById("link-input");
    const isAutoCollect = document.getElementById("isAutoCollect");

    console.log("popup loaded");

    chrome.storage.sync.get(['autoCollectEnabled'], (result) => {
        const enabled = result.autoCollectEnabled !== false;
        isAutoCollect.checked = enabled;
        console.log('Auto-collect state loaded:', enabled);
    });

    isAutoCollect.addEventListener("change", (event) => {
        const enabled = event.target.checked;
        chrome.storage.sync.set({ autoCollectEnabled: enabled }, () => {
            console.log('Auto-collect state saved:', enabled);
            
            chrome.runtime.sendMessage({
                action: 'toggleAutoCollect',
                enabled: enabled
            });
        });
    });

    sendBtn.addEventListener("click", async () => {
        const link = linkInput.value.trim();
        
        if (!link) {
            alert("Пожалуйста, введите ссылку");
            return;
        }

        if (!link.startsWith("http")) {
            alert("Пожалуйста, введите корректную ссылку");
            return;
        }

        console.log("Manual send:", link);

        try {
            const res = await fetch("http://localhost:3500/analysis-queue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url: link }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Sent successfully:", data);
                alert("Ссылка успешно отправлена!");
                linkInput.value = "";
            } else {
                const error = await res.text();
                console.error("Server error:", error);
                alert(`Ошибка сервера: ${res.status}`);
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Ошибка сети. Проверьте подключение к серверу.");
        }
    });

    linkInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendBtn.click();
        }
    });
});