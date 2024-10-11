// 创建 WebDriver 实例
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('按任意键退出...', () => {
  rl.close()
})
const fs = require('fs')
const DIRECTORY = 'D:\\work'

try {
  const {
    URL: RE_DESIGN_URL,
    TEMPLATE_PICTURE_TITLE_ARR,
    DESIGN_PICTURE_PATH,
    USER_NAME,
    USER_PASSWORD,
    DESIGN_TAB,
    REFRESH_MAX_COUNT,
    SKU_SUFFIX
  } = require(`D:\\work\\selenium\\config.js`)
  const path = require('path')
  const { Builder, By, Key } = require('selenium-webdriver')
  const chrome = require('selenium-webdriver/chrome')
  const { flatten, uniq, map, isEqual, sortBy } = require('lodash')
  const {
    whileWait,
    waitTimeByNum,
    getSystemUrls,
    createRandomNum,
    getPictureTitles,
    formatDate
  } = require('./utils')
  console.log(1)
  const { getCurrentConfig } = require('./const')
  console.log(2)
  console.log('RE_DESIGN_URL', RE_DESIGN_URL)
  //对内自营，对外分销的配置
  const config = getCurrentConfig(RE_DESIGN_URL)
  console.log('3')
  const picList = getPictureTitles(DESIGN_PICTURE_PATH)
  const FILL_MODE = getSystemUrls(RE_DESIGN_URL).productId ? '' : 'fill'
  const RENDER_MODE = 'fill'
  const DESIGN_TAB_PUBLIC = '图库'
  let DESIGN_COUNT = 0
  process.env.SE_MANAGER_PATH = `${DIRECTORY}\\selenium\\node_modules\\selenium-webdriver\\bin\\windows\\selenium-manager.exe`
  const newPath = `${DIRECTORY}\\selenium\\chromedriver-win64`
  process.env.PATH = `${newPath}${path.delimiter}${process.env.PATH}`
  console.log(11111)
  const DESIGN_BY_SELF_LIST = [FILL_MODE]
  console.log('配置加载完成')
  ;(async function example() {
    //设置 Chrome 浏览器选项
    console.log('设置 Chrome 浏览器选项')
    const tempDir = `${DIRECTORY}\\selenium\\temp`
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }
    let options = new chrome.Options()
    options.addArguments('start-maximized') // 启动时最大化窗口
    options.addArguments(`--user-data-dir=${tempDir}`)
    options.addArguments('--incognito')  // 使用隐身模式
    options.addArguments('--disable-cache')  // 禁用缓存
    // 初始化 WebDriver
    console.log('初始化 WebDriver')
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
    console.log('driver build')
    try {
      const wrapperClass = DESIGN_TAB === DESIGN_TAB_PUBLIC ? '.sharedPicLibraryComponent' : '.uploadDesignPicComponent'
      const querySelector1 = createQuerySelector(wrapperClass)
      const querySelectorAll1 = createQuerySelectorAll(wrapperClass)
      const isDesignBySelf = DESIGN_BY_SELF_LIST.includes(RENDER_MODE)
      const urlList = getSystemUrls(RE_DESIGN_URL)
      // 打开网页
      await driver.get(urlList.login)
      writeError(formatDate(new Date()))
      console.log('登录页面加载完成')
      //登录
      if (USER_NAME && USER_PASSWORD) {
        try {
          await driver.executeScript(`
           let element = document.querySelector('#app')
           const context = element.__vue__
           context.$message.info('等待页面加载完成，等待自动输入密码')
        `)
          const userName = await querySelector(config.login.userName)
          userName.sendKeys(USER_NAME)
          const password = await querySelector(config.login.password)
          password.sendKeys(USER_PASSWORD)
          const loginBtn = await querySelector(config.login.loginBtn)
          await loginBtn.click()
        } catch {
          console.log('发生错误，请手动输入密码')
          await driver.executeScript(`
           let element = document.querySelector('#app')
           const context = element.__vue__
           context.$message.error('发生错误，请手动输入密码')
        `)
        }
      }

      //跳转到topic页面
      const currentUrl0 = urlList.login
      await whileWait(async () => {
        let currentUrl1 = await driver.getCurrentUrl()
        return currentUrl0 != currentUrl1
      })
      console.log('跳转首页')
      let designData = []
      let designTitles = []

      if (!isDesignBySelf) {
        await driver.get(urlList.reDesign)
        await pageLoaded()
        await waitTimeByNum(3000)
        designData = await driver.executeScript(`
           let element = document.querySelector('.designContainerPage')
           const fabricList = element.__vue__.fabricList
           return fabricList.map(item => {
            const canvas = item.canvas
            const os = canvas.getObjects().filter(o => o.type != 'group')
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
        console.log('designTitles', designTitles)
        await driver.get(urlList.topic)
        await waitTimeByNum(200)
      }

      await driver.get(urlList.design)

      await pageLoaded()

      if (DESIGN_TAB === DESIGN_TAB_PUBLIC) {
        await waitTimeByNum(200)
        const publicTabBtn = await querySelector('[uiid="zd-tuku"]')
        await publicTabBtn.click()
        await waitTimeByNum(400)
      }
      writeError(`定制总数:${picList.length}`)
      for (let i = 0; i < picList.length; i++) {
        DESIGN_COUNT++
        const picTitleList = picList[i]
        if (!isDesignBySelf) {
          if (designTitles.length > 1) {
            if (TEMPLATE_PICTURE_TITLE_ARR.length) {
              const isDiff = !isEqual(sortBy(designTitles), sortBy(TEMPLATE_PICTURE_TITLE_ARR))
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
        let pictureTitleElement = await querySelector1('.cate-and-search-component .search input')
        if (!pictureTitleElement) {
          let searchIcon = await querySelector1('.cate-and-search-component .el-icon-search')
          await searchIcon.click()
          // 查找 input 元素并输入文本
          pictureTitleElement = await querySelector1('.cate-and-search-component .search input')
        }
        let firstPicTitle = ''
        let existPicClicked = false
        for (let j = 0; j < picTitleList.length; j++) {
          const picTitle = picTitleList[j]
          if (!firstPicTitle) firstPicTitle = picTitle
          await pictureTitleElement.clear()
          await pictureTitleElement.sendKeys(picTitle)
          await pictureTitleElement.sendKeys(Key.ENTER)
          //点击图片
          await whileWait([
              async () => {
                const element = await querySelector1(config.searchPictureLoading)
                if (!element) {
                  await waitTimeByNum(500)
                  return true
                }
                return element
              },
              async () => {
                return !(await querySelector1(config.searchPictureLoading))
              }
            ]
          )
          await waitTimeByNum(20)
          //点击图片
          const imgList = await querySelectorAll1('.hover-pic-popup-component')
          if (!imgList.length) {
            writeError(`${picTitle}图片不存在，已经被跳过定制。`)
            continue
          }
          let fImg = null
          if (imgList.length == 1) {
            fImg = imgList[0]
          } else {
            try {
              fImg = await driver.executeScript(`
                  let elements = document.querySelectorAll(\`${wrapperClass} .hover-pic-popup-component\`)
                  return [...elements].find(item => {
                    const title = item.__vue__.data.title
                    if(title == ${picTitle}) {
                      if(item.__vue__.themeClickHandler) {
                        item.__vue__.themeClickHandler()
                      } else {
                        item.__vue__.themeClckHandler()
                      }
                      return true
                    }
                    return false
                  })
              `)
            } catch {
            }
          }
          if (!fImg) {
            writeError(`${picTitle}图片不存在，已经被跳过定制。`)
            continue
          }
          await fImg.click()
          existPicClicked = true
          await waitTimeByNum(20)
        }
        if (!existPicClicked) continue

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
                   const context = element.__vue__
                   const fabricList = context.fabricList
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
                       return o
                     })
                     pArr.push(...osPArr)
                     Promise.all(osPArr).then(res => {
                        res.map(async o => {
                           if(!o) return
                            canvas.add(o)
                            if(o.groupType !== undefined) {
                              await context.copyLayerTile(o.groupType, o, canvas, true)
                            }
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
                   for(let i = 0; i < fabricList.length; i++) {
                       const canvas = fabricList[i].canvas
                       context.knifeActiveIndex = \`\${i}\`
                       await new Promise((resolve) => {
                         setTimeout(() => {
                           resolve(true)
                         }, 200)
                       })
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
                       }
                       canvas.renderAll()
                   }
                `)
          await canvasRendered()
        }

        //下一步
        const nextStepBtn = await querySelector('[uiid="zd-designNext"]')
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
            let sku = firstPicTitle
            if (SKU_SUFFIX) {
              sku = sku + SKU_SUFFIX
            }
            await skuPrefixEl.sendKeys(sku)
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
          if (isError) {
            writeError(`${picTitleList}:sku重复`)
            return true
          }
          keepToDesignEl = await querySelector('.uiid-zd-success-cancel')
          if (keepToDesignEl) {
            writeError(`${picTitleList}:定制成功`)
            return true
          }
          return false
        })
        //保存成功
        if (keepToDesignEl) {
          keepToDesignEl.click()
        } else {
          const zdSkuDialog = await querySelector('.save-component-dialog_custom-class .dialog-footer .el-button--default')
          await zdSkuDialog.click()
          await waitTimeByNum(400)
          await driver.executeScript(`
                   let element = document.querySelector('.designContainerPage')
                   const context = element.__vue__
                   context.UPDATE_IS_CLEAR_ALL_CANVAS_DESIGN_DATA(true)
            `
          )
        }
        if (DESIGN_COUNT > REFRESH_MAX_COUNT) {
          DESIGN_COUNT = 1
          await waitTimeByNum(400)
          await driver.get(urlList.topic)
          await driver.navigate().refresh()
          await waitTimeByNum(2000)
          writeError('刷新成功')
          console.log('刷新成功')
          console.log('urlList.design', urlList.design)
          await driver.get(urlList.design)
          console.log('跳转成功')
          await pageLoaded()
          if (DESIGN_TAB === DESIGN_TAB_PUBLIC) {
            await waitTimeByNum(200)
            const publicTabBtn = await querySelector('[uiid="zd-tuku"]')
            await publicTabBtn.click()
            await waitTimeByNum(400)
          }
        }

      }
    } catch (err) {
      writeError(err)
    } finally {
      // 关闭浏览器
      writeError('关闭浏览器')
      console.log('关闭浏览器')
      await waitTimeByNum(10000)
      await driver.quit()
      // 清理临时目录
      fs.rmdirSync(tempDir, { recursive: true })
    }

    function createQuerySelector(wrapperSelector) {
      return async function (selector) {
        try {
          if (wrapperSelector) {
            selector = `${wrapperSelector} ${selector}`
          }
          const element = await driver.findElement(By.css(selector))
          const isDisplayed = await element.isDisplayed()
          if (!isDisplayed) return null
          return element

        } catch {
          return null
        }
      }
    }

    function createQuerySelectorAll(wrapperSelector) {
      return async function (selector) {
        try {
          if (wrapperSelector) {
            selector = `${wrapperSelector} ${selector}`
          }
          return await driver.findElements(By.css(selector))
        } catch (err) {
          console.log('errerr', err)
          return []
        }
      }
    }

    function querySelector(selector) {
      return createQuerySelector()(selector)
    }

    function querySelectorAll(selector) {
      return createQuerySelectorAll()(selector)
    }

    async function pageLoaded() {
      await whileWait(async () => {
        return await driver.executeScript(`
                let element = document.querySelector('.designContainerPage')
                if (!element) return false
                const context = element.__vue__
                return !context.loading
            `
        )
      })
    }

    async function canvasRendered() {
      await whileWait([async () => {
        return await driver.executeScript(`
                let element = document.querySelector('.designContainerPage')
                if (!element) return false
                const context = element.__vue__
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
  })();

} catch (err) {
  console.log('浏览器异常关闭，请查看error.txt文件中的错误信息')
  writeError(err)
  console.log('err', err)
}


function writeError(content) {
  content = `${content}\n`
  try {
    const path = `${DIRECTORY}\\selenium\\error.txt`
    fs.appendFileSync(path, content, 'utf8')
  } catch (err) {
    console.log(`写入异常:${err}`)
  }
}
