import { Storage } from "@plasmohq/storage"
import type { PlasmoCSConfig } from "plasmo"

const storage = new Storage()

export const config: PlasmoCSConfig = {
    matches: ["https://hamlab.jp/*"]
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
        // Hz → MHz変換
        const freqMHz = (msg.freq / 1000000).toFixed(3)
        set("#frequency", freqMHz)
        // モード変換
        const mappedMode = mapMode(msg.mode)
        if (mappedMode) {
            set("#mode", mappedMode)
        }
        return
    }

    const adif = typeof msg === "string" ? msg : msg.adif
    if (!adif) return

    const data = parseADIF(adif)

    // フォーム反映（ADIF由来）
    fillHamLab(data)

    // JCC/JCG（geo由来・空のときだけ）
    if (typeof msg !== "string" && msg.geo?.jcc) {
        setIfEmpty("#js-code", msg.geo.jcc)
    }

    // ③ QTH 補完（QRZ・空のときだけ）
    if (typeof msg !== "string" && msg.qrz?.qth) {
        setIfEmpty("#qth", msg.qrz.qth)
    }

    // ④ Grid 高精度化（先頭一致時のみ差し替え）
    if (typeof msg !== "string" && msg.qrz?.grid) {
        const el = document.querySelector<HTMLInputElement>("#gl")
        if (el && el.value && msg.qrz.grid.startsWith(el.value)) {
            el.value = msg.qrz.grid
            el.dispatchEvent(new Event("change", { bubbles: true }))
        }
    }

    // QRZ NAME → operator（空のときだけ）
    if (typeof msg !== "string" && msg.qrz?.operator) {
        setIfEmpty("#operator", msg.qrz.operator)
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
    "SSB": "SSB",
    "USB": "SSB",
    "LSB": "SSB",
    "CW": "CW",
    "CW-R": "CW",
    "CW-U": "CW",
    "RTTY": "RTTY",
    "RTTY-R": "RTTY",
    "RTTY-LSB": "RTTY",
    "RTTY-USB": "RTTY",
    "FT8": "FT8",
    "FT4": "FT4",
    "DV": "DV",
    "D-STAR (DV)": "D-STAR (DV)",
    "D-STAR (DR)": "D-STAR (DR)",
    "C4FM": "C4FM",
    "WIRES-X": "WIRES-X",
}

function mapMode(mode: string): string | undefined {
    return MODE_MAP[mode]
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
    return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
}

function adifTime(t?: string) {
    if (!t || t.length < 4) return ""
    return `${t.slice(0, 2)}:${t.slice(2, 4)}`
}

/* -------------------------
 * Form fill
 * ------------------------- */

async function fillHamLab(data: Record<string, string>) {
    set("#callsign", data.call)
    set("#day", adifDate(data.qso_date))
    set("#time", adifTime(data.time_on))
    set("#frequency", data.freq)
    set("#bureau", data.rst_rcvd)
    set("#bureau_2", data.rst_sent)
    set("#mode", data.mode)
    set("#gl", data.gridsquare)
    set("#qth", data.qth)
    set("#remarks2", data.comment)
    set("#operator", data.name)
    set("#rig-val", data.tx_pwr)
    set("#time_zone", "U")

    // Options（固定値）
    const remarks1 = await storage.get<string>("remarks1Text")
    const rigName = await storage.get<string>("rigName")
    const antName = await storage.get<string>("antName")
    const antHeight = await storage.get<string>("antHeight")

    if (remarks1) set("#remarks1", remarks1)
    if (rigName) set("#rig-name", rigName)
    if (antName) set("#ant-name", antName)
    if (antHeight) set("#ant-val", antHeight)
}

/* -------------------------
 * DOM helpers
 * ------------------------- */

function set(sel: string, val?: string) {
    if (!val) return
    const el = document.querySelector<HTMLInputElement | HTMLSelectElement>(sel)
    if (!el) return
    el.value = val
    el.dispatchEvent(new Event("change", { bubbles: true }))
}

function setIfEmpty(sel: string, val?: string) {
    if (!val) return
    const el = document.querySelector<HTMLInputElement | HTMLSelectElement>(sel)
    if (!el || el.value) return
    el.value = val
    el.dispatchEvent(new Event("change", { bubbles: true }))
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
    document.querySelector<HTMLButtonElement>("#submit-regist")?.click()
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
    <b>HAMLABに送信しますか？</b><br>
    ${data.call} / ${data.band} / ${data.mode} / ${data.rst_sent}<br><br>
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
