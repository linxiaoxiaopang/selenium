const {URL: RE_DESIGN_URL, TEMPLATE_PICTURE_TITLE_ARR, FILL_MODE, DESIGN_PICTURE_PATH} = require(`F:\\work\\selenium\\config.js`)
const DIRECTORY = 'F:\\work'
const path = require('path')
const {Builder, By} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const {flatten, uniq, map, isEqual} = require('lodash')
const {whileWait, waitTimeByNum, getSystemUrls, createRandomNum, getPictureTitles, writeError, formatDate} = require('./utils')
const picList = getPictureTitles(DESIGN_PICTURE_PATH)

const RENDER_MODE = 'fill'
process.env.SE_MANAGER_PATH = `${DIRECTORY}\\selenium\\node_modules\\selenium-webdriver\\bin\\windows\\selenium-manager.exe`
const newPath = `${DIRECTORY}\\selenium\\chromedriver-win64`
process.env.PATH = `${newPath}${path.delimiter}${process.env.PATH}`
console.log('process.env.PATH', process.env.PATH)
const DESIGN_BY_SELF_LIST = [FILL_MODE]

    // 创建 WebDriver 实例
;(async function example() {
    // 设置 Chrome 浏览器选项
    let options = new chrome.Options()
    options.addArguments('start-maximized') // 启动时最大化窗口
    // 初始化 WebDriver
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
    console.log('driver build')
    try {
        const isDesignBySelf = DESIGN_BY_SELF_LIST.includes(RENDER_MODE)
        const urlList = getSystemUrls(RE_DESIGN_URL)
        // 打开网页
        await driver.get(urlList.login)
        writeError(formatDate(new Date()))
        //登录
        // const userName = await querySelector('[uiid="zd-name"]')
        // userName.sendKeys(USER_NAME)
        // const password = await querySelector('[uiid="zd-pwd"]')
        // password.sendKeys(USER_PASSWORD)
        //跳转到topic页面
        const currentUrl0 = urlList.login
        await whileWait(async () => {
            let currentUrl1 = await driver.getCurrentUrl()
            console.log('currentUrl0 != currentUrl1', currentUrl0 != currentUrl1)
            return currentUrl0 != currentUrl1
        })
        let designData = []
        let designTitles = []

        if (!isDesignBySelf) {
            await driver.get(urlList.reDesign)
            await pageLoaded()
            await waitTimeByNum(3000)
            designData = await driver.executeScript(`
           let element = document.querySelector('.designContainerPage')
           console.log('element', element);
           const fabricList = element.__vue__.fabricList
           return fabricList.map(item => {
            const canvas = item.canvas
            const os = canvas.getObjects()
            const canvasOption = {
                backgroundColor: canvas.backgroundColor
            }
            canvasOption.os = os.map(sItem => {
             const infoArr = sItem.id.split('@')
             const oWidth = infoArr[1]
             const oHeight = infoArr[2]
             const oId = infoArr[3]
             const picTitle = sItem.picTitle
             const width = sItem.width
             const height = sItem.height
             const left = sItem.left
             const top = sItem.top
             const scaleX = sItem.scaleX
             const scaleY = sItem.scaleY
             const flipX = sItem.flipX
             const flipY = sItem.flipY
             const angle = sItem.angle
             const groupType = sItem.groupType
             const afterScaleWidth = width * scaleX
             const afterScaleHeight = height * scaleY    
             console.log('groupType', groupType) 
             
             const option = {
                originWidth: oWidth,
                originHeight: oHeight,
                afterScaleWidth,
                afterScaleHeight,
                id: oId,
                title: picTitle,
                width,
                height,
                left,
                top,
                scaleX,
                scaleY,
                flipX,
                flipY,
                angle
              }
              if(groupType !== undefined)  {
                option.groupType = groupType
              }
              return option
            })
            return canvasOption
           })
        `)
            const designDataOsData = map(designData, 'os')
            designTitles = uniq(map(flatten(designDataOsData), 'title'))
            await driver.get(urlList.topic)
            await waitTimeByNum(200)
        }

        await driver.get(urlList.design)

        await pageLoaded()

        for (let i = 0; i < picList.length; i++) {
            const picTitleList = picList[i]
            if (!isDesignBySelf) {
                if (designTitles.length > 1) {
                    if (TEMPLATE_PICTURE_TITLE_ARR.length) {
                        const isDiff = !isEqual(designTitles, TEMPLATE_PICTURE_TITLE_ARR)
                        if (isDiff) {
                            writeError(`TEMPLATE_PICTURE_TITLE_ARR:${TEMPLATE_PICTURE_TITLE_ARR},模板数据title:${designTitles}不一致`)
                            return
                        }
                    }
                    if (designTitles.length != picTitleList.length) {
                        writeError(`待定制图片title:${picTitleList},模板数据title:${designTitles}数量不一致`)
                        continue
                    }
                }
            }

            let designsEls = await querySelectorAll('.designContainerHeader .design')
            if (designsEls.length > 1) {
                const chunkDesignEl = designsEls[1]
                let classAttribute = await chunkDesignEl.getAttribute('class')
                // 检查是否包含特定的 active 激活样式，检测是否是专业设计高亮
                let isChunkDesignActive = classAttribute.indexOf('active') >= 0
                if (isChunkDesignActive) {
                    await designsEls[0].click()
                    await whileWait(async () => {
                        let submitBtn = await querySelector('.el-message-box__btns .el-button--primary')
                        if (!submitBtn) return false
                        await submitBtn.click()
                        return true
                    })
                }
            }


            // 查找 searchIcon 元素并点击
            let pictureTitleElement = await querySelector('.cate-and-search-component .search input')
            if (!pictureTitleElement) {
                let searchIcon = await querySelector('.cate-and-search-component .el-icon-search')
                console.log('searchIcon', searchIcon)
                await searchIcon.click()
                // 查找 input 元素并输入文本
                pictureTitleElement = await querySelector('.cate-and-search-component .search input')
            }
            let firstPicTitle = ''
            for (let j = 0; j < picTitleList.length; j++) {
                const picTitle = picTitleList[j]
                if (!firstPicTitle) firstPicTitle = picTitle
                await pictureTitleElement.clear()
                await pictureTitleElement.sendKeys(picTitle)
                //点击图片
                await whileWait([
                        () => {
                            return querySelector('.uploadDesignPicComponent .loading-wrapper')
                        },
                        async () => {
                            return !(await querySelector('.uploadDesignPicComponent .loading-wrapper'))
                        }
                    ]
                )
                await waitTimeByNum(20)
                //点击图片
                const img = await querySelector('.hover-pic-popup-component .autoImgComponent')
                if (!img) {
                    writeError(`${picTitle}图片不存在，已经被跳过定制。`)
                    continue
                }
                await img.click()
                await waitTimeByNum(20)
            }

            //画布加载渲染
            await canvasRendered()

            // 获取一键定制，专业定制按钮
            if (designsEls.length > 1) {
                if (!isDesignBySelf) {
                    designsEls[1].click()
                    // 点击模式切换按钮
                    await whileWait(async () => {
                        let submitBtn = await querySelector('.el-message-box__btns .el-button--primary')
                        if (!submitBtn) return false
                        await submitBtn.click()
                        return true
                    })
                    await canvasRendered()
                }
            } else {
                const copyMenu = await querySelector('[uiid="zd-copyMenu"]')
                await copyMenu.click()
                await waitTimeByNum(200)
                const copyAll = await querySelector('[uiid="zd-copyAll"]')
                await copyAll.click()
                await canvasRendered()
            }

            if (!isDesignBySelf) {
                //根据模板数据更新画布数据
                const pArr = await driver.executeScript(`
                   let element = document.querySelector('.designContainerPage')
                   console.log('element', element);
                   const fabricList = element.__vue__.fabricList
                   const formData = ${JSON.stringify(designData)}
                   const formDesignTitles = ${JSON.stringify(designTitles)}
                   let FROM_TEMPLATE_PICTURE_TITLE_ARR = ${JSON.stringify(TEMPLATE_PICTURE_TITLE_ARR)}
                   if(formDesignTitles.length == 1) {
                      FROM_TEMPLATE_PICTURE_TITLE_ARR = formDesignTitles
                   }
                   if(!FROM_TEMPLATE_PICTURE_TITLE_ARR.length) {
                      FROM_TEMPLATE_PICTURE_TITLE_ARR = formDesignTitles  
                   }
                   const formPicTitleList = ${JSON.stringify(picTitleList)}
                   const pArr = []
                   fabricList.map((item, index) => {
                     const canvas = item.canvas
                     const os = canvas.getObjects()
                     os.map(o => {
                        canvas.remove(o)
                     })
                     canvas.renderAll()
                     let rawCanvasOption = formData[index]
                     canvas.backgroundColor = rawCanvasOption.backgroundColor
                     let rawOs = rawCanvasOption.os
                     const osPArr = rawOs.map(async rawO => {
                       const fIndex = FROM_TEMPLATE_PICTURE_TITLE_ARR.findIndex(title => rawO.title == title)
                       if(fIndex < 0) return
                       const fTitle = formPicTitleList[fIndex]
                       const findO = os.find(o => o.picTitle == fTitle)
                       if(!findO) return
                       const o = await new Promise((resolve) => {
                           findO.clone(
                                (cloneO) => {
                                  resolve(cloneO)
                                }        
                           )              
                       })
                       const infoArr = findO.id.split('@')
                       const oWidth = infoArr[1]
                       const oHeight = infoArr[2]
                       const oId = infoArr[3].replace(/^_/, '')
                       
                       const newOId = \`${createRandomNum()}@\${oWidth}@\${oHeight}@_\${oId}\`
                       const afterScaleWidth = rawO.afterScaleWidth
                       const afterScaleHeight = rawO.afterScaleHeight
                       const title = rawO.title
                       const width = rawO.width
                       const height = rawO.height
                       const left = rawO.left
                       const top = rawO.top
                       const scaleX = rawO.scaleX
                       const scaleY = rawO.scaleY
                       const flipX = rawO.flipX
                       const flipY = rawO.flipY
                       const angle = rawO.angle
                       const groupType = rawO.groupType
                       const oScaleX = afterScaleWidth / o.width  
                       const oScaleY = afterScaleHeight / o.height
                       console.log('oScaleX', oScaleX)
                       console.log('oScaleY', oScaleY)
                       o.setOptions({
                           id: newOId,
                           picTitle: findO.picTitle,
                           left,
                           top,
                           scaleX: oScaleX,
                           scaleY: oScaleY,
                           flipX,
                           flipY,
                           angle,
                           groupType
                       })
                       pArr.push(...osPArr)
                       return o
                     })
                     Promise.all(osPArr).then(res => {
                        res.map(o => {
                            canvas.add(o)
                            canvas.renderAll()
                        })
                        canvas.renderAll()
                        canvas.$cacheFrontDesignData = null
                     })
                   })  
                   return pArr
                `)

                await Promise.all(pArr)
            }

            //铺满
            if (RENDER_MODE === FILL_MODE) {
                await driver.executeScript(`
                   let element = document.querySelector('.designContainerPage')
                   const context = element.__vue__
                   const fabricList = context.fabricList
                   console.log('fabricList', fabricList)
                   for(let i = 0; i < fabricList.length; i++) {
                       const canvas = fabricList[i].canvas
                       console.log('canvas', canvas)
                       context.knifeActiveIndex = \`\${i}\`
                       await new Promise((resolve) => {
                         setTimeout(() => {
                           resolve(true)
                         }, 200)
                       })
                       console.log('await')
                       const os = canvas.getObjects()
                       for(let j = 0; j < os.length; j++) {
                         const o = os[j]
                         canvas.setActiveObject(o)
                         await new Promise((resolve) => {
                             setTimeout(() => {
                               resolve(true)
                             }, 50)
                         })
                         const fillBtn = document.querySelector('.iconfont.icon-shejiqi_puman')
                         fillBtn.click()
                         await new Promise((resolve) => {
                             setTimeout(() => {
                               resolve(true)
                             }, 50)
                         })
                         console.log('await1')
                       }
                       canvas.renderAll()
                   }
                `)
                await canvasRendered()
            }

            //下一步
            const nextStepBtn = await querySelector('.done-btn-wrapper .el-button--primary')
            nextStepBtn.click()
            await waitTimeByNum(200)
            //露白弹窗 继续定制
            const keepDesignBtn = await querySelector('.el-message-box__btns .el-button--default')
            if (keepDesignBtn) {
                await keepDesignBtn.click()
                await waitTimeByNum(200)
            }

            //输入前缀
            await whileWait(async () => {
                const skuPrefixEl = await querySelector('[uiid="zd-skuPrefix"]')
                if (skuPrefixEl) {
                    await skuPrefixEl.sendKeys(firstPicTitle)
                    return true
                }
                return false
            })

            // await waitTimeByNum(200000)

            //保存定制
            const saveBtn = await querySelector('.save-component-dialog_custom-class .el-button--primary')
            saveBtn.click()

            let keepToDesignEl = null
            await whileWait(async () => {
                const isError = await querySelector('.el-form-item__error')
                if (isError) return true
                keepToDesignEl = await querySelector('.uiid-zd-success-cancel')
                if (keepToDesignEl) return true
                return false
            })
            //保存成功
            if (keepToDesignEl) {
                keepToDesignEl.click()
            } else {
                await driver.get(urlList.topic)
                await waitTimeByNum(200)
                await driver.get(urlList.design)
                await pageLoaded()
            }
        }
    } finally {
        // 关闭浏览器
        // await driver.quit();
    }

    async function querySelector(selector) {
        try {
            const element = await driver.findElement(By.css(selector))
            const isDisplayed = await element.isDisplayed()
            if (!isDisplayed) return null
            return element

        } catch {
            console.log('获取不到元素')
            return null
        }
    }

    async function querySelectorAll(selector) {
        try {
            return await driver.findElements(By.css(selector))
        } catch {
            return []
        }
    }

    async function pageLoaded() {
        await whileWait(async () => {
            return await driver.executeScript(`
                let element = document.querySelector('.designContainerPage')
                if (!element) return false
                const context = element.__vue__
                console.log('context.loading', context.loading)
                return !context.loading
            `
            )
        })
    }

    async function canvasRendered() {
        await whileWait([async () => {
            return await driver.executeScript(`
                console.log('canvasRendered')
                let element = document.querySelector('.designContainerPage')
                if (!element) return false
                const context = element.__vue__
                console.log('context.loading', context.loading)
                return !context.loading
            `
            )
        }, async () => {
            return await driver.executeScript(`
                let element = document.querySelector('.designContainerPage')
                if (!element) return false
                const context = element.__vue__
                return !context.calcProShowPicLock
            `
            )
        }])
    }
})()
