import Cfg from '../model/Cfg.js'
import OpenAI from '../model/openai.js'
import {
  pluginName
} from '../config/constant.js'
import {
  split
} from '../model/utils.js'

const recall = async (e, promise, time) => {
  const res = await promise
  if (!res.message_id || !time) return
  if (e.group?.recallMsg)
    setTimeout(() =>
      e.group.recallMsg(res.message_id), time * 1000)
  else if (e.friend?.recallMsg)
    setTimeout(() =>
      e.friend.recallMsg(res.message_id), time * 1000)
}

const sleep = async (time) => {
  return new Promise(e => setTimeout(e, time))
}

export default class chat extends plugin {
  constructor(e) {
    super({
      name: 'OpanAI-Chat',
      priority: 114514,
      rule: [{
          reg: '^#chat',
          fnc: 'chatCommand'
        },
        {
          reg: '^#结束对话$',
          fnc: 'endConversation'
        },
        {
          reg: '^#结束全部对话$',
          fnc: 'endAllConversations'
        }
      ]
    })
    this.e = e
    this.redisKeyPrefix = `${pluginName}:chat:`
  }

  async chatCommand(e) {
    const content = e.msg.replace(/^#chat\s*/, '')
    if (!content.trim()) {
      return e.reply('请跟上要对话的内容~')
    }

    recall(e, e.reply('我正在思考如何回复你，请稍候', true), 30)
    return this.processChat(e, content, 'active')
  }

  async accept(e) {
    if (!e.msg || typeof e.msg !== 'string' || !e.msg.trim() || e.msg.startsWith('#') || e.user_id == e.self_id) {
      return false
    }

    const botWhitelist = Cfg.get('botWhitelistQQ', [], e) || []
    const botBlacklist = Cfg.get('botBlacklistQQ', [], e) || []
    const thinking = Cfg.get('thinking', false, e)

    if (botWhitelist.length > 0 && !botWhitelist.includes(e.self_id)) {
      return false
    }

    if (botBlacklist.length > 0 && botBlacklist.includes(e.self_id)) {
      return false
    }

    if (!e.isGroup) {
      if (!Cfg.get('enablePrivate', false, e)) {
        return false
      }
      const whitelistQQ = Cfg.get('pseudoWhitelistQQ', [], e) || []
      const blacklistQQ = Cfg.get('pseudoBlacklistQQ', [], e) || []

      if (whitelistQQ.length > 0 && !whitelistQQ.includes(e.user_id)) {
        logger.debug(`[${pluginName}] 私聊用户 ${e.user_id} 不在QQ白名单中，跳过`)
        return false
      }
      if (blacklistQQ.length > 0 && blacklistQQ.includes(e.user_id)) {
        logger.debug(`[${pluginName}] 私聊用户 ${e.user_id} 在QQ黑名单中，跳过`)
        return false
      }

      if (thinking) recall(e, e.reply('我正在思考如何回复你，请稍候', true), 30)
      return this.processChat(e, e.msg, 'active')
    }

    const isAtMe = e.atme || e.message?.some(item => item.type === 'at' && item.qq == e.self_id)

    if (isAtMe && Cfg.get('enableAt', true, e)) {
      let content = e.msg
      content = content.replace(new RegExp(`^@${e.bot?.info?.nickname}\\s*`, 'i'), '').trim()
      if (!content && e.message) {
        content = e.message.filter(seg => seg.type === 'text').map(seg => seg.text).join('').trim()
      }
      if (!content) {
        logger.debug(`[${pluginName}] 忽略纯艾特消息`)
        return false
      }
      if (thinking) recall(e, e.reply('我正在思考如何回复你，请稍候', true), 30)
      return this.processChat(e, content, 'active')
    }

    if (!this.shouldTriggerPseudo(e)) {
      return false
    }
    const aiName = Cfg.get('aiName', '猫娘', e)
    const containsAiName = (new RegExp(aiName)).test(e.msg)
    if (aiName && containsAiName && Cfg.get('enableName', true, e)) {
      logger.info(`[${pluginName}] 检测到AI昵称，尝试伪人回复: 群(${e.group_id}), 用户(${e.user_id})`)
      return this.processChat(e, e.msg, 'pseudo')
    }

    if (Cfg.get('enablePseudoHuman', true, e)) {

      const probability = Cfg.get('pseudoHumanProbability', 5, e)
      if (Math.random() * 100 < probability) {
        logger.info(`[${pluginName}] 概率触发伪人模式: 群(${e.group_id}), 用户(${e.user_id})`)
        const delay = Cfg.get('delay', "", e).split('-')
        if (delay.length === 2) {
          const time = Math.random() * (delay[1] - delay[0]) + delay[0]
          await sleep(time)
        }
        return this.processChat(e, e.msg, 'pseudo')
      }
    }

    return false
  }

  shouldTriggerPseudo(e) {
    const userId = e.user_id
    const groupId = e.group_id

    const whitelistQQ = Cfg.get('pseudoWhitelistQQ', [], e) || []
    const blacklistQQ = Cfg.get('pseudoBlacklistQQ', [], e) || []
    const whitelistGroup = Cfg.get('pseudoWhitelistGroup', [], e) || []
    const blacklistGroup = Cfg.get('pseudoBlacklistGroup', [], e) || []

    if (whitelistQQ.length > 0 && !whitelistQQ.includes(userId)) {
      logger.debug(`[${pluginName}] 用户 ${userId} 不在伪人QQ白名单中`)
      return false
    }

    if (whitelistGroup.length > 0 && !whitelistGroup.includes(groupId)) {
      logger.debug(`[${pluginName}] 群组 ${groupId} 不在伪人群组白名单中`)
      return false
    }

    if (blacklistQQ.length > 0 && blacklistQQ.includes(userId)) {
      logger.debug(`[${pluginName}] 用户 ${userId} 在伪人QQ黑名单中`)
      return false
    }

    if (blacklistGroup.length > 0 && blacklistGroup.includes(groupId)) {
      logger.debug(`[${pluginName}] 群组 ${groupId} 在伪人群组黑名单中`)
      return false
    }

    return true
  }

  async endConversation(e) {
    const cacheKey = this.getCacheKey(e)
    try {
      await redis.del(cacheKey)
      e.reply('已结束当前对话，相关聊天记录已被清除')
      return true
    } catch (error) {
      logger.error(`[${pluginName}] 结束对话失败: ${error.message || error}`)
      e.reply('结束对话失败，请稍后再试')
      return false
    }
  }

  async endAllConversations(e) {
    if (!e.isMaster) {
      e.reply('只有Bot主人才能结束全部对话')
      return false
    }

    try {
      const keys = await redis.keys(`${this.redisKeyPrefix}*`)
      if (keys.length > 0) {
        await redis.del(keys)
      }
      e.reply(`已结束全部对话，共清除 ${keys.length} 条对话记录`)
      return true
    } catch (error) {
      logger.error(`[${pluginName}] 结束全部对话失败: ${error.message || error}`)
      e.reply('结束全部对话失败，请稍后再试')
      return false
    }
  }

  async processChat(e, content, interactionType = 'active') {
    try {
      const {
        messages,
        cacheKey
      } = await this.getContextWithHistory(e, content, interactionType)

      const requestOptions = {
        messages: messages,
        model: Cfg.get('model', 'gpt-3.5-turbo', e),
        temperature: Cfg.get('temperature', 0.7, e),
        max_tokens: Cfg.get('maxTokens', 1000, e)
      }

      if (interactionType === 'pseudo') {
        requestOptions.max_tokens = Cfg.get('pseudoMaxTokens', 256, e)
        requestOptions.temperature = Cfg.get('pseudoTemperature', 0.85, e)
      }

      const response = await OpenAI.chat(requestOptions)

      if (!response) {
        if (interactionType === 'active') {
          e.reply('AI 响应失败，请稍后再试')
        } else {
          logger.info(`[${pluginName}] 伪人模式AI响应为空或失败，静默处理`)
        }
        return false
      }

      if (cacheKey) {
        messages.push({
          role: 'assistant',
          content: response
        })
        this.updateCache(e, cacheKey, messages)
      }

      const msgs = split(response)
      /*if (interactionType === 'active' || msgs.length === 1) {
        e.reply(response.trim())
        return true
      }*/

      const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms))
      }
      for (let msg of msgs) {
        await e.reply(msg.trim())
        await sleep(Math.min(msg.length * 150, 2000))
      }
    } catch (error) {
      logger.error(`[${pluginName}] 聊天处理错误 (${interactionType}模式): ${error.message || error}`)
      if (interactionType === 'active') {
        e.reply(`处理失败: ${error.message || '未知错误'}`)
      }
      return false
    }
  }

  getCacheKey(e) {
    return `${this.redisKeyPrefix}${e.isGroup ? `group:${e.group_id}` : `private:${e.user_id}`}`
  }

  async updateCache(e, key, messages) {
    const cacheExpire = Cfg.get('cacheExpireMinutes', 30, e) * 60
    const maxContextLength = Cfg.get('maxContextLength', 10, e)

    let systemMessages = []
    let chatMessages = []
    messages.forEach(msg => {
      if (msg.role === 'system') {
        systemMessages.push(msg)
      } else {
        chatMessages.push(msg)
      }
    })

    const messagesToCache = [...systemMessages, ...chatMessages.slice(-maxContextLength)]

    try {
      await redis.set(key, JSON.stringify(messagesToCache), {
        EX: cacheExpire
      })
    } catch (error) {
      logger.error(`[${pluginName}] 缓存对话失败: ${error.message || error}`)
    }
  }

  async getCache(key) {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error(`[${pluginName}] 获取缓存失败: ${error.message || error}`)
      return null
    }
  }

  async getChatHistory(e) {
    const historyCount = Cfg.get('historyCount', 10, e)
    let history = []

    if (historyCount <= 0) {
      return history
    }

    try {
      let rawHistory = []
      const fetchCount = Math.min(historyCount + 5, 50)
      if (e.isGroup) {
        rawHistory = await e.group.getChatHistory(0, fetchCount)
      } else {
        rawHistory = await e.friend.getChatHistory(0, fetchCount)
      }
      history = rawHistory
        .map(msg => this.formatHistoryMessage(e, msg))
        .filter(Boolean)
        .slice(-historyCount)
    } catch (error) {
      logger.error(`[${pluginName}] 获取聊天记录失败: ${error.message || error}`)
    }

    return history
  }

  formatHistoryMessage(e, msg) {
    if (!msg || !msg.message || typeof msg.raw_message !== 'string' || !msg.raw_message.trim()) {
      return null
    }

    const groupId = e.isGroup ? e.group_id : null
    const isBot = msg.user_id == e.self_id
    let role = isBot ? 'assistant' : 'user'
    let senderPrefix = ''
    let content = msg.raw_message.trim()

    if (role === 'user' && content) {
      if (groupId && msg.sender) {
        const sender = msg.sender
        const isAdmin = sender.role === 'admin' || sender.role === 'owner'
        const roleInfo = isAdmin ? (sender.role === 'owner' ? '(群主)' : '(管理员)') : '(成员)'
        const titleInfo = sender.title ? `[${sender.title}]` : ''
        senderPrefix = `${roleInfo}${titleInfo} | ${sender.card || sender.nickname}: `
      } else if (!groupId && msg.sender) {
        senderPrefix = `${msg.sender?.nickname}: `
      }
    }

    if (role === 'assistant' && content.startsWith(`${Cfg.get('aiName', 'AI助手', e)}: `)) {
      content = content.substring(`${Cfg.get('aiName', 'AI助手', e)}: `.length).trim()
    }

    if (!content) return null

    return {
      role: role,
      content: `历史聊天记录 | ${role === 'user' ? `${senderPrefix}${content}` : content}`
    }
  }

  buildInitialMessages(e, interactionType) {
    let messages = []
    const systemPrompt = Cfg.get('prompt', '', e)
    /*
    分两段system prompt可能导致部分ai不读第一个
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    */
    messages.push({
      role: 'system',
      content: this.getContextInfo(e, interactionType) + (!!systemPrompt ? `\n\n以下为你的人设prompt:\n${systemPrompt}` : '')
    })
    return messages
  }


  formatUserMessage(e, content) {
    let userMessageContent = content
    if (e.isGroup) {
      const sender = e.sender || {}
      const isAdmin = sender.role === 'admin' || sender.role === 'owner'
      const roleInfo = isAdmin ? (sender.role === 'owner' ? '(群主)' : '(管理员)') : '(群员)'
      const titleInfo = sender.title ? `[${sender.title}]` : ''
      userMessageContent = `${roleInfo}${titleInfo} | ${sender.card || sender.nickname}: ${content}`
    } else {
      userMessageContent = `${e.sender?.nickname}: ${content}`
    }
    return userMessageContent
  }

  async getContextWithHistory(e, content, interactionType) {
    const cacheKey = this.getCacheKey(e)
    let messages = await this.getCache(cacheKey)

    if (!messages) {
      messages = this.buildInitialMessages(e, interactionType)
      const history = await this.getChatHistory(e)
      messages = messages.concat(history)
    }

    const userMessageContent = this.formatUserMessage(e, content)
    if (messages[messages.length - 1].content.substring(9) == userMessageContent) messages.pop()
    messages.push({
      role: 'user',
      content: userMessageContent
    })

    return {
      messages,
      cacheKey
    }
  }

  getContextInfo(e, interactionType) {
    const aiName = Cfg.get('aiName', 'AI助手', e)
    let baseInfo = `机器人名字: ${e.bot?.info?.nickname}\n你的名字: ${aiName}\n`
    let specificInfo = ''
    let styleGuidance = ''

    if (e.isGroup) {
      specificInfo = `当前在群聊中。\n群号: ${e.group_id}\n群名: ${e.group_name}\n`
      if (interactionType === 'pseudo') {
        styleGuidance = `你正在以伪人模式参与群聊。你的回复应该非常简短、随意、口语化，模仿群友的风格。可以发表情、复读、或者简短附和。避免表现得像一个AI助手。**避免**使用 "${aiName}: " 或 "历史聊天记录" 等各种\`|\`之前的聊天记录格式开头。**避免**使用CQ码等各种格式化消息内容`
      } else {
        styleGuidance = `你正在群聊中被直接提问或互动(用户使用了#chat或@你)。你需要像一个乐于助人的群友一样，清晰、自然地回复。请结合上下文和聊天记录进行回应。优先使用中文。**避免**使用 "${aiName}: " 或 "历史聊天记录" 等各种\`|\`之前的聊天记录格式开头。**避免**使用CQ码等各种格式化消息内容`
      }
    } else {
      specificInfo = `当前在私聊中。\n用户: ${e.sender?.nickname}\n用户QQ: ${e.user_id}\n`
      styleGuidance = `你正在以伪人模式私聊。你需要像一个群友一样自然地回复用户。结合用户的发言和聊天记录作出回应。优先使用中文进行对话。**避免**使用 "${aiName}: " 或 "历史聊天记录" 等各种\`|\`之前的聊天记录格式开头。**避免**使用CQ码等各种格式化消息内容`
    }

    return baseInfo + specificInfo + styleGuidance
  }
}
