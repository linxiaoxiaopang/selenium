exports.config = {
  zhengding: {
    searchPictureLoading: '.loading-wrapper',
    async beforeClickPicture() {},
    login: {
      userName: 'input[uiid="zd-name"]',
      password: 'input[uiid="zd-pwd"]',
      loginBtn: 'button[uiid="zd-btn"]'
    },
    private: {},
    public: {}
  },
  zdcustom: {
    searchPictureLoading: '.water-fall-component .el-loading-mask',
    async beforeClickPicture(waitFn) {
      return await waitFn(3500)
    },
    login: {
      userName: 'input[uiid="zd-username"]',
      password: 'input[uiid="zd-pwd"]',
      loginBtn: 'button[uiid="zd-submit"]'
    },
    private: {},
    public: {}
  }
}

exports.getCurrentConfig = function (url) {
  if (url.indexOf('zhengding') >= 0) {
    return exports.config.zhengding
  }
  return exports.config.zdcustom
}
