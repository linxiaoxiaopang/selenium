const path = require('path')
// 模板：需要手动定制，用于记录位置信息的产品。
module.exports = {
    //使用模板情况下，使用定制器具体原型重新设计地址，填充模式下，使用定制器具体原型地址
    URL: 'https://www.zhengdingyunshang.com/#/design/designContainer?protoId=463&productId=4601192',
    // URL: 'https://www.zhengdingyunshang.com/#/design/designContainer?protoId=1185&productId=4584166',
    //模板图片title列表，在定制器中使用了超过1张原图的情况下配置，用户映射模板title
    TEMPLATE_PICTURE_TITLE_ARR: [],
    //浏览器画布填充模式，设置该值时，会忽略模板。可选值：fill
    // FILL_MODE: 'fill',
    FILL_MODE: '',
    //图片title的文件地址 传入绝对地址 默认使用的是./designTitles.txt 文件
    DESIGN_PICTURE_PATH: 'F:\\work\\node\\selenium\\designTitles.txt'
}

// HBC_SMT4
// 123456Bch9
// const RE_DESIGN_URL = 'https://www.zhengdingyunshang.com/#/design/designContainer?protoId=1185&productId=4584166'
// const RE_DESIGN_URL = 'https://www.zhengdingyunshang.com/#/design/designContainer?protoId=444&productId=4552153'
