# 前端项目架构设计文档 (React SPA)

## 1. 项目概述

本项目是一个基于 **React 19** + **TypeScript** + **Vite** 的单页应用 (SPA)，旨在作为 `nestjs-be` 后端的配套前端。项目设计目标是深度实践 React 最新特性，实现高性能、可维护的现代化前端架构，并为后续接入 AI 功能做准备。

针对您作为 Vue3 (Composition API) 工程师的背景，本架构文档特别强调了 **React Hooks** 与 **Vue Composables** 的思维转换，以及如何在 React 生态中实现类似的开发体验。

## 2. 技术栈选型

| 领域 | 选型 | 理由 & Vue 对比 |
| :--- | :--- | :--- |
| **框架** | **React 19** | 深度学习并发渲染 (Concurrent Mode)、Server Components (未来扩展)、Actions 等新特性。 |
| **构建工具** | **Vite** | 极速冷启动，与 Vue 生态体验一致。 |
| **语言** | **TypeScript** | 强类型约束，与后端 NestJS DTO 完美对齐。 |
| **路由** | **React Router v7** | 支持 Loaders/Actions 数据预加载模式，类似 Remix，提升 UX。 |
| **服务端状态** | **TanStack Query (v5)** | **核心推荐**。自动处理缓存、加载、错误状态。替代手动 `isLoading` 状态管理 (Vue 中常需手动处理)。 |
| **客户端状态** | **Zustand** | 极简 Flux 实现，API 类似 Pinia，无 Redux 样板代码。 |
| **UI 组件库** | **Shadcn/ui** + **Tailwind CSS** | 也就是 Radix UI + Tailwind。源码拷贝式组件，最大化定制能力，符合现代审美。 |
| **表单管理** | **React Hook Form** + **Zod** | 性能优异（非受控组件），Zod schema 可复用后端验证逻辑。 |
| **网络请求** | **Axios** | 经典的 Promise HTTP 客户端，配置拦截器处理统一响应格式。 |

## 3. 目录结构设计 (Feature-Based)

采用 **功能模块化 (Feature-based)** 结构，与 NestJS 后端的模块结构保持一致，降低认知切换成本。

```text
src/
├── app/                    # 全局应用配置
│   ├── provider.tsx        # 全局 Context Providers (Auth, QueryClient, Theme)
│   ├── router.tsx          # 路由配置
│   └── main.tsx            # 入口文件
├── assets/                 # 静态资源
├── components/             # 全局通用组件 (Button, Input, etc. - shadcn/ui)
│   ├── ui/                 # 基础 UI 组件
│   └── common/             # 业务无关的通用组件
├── config/                 # 环境变量与配置常量
├── features/               # 核心业务模块 (对应 NestJS Modules)
│   ├── auth/               # 认证模块
│   │   ├── api/            # 登录、注册 API
│   │   ├── components/     # 登录表单组件
│   │   ├── hooks/          # useAuth, useLogin
│   │   └── types/          # TS 类型定义
│   ├── user/               # 用户模块
│   │   ├── api/            # 用户信息更新 API
│   │   ├── components/     # 个人中心表单
│   │   └── hooks/          # useUpdateProfile
│   ├── interview/          # 面试/AI 模块
│   │   ├── api/            # SSE 连接
│   │   └── components/     # 聊天窗口
│   └── post/               # 帖子模块
├── hooks/                  # 全局通用 Hooks (useDebounce, useSSE)
├── lib/                    # 工具库
│   ├── axios.ts            # Axios 实例与拦截器
│   └── utils.ts            # 通用工具函数 (cn 等)
├── stores/                 # 全局客户端状态 (ThemeStore, SidebarStore)
└── types/                  # 全局类型定义 (ResponseFormat)
```

## 4. 核心架构实现方案

### 4.1 网络层 (Network Layer)

后端采用了统一的响应格式 `ResponseFormat<T>`，前端需在拦截器中自动解包。

**`src/lib/axios.ts` 设计思路：**

```typescript
// 伪代码示例
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // /api
  timeout: 10000,
});

// 请求拦截：注入 Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：解包与错误处理
api.interceptors.response.use(
  (response) => {
    // NestJS 成功响应结构: { code: 200, data: T, message: '...' }
    const { code, data, message } = response.data;
    if (code === 200 || code === 201) {
      return data; // 直接返回业务数据 T
    }
    // 业务错误
    return Promise.reject(new Error(message));
  },
  (error) => {
    // HTTP 错误 (401, 403, 500)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout(); // Token 过期自动登出
    }
    return Promise.reject(error);
  }
);
```

