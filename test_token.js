function extractToken(url) {
    const tokenMatch = url.match(/\/(docx|docs|wiki)\/([a-zA-Z0-9]+)/);
    return tokenMatch ? tokenMatch[2] : null;
}

const testUrls = [
    "https://insight-lab.feishu.cn/docx/McyAwkOjjiYzYakkT8AccJ67n7c",
    "https://open.feishu.cn/docs/McyAwkOjjiYzYakkT8AccJ67n7c",
    "https://xxx.feishu.cn/wiki/Wk123456",
    "https://invalid.url/abc"
];

testUrls.forEach(url => {
    console.log(`URL: ${url} => Token: ${extractToken(url)}`);
});
