export function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => resolve(event.target.result)
        reader.onerror = () => reject(new Error('Không đọc được file.'))
        reader.readAsText(file)
    })
}
