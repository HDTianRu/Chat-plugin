import {
  pluginName
} from "./constant.js"

export const helpCfg = {
  title: 'Chat帮助',
  subTitle: pluginName,
  columnCount: 3,
  colWidth: 265,
  theme: 'all',
  themeExclude: [ /*'default'*/ ],
  style: {
    fontColor: '#d3bc8e',
    descColor: '#eee',
    contBgColor: 'rgba(6, 21, 31, .5)',
    contBgBlur: 3,
    headerBgColor: 'rgba(6, 21, 31, .4)',
    rowBgColor1: 'rgba(6, 21, 31, .2)',
    rowBgColor2: 'rgba(6, 21, 31, .35)'
  }
}

export const helpList = [{
  group: '"[]"内为必填项,"{}"内为可选项,"|"表选择'
}, {
  group: '基本命令',
  list: [{
    icon: 71,
    title: '#chat',
    desc: '如题，主动与ai聊天'
  }, {
    icon: 74,
    title: '#结束对话',
    desc: '如题，结束本群/私聊对话，清除对话缓存'
  }]
}, {
  group: '管理命令，仅主人可用',
  list: [{
    icon: 85,
    title: '#结束全部对话',
    desc: '如题'
  }, {
    icon: 85,
    title: '#(强制)更新chat插件',
    desc: '更新插件本体'
  }]
}]