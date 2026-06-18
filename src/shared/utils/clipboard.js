export async function copyText(text) {
    if (!text) {
        return { ok: false, message: 'Không có nội dung để copy.' }
    }

    await navigator.clipboard.writeText(text)
    return { ok: true, message: 'Đã copy vào clipboard.' }
}
