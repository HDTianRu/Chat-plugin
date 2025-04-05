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

fs.watch(path.join(_cfgPath, "cfg_default.json"), (eventType, filename) => {
  if (filename) {
    loadConfig()
  }
})

fs.watch(path.join(_cfgPath, "cfg.json"), (eventType, filename) => {
  if (filename) {
    loadConfig()
  }
})

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