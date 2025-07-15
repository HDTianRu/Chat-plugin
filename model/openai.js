import OpenAI from 'openai'
import Cfg from './Cfg.js'
import {
  pluginName
} from '../config/constant.js'

class OpenAIClient {
  constructor() {
    //do nothing
  }

  initClient() {
    const apiKeys = Cfg.get('apiKey', '').replace("，", ",").split(",").map(i => i.trim())
    const baseURL = Cfg.get('apiUrl', 'https://api.deepseek.com/v1')

    if (apiKeys.length >= 1) {
      const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)]
      try {
        return new OpenAI({
          apiKey: apiKey,
          baseURL: baseURL
        })
      } catch (error) {
        logger.error(`[${pluginName}] 初始化OpenAI客户端失败: ${error.message || error}`)
        return null
      }
    } else {
      logger.warn(`[${pluginName}] 未配置OpenAI API Key，相关功能将不可用。`)
      return null
    }
  }

  async chat(options) {
    // 尝试重新初始化，以防配置在运行时被修改
    const client = this.initClient()
    if (!client) {
      logger.error(`[${pluginName}] OpenAI客户端不可用，请检查配置。`)
      return null
    }

    try {
      const {
        messages,
        model = Cfg.get('model', 'gpt-3.5-turbo'),
        temperature = Cfg.get('temperature', 0.7),
        max_tokens = Cfg.get('maxTokens', 1000)
      } = options

      const validMessages = messages.filter(msg => msg && msg.role && typeof msg.content === 'string' && msg.content.trim() !== '')

      const maxContextLength = Cfg.get('maxContextLength', 10)

      let systemMessages = []
      let chatMessages = []

      validMessages.forEach(msg => {
        if (msg.role === 'system') {
          systemMessages.push(msg)
        } else {
          chatMessages.push(msg)
        }
      })

      const contextMessages = chatMessages.slice(-maxContextLength)
      const finalMessages = [...systemMessages, ...contextMessages]

      if (finalMessages.length === 0 || finalMessages.every(m => m.role === 'system')) {
        logger.warn(`[${pluginName}] 没有有效的对话消息发送给OpenAI。`)
        return null
      }

      logger.debug(finalMessages)
      const response = await client.chat.completions.create({
        model,
        messages: finalMessages,
        temperature,
        max_tokens
      })

      if (!response || !response.choices || response.choices.length === 0 || !response.choices[0].message) {
        logger.warn(`[${pluginName}] OpenAI API 返回无效或空响应。`)
        return null
      }

      return response.choices[0].message.content || ''

    } catch (error) {
      logger.error(`[${pluginName}] OpenAI API 调用失败: ${error.message || error}`)
      if (error.response) {
        logger.error(`[${pluginName}] OpenAI API 响应状态: ${error.response.status}`)
        try {
          logger.error(`[${pluginName}] OpenAI API 响应数据: ${JSON.stringify(error.response.data)}`)
        } catch (e) {
          logger.error(`[${pluginName}] OpenAI API 响应数据无法序列化`)
        }

      }
      return null
    }
  }
}

export default new OpenAIClient()