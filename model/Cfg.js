import fs from "fs"
import lodash from "lodash"
import path from "path"
import {
  pluginRoot
} from "../config/constant.js"

const _cfgPath = path.join(pluginRoot, "data")
let cfg = {}

const loadConfig = () => {
  let defCfg = {}
  let userCfg = {}
  try {
    defCfg = JSON.parse(fs.readFileSync(path.join(_cfgPath, "cfg_default.json"), "utf8")) || {}
    if (fs.existsSync(path.join(_cfgPath, "cfg.json"))) {
      userCfg = JSON.parse(fs.readFileSync(path.join(_cfgPath, "cfg.json"), "utf8")) || {}
    }
  } catch (e) {
    console.warn("读取配置文件失败", e)
  }
  cfg = lodash.merge({}, defCfg, userCfg)
}

loadConfig()

const watcher = (type) => (type === 'change') ? setTimeout(loadConfig, 1000) : `⚡️我⚡️要⚡️玩⚡️原⚡️神⚡️`

fs.watch(join(_cfgPath, "cfg_default.json"), watcher)

fs.watch(join(_cfgPath, "cfg.json"), watcher)

const Cfg = {
  get(rote, def) {
    return lodash.get(cfg, rote, def)
  },
  set(rote, val) {
    Cfg._set(rote, val)
    Cfg.save()
  },
  _set(rote, val) {
    lodash.set(cfg, rote, val)
  },
  save() {
    try {
      fs.writeFileSync(path.join(_cfgPath, "cfg.json"), JSON.stringify(cfg, null, "\t"))
    } catch (e) {
      console.warn("保存配置文件失败", e)
    }
  },
  getAll() {
    return lodash.cloneDeep(cfg)
  },
}

export default Cfg