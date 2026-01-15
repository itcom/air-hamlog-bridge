import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"

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
} as const

export default function Options() {
    const [showConfirm, setShowConfirm] = useState(true)
    const [remarks1Text, setRemarks1Text] = useState("")
    const [rigName, setRigName] = useState("")
    const [antName, setAntName] = useState("")
    const [antHeight, setAntHeight] = useState("")

    useEffect(() => {
        storage.get<boolean>("showConfirm").then((v) => setShowConfirm(v ?? true))
        storage.get<string>("remarks1Text").then((v) => setRemarks1Text(v ?? ""))
        storage.get<string>("rigName").then((v) => setRigName(v ?? ""))
        storage.get<string>("antName").then((v) => setAntName(v ?? ""))
        storage.get<string>("antHeight").then((v) => setAntHeight(v ?? ""))
    }, [])

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>HAMLAB Bridge 設定</h1>

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
                <div style={styles.cardTitle}>固定入力</div>
                <div style={styles.fieldGroup}>
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
                </div>
            </div>

            <div style={styles.card}>
                <div style={styles.cardTitle}>設備情報</div>
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>無線機</label>
                    <input
                        type="text"
                        style={styles.input}
                        value={rigName}
                        onChange={(e) => {
                            setRigName(e.target.value)
                            storage.set("rigName", e.target.value)
                        }}
                        placeholder="例: IC-7300"
                    />
                </div>
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>アンテナ</label>
                    <input
                        type="text"
                        style={styles.input}
                        value={antName}
                        onChange={(e) => {
                            setAntName(e.target.value)
                            storage.set("antName", e.target.value)
                        }}
                        placeholder="例: ZS6BKW"
                    />
                </div>
                <div style={{ ...styles.fieldGroup, marginBottom: 0 }}>
                    <label style={styles.label}>地上高（m）</label>
                    <input
                        type="text"
                        style={styles.input}
                        value={antHeight}
                        onChange={(e) => {
                            setAntHeight(e.target.value)
                            storage.set("antHeight", e.target.value)
                        }}
                        placeholder="例: 10"
                    />
                </div>
            </div>
        </div>
    )
}
