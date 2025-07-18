import Cfg from './model/Cfg.js'

export function supportGuoba() {
  return {
    pluginInfo: {
      name: 'Chat-plugin',
      title: 'Chat-plugin',
      author: '@天如',
      authorLink: 'https://gitee.com/HDTianRu',
      link: 'https://gitee.com/HDTianRu/Chat-plugin',
      isV3: true,
      isV2: false,
      description: '简洁的AI聊天插件',
      icon: 'mdi:cat',
      iconColor: '#6bb9dd',
    },
    configInfo: {
      schemas: [{
          label: 'API 配置',
          component: 'SOFT_GROUP_BEGIN'
        },
        {
          field: 'apiUrl',
          label: 'API 地址',
          bottomHelpMessage: '填写 OpenAI 兼容 API 的基础地址',
          component: "Input",
          componentProps: {
            placeholder: "https://api.deepseek.com/v1"
          }
        }, {
          field: 'apiKey',
          label: 'API Key',
          bottomHelpMessage: '填写 API 的密钥，支持逗号分隔多个key',
          component: "InputPassword",
          componentProps: {
            placeholder: "sk-******"
          }
        }, {
          field: 'model',
          label: 'AI 模型',
          bottomHelpMessage: '使用的 AI 模型名称',
          component: "Input",
          componentProps: {
            placeholder: "deepseek-chat"
          }
        },

        {
          label: '基本配置',
          component: 'SOFT_GROUP_BEGIN'
        },
        ...basicCfg(),
        {
          field: 'special',
          label: 'BOT:群聊特定配置',
          bottomHelpMessage: '为特定BOT/群聊设置独立的配置参数，格式为 BOT账号:群号 ，如只指定一项，另一项则用 * 代替，比如: 3291691454:* ，优先级: BOT:群 > *:群 > BOT:* > 通用配置',
          component: 'GSubForm',
          componentProps: {
            multiple: true,
            schemas: [{
                field: 'key',
                label: 'BOT:群号',
                component: "Input",
                required: true
              },
              ...basicCfg()
            ],
          }
        },

        /*{
          label: '伪人配置',
          component: 'SOFT_GROUP_BEGIN'
        },*/

        {
          label: '黑白名单设置',
          component: 'SOFT_GROUP_BEGIN'
        },
        {
          field: "botWhitelistQQ",
          label: "机器人QQ白名单",
          bottomHelpMessage: "只有这些QQ号的机器人才会使用AI响应消息, 留空则不启用白名单",
          component: "GTags",
          componentProps: {
            allowAdd: true,
            allowDel: true,
            valueFormatter: ((value) => Number.parseInt(value)).toString()
          }
        },
        {
          field: "botBlacklistQQ",
          label: "机器人QQ黑名单",
          bottomHelpMessage: "这些QQ号的机器人不会使用AI响应消息, 白名单优先",
          component: "GTags",
          componentProps: {
            allowAdd: true,
            allowDel: true,
            valueFormatter: ((value) => Number.parseInt(value)).toString()
          }
        },
        {
          field: "pseudoWhitelistQQ",
          label: "伪人QQ白名单",
          bottomHelpMessage: "只对这些QQ号启用伪人模式, 留空则不启用白名单",
          component: "GTags",
          componentProps: {
            allowAdd: true,
            allowDel: true,
            valueFormatter: ((value) => Number.parseInt(value)).toString()
          }
        },
        {
          field: "pseudoBlacklistQQ",
          label: "伪人QQ黑名单",
          bottomHelpMessage: "对这些QQ号禁用伪人模式, 白名单优先",
          component: "GTags",
          componentProps: {
            allowAdd: true,
            allowDel: true,
            valueFormatter: ((value) => Number.parseInt(value)).toString()
          }
        },
        {
          field: "pseudoWhitelistGroup",
          label: "伪人群组白名单",
          bottomHelpMessage: "只在这些群组启用伪人模式, 留空则不启用白名单",
          component: "GSelectGroup"
        },
        {
          field: "pseudoBlacklistGroup",
          label: "伪人群组黑名单",
          bottomHelpMessage: "在这些群组禁用伪人模式, 白名单优先",
          component: "GSelectGroup"
        },
      ],
      getConfigData() {
        return Cfg.getAll()
      },
      setConfigData(data, {
        Result
      }) {
        for (let [keyPath, value] of Object.entries(data)) {
          Cfg._set(keyPath, value)
        }
        Cfg.save()
        return Result.ok({}, '保存成功喵~')
      },
    },
  }
}