### 4.2 数据获取 (Data Fetching) - React 这里的思维转变

在 Vue 中，你可能习惯在 `onMounted` 中调用 API 并赋值给 `ref`。
在 React + TanStack Query 中，我们**不手动管理 loading 和 error**。

**Vue 方式 (旧习惯):**
```javascript
const data = ref(null);
const loading = ref(false);
async function fetchData() {
  loading.value = true;
  data.value = await api.getUser();
  loading.value = false;
}
```

**React + Query 方式 (推荐):**
```typescript
// src/features/user/hooks/useUser.ts
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId], // 缓存 Key
    queryFn: () => api.getUser(userId),
    staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
  });
};

// 组件中使用
const { data, isLoading, error } = useUser('123');
if (isLoading) return <Spinner />;
return <div>{data.username}</div>;
```

### 4.3 实时通信 (SSE) - 针对 `/interview/stream`

NestJS 的 `InterviewController` 提供了一个 SSE 端点。React 中需要一个 Custom Hook 来管理连接生命周期。

**`src/hooks/useSSE.ts` 设计:**

```typescript
import { useEffect, useState } from 'react';

export function useSSE(url: string) {
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      // 后端格式: data: JSON.stringify({ timestamp, message })
      const parsed = JSON.parse(event.data);
      setMessages((prev) => [...prev, parsed.message]);
    };

    return () => {
      eventSource.close(); // 组件卸载时自动断开
    };
  }, [url]);

  return messages;
}
```

### 4.4 认证与权限 (Authentication)

利用 Zustand 存储 Token 和 UserInfo，并配合 React Router 的 `Layout` 进行路由守卫。

1.  **Store**: `useAuthStore` 存储 `token` (persist 到 localStorage)。
2.  **Guard**: `<ProtectedRoute>` 组件检查 store 中是否有 token，无则重定向到 `/login`。
3.  **Check**: App 初始化时调用 `/auth/profile` 验证 token 有效性。

## 5. Vue 到 React 的思维转换指南

1.  **响应式 vs 不可变性 (Immutability)**:
    *   Vue: `data.value = newValue` (自动追踪依赖，Mutable)。
    *   React: `setData(newData)` (触发重新渲染，Immutable)。**永远不要直接修改 state**。
    
2.  **生命周期 vs 副作用 (Effects)**:
    *   Vue: `onMounted`, `onUnmounted`, `watch`.
    *   React: `useEffect(() => { return () => cleanup }, [dependencies])`.
    *   *注意*: React 18+ 在 Strict Mode 下 Effect 会执行两次，这是为了检测不纯的副作用。

3.  **模板 vs JSX**:
    *   Vue: `v-if`, `v-for` 指令。
    *   React: JavaScript 逻辑 (`{condition && <Component />}`，`{list.map(item => <Component />)}`)。JSX 更灵活，但也更考验 JS 功底。

4.  **组件通信**:
    *   Vue: `props`, `emit`, `provide/inject`.
    *   React: `props` (函数传参), `Context` (依赖注入). React 没有 `emit`，而是通过传递回调函数 (`onUpdate={(val) => setVal(val)}`)。

## 6. AI 功能接入规划

考虑到后续接入 AI (如 Chat 界面)：
1.  **流式响应**: 利用上述 `useSSE` 或 `fetch` 的 `ReadableStream` 处理打字机效果。
2.  **Markdown 渲染**: 使用 `react-markdown` + `syntax-highlighter` 渲染 AI 返回的代码块。
3.  **乐观更新 (Optimistic UI)**: 用户发送消息后立即显示在界面上，不等服务器响应，提升流畅度。

## 7. 下一步行动建议

1.  **初始化项目**: 使用 `npm create vite@latest frontend -- --template react-ts`。
2.  **安装基础依赖**: `axios`, `@tanstack/react-query`, `zustand`, `react-router-dom`, `clsx`, `tailwind-merge`。
3.  **配置 Shadcn/ui**: 初始化 UI 组件库。
4.  **实现登录流程**: 对接 NestJS 的 `/auth/login` 接口，完成闭环。