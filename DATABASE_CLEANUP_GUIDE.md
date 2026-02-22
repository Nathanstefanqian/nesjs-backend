# 数据库清空问题排查指南

## 问题现象
调用清空 API 后，前端仍然显示大量 AI 对话数据。

## 排查步骤

### 1. 检查数据库实际状态

访问调试接口查看数据库统计信息：

```bash
GET http://localhost:3000/admin/chat/stats
Authorization: Bearer YOUR_TOKEN
```

这会返回：
```json
{
  "stats": {
    "totalConversations": 0,  // 应该是 0
    "aiConversations": 0,      // 应该是 0
    "userConversations": 0,
    "totalMessages": 0         // 应该是 0
  },
  "recentConversations": []    // 应该是空数组
}
```

### 2. 清空数据库

```bash
# 只清空 AI 对话
DELETE http://localhost:3000/admin/chat/clear-ai
Authorization: Bearer YOUR_TOKEN

# 或清空所有对话
DELETE http://localhost:3000/admin/chat/clear-all
Authorization: Bearer YOUR_TOKEN
```

### 3. 再次检查数据库状态

重复步骤 1，确认数据已清空。

### 4. 清空前端缓存

在浏览器控制台执行：

```javascript
// 清空 localStorage
localStorage.removeItem('chat-storage');

// 清空所有缓存
localStorage.clear();

// 刷新页面
location.reload();
```

### 5. 验证前端请求

打开浏览器开发者工具 → Network 标签：

1. 刷新页面
2. 查找 `conversations?type=ai` 请求
3. 查看响应数据：
   - 如果返回空数组 `[]` → 数据库已清空，前端应该不显示对话
   - 如果返回大量数据 → 数据库没有被清空

## 可能的原因

### 原因 1：前端缓存
**症状**：数据库已清空，但前端仍显示旧数据

**解决方案**：
```javascript
localStorage.removeItem('chat-storage');
location.reload();
```

### 原因 2：浏览器 HTTP 缓存
**症状**：API 请求被浏览器缓存

**解决方案**：
- 打开开发者工具
- 勾选 "Disable cache"
- 刷新页面

### 原因 3：多个数据库实例
**症状**：清空的是开发数据库，但前端连接的是生产数据库

**解决方案**：
检查 `.env` 文件中的 `MONGODB_URI` 配置

### 原因 4：清空 API 没有执行成功
**症状**：调用清空 API 后没有返回成功信息

**解决方案**：
查看清空 API 的响应：
```json
{
  "message": "AI 对话记录已清空",
  "deletedMessages": 100,      // 删除的消息数
  "deletedConversations": 20   // 删除的对话数
}
```

## 完整清理流程

```bash
# 1. 查看当前数据库状态
curl http://localhost:3000/admin/chat/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. 清空 AI 对话
curl -X DELETE http://localhost:3000/admin/chat/clear-ai \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 再次查看数据库状态（应该为空）
curl http://localhost:3000/admin/chat/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 在浏览器控制台清空缓存
localStorage.clear();
location.reload();
```

## 验证清空成功

清空成功后：
1. ✅ 数据库统计显示 0 条对话
2. ✅ `conversations?type=ai` 返回空数组 `[]`
3. ✅ 前端显示"开始一次新的对话..."
4. ✅ 对话列表为空

## 注意事项

⚠️ **重要**：
- 清空操作不可逆，请谨慎操作
- 建议先在开发环境测试
- 生产环境操作前务必备份数据
- 清空后需要同时清理前端缓存

