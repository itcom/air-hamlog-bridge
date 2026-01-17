import { Storage } from "@plasmohq/storage"
import type { PlasmoCSConfig } from "plasmo"

const storage = new Storage()

export const config: PlasmoCSConfig = {
    matches: ["https://air-hamlog.com/*"]
}

/**
 * background.ts から受信するメッセージの想定型
 */
type BridgeMessage =
    | string
    | {
        type?: "adif"
        adif?: string
        geo?: {
            jcc?: string
        }
        qrz?: {
            qth?: string
            grid?: string
            operator?: string
        }
    }
    | {
        type: "rig"
        data: boolean
        freq: number
        mode: string
        rig: string
    }

chrome.runtime.onMessage.addListener((msg: BridgeMessage) => {

    // rigタイプのメッセージ処理
    if (typeof msg !== "string" && msg.type === "rig") {
        // Hz → MHz変換して周波数帯を選択
        const freqMHz = msg.freq / 1000000
        selectFrequency(freqMHz)
        // モード変換（周波数を渡してSSB判定）
        const mappedMode = mapMode(msg.mode, freqMHz)
        if (mappedMode) {
            selectOption("#qso_log_mode", mappedMode)
        }
        return
    }

    const adif = typeof msg === "string" ? msg : msg.adif
    if (!adif) return

    const data = parseADIF(adif)

    // QRZ情報を抽出
    const qrzInfo = typeof msg !== "string" ? msg.qrz : undefined
    const geoInfo = typeof msg !== "string" ? msg.geo : undefined

    // フォーム反映（ADIF由来 + QRZ情報）
    fillAirHamLog(data, qrzInfo, geoInfo)

    // QRZ NAME → operator（空のときだけ）
    if (qrzInfo?.operator) {
        setIfEmpty("#qso_log_received_qra", qrzInfo.operator)
    }

    handleSubmit(data)
})

/* -------------------------
 * Mode mapping
 * ------------------------- */

const MODE_MAP: Record<string, string> = {
    "FM": "FM",
    "FM-N": "FM",
    "WFM": "FM",
    "AM": "AM",
    "AM-N": "AM",
    "USB": "SSB(USB)",
    "LSB": "SSB(LSB)",
    "CW": "CW",
    "CW-R": "CW",
    "CW-U": "CW",
    "RTTY": "FSK",
    "RTTY-R": "RTTY",
    "RTTY-LSB": "RTTY",
    "RTTY-USB": "RTTY",
    "FT8": "FT8",
    "FT4": "FT4",
    "JT65": "JT65",
    "JT9": "JT9",
    "DV": "D-STAR(DV)",
    "D-STAR (DV)": "D-STAR(DV)",
    "D-STAR (DR)": "D-STAR(DR)",
    "C4FM": "C4FM",
    "WIRES-X": "WIRES-",
}

/**
 * SSBモードの選択（周波数によってLSB/USBを決定）
 * 7MHz以下: LSB, 14MHz以上: USB
 */
function getSsbMode(freqMHz: number): string {
    // 10MHz帯は慣例的にUSB
    if (freqMHz < 10) {
        return "SSB(LSB)"
    } else {
        return "SSB(USB)"
    }
}

function mapMode(mode: string, freqMHz?: number): string | undefined {
    // SSBの場合は周波数で判断
    if (mode === "SSB" && freqMHz !== undefined) {
        return getSsbMode(freqMHz)
    }
    return MODE_MAP[mode]
}

/* -------------------------
 * Frequency mapping
 * ------------------------- */

