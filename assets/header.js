document.addEventListener('DOMContentLoaded', async () => {
    const headerContainer = document.getElementById('header');

    // 1. script.jsで定義した関数を使ってheader.htmlを読み込む
    await loadHTMLComponent('header', 'assets/header.html');
    
    // 2. 読み込み完了後、現在のページのIDを取得する
    const pageId = headerContainer.dataset.pageId; // data-page-id="home" なら "home" が入る
    
    // 3. IDが設定されていれば、該当するリンクにactiveクラスを付与する
    if (pageId) {
        const targetLink = document.getElementById(`header-link-${pageId}`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }
});