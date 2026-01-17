import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "react"

const storage = new Storage()

const styles = {
    container: {
        maxWidth: 480,
        margin: "0 auto",
        padding: 24,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#333",
    },
    header: {
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: "2px solid #4a90d9",
    },
    card: {
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: "#666",
        marginBottom: 12,
    },
    checkboxLabel: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 14,
    },
    checkbox: {
        width: 18,
        height: 18,
        cursor: "pointer",
    },
    fieldGroup: {
        marginBottom: 12,
    },
    label: {
        display: "block",
        fontSize: 13,
        fontWeight: 500,
        color: "#555",
        marginBottom: 4,
    },
    input: {
        width: "100%",
        padding: "8px 12px",
        fontSize: 14,
        border: "1px solid #ccc",
        borderRadius: 4,
        boxSizing: "border-box" as const,
        transition: "border-color 0.2s",
    },
    select: {
        width: "100%",
        padding: "8px 12px",
        fontSize: 14,
        border: "1px solid #ccc",
        borderRadius: 4,
        boxSizing: "border-box" as const,
        transition: "border-color 0.2s",
        backgroundColor: "#fff",
    },
    textarea: {
        width: "100%",
        padding: "8px 12px",
        fontSize: 14,
        border: "1px solid #ccc",
        borderRadius: 4,
        boxSizing: "border-box" as const,
        transition: "border-color 0.2s",
        minHeight: 80,
        resize: "vertical" as const,
    },
    hint: {
        fontSize: 11,
        color: "#888",
        marginTop: 4,
    },
} as const

// カード交換の選択肢（AirHamLogのフォームと同じ）
const CARD_EXCHANGE_OPTIONS = [
    { value: "", label: "選択してください" },
    { value: "JARL (Bureau)", label: "JARL (Bureau)" },
    { value: "No Card", label: "No Card" },
    { value: "1WAY (当方→先方)", label: "1WAY (当方→先方)" },
    { value: "1WAY (先方→当方)", label: "1WAY (先方→当方)" },
    { value: "eQSL", label: "eQSL" },
]

export default function Options() {
    const [showConfirm, setShowConfirm] = useState(true)
    const [remarks1Text, setRemarks1Text] = useState("")
    const [rigName, setRigName] = useState("")
    const [antName, setAntName] = useState("")
    const [antHeight, setAntHeight] = useState("")
    // AirHamLog連携
    const [cardExchange, setCardExchange] = useState("")
    const [cardRemarks, setCardRemarks] = useState("")

    useEffect(() => {
        storage.get<boolean>("showConfirm").then((v) => setShowConfirm(v ?? true))
        storage.get<string>("remarks1Text").then((v) => setRemarks1Text(v ?? ""))
        // AirHamLog連携
        storage.get<string>("cardExchange").then((v) => setCardExchange(v ?? ""))
        storage.get<string>("cardRemarks").then((v) => setCardRemarks(v ?? ""))
    }, [])

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>AirHamLog Bridge 設定</h1>

            <div style={styles.card}>
                <div style={styles.cardTitle}>動作設定</div>
                <label style={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={showConfirm}
                        onChange={(e) => {
                            setShowConfirm(e.target.checked)
                            storage.set("showConfirm", e.target.checked)
                        }}
                    />
                    登録前に確認ダイアログを表示する
                </label>
            </div>

            <div style={styles.card}>
                <div style={styles.cardTitle}>ログ設定（AirHamLog連携）</div>
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>カード交換</label>
                    <select
                        style={styles.select}
                        value={cardExchange}
                        onChange={(e) => {
                            setCardExchange(e.target.value)
                            storage.set("cardExchange", e.target.value)
                        }}
                    >
                        {CARD_EXCHANGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ ...styles.fieldGroup, marginBottom: 0 }}>
                    <label style={styles.label}>Remarks（QSLカードに印字されます）</label>
                    <textarea
                        style={styles.textarea}
                        value={cardRemarks}
                        onChange={(e) => {
                            setCardRemarks(e.target.value)
                            storage.set("cardRemarks", e.target.value)
                        }}
                        placeholder="例: TNX FB QSO!"
                    />
                </div>
            </div>

            <div style={styles.card}>
                <div style={styles.cardTitle}>固定入力（メモ欄）</div>
                <div style={{ ...styles.fieldGroup, marginBottom: 0 }}>
                    <label style={styles.label}>Remarks1</label>
                    <input
                        type="text"
                        style={styles.input}
                        value={remarks1Text}
                        onChange={(e) => {
                            setRemarks1Text(e.target.value)
                            storage.set("remarks1Text", e.target.value)
                        }}
                        placeholder="例: FT8 / HAMLAB Bridge"
                    />
                    <div style={styles.hint}>
                        毎回メモ欄に自動追加されます
                    </div>
                </div>
            </div>
        </div>
    )
}