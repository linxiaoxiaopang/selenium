const fs = require('fs')
const path = require('path')

async function whileWait(callbackList, interval = 300) {
    if (!callbackList) return true
    if (!Array.isArray(callbackList)) {
        callbackList = [callbackList]
    }
    for (let i = 0; i < callbackList.length; i++) {
        let isFinished = false
        const callback = callbackList[i]
        while (!isFinished) {
            isFinished = await callback()
            await waitTimeByNum(interval)
        }
    }
}

async function waitTimeByNum(num) {
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, num)
    })
}

function parseUrl(urlString) {
    const url = new URL(urlString)
    const {origin, hash, searchParams, href, pathname} = url
    const res = {
        href,
        origin
    }
    const isHash = pathname == '/' && hash
    if (!isHash) {
        res.rootUrl = `${origin}/`
        res.pathname = pathname
        res.searchParams = searchParams
        res.mode = 'history'
    } else {
        const cleanHash = hash.substring(1)
        let [hashPathname, queryString] = cleanHash.split('?')
        const queryParams = new URLSearchParams(queryString)
        res.rootUrl = `${origin}/#/`
        res.pathname = `/#${hashPathname}`
        res.searchParams = queryParams
        res.mode = 'hash'
    }
    res.searchParamsObj = {}
    for (const [key, value] of res.searchParams) {
        res.searchParamsObj[key] = value
    }

    res.originAndPathname = `${res.origin}${res.pathname}`
    return res
}


function getSystemUrls(urlString) {
    const {rootUrl, searchParamsObj, originAndPathname} = parseUrl(urlString)
    return {
        productId: searchParamsObj.productId,
        login: `${rootUrl}login`,
        topic: rootUrl,
        design: `${originAndPathname}?protoId=${searchParamsObj.protoId}`,
        reDesign: `${originAndPathname}?protoId=${searchParamsObj.protoId}&productId=${searchParamsObj.productId}`
    }
}

//创建随机id
function createRandomNum() {
    return Date.now().toString(16) + Math.random().toString(16).slice(2, 8)
}

function getPictureTitles(path) {
    const content = fs.readFileSync(path, 'utf-8')
    const splitData = content.split('\r\n').filter(Boolean)
    const chunkSplitData = splitData.map(item => item.split(' '))
    return chunkSplitData
}

function writeError(content) {
    content = `${content}\n`
    console.log('content', content)
    try {
        fs.appendFileSync(path.resolve(__dirname, './error.txt'), content, 'utf8')
    } catch(err) {
        console.log(`写入异常:${err}`)
    }
}

function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

module.exports = {
    whileWait,
    waitTimeByNum,
    parseUrl,
    getSystemUrls,
    createRandomNum,
    getPictureTitles,
    writeError,
    formatDate
}