function selectFrequency(freqMHz: number) {
    let band = ""
    if (freqMHz >= 1.8 && freqMHz < 2) band = "1.9MHz"
    else if (freqMHz >= 3.5 && freqMHz < 3.8) band = "3.5MHz"
    else if (freqMHz >= 3.8 && freqMHz < 4) band = "3.8MHz"
    else if (freqMHz >= 7 && freqMHz < 7.3) band = "7MHz"
    else if (freqMHz >= 10.1 && freqMHz < 10.15) band = "10MHz"
    else if (freqMHz >= 14 && freqMHz < 14.35) band = "14MHz"
    else if (freqMHz >= 18 && freqMHz < 18.2) band = "18MHz"
    else if (freqMHz >= 21 && freqMHz < 21.45) band = "21MHz"
    else if (freqMHz >= 24.89 && freqMHz < 25) band = "24MHz"
    else if (freqMHz >= 28 && freqMHz < 29.7) band = "28MHz"
    else if (freqMHz >= 50 && freqMHz < 54) band = "50MHz"
    else if (freqMHz >= 144 && freqMHz < 148) band = "144MHz"
    else if (freqMHz >= 430 && freqMHz < 440) band = "430MHz"
    else if (freqMHz >= 1200 && freqMHz < 1300) band = "1200MHz"

    if (band) {
        selectOption("#qso_log_frequency", band)
    }
}

/* -------------------------
 * ADIF utilities
 * ------------------------- */

function parseADIF(adif: string) {
    const obj: Record<string, string> = {}
    adif.replace(/<([^:]+):\d+>([^<]+)/g, (_: string, k: string, v: string) => {
        obj[k.toLowerCase()] = v.trim()
        return ""
    })
    return obj
}

function adifDate(d?: string) {
    if (!d || d.length !== 8) return ""
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

function adifTime(t?: string) {
    if (!t || t.length < 4) return ""
    return `${t.slice(0, 2)}:${t.slice(2, 4)}`
}

/* -------------------------
 * Form fill
 * ------------------------- */

interface QrzInfo {
    qth?: string
    grid?: string
    operator?: string
}

interface GeoInfo {
    jcc?: string
}

async function fillAirHamLog(data: Record<string, string>, qrzInfo?: QrzInfo, geoInfo?: GeoInfo) {
    set("#qso_log_callsign", data.call)
    set("#qso_log_qso_at_date", adifDate(data.qso_date))
    set("#qso_log_qso_at_time", adifTime(data.time_on))
    set("#qso_log_sent_rst", data.rst_sent)
    set("#qso_log_received_rst", data.rst_rcvd)
    set("#qso_log_received_qra", data.name)

    // 相手のQTH - JCCのみ入力（geo.jccから）
    if (geoInfo?.jcc) {
        set("#qso_log_received_qth", geoInfo.jcc)
    }

    // 自分のQTH - setDefaultQthボタンをクリック
    const defaultQthBtn = document.querySelector<HTMLAnchorElement>("#setDefaultQth")
    if (defaultQthBtn) {
        defaultQthBtn.click()
    }

    // 周波数を取得（モード選択に使用）
    let freqMHz: number | undefined
    if (data.freq) {
        freqMHz = parseFloat(data.freq)
        selectFrequency(freqMHz)
    }

    // モードの選択（周波数を渡してSSB判定）
    if (data.mode) {
        const mappedMode = mapMode(data.mode, freqMHz)
        if (mappedMode) {
            selectOption("#qso_log_mode", mappedMode)
        }
    }

    // 設定からカード交換を取得して設定
    const cardExchange = await storage.get<string>("cardExchange")
    if (cardExchange) {
        selectOption("#qso_log_card", cardExchange)
    }

    // 設定からQSLカード用Remarksを取得して設定
    const cardRemarks = await storage.get<string>("cardRemarks")
    if (cardRemarks) {
        set("#qso_log_card_remarks", cardRemarks)
    }

    // メモの構築
    const remarksParts: string[] = []

    // ADIFのcommentがあれば追加
    if (data.comment) {
        remarksParts.push(data.comment)
    }

    // QRZ情報をまとめてメモに追加
    if (qrzInfo) {
        const qrzParts: string[] = []
        if (qrzInfo.grid) {
            qrzParts.push(`Grid: ${qrzInfo.grid}`)
        }
        if (qrzInfo.qth) {
            qrzParts.push(`QTH: ${qrzInfo.qth}`)
        }
        if (qrzParts.length > 0) {
            remarksParts.push(qrzParts.join(" / "))
        }
    }

    // 設定の固定Remarks1を追加
    const remarks1 = await storage.get<string>("remarks1Text")
    if (remarks1) {
        remarksParts.push(remarks1)
    }

    // メモを設定
    if (remarksParts.length > 0) {
        set("#qso_log_remarks", remarksParts.join("\n"))
    }
}

/* -------------------------
 * DOM helpers
 * ------------------------- */

function set(sel: string, val?: string) {
    if (!val) return
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)
    if (!el) return
    el.value = val
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.dispatchEvent(new Event("change", { bubbles: true }))
}

