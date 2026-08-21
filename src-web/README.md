# 《避难所格斗》Web 2D 工程

这是独立的 HTML5 Canvas 正式版工程。运行时只读取本目录中的 HTML、JavaScript、
CSS 和 `assets/` 图片，不读取 `../cocos` 的任何内容。

## 试玩

在本目录启动静态文件服务器，然后访问服务器输出的网址：

```bash
python3 -m http.server 8000
```

操作说明以游戏首页和根目录 `README.md` 为准。

战斗机制说明：

- [击飞与空中连击规则](../docs/knockback-and-air-combo-rules.md)

## 独立开发约束

- Web 新图片只放入本目录的 `assets/`。
- Web 运行时代码只修改本目录中的文件。
- 不允许通过相对路径读取 `../cocos`。
- Web 与 Cocos 不做自动同步；需要移植功能或图片时，人工复制并分别验证。