function basicCfg() {
  return [{
      field: 'aiName',
      label: 'AI名称 (支持正则)',
      bottomHelpMessage: '提到此名称会触发 AI 回复',
      component: "Input",
      componentProps: {
        placeholder: "猫娘"
      }
    }, {
      field: 'temperature',
      label: '温度设置 (主动)',
      bottomHelpMessage: '控制主动回复的随机性 (0.1 ~ 2.0)',
      component: "InputNumber",
      componentProps: {
        min: 0.1,
        max: 2,
        step: 0.1,
        placeholder: "0.7"
      }
    }, {
      field: 'maxTokens',
      label: '最大Token数 (主动)',
      bottomHelpMessage: '控制主动回复的最大长度',
      component: "InputNumber",
      componentProps: {
        min: 64,
        max: 65536,
        placeholder: "4096"
      }
    }, {
      field: 'prompt',
      label: 'Prompt 设置',
      bottomHelpMessage: '系统 Prompt 设置，定义 AI 的行为和角色',
      component: "InputTextArea",
      componentProps: {
        placeholder: "你是一个猫娘..."
      }
    }, {
      field: 'enableName',
      label: '启用名字触发',
      bottomHelpMessage: '检测消息包含ai名字则回复',
      component: "Switch"
    }, {
      field: 'enableAt',
      label: '启用艾特回复',
      bottomHelpMessage: '是否在被艾特时回复',
      component: "Switch"
    }, {
      field: 'enablePrivate',
      label: '启用私聊',
      bottomHelpMessage: '是否允许在私聊中使用',
      component: "Switch"
    }, {
      field: 'thinking',
      label: '提示正在思考中',
      bottomHelpMessage: '主动模式先回一句正在思考中',
      component: "Switch"
    }, {
      field: 'delay',
      label: '伪人随机延迟',
      bottomHelpMessage: '格式: 下限-上限 (单位ms)，如 500-1000',
      component: "Input"
    }, {
      field: 'historyCount',
      label: '聊天记录条数',
      bottomHelpMessage: '对话时附加的最近聊天记录条数 (0 ~ 50)',
      component: "InputNumber",
      componentProps: {
        min: 0,
        max: 50,
        placeholder: "10"
      }
    }, {
      field: 'cacheExpireMinutes',
      label: '缓存过期时间(分钟)',
      bottomHelpMessage: '对话缓存过期时间 (1 ~ 1440)',
      component: "InputNumber",
      componentProps: {
        min: 1,
        max: 1440,
        placeholder: "30"
      }
    }, {
      field: 'maxContextLength',
      label: '最大上下文长度',
      bottomHelpMessage: '缓存中最多保留的对话消息数量 (1 ~ 50)',
      component: "InputNumber",
      componentProps: {
        min: 1,
        max: 50,
        placeholder: "10"
      }
    }, {
      field: 'enablePseudoHuman',
      label: '启用伪人模式',
      bottomHelpMessage: '是否在群聊中随机回复消息',
      component: "Switch"
    }, {
      field: 'pseudoHumanProbability',
      label: '伪人模式概率 (%)',
      bottomHelpMessage: '伪人模式触发的概率 (1-100)',
      component: "InputNumber",
      componentProps: {
        min: 1,
        max: 100,
        placeholder: "5"
      }
    }, {
      field: 'pseudoTemperature',
      label: '温度设置 (伪人)',
      bottomHelpMessage: '控制伪人模式回复的随机性 (0.1 ~ 2.0)',
      component: "InputNumber",
      componentProps: {
        min: 0.1,
        max: 2,
        step: 0.1,
        placeholder: "0.85"
      }
    }, {
      field: 'pseudoMaxTokens',
      label: '最大Token数 (伪人)',
      bottomHelpMessage: '控制伪人模式回复的最大长度',
      component: "InputNumber",
      componentProps: {
        min: 10,
        max: 1024,
        placeholder: "128"
      }
    }]
}