function setIfEmpty(sel: string, val?: string) {
    if (!val) return
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)
    if (!el || el.value) return
    el.value = val
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.dispatchEvent(new Event("change", { bubbles: true }))
}

function selectOption(sel: string, val: string) {
    const el = document.querySelector<HTMLSelectElement>(sel)
    if (!el) return
    const option = Array.from(el.options).find(opt => opt.value === val)
    if (option) {
        el.value = val
        el.dispatchEvent(new Event("change", { bubbles: true }))
    }
}

/* -------------------------
 * Submit flow
 * ------------------------- */

async function handleSubmit(data: Record<string, string>) {
    const showConfirm = (await storage.get<boolean>("showConfirm")) ?? true
    if (showConfirm) {
        showConfirmDialog(data, submitWithDelay)
    } else {
        submitWithDelay()
    }
}

function wait(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function submitWithDelay() {
    await wait(300)
    const form = document.querySelector<HTMLFormElement>("form[name='newlog']")
    const submitBtn = form?.querySelector<HTMLButtonElement>("button[type='submit']")
    submitBtn?.click()
}

function showConfirmDialog(
    data: Record<string, string>,
    onOk: () => void
) {
    const box = document.createElement("div")
    box.style.cssText = `
    position:fixed; top:20px; right:20px; z-index:99999;
    background:#111; color:#fff; padding:12px;
    border-radius:8px; font-size:13px;
  `
    box.innerHTML = `
    <b>AirHamLogに送信しますか？</b><br>
    ${data.call} / ${data.freq || ""} / ${data.mode} / ${data.rst_sent}<br><br>
    <button id="ok">送信</button>
    <button id="ng">キャンセル</button>
  `
    document.body.appendChild(box)

    box.querySelector<HTMLButtonElement>("#ok")?.addEventListener("click", () => {
        box.remove()
        onOk()
    })
    box.querySelector<HTMLButtonElement>("#ng")?.addEventListener("click", () => {
        box.remove()
    })
}

/* -------------------------
 * Auto-select received QTH
 * ------------------------- */

// 受信QTHの自動選択機能を追加
function enhanceReceivedQthSearch() {
    const list = document.getElementById('received-qth-list')
    if (!list) return

    const qthInput = document.getElementById('qso_log_received_qth') as HTMLInputElement
    if (!qthInput) return

    console.log('Enhance Received QTH Search initialized.')

    // リストの表示状態を監視
    const observer = new MutationObserver(() => {
        // display: block になったときのみ処理
        if (list.style.display !== 'block') {
            return
        }
        console.log('Received QTH list displayed, searching for matches...')

        const query = qthInput.value.toLowerCase().trim()
        if (!query) return
        console.log(`Searching for QTH match: ${query}`)

        const items = list.querySelectorAll('a.list-group-item')
        if (items.length === 0) return
        console.log(`Found ${items.length} items in the list.`)

        // 完全一致する候補を探す
        for (const item of items) {
            const text = item.textContent || ''
            console.log(`Checking item: ${text}`)
            // "JCC2901:" のようなパターンで完全一致を確認
            const match = text.match(/^[A-Z]+(\d+):/i)
            if (match && match[1].toLowerCase() === query) {
                console.log(`Match found: ${text}`);
                // 自動選択
                ;(item as HTMLAnchorElement).click()
                break
            }
        }
    })

    // style属性の変更を監視
    observer.observe(list, {
        attributes: true,
        attributeFilter: ['style']
    })
}

// ページ読み込み時に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceReceivedQthSearch)
} else {
    enhanceReceivedQthSearch()
}
