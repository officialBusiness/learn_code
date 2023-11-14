# Babylon.js 代码

## 版本说明

### Babylon.js-1.0.8: 初始的第一版

* 纹理无法展示: 需要在 default.vertex.fx 中添加 float 精度

* 视频纹理无法播放: 在 babylon.engine 的 updateVideoTexture 函数中不能直接 texImage2D ，需要添加视频缩放操作



<!--

* Babylon.js-1.1.0: 能够展示纹理图片

* Babylon.js-1.9.0: 有案例的最后的版本

* Babylon.js-1.11: 有纯 js 的最后的版本

* Babylon.js-1.12: 只有 ts 的第一的版本

-->