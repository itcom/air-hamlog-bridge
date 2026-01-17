let ws: WebSocket | null = null

/**
 * Establishes a WebSocket connection to the local HAMLAB Bridge server.
 * Listens for incoming messages and forwards them to all tabs.
 * If the connection is closed, re-establish it after a 1 second delay.
 */
function connect() {
    ws = new WebSocket("ws://127.0.0.1:17800/ws")

    ws.onmessage = (e) => {
        let payload: any

        try {
            payload = JSON.parse(e.data)
        } catch {
            // 従来互換（生ADIF）
            payload = { adif: e.data }
        }

        chrome.tabs.query({ url: "https://air-hamlog.com/*" }, (tabs) => {
            tabs.forEach((tab) => {
                if (!tab.id) return
                chrome.tabs.sendMessage(tab.id, payload, () => {
                    // content script が無いのは正常
                    if (chrome.runtime.lastError) {
                        // 何もしない（ログも出さない）
                    }
                })
            })
        })
    }


    ws.onclose = () => setTimeout(connect, 1000)
}

connect()
