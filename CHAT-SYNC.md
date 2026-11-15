# QQ → Chat 只读同步

使用现有 Bun/宿主 Chrona SDK 执行，无额外构建产物；依赖 bun install --frozen-lockfile。

首次启动此版本时原子写入 chat-sync.json 的 since，只有此后收到的私聊用户消息及这些消息的对应回复会同步。不会回扫旧轮次的后续回复，不同步通知或历史附件；附件仅显示提示。同步在现有 QQ poll 后执行，通过 chat.qq-sync 写入 Chat，不触发 Agent。

按当前绑定 openid 筛选私聊，使用 owner SHA-256 + QQ session id 分隔会话。消息 id 稳定，回复进度可更新。已确认快照摘要持久化；失败只重试幂等记录写入，不重复执行或发送 QQ 消息。Chat 删除镜像后保留映射，原会话不会复活；QQ /new 后产生新的来源会话。

测试：bun run chat-sync-test.ts；宿主候选 checks 包含此脚本。真实 QQ 收发和浏览器结果需要在激活后独立检查，不能由夹具证明。
