export const split = (text) => {
  const reg = /[。？\?\n](?![。！？\!\?\n])/
  const ret = text.split(reg)
    .map(i => i.replace("<EMPTY>", "").trim())
    .filter(Boolean)
  if (text.length >= 500 || ret.length > 5)
    return [text]
  else
    return ret
}