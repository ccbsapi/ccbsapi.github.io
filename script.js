/**
 * 外部のHTMLファイルを読み込んで、指定したIDの要素に挿入する共通関数
 * @param {string} elementId - 挿入先のHTML要素のID
 * @param {string} filePath - 読み込むHTMLファイルのパス
 */
async function loadHTMLComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error('コンポーネントの読み込みに失敗しました:', error);
        document.getElementById(elementId).innerHTML = '<p>ヘッダーの読み込みに失敗しました。</p>';
    }
}